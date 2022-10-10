const db = require('../models');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const moment = require('moment');
const Sequelize = require('sequelize');
const { CustomError, TypeError } = require('../models/customError.model');
var generator = require('generate-password');
const validBodyKeys = require('../utils/validBodyKeys');
const mailService = require('../services/mail-service');
const User = db.users;
const ReferralCode = db.referralCodes;
const ReferralTransactions = db.referralTransactions;

const userBodyProps = ['firstName', 'lastName', 'photo', 'dateOfBirth', 'about'];

class UserController {
  async getVkComments(req, res) {
    const { offset } = req.query;
    const data = await axios.get(`http://api.vk.com/method/board.getComments?v=5.131&group_id=213480825&topic_id=48841807&access_token=484899304848993048489930764b584f4944848484899302b79180d8fb65f87bb71e34a&extended=1&count=30&lang=0&sort=desc&offset=${offset}`);

    res.json(data.data);
  }

  async createUser(req, res) {
    const { email, password, name, referralCode } = req.body;
    const passHash = await bcrypt.hash(password, 3);
    const findUserEmail = await User.findOne({ where: { email } });
    if (findUserEmail) {
      throw new CustomError(400, TypeError.USER_EXIST);
    }
    if (referralCode) {
      const findReferralCode = await ReferralCode.findOne({ where: { code: referralCode.toUpperCase(), dateEnd: { $gt: new Date() } } });
      if (!findReferralCode) {
        throw new CustomError(404, TypeError.NOT_FOUND_REFERRAL_CODE);
      }
    }
    const activationLink = uuid.v4();
    const newReferralCode = generator
      .generate({
        length: 5,
        numbers: false,
        uppercase: true,
      })
      .toUpperCase();
    const newUser = await User.create({
      email,
      password: passHash,
      name,
      confirmUrl: activationLink,
      ...(referralCode && { attachedReferralCode: referralCode }),
      ...(referralCode && { balance: 50 }),
    });

    const selfReferralCode = await ReferralCode.create({
      code: newReferralCode,
      dateEnd: moment().add(30, 'days').toDate(),
      userId: newUser?.id,
    });
    await mailService.sendActivationMail(email, `${process.env.API_URL}/activate/${activationLink}`);
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.SECRET_TOKEN, { expiresIn: '1h' });
    res.json({ token: token });
  }
  async generateReferralCode(req, res) {
    const authHeader = req.headers['request_token'];
    const decoded = jwt.verify(authHeader, process.env.SECRET_TOKEN);
    const findReferralCode = await ReferralCode.findOne({ where: { userId: decoded?.id } });
    if (!findReferralCode) {
      throw new CustomError(404, TypeError.NOT_FOUND_REFERRAL_CODE);
    }
    const newReferralCode = generator
      .generate({
        length: 5,
        numbers: false,
        uppercase: true,
      })
      .toUpperCase();
    await ReferralCode.update({ code: newReferralCode, dateEnd: moment().add(30, 'days').toDate() }, { where: { userId: decoded?.id } });
    res.json({ success: true });
  }
  async activate(req, res, next) {
    const activationLink = req.params.link;
    if (!activationLink) {
      throw new CustomError(400, TypeError.INCORRECT_ACTIVE_LINK);
    }
    const user = await User.findOne({
      where: {
        confirmUrl: activationLink,
      },
    });
    if (!user) {
      throw new CustomError(400, TypeError.INCORRECT_ACTIVE_LINK);
    }
    user.active = true;
    await user.save();
    return res.redirect(process.env.SITE_URL);
  }
  async loginUser(req, res) {
    const { email, password } = req.body;
    const findUser = await User.findOne({ where: { email, deleted: false } });
    if (!findUser) {
      throw new CustomError(400, TypeError.LOGIN_ERROR);
    }

    const passCheck = await bcrypt.compare(password, findUser.password);
    if (!passCheck) {
      throw new CustomError(400, TypeError.LOGIN_ERROR);
    }
    if (!findUser?.active) {
      throw new CustomError(400, TypeError.ACCOUNT_NOT_ACTIVE);
    }

    const token = jwt.sign({ id: findUser.id, email: findUser.email }, process.env.SECRET_TOKEN, { expiresIn: '24h' });
    res.json({ token: token });
  }
  async resetPassword(req, res) {
    const { email, name } = req.body;
    const findUser = await User.findOne({ where: { email, name, active: true, deleted: false } });
    if (!findUser) {
      throw new CustomError(404, TypeError.NOT_FOUND_USER);
    }
    var newPassword = generator.generate({
      length: 10,
      numbers: true,
    });
    const passHash = await bcrypt.hash(newPassword, 3);
    await User.update(
      { password: passHash },
      {
        where: {
          id: findUser?.id,
        },
      },
    );
    await mailService.sendResetPassword(email, newPassword);
    res.json({ success: true });
  }
  async getUser(req, res) {
    const authHeader = req.headers['request_token'];
    const decoded = jwt.verify(authHeader, process.env.SECRET_TOKEN);
    const findSelfReferralCode = await ReferralCode.findOne({
      where: {
        userId: decoded.id,
      },
      raw: true,
    });
    const findUser = await User.findOne({ where: { active: true, deleted: false, email: decoded.email, id: decoded.id }, attributes: { exclude: ['password', 'createdAt'] }, raw: true });
    const totalReferralSum = await ReferralTransactions.findAll({
      where: {
        userId: decoded.id,
      },
      attributes: ['userId', [Sequelize.fn('sum', Sequelize.col('referralSum')), 'sum_referal']],
      group: ['userId'],
      raw: true,
    });
    const nextDay = moment().add(1, 'days').toDate();
    const today = new Date().setHours(0, 0, 0, 0);
    const totalReferralSumToday = await ReferralTransactions.findAll({
      where: {
        userId: decoded.id,
        date: {
          $gt: today,
          $lt: nextDay,
        },
      },
      attributes: ['userId', [Sequelize.fn('sum', Sequelize.col('referralSum')), 'sum_referal']],
      group: ['userId'],
      raw: true,
    });

    let totalRefferal = totalReferralSum?.length > 0 ? parseFloat(totalReferralSum?.[0]?.sum_referal).toFixed(2) : 0;
    let totalRefferalToday = totalReferralSumToday?.length > 0 ? parseFloat(totalReferralSumToday?.[0]?.sum_referal).toFixed(2) : 0;

    if (!findUser) {
      throw new CustomError(400);
    }
    res.json({ ...findUser, selfReferralCode: findSelfReferralCode, totalRefferal, totalRefferalToday });
  }

  async checkAccount(req, res) {
    const { id, server } = req.params;
    await axios
      .get(`https://idvpay.com/api/v1/user_info?serverId=${server}&roleId=${id}`)
      .then((result) => {
        const roleId = result.data.data.roleid;
        const roleName = result.data.data.rolename;
        const obj = {
          id: roleId,
          nickname: roleName,
        };
        res.json(obj);
      })
      .catch((err) => {
        throw new CustomError(404);
      });
  }

  async payment(req, res) {
    // const { package, id } = req.body;

    await axios
      .get(`https://idvpay.com/api/v1/user_info?serverId=2011&roleId=${req.body.id}`)
      .then((result) => {
        const accountId = result.data.data.account_id;
        const roleId = result.data.data.roleId;
        return axios.get(`https://idvpay.com/api/v1/get_pay_url?payMethod=gamecode&payType=netease+gamecode_netease+gamecode&serverId=10102&roleId=${roleId}&accountId=${accountId}&goodsId=${req.body.package}&region=&platform=pc`);
      })
      .then((result) => {
        const urlPayment = new URL(result.data.data);
        const paramsPayment = urlPayment.searchParams;
        const idPayment = paramsPayment.get('pay_orderid');
        return axios.post(`https://gamecode.topupease.com/client/gamecode/active`, {
          card_pwd: '234234',
          cardid: '234234',
          pay_orderid: idPayment,
        });
      })
      .then((result) => {
        res.json({ result: result });
      })
      .catch((err) => {
        throw new CustomError(400);
      });
  }
}

module.exports = new UserController();
//     https://idvpay.com/api/v1/get_pay_url?payMethod=gamecode&payType=netease+gamecode_netease+gamecode&serverId=10102&roleId=234434&accountId=173822576&goodsId=h55na.mol.others.60echoes&region=&platform=pc

// https://idvpay.com/api/v1/get_pay_url?payMethod=gamecode&payType=netease+gamecode_netease+gamecode&serverId=10102&roleId=234434&accountId=173822576&goodsId=h55na.mol.others.300echoes&region=&platform=pc

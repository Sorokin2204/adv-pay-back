const db = require('../models');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { CustomError, TypeError } = require('../models/customError.model');
const validBodyKeys = require('../utils/validBodyKeys');
const mailService = require('../services/mail-service');
const User = db.users;

const userBodyProps = ['firstName', 'lastName', 'photo', 'dateOfBirth', 'about'];

class UserController {
  async createUser(req, res) {
    const { email, password, name } = req.body;
    const passHash = await bcrypt.hash(password, 3);

    const findUserEmail = await User.findOne({ where: { email } });
    if (findUserEmail) {
      throw new CustomError(400, TypeError.USER_EXIST);
    }
    const activationLink = uuid.v4();
    const newUser = await User.create({
      email,
      password: passHash,
      name,
      confirmUrl: activationLink,
    });
    await mailService.sendActivationMail(email, `${process.env.API_URL}/activate/${activationLink}`);
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.SECRET_TOKEN, { expiresIn: '1h' });
    res.json({ token: token });
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

    const token = jwt.sign({ id: findUser.id, email: findUser.email }, process.env.SECRET_TOKEN, { expiresIn: '1h' });
    res.json({ token: token });
  }

  async getUser(req, res) {
    await setTimeout(() => {}, 3000);
    const authHeader = req.headers['request_token'];
    const decoded = jwt.verify(authHeader, process.env.SECRET_TOKEN);
    const findUser = await User.findOne({ active: true, deleted: false, where: { email: decoded.email, id: decoded.id }, attributes: { exclude: ['password', 'createdAt'] } });

    if (!findUser) {
      throw new CustomError(400);
    }
    res.json(findUser);
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

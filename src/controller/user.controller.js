const db = require('../models');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const moment = require('moment');
const Sequelize = require('sequelize');
const requestIp = require('request-ip');
const cheerio = require('cheerio');
var md5 = require('md5');
const { CustomError, TypeError } = require('../models/customError.model');
var generator = require('generate-password');
const validBodyKeys = require('../utils/validBodyKeys');
const mailService = require('../services/mail-service');
const User = db.users;
const ReferralCode = db.referralCodes;
const Payment = db.payments;
const ReferralTransactions = db.referralTransactions;
const Settings = db.settings;
const { OAuth2Client } = require('google-auth-library');
const { avatarsGenshin } = require('../utils/dataAvatarGenshin');
const client = new OAuth2Client(process.env.GOOGLE_AUTH_KEY);
const userBodyProps = ['firstName', 'lastName', 'photo', 'dateOfBirth', 'about'];

class UserController {
  async getVkComments(req, res) {
    const { offset } = req.query;
    const data = await axios.get(`http://api.vk.com/method/board.getComments?v=5.131&group_id=213480825&topic_id=48841807&access_token=${process.env.VK_SERVICE_KEY}&extended=1&count=30&lang=0&sort=desc&offset=${offset}`);

    res.json(data.data);
  }

  async createUser(req, res) {
    const { email, password, name, referralCode, gToken } = req.body;
    const passHash = await bcrypt.hash(password, 3);
    const findUserEmail = await User.findOne({ where: { email } });
    const googleResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${gToken}`);

    if (!googleResponse.data?.success) {
      throw new CustomError(400, TypeError.CAPTHA_ERROR);
    }
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

  async initPaymentCard(req, res) {
    const { price } = req.body;
    const tokenHeader = req.headers['request_token'];
    const tokenData = jwt.verify(tokenHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError(400);
      }
      return tokenData;
    });
    let postData = {
      action: 'initPayment',
      project: 1251,
      sum: price,
      currency: 'RUB',
      returnLink: 1,
      innerID: tokenData?.id,
      email: tokenData?.email,
      payWay: '1',
    };
    const sign = md5(process.env.SECRET_PAYMENT + postData.action + postData.project + postData.sum + postData.currency + postData.innerID + postData.email + postData.payWay);
    postData.sign = sign;

    const response = await axios.post('https://pay.primepayments.io/API/v2/', new URLSearchParams(postData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response?.data?.status === 'ERROR') {
      throw new CustomError(400);
    }
    res.json(response.data);
  }
  async getSettings(req, res) {
    const settings = await Settings.findAll();
    res.json(settings);
  }
  async processPaymentCreditCard(req, res) {
    const { action, orderID, payWay, innerID, sum, webmaster_profit, sign, email } = req.body;
    const clientIp = requestIp.getClientIp(req);
    console.log(clientIp);
    if (action === 'order_payed') {
      const signCheck = md5(process.env.SECRET_PAYMENT_2 + orderID + payWay + innerID + sum + webmaster_profit);
      if (sign === signCheck) {
        const findPayment = await Payment.findOne({ where: { userId: innerID, number: orderID } });
        if (!findPayment) {
          const findUser = await User.findOne({
            where: {
              id: innerID,
              email: email,
              active: true,
            },
          });
          if (findUser) {
            const newBalance = parseFloat(findUser?.balance) + parseFloat(sum);
            const bonusBalanceCalc = parseFloat((0.5 / 100) * parseFloat(sum)).toFixed(2);
            const newBonusBalance = parseFloat(findUser?.bonusBalance) + parseFloat(bonusBalanceCalc);
            await User.update(
              { balance: newBalance.toFixed(2), bonusBalance: newBonusBalance.toFixed(2) },
              {
                where: {
                  id: innerID,
                  email: email,
                  active: true,
                },
              },
            );
            const newPayment = { number: orderID, price: sum, userId: innerID, date: new Date() };
            const paymentCreated = await Payment.create(newPayment);
            if (findUser?.attachedReferralCode) {
              const findReferralCode = await ReferralCode.findOne({ where: { code: findUser?.attachedReferralCode, dateEnd: { $gt: new Date() } } });
              if (findReferralCode && findReferralCode?.userId) {
                const userReferral = await User.findOne({
                  where: {
                    id: findReferralCode?.userId,
                    active: true,
                    deleted: false,
                  },
                });
                if (userReferral) {
                  const percentReferralSum = parseFloat((1 / 100) * parseFloat(sum)).toFixed(2);

                  if (!isNaN(percentReferralSum)) {
                    await User.update(
                      {
                        balance: parseFloat(parseFloat(userReferral?.balance) + parseFloat(percentReferralSum)).toFixed(2),
                      },
                      {
                        where: {
                          id: findReferralCode?.userId,
                        },
                      },
                    );
                    await ReferralTransactions.create({
                      date: new Date(),
                      referralCode: findUser?.attachedReferralCode,
                      referralSum: percentReferralSum,
                      userId: userReferral?.id,
                      transactionId: paymentCreated?.id,
                    });
                  }
                }
              }
            }
            console.log('SUCCESS PAYMENT');
            console.log(req.body);
            res.send('OK');
          } else {
            console.error('NOT FIND USER ERROR');
            console.error(req.body);
            throw new CustomError(400);
          }
        } else {
          console.error('FIND PAYMENT ERROR');
          console.error(req.body);
          throw new CustomError(400);
        }
      } else {
        console.error('SIGN ERROR');
        console.error(req.body);
        throw new CustomError(400);
      }
    } else {
      console.error('IP INCORRECT ERROR');
      console.error(req.body);
      throw new CustomError(400);
    }
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

    const findUser = await User.findOne({ where: { email, deleted: false, isGoogleAuth: false } });
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

  async googleAuth(req, res) {
    const { gToken, referralCode } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: gToken,
      audience: process.env.CLIENT_ID,
    });
    const googleData = ticket.getPayload();

    const findUserEmail = await User.findOne({ where: { email: googleData?.email, isGoogleAuth: false } });
    if (findUserEmail) {
      throw new CustomError(400, TypeError.USER_EXIST);
    }
    const findUserEmailAndName = await User.findOne({ where: { email: googleData?.email, name: googleData?.name, isGoogleAuth: true } });

    if (findUserEmailAndName) {
      const token = jwt.sign({ id: findUserEmailAndName.id, email: findUserEmailAndName.email }, process.env.SECRET_TOKEN, { expiresIn: '24h' });
      res.json({ token: token });
    } else {
      if (referralCode) {
        const findReferralCode = await ReferralCode.findOne({ where: { code: referralCode.toUpperCase(), dateEnd: { $gt: new Date() } } });
        if (!findReferralCode) {
          throw new CustomError(404, TypeError.NOT_FOUND_REFERRAL_CODE);
        }
      }
      const newPassword = generator.generate({
        length: 20,
      });
      const passHash = await bcrypt.hash(newPassword, 3);
      const newUser = await User.create({
        email: googleData?.email,
        password: passHash,
        name: googleData?.name,
        confirmUrl: null,
        active: true,
        isGoogleAuth: true,
        ...(referralCode && { attachedReferralCode: referralCode }),
        ...(referralCode && { balance: 50 }),
      });
      const newReferralCode = generator
        .generate({
          length: 5,
          numbers: false,
          uppercase: true,
        })
        .toUpperCase();
      const selfReferralCode = await ReferralCode.create({
        code: newReferralCode,
        dateEnd: moment().add(30, 'days').toDate(),
        userId: newUser?.id,
      });
      const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.SECRET_TOKEN, { expiresIn: '24h' });
      res.json({ token: token });
    }
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
  async getBonus(req, res) {
    const tokenHeader = req.headers['request_token'];
    const tokenData = jwt.verify(tokenHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
      }
      return tokenData;
    });

    const findUser = await User.findOne({ where: { id: tokenData?.id, active: true }, attributes: { exclude: ['password', 'createdAt'] } });

    if (findUser?.bonusBalance && findUser?.bonusBalance >= 100) {
      if (findUser?.bonusBalance >= 1000) {
        const resultMinusBonus = (parseFloat(findUser?.bonusBalance) - parseFloat(1000)).toFixed(2);
        const newBalance = parseFloat(findUser?.balance) + parseFloat(1000);
        await User.update(
          { balance: newBalance.toFixed(2), bonusBalance: resultMinusBonus },
          {
            where: {
              id: tokenData?.id,
              email: findUser?.email,
              active: true,
            },
          },
        );
      } else if (findUser?.bonusBalance >= 500) {
        const resultMinusBonus = (parseFloat(findUser?.bonusBalance) - parseFloat(500)).toFixed(2);
        const newBalance = parseFloat(findUser?.balance) + parseFloat(500);
        await User.update(
          { balance: newBalance.toFixed(2), bonusBalance: resultMinusBonus },
          {
            where: {
              id: tokenData?.id,
              email: findUser?.email,
              active: true,
            },
          },
        );
      } else if (findUser?.bonusBalance >= 100) {
        const resultMinusBonus = (parseFloat(findUser?.bonusBalance) - parseFloat(100)).toFixed(2);
        const newBalance = parseFloat(findUser?.balance) + parseFloat(100);
        await User.update(
          { balance: newBalance.toFixed(2), bonusBalance: resultMinusBonus },
          {
            where: {
              id: tokenData?.id,
              email: findUser?.email,
              active: true,
            },
          },
        );
      }
      res.json(true);
    } else {
      throw new CustomError(400);
    }

    res.json({});
  }
  async checkAccount(req, res) {
    const { id, server } = req.params;
    const { typeGameId } = req.query;
    console.log('Type game', typeGameId);
    if (typeGameId == '1') {
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
    } else if (typeGameId == '2') {
      await axios
        .get(`https://enka.network/u/${id}/__data.json`)
        .then((result) => {
          if (Object.keys(result.data).length === 0) {
            throw new CustomError(404);
          } else {
            console.log(result.data);
          }
          const roleId = result.data.playerInfo.nickname;
          const roleName = result.data.playerInfo.nickname;
          const level = result.data.playerInfo.level;
          const wordlLevel = result.data.playerInfo.worldLevel;
          const avatar = result.data.playerInfo.profilePicture.avatarId;
          const image = avatarsGenshin[avatar] ? `https://enka.network/ui/${avatarsGenshin[avatar]}.png` : '';
          const obj = {
            id: id,
            nickname: roleName,
            wordlLevel,
            level,
            image,
          };
          res.json(obj);
        })
        .catch((err) => {
          throw new CustomError(404);
        });
    } else {
      throw new CustomError(404);
    }
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

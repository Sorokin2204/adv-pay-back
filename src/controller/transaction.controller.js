const db = require('../models');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const Transaction = db.transactions;
const User = db.users;
const Package = db.packages;
const CreditCard = db.creditCards;

class TransactionController {
  async createTranscation(req, res) {
    const tokenHeader = req.headers['request_token'];
    const { packageId, playerId, serverId } = req.body;
    console.log(req.body);
    if (!packageId || !playerId || !serverId) {
      throw new CustomError(500);
    }
    const findPackage = await Package.findOne({ where: { code: packageId } });
    if (!findPackage) {
      throw new CustomError(500);
    }
    const findCard = await CreditCard.findOne({ where: { packageId: findPackage?.id, active: true } });
    if (!findCard) {
      throw new CustomError(404, TypeError.PACKAGE_NOT_ACTIVE);
    }
    const tokenData = jwt.verify(tokenHeader, 'secret-jwt-pass', (err, tokenData) => {
      if (err) {
        throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
      }
      return tokenData;
    });

    const findUser = await User.findOne({ where: { id: tokenData?.id }, attributes: { exclude: ['password', 'createdAt'] } });

    if (!findUser) {
      throw new CustomError(400);
    }
    if (findUser?.balance < findPackage?.price) {
      throw new CustomError(404, TypeError.BALANCE_ERROR);
    }

    const checkRes = await axios
      .get(`https://idvpay.com/api/v1/user_info?serverId=${serverId}&roleId=${playerId}`)
      .then((result) => {
        console.log('ПРОВЕРКА АКК');
        if (result.data.errorcode !== 0 && !result.data) {
          throw new CustomError(404, TypeError.ACCOUNT_NOT_FOUND);
        }
        const accountCheck = result.data.data.account_id;
        const roleCheck = result.data.data.roleid;
        const hostCheck = result.data.data.hostid;
        const roleNameCheck = result.data.data.rolename;
        return { accountCheck, roleCheck, hostCheck, roleNameCheck };
      })
      .catch((result) => {
        throw new CustomError(404, TypeError.ACCOUNT_NOT_FOUND);
      });
    console.log(checkRes);
    const generatePaymentRes = await axios
      .get(`https://idvpay.com/api/v1/get_pay_url?payMethod=gamecode&payType=netease+gamecode_netease+gamecode&serverId=${checkRes.hostCheck}&roleId=${checkRes.roleCheck}&accountId=${checkRes.accountCheck}&goodsId=h55na.mol.others.${findPackage?.code}echoes&region=&platform=pc`)
      .then((result) => {
        console.log('ПОЛУЧЕНИЕ ПЛАТЕЖА');
        if (result.data.errorcode !== 0 && result.data.success === false) {
          throw new CustomError(400);
        }
        const urlPayment = new URL(result.data.data);
        const paramsPayment = urlPayment.searchParams;
        const idPayment = paramsPayment.get('pay_orderid');
        console.log(result.data);
        return idPayment;
      })
      .catch((err) => {
        console.log('ОШИБКА ПОЛУЧЕНИЯ ПЛАТЕЖА', err);
        throw new CustomError(400);
      });

    const createPaymentRes = await axios
      .post(`https://gamecode.topupease.com/client/gamecode/active`, {
        card_pwd: '234234',
        cardid: '234234',
        pay_orderid: generatePaymentRes,
      })
      .then((res) => {
        console.log('УСПЕШНО ОПЛАЧЕНО');
        console.log(res.data);
      })
      .catch(() => {
        throw new CustomError(400);
      });

    const findUserRepeat = await User.findOne({ where: { id: tokenData?.id }, attributes: { exclude: ['password', 'createdAt'] } });

    if (!findUserRepeat) {
      throw new CustomError(400);
    }
    if (findUserRepeat?.balance < findPackage?.price) {
      throw new CustomError(404, TypeError.BALANCE_ERROR);
    }
    const updateBalance = parseFloat(findUserRepeat?.balance).toFixed(2) - parseFloat(findPackage?.price).toFixed(2);
    await User.update({ balance: updateBalance }, { where: { id: tokenData?.id } });
    await CreditCard.update({ active: false }, { where: { id: findCard?.id } });
    const createTransactionRow = {
      date: new Date(),
      number: generatePaymentRes,
      nickname: checkRes.roleNameCheck,
      price: findPackage?.price,
      packageName: findPackage?.name,
      nickid: checkRes.roleCheck,
      packageId: findPackage?.id,
      creditCardId: findCard?.id,
      userId: findUserRepeat?.id,
      serverid: serverId,
    };
    await Transaction.create(createTransactionRow);
    res.json(true);
  }

  async getTransactions(req, res) {
    const tokenData = jwt.verify(req.headers['request_token'], 'secret-jwt-pass', (err, tokenData) => {
      if (err) {
        throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
      }
      return tokenData;
    });

    const allTrans = await Transaction.findAll({ where: { userId: tokenData?.id } });
    res.json(allTrans);
  }
}

module.exports = new TransactionController();

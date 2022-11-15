const db = require('../models');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const { genshinApi } = require('../utils/genshinApi');
const Transaction = db.transactions;
const User = db.users;
const Package = db.packages;
const TypeGame = db.typeGames;
const CreditCard = db.creditCards;

class TransactionController {
  async createTranscation(req, res) {
    const tokenHeader = req.headers['request_token'];
    const { packageId, playerId, serverId, typeGameId } = req.body;
    console.log(req.body);
    if (!packageId || !playerId || !serverId) {
      throw new CustomError(500);
    }
    const findPackage = await Package.findOne({ where: { code: packageId } });
    if (!findPackage) {
      throw new CustomError(500);
    }

    const tokenData = jwt.verify(tokenHeader, process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
      }
      return tokenData;
    });

    const findUser = await User.findOne({ where: { id: tokenData?.id, active: true }, attributes: { exclude: ['password', 'createdAt'] } });

    if (!findUser) {
      throw new CustomError(400);
    }
    if (findUser?.balance < findPackage?.price) {
      throw new CustomError(404, TypeError.BALANCE_ERROR);
    }
    if (typeGameId === 1) {
      const findCard = await CreditCard.findOne({ where: { packageId: findPackage?.id, status: 'work' } });
      if (!findCard) {
        throw new CustomError(404, TypeError.PACKAGE_NOT_ACTIVE);
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

          return idPayment;
        })
        .catch((err) => {
          throw new CustomError(400);
        });

      const createPaymentRes = await axios
        .post(`https://gamecode.topupease.com/client/gamecode/active`, {
          card_pwd: findCard?.code,
          cardid: findCard?.number,
          pay_orderid: generatePaymentRes,
        })
        .then((res) => {
          return res.data;
        })
        .catch(() => {
          throw new CustomError(400);
        });
      if (createPaymentRes?.code === 1000) {
        await CreditCard.update(
          { status: 'success' },
          {
            where: {
              id: findCard?.id,
            },
          },
        );
        const findUserRepeat = await User.findOne({ where: { id: tokenData?.id }, attributes: { exclude: ['password', 'createdAt'] } });
        if (!findUserRepeat) {
          throw new CustomError(400);
        }
        const updateBalance = parseFloat(findUserRepeat?.balance).toFixed(2) - parseFloat(findPackage?.price).toFixed(2);
        await User.update({ balance: updateBalance }, { where: { id: tokenData?.id } });
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
          typeGameId,
          status: 'completed',
        };
        await Transaction.create(createTransactionRow);
        res.json(true);
      } else if (createPaymentRes?.code === 4301) {
        await CreditCard.update(
          { status: 'incorrect' },
          {
            where: {
              id: findCard?.id,
            },
          },
        );
        throw new CustomError(400);
      } else if (createPaymentRes?.code === 4305) {
        await CreditCard.update(
          { status: 'has-been-used' },
          {
            where: {
              id: findCard?.id,
            },
          },
        );
        throw new CustomError(400);
      } else if (createPaymentRes?.code === 4309) {
        await CreditCard.update(
          { status: 'amount-less' },
          {
            where: {
              id: findCard?.id,
            },
          },
        );
        throw new CustomError(400);
      } else if (createPaymentRes?.code === 4308) {
        await CreditCard.update(
          { status: 'amount-greater' },
          {
            where: {
              id: findCard?.id,
            },
          },
        );
        throw new CustomError(400);
      } else {
        throw new CustomError(400);
      }
    } else if (typeGameId === 2) {
      const genshinOrder = await genshinApi({ type: 'order/create_order', user_id: playerId, server_id: serverId, product_id: packageId });
      const parseOrder = JSON.parse(genshinOrder);
      if (parseOrder?.status === true && parseOrder?.account_details?.['User ID'] === playerId && parseOrder?.order_id) {
        const findUserRepeat = await User.findOne({ where: { id: tokenData?.id }, attributes: { exclude: ['password', 'createdAt'] } });
        if (!findUserRepeat) {
          throw new CustomError(400);
        }
        const updateBalance = parseFloat(findUserRepeat?.balance).toFixed(2) - parseFloat(findPackage?.price).toFixed(2);
        await User.update({ balance: updateBalance }, { where: { id: tokenData?.id } });
        const createTransactionRow = {
          date: new Date(),
          number: parseOrder?.order_id,
          nickname: playerId,
          price: findPackage?.price,
          packageName: findPackage?.name,
          nickid: playerId,
          packageId: findPackage?.id,
          creditCardId: 284,
          userId: findUserRepeat?.id,
          serverid: serverId == 'America' ? 1 : serverId == 'Europe' ? 2 : serverId == 'Asia' ? 3 : serverId == 'TW, HK, MO' ? 4 : 0,
          typeGameId,
          status: 'processing',
        };
        await Transaction.create(createTransactionRow);
        res.json(true);
      } else {
        console.log('errrrrrrr');
        throw new CustomError(400);
      }
    }
  }

  async getTransactions(req, res) {
    const tokenData = jwt.verify(req.headers['request_token'], process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
      }
      return tokenData;
    });

    const allTrans = await Transaction.findAll({
      where: { userId: tokenData?.id },
      include: {
        model: TypeGame,
      },
    });
    res.json(allTrans);
  }
}

module.exports = new TransactionController();

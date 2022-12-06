const db = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const Package = db.packages;
const Payments = db.payments;
const ReferralCode = db.referralCodes;
const ReferralTransactions = db.referralTransactions;
const User = db.users;
const axios = require('axios');
const cheerio = require('cheerio');
class PackageController {
  async getWmRate(req, res) {
    const url = `https://exchanger.web.money/asp/wmlist.asp?exchtype=117`;
    axios
      .get(url)
      .then((response) => {
        let $ = cheerio.load(response.data);
        res.json($('#exchtypebtn117 ~ span').text());
      })
      .catch(function (e) {
        console.log(e);
      });
  }

  async getPayments(req, res) {
    const tokenData = jwt.verify(req.headers['request_token'], process.env.SECRET_TOKEN, (err, tokenData) => {
      if (err) {
        throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
      }
      return tokenData;
    });

    const allPayms = await Payments.findAll({ where: { userId: tokenData?.id } });
    res.json(allPayms);
  }
  async paymentSuccess(req, res) {
    res.send('YES');
  }
  async paymentProcess(req, res) {
    const { LMI_PAYEE_PURSE, LMI_PAYMENT_AMOUNT, LMI_PAYMENT_NO, LMI_MODE, LMI_SYS_INVS_NO, LMI_SYS_TRANS_NO, LMI_SYS_TRANS_DATE, LMI_PAYER_PURSE, LMI_PAYER_WM, LMI_HASH, token, LMI_PREREQUEST } = req.body;

    if (LMI_PREREQUEST === '1') {
      if (LMI_PAYEE_PURSE === 'Z250362075889') {
        res.send('YES');
      }
    } else {
      console.log('PURSE - OK');
      const hashStr = ''.concat(LMI_PAYEE_PURSE, LMI_PAYMENT_AMOUNT, LMI_PAYMENT_NO, LMI_MODE, LMI_SYS_INVS_NO, LMI_SYS_TRANS_NO, LMI_SYS_TRANS_DATE, 'test123', LMI_PAYER_PURSE, LMI_PAYER_WM);
      console.log(LMI_HASH);
      const hashGen = crypto.createHash('sha256').update(hashStr).digest('hex').toUpperCase();

      if (hashGen == LMI_HASH) {
        console.log('HASK OK');
        const tokenData = jwt.verify(token, process.env.SECRET_TOKEN, (err, tokenData) => {
          if (err) {
            console.log('TOKEN - ERROR');
            throw new CustomError(400);
          }
          return tokenData;
        });
        console.log('TOKEN - OK');
        const findUser = await User.findOne({
          where: {
            id: tokenData?.id,
            email: tokenData?.email,
            active: true,
          },
        });
        if (findUser) {
          console.log('FIND - OK');
          const rateResponse = await axios.get('https://exchanger.web.money/asp/wmlist.asp?exchtype=117');
          let $ = cheerio.load(rateResponse.data);
          const rate = $('#exchtypebtn117 ~ span').text();
          const rubCurrent = parseFloat(rate?.replace(',', '.')) * parseFloat(LMI_PAYMENT_AMOUNT);
          if (isNaN(rubCurrent)) {
            console.log('NAN ERROR');
            throw new CustomError(400);
          }
          const updateBalance = parseFloat(findUser?.balance) + parseFloat(rubCurrent);
          const bonusBalanceCalc = parseFloat((0.5 / 100) * parseFloat(rubCurrent)).toFixed(2);
          const newBonusBalance = parseFloat(findUser?.bonusBalance) + parseFloat(bonusBalanceCalc);
          await User.update(
            { balance: updateBalance.toFixed(2), bonusBalance: newBonusBalance },
            {
              where: {
                id: findUser?.id,
                email: findUser?.email,
                active: true,
              },
            },
          );
          const newPayment = { number: LMI_SYS_TRANS_NO, date: new Date(), price: rubCurrent.toFixed(2), userId: findUser?.id };
          const createdPayments = await Payments.create(newPayment);
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
                const percentReferralSum = parseFloat((1 / 100) * rubCurrent).toFixed(2);

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
                    transactionId: createdPayments?.id,
                  });
                }
              }
            }
          }
          res.send('YES');
        } else {
          console.log('FIND - ERROR');
          throw new CustomError(400);
        }
      } else {
        console.log('HASH ERROR');
        throw new CustomError(400);
      }
    }
  }
}

module.exports = new PackageController();

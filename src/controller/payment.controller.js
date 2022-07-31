const db = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const Package = db.packages;
const Payments = db.payments;
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
    const tokenData = jwt.verify(req.headers['request_token'], process.env.ADD_CARD_SECRET, (err, tokenData) => {
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
    console.log(req.body);
    if (LMI_PREREQUEST === '1') {
      if (LMI_PAYEE_PURSE === 'Z157035074475') {
        res.send('YES');
      }
    } else {
      console.log('PURSE - OK');
      const hashStr = ''.concat(LMI_PAYEE_PURSE, LMI_PAYMENT_AMOUNT, LMI_PAYMENT_NO, LMI_MODE, LMI_SYS_INVS_NO, LMI_SYS_TRANS_NO, LMI_SYS_TRANS_DATE, 'test123', LMI_PAYER_PURSE, LMI_PAYER_WM);
      console.log(LMI_HASH);
      const hashGen = crypto.createHash('sha256').update(hashStr).digest('hex').toUpperCase();

      if (hashGen == LMI_HASH) {
        console.log('HASK OK');
        console.log(process.env.SECRET_TOKEN);
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
          const rate = await axios.get('https://idv-back.herokuapp.com/v1/payment/rate').then((data) => data.data);

          const rubCurrent = parseFloat(rate?.replace(',', '.')) * parseFloat(LMI_PAYMENT_AMOUNT);
          if (isNaN(rubCurrent)) {
            console.log('NAN ERROR');
            throw new CustomError(400);
          }
          const updateBalance = parseFloat(findUser?.balance) + parseFloat(rubCurrent);

          await User.update(
            { balance: updateBalance.toFixed(2) },
            {
              where: {
                id: findUser?.id,
                email: findUser?.email,
                active: true,
              },
            },
          );
          const newPayment = { number: LMI_SYS_TRANS_NO, date: new Date(), price: updateBalance.toFixed(2) };
          await Payments.create(newPayment);

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

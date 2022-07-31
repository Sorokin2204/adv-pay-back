const db = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const Package = db.packages;
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
  async paymentSuccess(req, res) {
    const {} = req.body;
    console.log('Wm PARAMS', req.body);
    res.send('YES');
  }
  async paymentProcess(req, res) {
    const { LMI_PAYEE_PURSE, LMI_PAYMENT_AMOUNT, LMI_PAYMENT_NO, LMI_MODE, LMI_SYS_INVS_NO, LMI_SYS_TRANS_NO, LMI_SYS_TRANS_DATE, LMI_PAYER_PURSE, LMI_PAYER_WM, LMI_HASH, token } = req.body;
    if (LMI_PAYEE_PURSE === 'Z157035074475') {
      const hashStr = ''.concat(LMI_PAYEE_PURSE, LMI_PAYMENT_AMOUNT, LMI_PAYMENT_NO, LMI_MODE, LMI_SYS_INVS_NO, LMI_SYS_TRANS_NO, LMI_SYS_TRANS_DATE, 'test123', LMI_PAYER_PURSE, LMI_PAYER_WM);
      console.log(LMI_HASH);
      const hashGen = crypto.createHash('sha256').update(hashStr).digest('hex').toUpperCase();

      if (hashGen == LMI_HASH) {
        const tokenData = jwt.verify(token, 'secret-jwt-pass', (err, tokenData) => {
          if (err) {
            res.json('NO');
          }
          return tokenData;
        });

        const findUser = await User.findOne({
          where: {
            id: tokenData?.id,
            email: tokenData?.email,
          },
        });
        if (findUser) {
            console.log(findUser);
        res.json('YES');
      } else {
        res.json('NO');
      }
    }
    res.json('NO');
  }
}

module.exports = new PackageController();

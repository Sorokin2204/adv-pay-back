const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const Package = db.packages;
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
    console.log('Wm PARAMS', req.body);
    res.send('YES');
  }
}

module.exports = new PackageController();

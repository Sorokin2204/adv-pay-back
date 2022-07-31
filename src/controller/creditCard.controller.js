const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const CreditCard = db.creditCards;
const Package = db.packages;

class CreditCardController {
  async getCreditCards(req, res) {
    const secret = req.headers['request_secret'];
    if (secret === process.env.ADD_CARD_SECRET) {
      const text = Object.keys(req.body)[0];
      let arr = text.split('\r\n');
      const type = arr[0].split(';')[1];
      arr.shift();
      const cards = arr.map((item) => item.split(';'));
      const findPackage = await Package.findOne({ where: { id: type } });
      if (!findPackage) {
        throw new CustomError(404);
      }
      const cardsForPush = cards.map((card) => ({ number: card[0], code: card[1], packageId: type }));
      await CreditCard.bulkCreate(cardsForPush);

      res.json({ status: 'ok' });
    } else {
      res.json({ status: 'error' });
    }
  }
}

module.exports = new CreditCardController();

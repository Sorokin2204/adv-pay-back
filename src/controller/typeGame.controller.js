const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const TypeGame = db.typeGames;

class TypeGameController {
  async findTypeGame(req, res) {
    const { slug } = req.query;
    const findTypeGame = await TypeGame.findOne({ where: { slug, active: true } });
    if (!findTypeGame) {
      throw new CustomError(404, TypeError.NOT_FOUND_TYPE_GAME);
    }

    res.json(findTypeGame);
  }
}

module.exports = new TypeGameController();

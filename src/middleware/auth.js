require('dotenv').config();
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const db = require('../models');
const User = db.users;
async function auth(req, res, next) {
  try {
  } catch (error) {}
  const authHeader = req.headers['request_token'];
  if (!authHeader) {
    throw new CustomError(401, TypeError.PROBLEM_WITH_TOKEN);
  }
  const tokenData = jwt.verify(authHeader, 'secret-jwt-pass', (err, tokenData) => {
    if (err) {
      throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
    }
    return tokenData;
  });
  const loginFind = await User.findOne({ raw: true, where: { email: tokenData.email, id: tokenData.id } });
  if (!loginFind) {
    throw new CustomError(403, TypeError.PROBLEM_WITH_TOKEN);
  }
  next();
}
module.exports = auth;

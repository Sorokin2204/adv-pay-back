const { CustomError } = require('../models/customError.model');

const validateLogin = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err) {
    throw new CustomError(400, {
      errorMessage: 'Неправильный логин или пароль',
    });
  }
};

module.exports = validateLogin;

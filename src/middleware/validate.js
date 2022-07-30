const { CustomError, TypeError } = require('../models/customError.model');

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err) {
    let message;
    console.log(err.message);
    if (err.params.path.includes('params.')) {
      if (typeof err.message === 'number') {
        message = { error: TypeError.PARAMS_NOT_VALID, bugID: `Баг найден, необходимо сообщить разработчику. ID ${err.message}` };
      } else {
        message = TypeError.PARAMS_NOT_VALID;
      }
    } else if (typeof err.message === 'string') {
      message = {
        [err.params.path.replace('body.', '')]: {
          [err.type]: err.message,
        },
      };
    } else if (typeof err.message === 'object') {
      message = {
        [err.params.path.replace('body.', '')]: err.message,
      };
    }
    throw new CustomError(500, message);
  }
};

module.exports = validate;

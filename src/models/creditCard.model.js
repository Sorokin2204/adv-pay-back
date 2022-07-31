const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const CreditCard = sequelize.define('creditCard', {
    number: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'work',
    },
    code: {
      type: Sequelize.STRING,
    },
  });
  return CreditCard;
};

const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const CreditCard = sequelize.define('creditCard', {
    number: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    code: {
      type: Sequelize.STRING,
    },
  });
  return CreditCard;
};

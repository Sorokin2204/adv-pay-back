const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const Payment = sequelize.define('payment', {
    number: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      defaultValue: new Date(),
    },
    price: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
  });
  return Payment;
};

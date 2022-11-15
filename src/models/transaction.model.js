const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const Transaction = sequelize.define('transaction', {
    number: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.DATE,
    },
    nickname: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    packageName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    nickid: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    serverid: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'completed',
    },
  });
  return Transaction;
};

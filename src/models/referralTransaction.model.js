const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const ReferralTransaction = sequelize.define('referralTransaction', {
    // number: {
    //   type: Sequelize.STRING,
    //   allowNull: false,
    // },
    date: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.DATE,
    },
    referralCode: {
      type: Sequelize.STRING,
      defaultValue: Sequelize.STRING,
    },
    referralSum: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },

    transactionId: {
      type: Sequelize.INTEGER,
    },
    // nickname: {
    //   type: Sequelize.STRING,
    //   allowNull: false,
    // },
    // price: {
    //   type: Sequelize.FLOAT,
    //   allowNull: false,
    // },
    // packageName: {
    //   type: Sequelize.STRING,
    //   allowNull: false,
    // },
    // nickid: {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    // },
    // serverid: {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    // },
  });
  return ReferralTransaction;
};

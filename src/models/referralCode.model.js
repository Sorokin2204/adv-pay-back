const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const ReferralCode = sequelize.define('referralCode', {
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    dateEnd: {
      type: Sequelize.DATE,
    },
  });
  return ReferralCode;
};

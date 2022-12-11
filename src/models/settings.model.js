const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const Settings = sequelize.define('settings', {
    textWarning: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    activeWarning: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });
  return Settings;
};

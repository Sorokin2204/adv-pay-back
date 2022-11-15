const valideYear = require('../utils/validYear');
const { CustomError } = require('./customError.model');

module.exports = (sequelize, Sequelize) => {
  const TypeGame = sequelize.define('typeGame', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });
  return TypeGame;
};

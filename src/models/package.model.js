module.exports = (sequelize, Sequelize) => {
  const Package = sequelize.define('package', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return Package;
};

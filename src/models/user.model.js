module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    'user',
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      confirmUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      updatedAt: false,
    },
  );
  return User;
};

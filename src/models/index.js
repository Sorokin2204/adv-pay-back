const Sequelize = require('sequelize');
const reset = require('../setup');
const setupRelationship = require('../setupRelationship');
require('dotenv').config();
// const config = {
//   host: 'us-cdbr-east-06.cleardb.net',
//   user: 'bff23bd1bd5841',
//   pass: 'c094e2ab',
//   dbName: 'heroku_ab36879f58c5bab',
// };
const config = {
  host: 'localhost',
  user: 'root',
  pass: 'pass',
  dbName: 'idv_pay',
};

const sequelize = new Sequelize(config.dbName, config.user, config.pass, {
  host: config.host,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//MODELS

db.users = require('./user.model')(sequelize, Sequelize);
db.packages = require('./package.model')(sequelize, Sequelize);
db.transactions = require('./transaction.model')(sequelize, Sequelize);
db.payments = require('./payment.model')(sequelize, Sequelize);
db.creditCards = require('./creditCard.model')(sequelize, Sequelize);

setupRelationship(db);

module.exports = db;

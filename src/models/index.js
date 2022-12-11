const Sequelize = require('sequelize');
const reset = require('../setup');
const setupRelationship = require('../setupRelationship');
require('dotenv').config();

const config = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  pass: process.env.MYSQL_PASSWORD,
  dbName: process.env.MYSQL_DB,
};
const Op = Sequelize.Op;
const operatorsAliases = {
  $ne: Op.ne,
  $notIn: Op.notIn,
  $or: Op.or,
  $in: Op.in,
  $like: Op.like,
  $startWith: Op.startsWith,
  $lte: Op.lte,
  $lt: Op.lt,
  $gte: Op.gte,
  $gt: Op.gt,
};

const sequelize = new Sequelize(config.dbName, config.user, config.pass, {
  operatorsAliases,
  host: config.host,
  dialect: 'mysql',
  charset: 'utf8',
  collate: 'utf8_general_ci',
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
db.referralCodes = require('./referralCode.model')(sequelize, Sequelize);
db.packages = require('./package.model')(sequelize, Sequelize);
db.transactions = require('./transaction.model')(sequelize, Sequelize);
db.referralTransactions = require('./referralTransaction.model')(sequelize, Sequelize);
db.typeGames = require('./typeGame.model')(sequelize, Sequelize);
db.payments = require('./payment.model')(sequelize, Sequelize);
db.creditCards = require('./creditCard.model')(sequelize, Sequelize);
db.settings = require('./settings.model')(sequelize, Sequelize);

setupRelationship(db);

module.exports = db;

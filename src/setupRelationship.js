const setupRelationship = (db) => {
  db.packages.hasMany(db.creditCards);
  db.creditCards.belongsTo(db.packages);

  db.packages.hasMany(db.transactions);
  db.transactions.belongsTo(db.packages);

  db.creditCards.hasMany(db.transactions);
  db.transactions.belongsTo(db.creditCards);

  db.users.hasMany(db.transactions);
  db.transactions.belongsTo(db.users);

  db.users.hasMany(db.payments);
  db.payments.belongsTo(db.users);

  db.users.hasOne(db.referralCodes);
  db.referralCodes.belongsTo(db.users);

  db.packages.belongsTo(db.typeGames);
  db.typeGames.hasOne(db.packages);

  db.transactions.belongsTo(db.typeGames);
  db.typeGames.hasOne(db.transactions);

  db.users.hasMany(db.referralTransactions);
  db.referralTransactions.belongsTo(db.users);
};

module.exports = setupRelationship;

const setupRelationship = (db) => {
  db.packages.hasMany(db.creditCards);
  db.creditCards.belongsTo(db.packages);

  db.packages.hasMany(db.transactions);
  db.transactions.belongsTo(db.packages);

  db.creditCards.hasMany(db.transactions);
  db.transactions.belongsTo(db.creditCards);

  db.users.hasMany(db.transactions);
  db.transactions.belongsTo(db.users);
};

module.exports = setupRelationship;

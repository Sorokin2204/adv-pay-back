function reset(db) {
  db.packages.bulkCreate([
    { id: 1, name: 'X 60', price: 2000, code: 60 },
    { id: 2, name: 'X 305', price: 3000, code: 300 },
    { id: 3, name: 'X 690', price: 6000, code: 680 },
    { id: 4, name: 'X 3330', price: 10000, code: 3280 },
    { id: 5, name: 'X 6590', price: 12000, code: 6480 },
  ]);
}

module.exports = reset;

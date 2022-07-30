const isBetweenTwoDate = (dateFrom, dateCheck, dateTo) => {
  var d1 = dateFrom.split('/');
  var d2 = dateTo.split('/');
  var c = dateCheck.split('/');

  var from = new Date(d1[2], parseInt(d1[1]) - 1, d1[0]);
  var to = new Date(d2[2], parseInt(d2[1]) - 1, d2[0]);
  var check = new Date(c[2], parseInt(c[1]) - 1, c[0]);

  return check > from && check <= to;
};
module.exports = isBetweenTwoDate;

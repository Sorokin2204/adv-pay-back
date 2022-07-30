const validDate = (value) => {
  let dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  const isDate = dateRegex.test(value);
  if (!isDate) {
    return false;
  }
  const isBeetwen = isBetweenTwoDate('1/1/1900', value, getNowDate());
  if (!isBeetwen) {
    return false;
  }
  return true;
};
module.exports = validDate;

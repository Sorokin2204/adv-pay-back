const valideYear = (value) => {
  if (isNaN(value)) {
    return false;
  }
  const intDate = parseInt(value);
  if (intDate >= 0 && intDate <= new Date().getFullYear()) {
    return true;
  } else {
    return false;
  }
};
module.exports = valideYear;

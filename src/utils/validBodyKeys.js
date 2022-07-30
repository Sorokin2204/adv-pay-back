const validBodyKeys = (keys, body) => {
  let valid = true;
  Object.keys(body).map((key) => {
    if (!keys.find((keyItem) => keyItem === key)) {
      valid = false;
    }
  });
  return valid;
};
module.exports = validBodyKeys;

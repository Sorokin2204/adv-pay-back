const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./src/models');
const bodyParser = require('body-parser');
const userRouter = require('./src/routes/user.routes');
const packageRouter = require('./src/routes/package.routes');
const paymentRouter = require('./src/routes/payment.routes');
const transactionRouter = require('./src/routes/transaction.routes');
const creditCardRouter = require('./src/routes/creditCard.routes');
const cheerio = require('cheerio');
const { handleError } = require('./src/middleware/customError');
const { CustomError, TypeError } = require('./src/models/customError.model');
const { default: axios } = require('axios');
require('dotenv').config();
const moment = require('moment');
var generator = require('generate-password');
var corsOptions = {
  // origin: ['https://donate-gold.ru'],
  origin: '*',
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./images'));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

db.sequelize.sync({ alter: true }).then((se) => {});

app.use('/api/v1', userRouter);
app.use('/api/v1', packageRouter);
app.use('/api/v1', paymentRouter);
app.use('/api/v1', creditCardRouter);
app.use('/api/v1', transactionRouter);
app.use(function (req, res, next) {
  throw new CustomError(404, TypeError.PATH_NOT_FOUND);
});
app.use(handleError);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// const rateGet = async () => {
//   const url = `https://exchanger.web.money/asp/wmlist.asp?exchtype=117`;
//   const rate = await axios
//     .get(url)
//     .then((response) => {
//       let $ = cheerio.load(response.data);
//       const rateData = $('#exchtypebtn117 ~ span').text();
//       return rateData;
//       // res.json($('#exchtypebtn117 ~ span').text());
//     })
//     .catch(function (e) {
//       console.log(e);
//     });
//   return rate;
// };
// console.log(await rateGet());

// .then((response) => {

//   res.json($('#exchtypebtn117 ~ span').text());
// })
// .catch(function (e) {
//   console.log(e);
// });

// const rateGet = async () => {
//   const url = `https://pay.primepayments.io/API/v1/`;
//   const rate = await axios
//     .post(url, {
//       action: 'initPayment',
//       project: 1251,
//       sum: '100',
//       currency: 'RUB',
//       innerID: '1234',
//       email: 'test@test.com',
//       sign: 'd3d3d07d69bfa25324c9a244a1a7185b',
//     })
//     .then((response) => {
//       console.log(response.data);
//     })
//     .catch(function (e) {
//       console.log(e);
//     });
//   return rate;
// };
// console.log(rateGet());

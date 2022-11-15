const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./src/models');
const bodyParser = require('body-parser');
const userRouter = require('./src/routes/user.routes');
const typeGameRouter = require('./src/routes/typeGame.routes');
const packageRouter = require('./src/routes/package.routes');
const paymentRouter = require('./src/routes/payment.routes');
const transactionRouter = require('./src/routes/transaction.routes');
const creditCardRouter = require('./src/routes/creditCard.routes');
const cheerio = require('cheerio');
const { handleError } = require('./src/middleware/customError');
const { CustomError, TypeError } = require('./src/models/customError.model');
const { default: axios } = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const moment = require('moment');
var generator = require('generate-password');
const { genshinApi } = require('./src/utils/genshinApi');
var corsOptions = {
  // origin: ['https://donate-gold.ru'],
  origin: '*',
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./images'));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

db.sequelize.sync({ alter: true }).then((se) => {
  // db.typeGames.bulkCreate([
  //   {
  //     id: 1,
  //     name: 'Identity',
  //     slug: 'identity-v',
  //   },
  //   {
  //     id: 2,
  //     name: 'Genshin',
  //     slug: 'genshin',
  //   },
  // ]);
  // db.transactions.update({ typeGameId: 1 }, { where: { typeGameId: null } });
  // db.packages.update({ typeGameId: 1 }, { where: { typeGameId: null } });
});
cron.schedule('*/30 * * * * *', async () => {
  const processingTrans = await db.transactions.findAll({ where: { status: 'processing' }, raw: true });
  for (let processingItem of processingTrans) {
    try {
      let dataOrder = await genshinApi({ type: 'order/order_detail', order_id: processingItem?.number });
      dataOrder = JSON.parse(dataOrder);
      if (dataOrder?.order_id === processingItem?.number && dataOrder?.order_status) {
        await db.transactions.update(
          { status: dataOrder?.order_status },
          {
            where: {
              id: processingItem?.id,
            },
          },
        );
      }
    } catch (errorrr) {}
  }
});

app.use('/api/v1', userRouter);
app.use('/api/v1', typeGameRouter);
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

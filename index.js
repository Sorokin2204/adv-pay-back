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

db.sequelize.sync({ alter: true }).then((se) => {});
cron.schedule('0 0 */2 * * *', async () => {
  const processingTrans = await db.transactions.findAll({
    where: {
      typeGameId: 2,
      $or: [
        { status: 'incorrect-details' },
        {
          createdAt: {
            $lt: new Date(),
            $gt: moment().subtract(2, 'hours'),
          },
        },
      ],
    },
    raw: true,
  });
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

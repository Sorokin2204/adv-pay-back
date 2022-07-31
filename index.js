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
const reset = require('./src/setup');
const { handleError } = require('./src/middleware/customError');
const { CustomError, TypeError } = require('./src/models/customError.model');
require('dotenv').config();

var corsOptions = {
  origin: '*',
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./images'));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

db.sequelize.sync({ force: true }).then((se) => {
  reset(db);
});

app.use('/v1', userRouter);
app.use('/v1', packageRouter);
app.use('/v1', paymentRouter);
app.use('/v1', creditCardRouter);
app.use('/v1', transactionRouter);
app.use(function (req, res, next) {
  throw new CustomError(404, TypeError.PATH_NOT_FOUND);
});
app.use(handleError);

const PORT = process.env.PORT || 8080;
// const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

const axios = require('axios');

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

db.sequelize.sync({ alter: true }).then(async (se) => {});
cron.schedule('0 0 */2 * * *', async () => {
  const processingTrans = await db.transactions.findAll({
    where: {
      typeGameId: 2,
      $or: [
        { status: 'incorrect-details' },
        {
          status: 'processing',
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
// (async function example() {
//   let driver = await new Builder().forBrowser(Browser.CHROME).build();
//   try {
//     await driver.get('https://pay.neteasegames.com/identityv/topup');
//     setTimeout(async () => {
//       // await driver.findElement(By.id('rc_select_0')).sendKeys('Asio', Key.RETURN);
//       // const conne = await driver.createCDPConnection('page');
//       // console.log(dirver.requset);
//       // const browserVersion = await driver.executeScript('return window.performance.getEntries();');
//       // console.log(browserVersion);
//     }, 5000);

//     // driver.getDev
//     // await driver.wait(elem.getText(), 1000);
//   } finally {
//     // setTimeout(async () => {
//     //   await driver.quit();
//     // }, 5000);
//   }
// })();
// async function StartScrap() {
//   const url = 'https://stackoverflow.com/questions/60579493/intercept-a-certain-request-and-get-its-response-puppeteer';
//   await puppeteer.launch({ headless: false, executablePath: executablePath() }).then(async (browser) => {
//     const page = await browser.newPage();
//     await page.setViewport({ width: 700, height: 700 });

//     await page.goto(url, { waitUntil: 'load', timeout: 0 });
//     page.on('response', async (res) => {
//       console.log(await res);
//     });
//   });
// }
// StartScrap();
/////////WORK//////////////
// const puppeteer = require('puppeteer');
// const request_client = require('request-promise-native');
// fs = require('fs');
// (async () => {
//   let countLogin = 0;
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   await page.setRequestInterception(true);

//   page.on('request', (request) => {
//     request_client({
//       uri: request.url(),
//       resolveWithFullResponse: true,
//     })
//       .then(async (response) => {
//         const request_url = request.url();
//         const request_headers = request.headers();
//         const request_post_data = request.postData();
//         const response_headers = response.headers;
//         const response_size = response_headers['content-length'];
//         const response_body = response.body;
//         const request_method = request.method();

//         if (request_url.includes('login-role') && countLogin !== 1) {
//           setTimeout(async () => {
//             if (response_body.includes('"data":null')) {
//               await browser.close();
//             }
//             await page.click('.goods-item-pc:nth-child(1)');
//             await page.click('.topup-detail-box .topup-btn');
//             countLogin = 1;
//           }, 3000);
//         }

//         if (countLogin == 1) {
//           const tabs = await browser.pages();
//           if (tabs?.length == 3) {
//             console.log('RESULT', tabs[tabs.length - 1].url());
//             await browser.close();
//           }
//         }
//         request.continue();
//       })
//       .catch((error) => {
//         request.abort();
//       });
//   });

//   await page.goto('https://pay.neteasegames.com/identityv/topup', {
//     waitUntil: 'networkidle0',
//     timeout: 60000,
//   });
//   await page.click('#rc_select_0');
//   await page.type('#rc_select_0', 'NA', { delay: 100 });
//   await (await page.$('#rc_select_0')).press('Enter');
//   await page.type('.userid-login .bui-input', '355454', { delay: 100 });
//   await page.click('.privacy-wrap input[type=checkbox]');
//   await page.click('.userid-login .bui-button.userid-login-btn');
//   3554540;
// })();

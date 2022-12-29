const puppeteer = require('puppeteer');
const request_client = require('request-promise-native');
fs = require('fs');

// async function getIdenOrderId(userId, serverId, packNumber) {
//   let serverLetters;
//   let packNthNumber;
//   if (serverId == '2001') {
//     serverLetters = 'Asia';
//   } else if (serverId == '2011') {
//     serverLetters = 'NA';
//   }
//   if (!serverLetters) {
//     return;
//   }
//   switch (packNumber) {
//     case '60':
//       packNthNumber = '1';
//       break;
//     case '185':
//       packNthNumber = '2';
//     case '300':
//       packNthNumber = '3';
//       break;
//     case '680':
//       packNthNumber = '4';
//       break;
//     case '2025':
//       packNthNumber = '5';
//       break;
//     case '3280':
//       packNthNumber = '6';
//       break;
//     case '6480':
//       packNthNumber = '7';
//       break;
//     default:
//       return;
//       break;
//   }
//   console.log(userId, serverLetters, packNthNumber);
//   let isLogin = false;
//   const browser = await puppeteer.launch({ headless: false });
//   //   try {
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

//         if (request_url.includes('login-role') && !isLogin) {
//           setTimeout(async () => {
//             if (response_body.includes('"data":null')) {
//               await browser.close();
//               return;
//             }
//             await page.click(`.goods-item-pc:nth-child(${packNthNumber})`);
//             await page.click('.topup-detail-box .topup-btn');
//             isLogin = true;
//           }, 3000);
//         }

//         if (countLogin == 1) {
//           const tabs = await browser.pages();
//           if (tabs?.length == 3) {
//             await browser.close();
//             return tabs[tabs.length - 1].url();
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
//     timeout: 0,
//   });
//   await page.click('#rc_select_0');
//   await page.type('#rc_select_0', serverLetters, { delay: 100 });
//   await (await page.$('#rc_select_0')).press('Enter');
//   await page.type('.userid-login .bui-input', userId, { delay: 100 });
//   await page.click('.privacy-wrap input[type=checkbox]');
//   await page.click('.userid-login .bui-button.userid-login-btn');
//   //   } catch (error) {
//   //     console.log('ERROR PUP', error);
//   //   } finally {
//   //     await browser.close();
//   //   }
// }

async function getIdenOrderId(userId, serverId, packNumber) {
  return new Promise(async (resolve, reject) => {
    let browser;
    try {
      let serverLetters;
      let packNthNumber;
      if (serverId == '2001') {
        serverLetters = 'Asia';
      } else if (serverId == '2011') {
        serverLetters = 'NA';
      }
      if (!serverLetters) {
        reject();
      }
      switch (packNumber) {
        case '60':
          packNthNumber = '1';
          break;
        case '185':
          packNthNumber = '2';
        case '300':
          packNthNumber = '3';
          break;
        case '680':
          packNthNumber = '4';
          break;
        case '2025':
          packNthNumber = '5';
          break;
        case '3280':
          packNthNumber = '6';
          break;
        case '6480':
          packNthNumber = '7';
          break;
        default:
          reject();
          break;
      }
      let orderUrl;
      let countLogin = 0;
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.setRequestInterception(true);

      page.on('request', (request) => {
        request_client({
          uri: request.url(),
          resolveWithFullResponse: true,
        })
          .then(async (response) => {
            const request_url = request.url();
            const request_headers = request.headers();
            const request_post_data = request.postData();
            const response_headers = response.headers;
            const response_size = response_headers['content-length'];
            const response_body = response.body;
            const request_method = request.method();

            if (request_url.includes('login-role') && countLogin !== 1) {
              setTimeout(async () => {
                if (response_body.includes('"data":null')) {
                  await browser.close().catch(() => {
                    reject();
                  });
                }
                await page.click(`.goods-item-pc:nth-child(${packNthNumber})`).catch(() => {
                  reject();
                });
                await page.click('.topup-detail-box .topup-btn').catch(() => {
                  reject();
                });
                countLogin = 1;
              }, 3000);
            }

            if (countLogin == 1) {
              const tabs = await browser.pages().catch(() => {
                reject();
              });
              if (tabs?.length == 3) {
                await browser.close().catch(() => {
                  reject();
                });
                orderUrl = tabs[tabs.length - 1].url();
              }
            }
            request.continue();
          })
          .catch((error) => {
            request.abort();
          });
      });

      await page
        .goto('https://pay.neteasegames.com/identityv/topup', {
          waitUntil: 'networkidle0',
          timeout: 0,
        })
        .catch(() => {
          reject();
        });
      await page.click('#rc_select_0');
      await page.type('#rc_select_0', serverLetters, { delay: 100 }).catch(() => {
        reject();
      });
      await (
        await page.$('#rc_select_0').catch(() => {
          reject();
        })
      )
        .press('Enter')
        .catch(() => {
          reject();
        });
      await page.type('.userid-login .bui-input', userId, { delay: 100 }).catch(() => {
        reject();
      });
      await page.click('.privacy-wrap input[type=checkbox]').catch(() => {
        reject();
      });
      await page.click('.userid-login .bui-button.userid-login-btn').catch(() => {
        reject();
      });
      let finishTime = 60000;
      let currentTime = 0;
      while (finishTime != currentTime) {
        await sleep(200);
        if (orderUrl) {
          const urlPayment = new URL(orderUrl);
          const paramsPayment = urlPayment.searchParams;
          const idPayment = paramsPayment.get('pay_orderid');
          if (idPayment) {
            currentTime = 60000;
            resolve(idPayment);
          } else {
            reject();
          }
        } else {
          currentTime += 200;
        }
      }
      reject();
    } catch (error) {
    } finally {
      await browser.close().catch(() => {
        reject();
      });
    }
  })
    .then((resultData) => resultData)
    .catch(() => {});
}
module.exports = { getIdenOrderId };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const puppeteer = require('puppeteer');
const request_client = require('request-promise-native');
fs = require('fs');
const minimal_args = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--no-sandbox',
  '--disabled-setupid-sandbox',
  `--window-size=1920,1080`,
];
async function getIdenOrderId(userId, serverId, packNumber) {
  return new Promise(async (resolve, reject) => {
    let browser;
    let currentTime = 0;
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
      browser = await puppeteer.launch({
        headless: true,
        args: minimal_args,
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });
      console.log('Start brows');
      const page = await browser.newPage();
      console.log('Start page');

      await page.setRequestInterception(true);

      page.on('request', (request) => {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
          request.abort();
        } else {
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
                  console.log('LOGIN SUCCESS');

                  if (response_body.includes('"data":null')) {
                    console.log('NOT FOUND DATA LOGIN');
                    await browser.close().catch((er) => {
                      reject(er);
                    });
                  }

                  await page.click(`.goods-item-pc:nth-child(${packNthNumber})`).catch((er) => {
                    reject(er);
                  });
                  console.log('Click packages');
                  await page.click('.topup-detail-box .topup-btn').catch((er) => {
                    reject();
                  });
                  console.log('Click submit');
                  countLogin = 1;
                }, 3000);
              }

              if (countLogin == 1) {
                console.log('Order created');
                const tabs = await browser.pages().catch((er) => {
                  reject(er);
                });
                if (tabs?.length == 3) {
                  console.log('Tabs news open');
                  await browser.close().catch((er) => {
                    reject(er);
                  });
                  orderUrl = tabs[tabs.length - 1].url();
                  console.log('URL _ ', orderUrl);
                }
              }
              request.continue();
            })
            .catch((error) => {
              request.abort();
            });
        }
      });

      await page
        .goto('https://pay.neteasegames.com/identityv/topup', {
          waitUntil: 'networkidle0',
          timeout: 0,
        })
        .catch(() => {
          reject();
        });
      console.log('Open page');
      await sleep(200);
      await page.click('.region-lan-select').catch((err) => {
        console.log(err);
      });
      await sleep(1000);
      await page.click('.bui-select-selector').catch((err) => {
        console.log(err);
      });
      await sleep(400);
      await page.click('.bui-select-item-option:nth-child(5)').catch((err) => {
        console.log(err);
      });
      await sleep(200);
      await page.click('#rc_select_0');
      console.log('Click select');
      await page.type('#rc_select_0', serverLetters, { delay: 100 }).catch((er) => {
        reject(er);
      });
      console.log('input server');
      await (
        await page.$('#rc_select_0').catch((er) => {
          reject(er);
        })
      )
        .press('Enter')
        .catch((er) => {
          reject(er);
        });
      console.log('press enter');
      await page.type('.userid-login .bui-input', userId, { delay: 100 }).catch((er) => {
        reject(er);
      });
      console.log('input userid');
      await page.click('.privacy-wrap input[type=checkbox]').catch((er) => {
        reject(er);
      });
      console.log('click checkbox');
      await page.click('.userid-login .bui-button.userid-login-btn').catch((er) => {
        reject(er);
      });
      console.log('click login');
      let finishTime = 60000;

      while (finishTime != currentTime) {
        await sleep(200);
        if (orderUrl) {
          console.log(currentTime);

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
      reject('NO search');
    } catch (error) {
      console.log(error);
    } finally {
      currentTime = 60000;
      await browser?.close()?.catch((er) => {
        reject(er);
      });
    }
  })
    .then((resultData) => resultData)
    .catch((er) => {
      console.log('ERROR', er);
      currentTime = 60000;
    });
}
module.exports = { getIdenOrderId };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

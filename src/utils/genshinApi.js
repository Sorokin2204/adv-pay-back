const { exec } = require('child_process');

function genshinApi(params) {
  return new Promise((resolve, reject) => {
    const urlParams = new URLSearchParams(params).toString();
    exec(`php genshinApi.php "${urlParams}"`, (error, stdout, stderr) => {
      if (error) {
        reject();
      }
      if (stderr) {
        reject();
      }
      resolve(stdout.replace(/^\s+|\s+$/g, ''));
    });
  });
}
module.exports = { genshinApi };

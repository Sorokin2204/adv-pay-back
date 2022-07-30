const Router = require('express');
const packageController = require('../controller/package.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');

router.get('/package/list', errorWrapper(auth), errorWrapper(packageController.getPackages));

module.exports = router;

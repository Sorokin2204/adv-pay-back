const Router = require('express');
const packageController = require('../controller/package.controller');
const paymentController = require('../controller/payment.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');

router.get('/payment/rate', errorWrapper(paymentController.getWmRate));

router.post('/payment/success', errorWrapper(paymentController.paymentSuccess));

module.exports = router;

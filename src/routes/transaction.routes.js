const Router = require('express');
const packageController = require('../controller/package.controller');
const paymentController = require('../controller/payment.controller');
const transactionController = require('../controller/transaction.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');

router.post('/transaction/create', errorWrapper(auth), errorWrapper(transactionController.createTranscation));

router.get('/transaction/list', errorWrapper(auth), errorWrapper(transactionController.getTransactions));

module.exports = router;

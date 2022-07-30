const Router = require('express');
const bodyParser = require('body-parser');
const creditCardController = require('../controller/creditCard.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');

router.post('/creditCard/add/:secret', errorWrapper(creditCardController.getCreditCards));

module.exports = router;

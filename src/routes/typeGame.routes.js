const Router = require('express');
const bodyParser = require('body-parser');
const typeGameController = require('../controller/typeGame.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');

router.get('/typeGame/find', errorWrapper(typeGameController.findTypeGame));

module.exports = router;

const Router = require('express');
const userController = require('../controller/user.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const validate = require('../middleware/validate');

router.post('/user/add', errorWrapper(userController.createUser));
router.post('/user/login', errorWrapper(userController.loginUser));
router.get('/user/get', errorWrapper(auth), errorWrapper(userController.getUser));
router.get('/activate/:link', userController.activate);
router.get('/vk-comments', userController.getVkComments);
router.get('/user/check/:id/:server', errorWrapper(auth), errorWrapper(userController.checkAccount));
router.post('/user/buy', errorWrapper(userController.payment));

module.exports = router;

const Router = require('express');
const userController = require('../controller/user.controller');
const router = new Router();
const auth = require('../middleware/auth');
const { errorWrapper } = require('../middleware/customError');
const validate = require('../middleware/validate');
// const { userByIdValidation, userUpdateAllValidation, serUpdateValidation, userDeleteValidation } = require('../validation/user.validation');

router.post('/user/add', errorWrapper(userController.createUser));
router.post('/user/login', errorWrapper(userController.loginUser));
router.get('/user/get', errorWrapper(auth), errorWrapper(userController.getUser));

router.get('/user/check/:id/:server', errorWrapper(auth), errorWrapper(userController.checkAccount));
router.post('/user/buy', errorWrapper(userController.payment));
// router.patch('/user/:id', errorWrapper(validate(userUpdateValidation)), errorWrapper(auth), errorWrapper(userController.updateUser));

// router.delete('/user/:id', errorWrapper(validate(userDeleteValidation)), errorWrapper(auth), errorWrapper(userController.deleteUser));
module.exports = router;

const TypeError = {
  PROBLEM_WITH_TOKEN: 'PROBLEM_WITH_TOKEN',
  BODY_NOT_VALID: 'BODY_NOT_VALID',
  PARAMS_NOT_VALID: 'PARAMS_NOT_VALID',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  UNDEFINED_ERROR: 'UNDEFINED_ERROR',
  NOT_FOUND_USER: 'NOT_FOUND_USER',
  USER_EXIST: 'USER_EXIST',
  LOGIN_ERROR: 'LOGIN_ERROR',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  PACKAGE_NOT_ACTIVE: 'PACKAGE_NOT_ACTIVE',
  BALANCE_ERROR: 'BALANCE_ERROR',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',
  INCORRECT_ACTIVE_LINK: 'INCORRECT_ACTIVE_LINK',
  NOT_FOUND_REFERRAL_CODE: 'NOT_FOUND_REFERRAL_CODE',
  CAPTHA_ERROR: 'CAPTHA_ERROR',
};

class CustomError {
  constructor(status = 500, response = TypeError.UNEXPECTED_ERROR) {
    this.status = status;
    if (TypeError.hasOwnProperty(response)) {
      this.response = { error: response };
    } else {
      this.response = response;
    }
  }
}
module.exports = { CustomError, TypeError };

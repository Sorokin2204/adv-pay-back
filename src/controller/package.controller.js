const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CustomError, TypeError } = require('../models/customError.model');
const Package = db.packages;

class PackageController {
  async getPackages(req, res) {
    const findPackages = await Package.findAll();
    res.json(findPackages);
  }
}

module.exports = new PackageController();

const ServerError = require('../errors/serverError');

module.exports = (err, req, res, next) => {
  if (!err.statusCode) {
    const erorr = new ServerError('Server Error 500');
    res.status(erorr.statusCode).send({ message: erorr.message });
    next();
  } else {
    res.status(err.statusCode).send({ message: err.message });
    next();
  }
};

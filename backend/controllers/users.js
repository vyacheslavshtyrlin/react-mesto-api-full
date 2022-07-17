const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFound = require('../errors/notFoundError');
const Conflict = require('../errors/conflictError');
const BadRequest = require('../errors/badRequest');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.login = (req, res, next) => {
  const { password, email } = req.body;
  User.findUserByCredentials(password, email)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'secret', { expiresIn: '7d' });
      res.status(200).send({ token });
    })
    .catch(next);
};

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .orFail(() => {
      throw new NotFound('Не найдено ни одного пользователя');
    })
    .then((users) => {
      res.send({ data: users });
    })
    .catch(next);
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .orFail(() => {
      throw new NotFound('Нет пользователя по заданному id');
    })
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .catch(next)
    .then((hash) => {
      User.create({
        name, about, avatar, email, password: hash,
      })
        .then((data) => {
          res.send({
            name: data.name,
            about: data.about,
            avatar: data.avatar,
            email: data.email,
          }).status(200);
        })
        .catch((error) => {
          if (error.code === 11000) {
            throw new Conflict('Пользователь с таким e-mail уже зарегестрирован');
          } else if (error.name === 'ValidationError' || error.name === 'CastError') {
            throw new BadRequest(error.message);
          }
          throw error;
        })
        .catch(next);
    });
};

module.exports.patchUser = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, about }, { new: true, runValidators: true })
    .then((data) => {
      res.send({ name: data.name, about: data.about, avatar: data.avatar }).status(200);
    })
    .catch((error) => {
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        throw new BadRequest(error.message);
      }
      throw error;
    })
    .catch(next);
};

module.exports.patchAvatar = (req, res, next) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(req.user._id, { avatar }, { new: true, runValidators: true })
    .then((user) => {
      res.send({ name: user.name, about: user.about, avatar: user.avatar }).status(200);
    })
    .catch((error) => {
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        throw new BadRequest(error.message);
      }
      throw error;
    })
    .catch(next);
};

module.exports.getUserMe = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(() => {
      throw new NotFound('Нет пользователя с таким id');
    })
    .then((user) => res.send({ user }).status(200))
    .catch(next);
};

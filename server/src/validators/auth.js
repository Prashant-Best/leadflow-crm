const { body, checkExact } = require('express-validator');

const emailRule = () =>
  body('email')
    .exists({ values: 'falsy' })
    .withMessage('Email is required')
    .bail()
    .isString()
    .withMessage('Email must be text')
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Enter a valid email address');

const registerRules = [
  checkExact(
    [
      body('name')
        .exists({ values: 'falsy' })
        .withMessage('Name is required')
        .bail()
        .isString()
        .withMessage('Name must be text')
        .bail()
        .trim()
        .isLength({ min: 2, max: 60 })
        .withMessage('Name must be 2-60 characters'),
      emailRule(),
      body('password')
        .exists({ values: 'falsy' })
        .withMessage('Password is required')
        .bail()
        .isString()
        .withMessage('Password must be text')
        .bail()
        .isLength({ min: 8, max: 72 })
        .withMessage('Password must be 8-72 characters'),
    ],
    { locations: ['body'] }
  ),
];

const loginRules = [
  checkExact(
    [
      emailRule(),
      // isString blocks NoSQL operator payloads such as { "$gt": "" }.
      body('password')
        .exists({ values: 'falsy' })
        .withMessage('Password is required')
        .bail()
        .isString()
        .withMessage('Password must be text'),
    ],
    { locations: ['body'] }
  ),
];

module.exports = { registerRules, loginRules };

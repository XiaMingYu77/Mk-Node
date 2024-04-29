const express = require('express');
const userApi = require('./user/index');
const workerApi = require('./worker/index');

const router = express.Router();

router.use('/user', userApi);
router.use('/project', workerApi);

module.exports = router;
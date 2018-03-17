'use strict';
// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const loginJs_debugger = debug('debug:login.js');
loginJs_debugger('login.js処理開始');

const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  loginJs_debugger('GET処理開始')
  res.render('login', { user: req.user });
  loginJs_debugger('GET処理完了')
});

module.exports = router;

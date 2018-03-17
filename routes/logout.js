'use strict';
// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const logoutJs_debugger = debug('debug:logout.js');
logoutJs_debugger('logout.js処理開始');

const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  logoutJs_debugger('GET処理開始')
  req.logout();
  res.redirect('/');
  logoutJs_debugger('GET処理完了')
});

module.exports = router;

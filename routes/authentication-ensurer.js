// 厳格モード
'use strict';

// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const authenticationEnsurerJs_debugger = debug('debug:authenticationEnsurer.js');
authenticationEnsurerJs_debugger('authenticationEnsurer.js処理開始');

// 認証を確認する処理
function ensure(req, res, next) {
  authenticationEnsurerJs_debugger('ensure処理開始')
  // ログインされているときだけnext()が発行されて
  // 次のミドルウェアへ処理がわたる
  if (req.isAuthenticated()) {
    return next();
  }
  // ログインしていなければリダイレクトして終了
  // (next()が発行されない)
  res.redirect('/login');
  authenticationEnsurerJs_debugger('ensure処理完了')
}

module.exports = ensure;
// commentを取得するAPI
// 大体availabilities.jsを一緒なのでそっちも参照

// 厳格モード
'use strict';
// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const commentJs_debugger = debug('debug:comment.js');
commentJs_debugger('comment.js処理開始');

// ルーター作成
const express = require('express');
const router = express.Router();

// 認証確認の自作モジュール呼び出し
const authenticationEnsurer = require('./authentication-ensurer');

// Commentモデル呼び出し
const Comment = require('../models/comment');

// /schedules/:scheduleId/users/:userId/comments
// にPOSTでアクセスされた際の処理
router.post('/:scheduleId/users/:userId/comments',
  // ログインしていない場合はauthenticationEnsurerモジュールで
  // next()が発行されない
  authenticationEnsurer,
  (req, res, next) => {
    // パラメータを受け取る
    const scheduleId = req.params.scheduleId;
    const userId = req.params.userId;
    const comment = req.body.comment;
    // CommentをDBに追加
    Comment.upsert({
      scheduleId: scheduleId,
      userId: userId,
      // コメントは255文字まで
      comment: comment.slice(0, 255)
      // Upsertが終了したら
    }).then(() => {
      // ResponseをJSON形式で返す
      res.json({ status: 'OK', comment: comment });
    });
  }
);

module.exports = router;
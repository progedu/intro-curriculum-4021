// 厳格モード
'use strict';
// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const availabilitiesJs_debugger = debug('debug:availabilities.js');
availabilitiesJs_debugger('availabilities.js処理開始');

// ルーター作成
const express = require('express');
const router = express.Router();

// 認証確認の自作モジュール呼び出し
const authenticationEnsurer = require('./authentication-ensurer');

// Availabilityモデル呼び出し
const Availability = require('../models/availability');

// /schedules/:scheduleId/users/:userId/candidates/:candidateId'
// にPOSTでアクセスされた際の処理
router.post(
  '/:scheduleId/users/:userId/candidates/:candidateId',
  // ログインしていない場合はauthenticationEnsurerモジュールで
  // next()が発行されない
  authenticationEnsurer,
  (req, res, next) => {
    // パラメータを受け取る
    const scheduleId = req.params.scheduleId;
    const userId = req.params.userId;
    const candidateId = req.params.candidateId;
    let availability = req.body.availability;
    // availabilityは数字に変換する
    // 未設定の場合は0(欠席)
    availability = availability ? parseInt(availability) : 0;
    // AvailabilityをDBに追加
    Availability.upsert({
      scheduleId: scheduleId,
      userId: userId,
      candidateId: candidateId,
      availability: availability
    }).then(() => {
      // ResponseをJSON形式で返す
      res.json({ status: 'OK', availability: availability });
    });
  }
);

module.exports = router;
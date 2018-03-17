// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const indexJs_debugger = debug('debug:index.js');
indexJs_debugger('index.js処理開始');

// ルーター作成
var express = require('express');
var router = express.Router();

// Scheduleモデルを呼び出す
const Schedule = require('../models/schedule');

/* GET home page. */
// GETアクセス時の処理
router.get('/', (req, res, next) => {
  indexJs_debugger('GET処理開始')
  const title = '予定調整くん';
  // ログインしていれば  
  if (req.user) {
    // ユーザーが作成したScheduleを取得して
    Schedule.findAll({
      where: {
        createdBy: req.user.id
      },
      // 更新日時の新しい順に表示する
      order: '"updatedAt" DESC'
    }).then((schedules) => {
      // 取得できたらindex.jjadeテンプレートを適用して表示
      res.render('index', {
        title: title,
        user: req.user,
        schedules: schedules
      });
    });
  } else {
    res.render('index', { title: title });
  }
  indexJs_debugger('GET処理完了')
});

module.exports = router;
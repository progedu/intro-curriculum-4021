// 厳格モード
'use strict';
// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const scheduleJs_debugger = debug('debug:schedule.js');
scheduleJs_debugger('schedule.js処理開始');

// 'node-uuid'モジュール読み込み
// UUIDを生成するために必要
const uuid = require('node-uuid');
// 各モデルを読み込む
const Schedule = require('../models/schedule');
const Candidate = require('../models/candidate');
const User = require('../models/user');
const Availability = require('../models/availability');
const Comment = require('../models/comment');

// ルーター作成
const express = require('express');
const router = express.Router();

// 認証確認用の自作モジュール読み込み
const authenticationEnsurer = require('./authentication-ensurer');

// GETで/schedules/newにアクセスされた時の処理
router.get('/new', authenticationEnsurer, (req, res, next) => {
  scheduleJs_debugger('GET(schedule/new)処理開始')
  res.render('new', { user: req.user });
  scheduleJs_debugger('GET(schedule/new)処理完了')
});

// POSTでschedules/newからデータを渡された時の処理
router.post('/', authenticationEnsurer, (req, res, next) => {
  // console.dir(req);
  scheduleJs_debugger('POST処理開始')
  // 予定(Schedule)のIDとしてUUIDを生成
  const scheduleId = uuid.v4();
  // 更新日時として現在時刻を設定
  const updatedAt = new Date();
  // Scheduleを生成して
  Schedule.create({
    scheduleId: scheduleId,
    // scheduleNameは255文字までとする
    scheduleName: req.body.scheduleName.slice(0, 255),
    memo: req.body.memo,
    // いつの間にかreq.userにGitHubの情報がわたっている
    createdBy: req.user.id,
    updatedAt: updatedAt
    // Scheduleが生成できれば
  }).then((schedule) => {
    // 候補日のデータを配列として受け取る
    let candidateNames = parseCandidateNames(req);
    // 配列内の空文字を消去する
    candidateNames = trimArray(candidateNames);
    createCandidatesAndRedirect(candidateNames, scheduleId, res);    // 候補日のテキストボックスに入力されたデータを
    // // trim()して
    // // 改行コードでsplit()して配列にして
    // // 配列の中身もtrim()した配列を返す？
    // const candidateNames = req.body.candidates
    //   .trim()
    //   .split('\r\n')
    //   .map((s) => s.trim());
    // // その配列を１つずつCandidateModelっぽいものに変換して
    // // CandidateModelっぽいものの配列を作る
    // const candidates = candidateNames.map((c) => {
    //   return {
    //     candidateName: c,
    //     scheduleId: schedule.scheduleId
    //   };
    // });
    // // 作った配列をまとめてDBに登録して、
    // Candidate.bulkCreate(candidates).then(() => {
    //   // うまくいったら/schedules/{scheduleId}にリダイレクトする
    //   // 初心者がわかるかこんなもん
    //   res.redirect('/schedules/' + schedule.scheduleId);
    // });
  });
  scheduleJs_debugger('POST処理完了')
});

// schedules/{scheduleId}にGETでアクセスされた時の処理
router.get('/:scheduleId',
  authenticationEnsurer,
  (req, res, next) => {
    scheduleJs_debugger('GET(schedule/{scheduleId})処理開始')
    let storedSchedule = null;
    let storedCandidates = null;
    // 発行されるSQL
    // SELECT 
    //   "schedules"."scheduleId",
    //   "schedules"."scheduleName",
    //   "schedules"."memo",
    //   "schedules"."createdBy",
    //   "schedules"."updatedAt",
    //   "user"."userId" AS "user.userId",
    //   "user"."username" AS "user.username"
    // FROM 
    //   "schedules" AS "schedules"
    // LEFT OUTER JOIN
    //   "users" AS "user"
    // ON
    //   "schedules"."createdBy" = "user"."userId"
    // WHERE
    //   "schedules"."scheduleId" = '301316ee-67b1-4f2d-8b56-0e3fc6c815a9'
    // ORDER BY
    //   "updatedAt" DESC;
    Schedule.findOne({
      // Userテーブルと結合しているのだろう
      // DB作成時に従属関係を設定しているので
      // モデル名を指定するだけでいい感じに結合してくれるのだと思う
      // 初めて出てきた文法はちゃんと説明しろぼけ
      include: [
        {
          model: User,
          attributes: ['userId', 'username']
        }],
      // WHERE条件
      where: {
        scheduleId: req.params.scheduleId
      },
      order: '"updatedAt" DESC'
    }).then((schedule) => {
      // scheduleが取得できれば
      if (schedule) {
        // 対象スケジュールの候補日をすべて取得する
        storedSchedule = schedule;
        // then()の第一引数（onfullfilled()）のなかで
        // 新たなpromiseを返すと
        // そのままthen()の返り値となるようだ
        return Candidate.findAll({
          where: { scheduleId: schedule.scheduleId },
          order: '"candidateId" ASC'
        });
      } else {
        const err = new Error('指定された予定は見つかりません');
        err.status = 404;
        next(err);
      }
    }).then((candidates) => {
      // データベースからその予定の全ての出欠を取得する
      storedCandidates = candidates;
      // Userテーブルと結合してuserId,usernameを取得
      // then()の第一引数（onfullfilled()）のなかで
      // 新たなpromiseを返すと
      // そのままthen()の返り値となるようだ
      return Availability.findAll({
        include: [
          {
            model: User,
            attributes: ['userId', 'username']
          }
        ],
        // WHERE条件の指定
        where: { scheduleId: storedSchedule.scheduleId },
        // ORDER順の指定
        order: '"user.username" ASC, "candidateId" ASC'
      });
    }).then((availabilities) => {
      // 出欠 MapMap(キー:ユーザー ID, 値:出欠Map(キー:候補 ID, 値:出欠)) を作成する
      const availabilityMapMap = new Map(); // key: userId, value: Map(key: candidateId, availability)
      // 対象スケジュールの全ての出欠データを走査してMapを作成する
      availabilities.forEach((a) => {
        // ユーザーごとの出欠Mapを取得する
        // ない場合は新しく作る
        const map = availabilityMapMap.get(a.user.userId) || new Map();
        // ユーザーごとの出欠Mapにデータを設定する
        map.set(a.candidateId, a.availability);
        // ユーザーごとの出欠Mapを
        // 全ユーザーのMapMapにセットする
        availabilityMapMap.set(a.user.userId, map);
      });
      // AvailabilityMapMapはこんな感じ
      // { 16929852 => Map { 44 => 0, 45 => 0, 46 => 0, 47 => 0 } },
      // { 11111111 => Map { 44 => 0, 45 => 0, 46 => 0, 47 => 0 } },
      // { 22222222 => Map { 44 => 0, 45 => 0, 46 => 0, 47 => 0 } }

      // 閲覧ユーザーと出欠に紐づくユーザーからユーザー Map (キー:ユーザー ID, 値:ユーザー) を作る
      const userMap = new Map(); // key: userId, value: User
      // 閲覧中のユーザーをユーザーMapに登録する
      userMap.set(parseInt(req.user.id), {
        // 自分自身であることを示す
        isSelf: true,
        userId: parseInt(req.user.id),
        username: req.user.username
      });
      // 閲覧中スケジュールに対応するすべての出欠データを走査して、
      // 関連ユーザーをMapに追加する
      // この時点でユーザーMapにはスケジュールに関連しているユーザーと
      // 閲覧中ユーザーのデータが入っている
      // 閲覧中ユーザーが閲覧中スケジュールと関連しない場合もある
      availabilities.forEach((a) => {
        userMap.set(a.user.userId, {
          // 閲覧ユーザー自身であるかを含める
          isSelf: parseInt(req.user.id) === a.user.userId, // 閲覧ユーザー自身であるかを含める
          userId: a.user.userId,
          username: a.user.username
        });
      });
      // userMapはこんな感じ
      // { 16929852 => { isSelf: true, userId: 16929852, username: 'gladiolusbamboo' } }
      // { 11111111 => { isSelf: false, userId: 11111111, username: 'valtan-seijin' } }
      // { 22222222 => { isSelf: false, userId: 22222222, username: 'kane-gon' } }

      // 全ユーザー、全候補で二重ループしてそれぞれの出欠の値がない場合には、「欠席」を設定する
      // ユーザーMapからユーザーデータの部分だけを配列にして取り出す
      const users = Array.from(userMap).map((keyValue) => keyValue[1]);
      // usersはこんな感じ
      // [ { isSelf: true, userId: 16929852, username: 'gladiolusbamboo' },
      //   { isSelf: false, userId: 11111111, username: 'valtan-seijin' },
      //   { isSelf: false, userId: 22222222, username: 'kane-gon' } ]
      // 関連の全ユーザーを走査する
      users.forEach((u) => {
        // candidatesは「対象スケジュールに対応するすべての候補日」
        storedCandidates.forEach((c) => {
          // 走査中ユーザーの出欠Mapを取得する。　存在しない場合は新規作成。
          const map = availabilityMapMap.get(u.userId) || new Map();
          // 走査中ユーザーの走査中の候補日に対する出欠データを取得する
          // 存在しない場合は0
          const a = map.get(c.candidateId) || 0; // デフォルト値は 0 を利用
          // 走査中ユーザーの出欠Mapに値を設定する
          map.set(c.candidateId, a);
          // 全ユーザーの出欠データを格納している
          // availabilityMapMapにデータを登録する（登録し直すイメージ？）
          availabilityMapMap.set(u.userId, map);
        });
      });

      // scheduleIdとひもづいたコメントをすべて取得
      // then()の第一引数（onfullfilled()）のなかで
      // 新たなpromiseを返すと
      // そのままthen()の返り値となるようだ
      return Comment.findAll({
        where: { scheduleId: storedSchedule.scheduleId }
      }).then((comments) => {
        // ユーザーごとにコメントを整理
        const commentMap = new Map();  // key: userId, value: comment
        comments.forEach((comment) => {
          commentMap.set(comment.userId, comment.comment);
        });
        // 取得したデータを元にscheduleテンプレートを
        // 適用してhtmlを表示する
        res.render('schedule', {
          user: req.user,
          schedule: storedSchedule,
          candidates: storedCandidates,
          users: users,
          availabilityMapMap: availabilityMapMap,
          commentMap: commentMap
        });
      });
    });
    scheduleJs_debugger('GET(schedule/{scheduleId})処理開始')
  }
);

// /schedules/81106aa9-4c17-47c5-af0f-8abce6303e7a/edit
// みたいなURLにGETでアクセスされた時の処理
router.get('/:scheduleId/edit',
  // ログイン済みかを確認する
  authenticationEnsurer,
  (req, res, next) => {
    // ScheduleIdのスケジュールを取得する
    Schedule.findOne({
      where: {
        scheduleId: req.params.scheduleId
      }
    }).then((schedule) => {
      // 閲覧中ユーザーとスケジュール作成者が同じなら
      if (isMine(req, schedule)) { // 作成者のみが編集フォームを開ける
        // scheduleIdと紐付いている候補日を全て取得する
        Candidate.findAll({
          where: { scheduleId: schedule.scheduleId },
          order: '"candidateId" ASC'
          // 取得できたら
        }).then((candidates) => {
          // edit.jadeテンプレートを適用してhtmlを描画する
          res.render('edit', {
            user: req.user,
            schedule: schedule,
            candidates: candidates
          });
        });
        // 閲覧中ユーザーとスケジュール作成者が違うなら
      } else {
        // エラーを投げる
        const err = new Error('指定された予定がない、または、予定する権限がありません');
        err.status = 404;
        next(err);
      }
    });
  }
);

function isMine(req, schedule) {
  return schedule && parseInt(schedule.createdBy) === parseInt(req.user.id);
}


// /schedules/81106aa9-4c17-47c5-af0f-8abce6303e7a/edit=1
// みたいなURLにPOSTでアクセスされた時の処理
router.post('/:scheduleId', authenticationEnsurer, (req, res, next) => {
  // editの値が1なら編集
  if (parseInt(req.query.edit) === 1) {
    // scheduleIdからスケジュールを特定して
    Schedule.findOne({
      where: {
        scheduleId: req.params.scheduleId
      }
    }).then((schedule) => {
      // 閲覧中ユーザーとスケジュール作成者が同じなら
      if (isMine(req, schedule)) { // 作成者のみ
        // 更新日時に現在時刻を設定
        const updatedAt = new Date();
        // POSTで受け取ったデータを元にスケジュールを更新する
        schedule.update({
          scheduleId: schedule.scheduleId,
          scheduleName: req.body.scheduleName.slice(0, 255),
          memo: req.body.memo,
          createdBy: req.user.id,
          updatedAt: updatedAt
          // ちゃんと更新できたら
        }).then((schedule) => {
          // scheduleIdと紐づけされている
          // すべての候補日を取得して
          Candidate.findAll({
            where: { scheduleId: schedule.scheduleId },
            order: '"candidateId" ASC'
          }).then((candidates) => {
            // 追加されているかチェック
            // 候補日のデータを配列として受け取る
            let candidateNames = parseCandidateNames(req);
            // 配列内の空文字を消去する
            candidateNames = trimArray(candidateNames);
            scheduleJs_debugger(candidateNames)
            // 配列に追加すべき候補日があれば
            if (candidateNames) {
              // 候補日を追加し、
              // /schedules/{scheduleId}にリダイレクトする
              createCandidatesAndRedirect(candidateNames, schedule.scheduleId, res);
            } else {
              res.redirect('/schedules/' + schedule.scheduleId);
            }
          });
        });
        // 閲覧中ユーザーとスケジュール作成者が同じでないなら
      } else {
        // エラーを投げる
        const err = new Error('指定された予定がない、または、編集する権限がありません');
        err.status = 404;
        next(err);
      }
    });
    // deleteの値が1なら
  } else if (parseInt(req.query.delete) === 1) {
    // scheduleIdを紐付いているデータを全て削除する
    deleteScheduleAggregate(req.params.scheduleId, () => {
      res.redirect('/');
    });
  } else {
    const err = new Error('不正なリクエストです');
    err.status = 400;
    next(err);
  }
});

/**
 * scheduleIdと紐付いているデータを全て削除する
 * @param {*} scheduleId 
 * @param {*} done 
 * @param {*} err 
 */
function deleteScheduleAggregate(scheduleId, done, err) {
  // scheduleIdと紐付いているすべてのコメントを取得して
  const promiseCommentDestroy = Comment.findAll({
    where: { scheduleId: scheduleId }
  }).then((comments) => {
    // それぞれ削除する
    return Promise.all(comments.map((c) => { return c.destroy(); }));
  });

  // scheduleIdとひもづいている出欠モデルを取得する
  Availability.findAll({
    where: { scheduleId: scheduleId }
  }).then((availabilities) => {
    // scheduleIdとひもづいている出欠モデルをすべて削除する
    const promises = availabilities.map((a) => { return a.destroy(); });
    // then()の第一引数として与えられるコールバック関数である
    // onfullfilled()のなかで新たなpromiseを返すと
    // そのままthen()の返り値となるようだ
    return Promise.all(promises);
    // 削除が終了したら
  }).then(() => {
    // scheduleIdと紐付いている候補日モデルを取得する
    return Candidate.findAll({
      where: { scheduleId: scheduleId }
    });
  }).then((candidates) => {
    // scheduleIdとひもづいている候補日モデルをすべて削除する
    const promises = candidates.map((c) => { return c.destroy(); });
    // コメントも削除されてることを確認する
    // なぜここで・・・？？？
    promises.push(promiseCommentDestroy);
    // then()の第一引数として与えられるコールバック関数である
    // onfullfilled()のなかで新たなpromiseを返すと
    // そのままthen()の返り値となるようだ
    return Promise.all(promises);
  }).then(() => {
    // ScheduleIdで特定されるSchedule自体を削除する
    return Schedule.findById(scheduleId).then((s) => { return s.destroy(); });
  }).then(() => {
    if (err) return done(err);
    done();
  });
}

// 他のモジュールから関数を利用できるように
// 関数をrouterにひもづける
router.deleteScheduleAggregate = deleteScheduleAggregate;

/**
 * 候補日を追加して、
 * /schedules/{scheduleId}にリダイレクトする
 * @param {*} candidateNames 
 * @param {*} scheduleId 
 * @param {*} res 
 */
function createCandidatesAndRedirect(candidateNames, scheduleId, res) {
  // 候補日を１つずつ走査して
  const candidates = candidateNames.map((c) => {
    // 候補日オブジェクトの配列を作成する
    return {
      candidateName: c,
      scheduleId: scheduleId
    };
  });
  // 候補日オブジェクトをもとに候補日モデルをまとめて作成する
  Candidate.bulkCreate(candidates).then(() => {
    // 終わったら
    // /schedules/{scheduleId}にリダイレクトする
    res.redirect('/schedules/' + scheduleId);
  });
}

/**
 * 候補日のデータを配列に変換して受け取る
 * @param {*} req 
 */
function parseCandidateNames(req) {
  return req.body.candidates.trim().split('\n').map((s) => s.trim());
}

function trimArray(original_array) {
  let new_array = [];
  original_array.forEach((txt) => {
    if (txt.trim() != '')
      new_array.push(txt);
  });
  return new_array;
}

module.exports = router;
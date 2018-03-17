// 厳格モード
'use strict';

console.log('テスト開始');

// テスト用モジュール読み込み
const request = require('supertest');
const assert = require('assert');

// app.js読み込み
const app = require('../app');

// 必要なモデル読み込み
const User = require('../models/user');
const Candidate = require('../models/candidate');
const Schedule = require('../models/schedule');
const Availability = require('../models/availability');
const Comment = require('../models/comment');
// scheduleIdと紐付いたデータをすべて削除する関数を
// schedule.jsを経由して利用する
const deleteScheduleAggregate = require('../routes/schedules').deleteScheduleAggregate;

// passport-stubモジュール読み込み
// スタブ：テスト対象から呼び出される別のモジュールの代用品
const passportStub = require('passport-stub');

// mochaのテストの書式
// 第一引数：一連のテストの名前
// 第二引数：個々のテスト処理(it処理)を含む無名関数
describe('/login',
  () => {
    console.log('/login関連のテスト開始');
    // 一連のit処理の前に実行される処理
    before(
      () => {
        console.log('BEFORE処理開始');
        // passportStubをインストールする 
        passportStub.install(app);
        // usernameプロパティを指定する…のは
        // passportの仕様に従ってるんじゃないかなぁ
        passportStub.login({ username: 'testuser' });
        console.log('BEFORE処理終了');
      }
    );

    // 一連のit処理の後に実行される処理
    after(
      () => {
        console.log('AFTER処理開始');
        // ログアウト
        passportStub.logout();
        // ↓必要なのかどうかよくわからない
        passportStub.uninstall(app);
        console.log('AFTER処理完了');
      }
    );

    // 個々のテスト処理
    // 第一引数：個々のテストの名前
    // 第二引数：実際のテスト処理を行う関数(assert処理など)
    it('ログインのためのリンクが含まれる',
      // supertestモジュールの書式
      // ドキュメント：https://github.com/visionmedia/supertest
      (done) => {
        console.log('test1開始');
        // 対象のアプリを引数にオブジェクトを作成して
        request(app)
          // /loginにアクセスして
          .get('/login')
          // ヘッダの値をチェックして
          .expect('Content-Type', 'text/html; charset=utf-8')
          // <body>タグ内に
          // <a href="auth/github"という文字列があるかをチェックする
          .expect(/<a href="\/auth\/github"/)
          // 期待されるステータスコードと引数のCB関数を渡すと終了？
          .expect(200, done);
        console.log('test1完了');
      }
    );

    // 大体↑と一緒
    it('ログイン時はユーザー名が表示される',
      (done) => {
        console.log('test2開始');
        request(app)
          .get('/login')
          .expect(/testuser/)
          .expect(200, done);
        console.log('test2完了');
      }
    );
  }
);

describe('/logout',
  () => {
    console.log('/logout関連のテスト開始');

    // 個々のテスト処理
    // 第一引数：個々のテストの名前
    // 第二引数：実際のテスト処理を行う関数(assert処理など)
    it('/logout にアクセスした際に / にリダイレクトされる',
      (done) => {
        console.log('test3開始');
        request(app)
          .get('/logout')
          .expect('Location', '/')
          .expect(302, done);
        console.log('test3完了');
      }
    );
  }
);

// schedule関連のテスト
describe('/schedules', () => {
  // テスト前処理
  before(() => {
    // passportStubを作成
    passportStub.install(app);
    // stubを使ってログイン
    passportStub.login({ id: 0, username: 'testuser' });
  });
  // テスト後処理
  after(() => {
    // ログアウト
    passportStub.logout();
    // 一応アンインスコ
    passportStub.uninstall(app);
  });

  it('予定が作成でき、表示される', (done) => {
    console.log('テスト開始：予定が作成でき、表示される');
    // Userモデルを作成して
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      // うまくいったらテスト開始
      request(app)
        // schedulesにPOSTでデータを渡す
        // ここで１つのScheduleと複数のCandidateがデータベースに登録される
        .post('/schedules')
        .send({ scheduleName: 'テスト予定1', memo: 'テストメモ1\r\nテストメモ2', candidates: 'テスト候補1\r\nテスト候補2\r\nテスト候補3' })
        // schedulesにリダイレクトされるか
        .expect('Location', /schedules/)
        // 302 redirectか
        .expect(302)
        // 終わったら次ののテストに移る
        .end((err, res) => {
          const createdSchedulePath = res.headers.location;
          // console.dir(res.headers);
          console.log('createdSchedulePath => ' + createdSchedulePath);
          // createdSchedulePath => /schedules/{scheduleId}
          // テスト開始
          request(app)
            // /schedules/{scheduleId}にGETでアクセスして
            .get(createdSchedulePath)
            // ちゃんと表示されてることを確認する
            .expect(/テスト予定1/)
            .expect(/テストメモ1/)
            .expect(/テストメモ2/)
            .expect(/テスト候補1/)
            .expect(/テスト候補2/)
            .expect(/テスト候補3/)
            // 200 アクセス成功
            .expect(200)
            .end((err, res) => {
              // scheduleIdに紐付いているレコードをまとめて削除する
              deleteScheduleAggregate(createdSchedulePath.split('/schedules/')[1], done, err);
            });
        });
    });
    console.log('テスト終了：予定が作成でき、表示される');
  });

});

// schedule関連のテスト２
describe('/schedules/:scheduleId/users/:userId/candidates/:candidateId', () => {
  // テスト前処理
  before(() => {
    // passportStubを作成
    passportStub.install(app);
    // stubを使ってログイン
    passportStub.login({ id: 0, username: 'testuser' });
  });
  // テスト後処理
  after(() => {
    // ログアウト
    passportStub.logout();
    // 一応アンインスコ
    passportStub.uninstall(app);
  });


  it('出欠が更新できる', (done) => {
    console.log('テスト開始：出欠が更新できる');
    // Userを追加する
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      // テスト開始
      request(app)
        // schedulesにPOSTでアクセスし、各パラメーターを渡す
        // ここで１つのScheduleと複数のCandidateがデータベースに登録される
        // memoはscheduleモデルに含まれる要素
        .post('/schedules')
        .send({ scheduleName: 'テスト出欠更新予定1', memo: 'テスト出欠更新メモ1', candidates: 'テスト出欠更新候補1' })
        // 次に移る
        .end((err, res) => {
          // レスポンスヘッダからURLを取得
          // createdSchedulePath => /schedules/{scheduleId}
          const createdSchedulePath = res.headers.location;
          // splitしてscheduleIdを取得
          const scheduleId = createdSchedulePath.split('/schedules/')[1];
          // scheduleIdでひもづけられる候補日を１件取得する
          Candidate.findOne({
            where: { scheduleId: scheduleId }
          }).then((candidate) => {
            // 更新がされることをテスト
            request(app)
              // /schedules/{scheduleId}/users/0/candidates/{candidate.candidateId}
              // にPOSTでアクセスして、availabilitiesのルーターで定義している
              // APIの動作を確認する
              .post(`/schedules/${scheduleId}/users/${0}/candidates/${candidate.candidateId}`)
              // 2は出席を表す
              .send({ availability: 2 }) // 出席に更新
              // 出席に更新されたJSON形式のレスポンスが帰ってくればOK
              .expect('{"status":"OK","availability":2}')
              // 終わったらscheduleId絡みのレコードをすべて削除する
              .end((err, res) => {
                Availability.findAll({
                  where: { scheduleId: scheduleId }
                }).then((availabilities) => {
                  // console.log('=== DBから取得 ===');
                  // console.dir(availabilities);
                  // console.log('=== レスポンスから取得 ===');
                  // console.dir(res);
                  // console.log('配列長');
                  // console.dir(availabilities.length);
                  // console.log('Availability');
                  // console.dir(availabilities[0].availability);
                  // console.dir(res.body.availability);

                  // DBからscheduleIdに紐付いたavailabilityを１件だけ取得できればOK
                  assert.equal(availabilities.length, 1);
                  // DBに登録されているscheduleIdに紐付いたavailabilityの値と
                  // responseとして帰ってきているavailabilityの値が同一ならOK
                  assert.equal(availabilities[0].availability, res.body.availability);
                  deleteScheduleAggregate(scheduleId, done, err);
                });
              });
          });
        });
    });
    console.log('テスト終了：出欠が更新できる');
  });
});

// comment関連のテスト
describe('/schedules/:scheduleId/users/:userId/comments', () => {
  // テスト前処理
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });
  // テスト後処理
  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('コメントが更新できる', (done) => {
    // ユーザーを追加
    User.upsert({ userId: 0, username: 'testuser' })
      .then(() => {
        // テスト開始
        request(app)
          // テスト用scheduleを追加
          .post('/schedules')
          .send({
            scheduleName: 'テストコメント更新予定1',
            memo: 'テストコメント更新メモ1',
            candidates: 'テストコメント更新候補1'
          })
          // 終わったら
          .end((err, res) => {
            // レスポンスヘッダからURLを取得
            // createdSchedulePath => /schedules/{scheduleId}
            const createdSchedulePath = res.headers.location;
            // createdSchedulePathからscheduleIdを取得
            const scheduleId = createdSchedulePath.split('/schedules/')[1];
            // 更新がされることをテスト
            request(app)
              // /schedules/{scheduleId}/users/0/comments
              // にPOSTでアクセスして、commentsのルーターで定義している
              // APIの動作を確認する
              .post(`/schedules/${scheduleId}/users/${0}/comments`)
              .send({ comment: 'testcomment' })
              .expect('{"status":"OK","comment":"testcomment"}')
              // ちゃんと結果が返ってきたら
              .end((err, res) => {
                // scheduleIdと紐付いているすべてのコメントを取得して
                Comment.findAll({
                  where: { scheduleId: scheduleId }
                }).then((comments) => {
                  // 正常なコメントが返ってきているか確認して
                  // console.dir(comments);
                  assert.equal(comments.length, 1);
                  assert.equal(comments[0].comment, 'testcomment');
                  // テスト用のscheduleIdと紐付いているすべてのデータを削除する
                  deleteScheduleAggregate(scheduleId, done, err);
                });
              });
          });
      });
  });
});

// スケジュール編集のテスト
describe('/schedules/:scheduleId?edit=1', () => {
  // テスト前処理
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });
  // テスト後処理
  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('予定が更新でき、候補が追加できる', (done) => {
    // テスト用ユーザーを追加
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      // テスト開始
      request(app)
        // /shceulesにPOSTでデータを渡す
        .post('/schedules')
        .send({ scheduleName: 'テスト更新予定1', memo: 'テスト更新メモ1', candidates: 'テスト更新候補1' })
        // 次ヘ進む
        .end((err, res) => {
          // レスポンスヘッダからURLを取得
          // createdSchedulePath => /schedules/{scheduleId}          
          const createdSchedulePath = res.headers.location;
          // createdSchedulePathからscheduleIdを取得
          const scheduleId = createdSchedulePath.split('/schedules/')[1];
          // 更新がされることをテスト
          request(app)
            // さっき追加したスケジュールをPOSTで編集してみる
            .post(`/schedules/${scheduleId}?edit=1`)
            .send({ scheduleName: 'テスト更新予定2', memo: 'テスト更新メモ2', candidates: 'テスト更新候補2' })
            // 終わったら
            .end((err, res) => {
              // scheduleIdのスケジュールを取得する
              Schedule.findById(scheduleId).then((s) => {
                // 取得した内容が正しいか確認する
                assert.equal(s.scheduleName, 'テスト更新予定2');
                assert.equal(s.memo, 'テスト更新メモ2');
              });
              // scheduleIdと紐付いている候補日を取得する
              Candidate.findAll({
                where: { scheduleId: scheduleId }
                // 取得できたら
              }).then((candidates) => {
                // 候補日が追加されているか
                assert.equal(candidates.length, 2);
                // 最初に設定した候補日は残っているか
                assert.equal(candidates[0].candidateName, 'テスト更新候補1');
                // 追加した方の候補日も存在するか
                assert.equal(candidates[1].candidateName, 'テスト更新候補2');
                // scheduleIdと紐付いているモデルをすべて削除する
                deleteScheduleAggregate(scheduleId, done, err);
              });
            });
        });
    });
  });
});

// 削除処理のテスト
describe('/schedules/:scheduleId?delete=1', () => {
  // テスト前処理
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });
  // テスト後処理
  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('予定に関連する全ての情報が削除できる', (done) => {
    // テスト用ユーザーを追加する
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      // テスト開始
      request(app)
        // /schedulesにPOSTでデータを送信してテスト用データを追加する
        .post('/schedules')
        .send({ scheduleName: 'テスト更新予定1', memo: 'テスト更新メモ1', candidates: 'テスト更新候補1' })
        // データが追加できたら
        .end((err, res) => {
          // レスポンスヘッダからURLを取得
          // createdSchedulePath => /schedules/{scheduleId}          
          const createdSchedulePath = res.headers.location;
          // createdSchedulePathからscheduleIdを取得
          const scheduleId = createdSchedulePath.split('/schedules/')[1];
          // 出欠作成
          // scheduleIdと紐付いている候補日データを１件取得する
          const promiseAvailability = Candidate.findOne({
            where: { scheduleId: scheduleId }
          }).then((candidate) => {
            // PromiseオブジェクトはPromiseコンストラクタで生成する
            // Promiseコンストラクタは１つのCB関数(以下callback())を引数に取る
            // callback()はさらに２つのCB関数(以下、resolve()、reject())を引数にとる。
            return new Promise(
              (resolve) => {
                // テスト開始
                request(app)
                  // /schedules/{scheduleId}/users/0/candidates/{candidateId}
                  // にPOSTでデータを渡す
                  .post(`/schedules/${scheduleId}/users/${0}/candidates/${candidate.candidateId}`)
                  // 出欠を出席に更新
                  .send({ availability: 2 }) // 出席に更新
                  .end((err, res) => {
                    if (err) done(err);
                    // promiseの状態をfulfilledにする
                    resolve();
                  });
              }
            );
            // というpromiseを返す
          });

          // コメント作成
          // promiseを作成する
          const promiseComment =
            // PromiseオブジェクトはPromiseコンストラクタで生成する
            // Promiseコンストラクタは１つのCB関数(以下callback())を引数に取る
            // callback()はさらに２つのCB関数(以下、resolve()、reject())を引数にとる。
            new Promise((resolve) => {
              // テスト開始
              request(app)
                // /schedules/${scheduleId}/users/${0}/comments
                // にPOSTでコメントのデータを渡す
                .post(`/schedules/${scheduleId}/users/${0}/comments`)
                .send({ comment: 'testcomment' })
                // 正常なレスポンスが返ってくればOK
                .expect('{"status":"OK","comment":"testcomment"}')
                .end((err, res) => {
                  if (err) done(err);
                  // promiseの状態をfulfilledにする
                  resolve();
                });
            });
          // というpromiseを作成する

          // 削除
          // promiseAvailability, promiseCommentがどっちもfulfilledになれば
          // then()の第一引数のCB関数(onfulfilled())が実行される
          // 各promiseがresolve()に引数として与えた値は
          // onfulfilled()の仮引数から利用できる
          const promiseDeleted = Promise.all([promiseAvailability, promiseComment])
            .then(() => {
              // 新しいpromiseを作成する
              return new Promise((resolve) => {
                // テスト開始
                request(app)
                  // /schedules/{scheduleId}?delete=1
                  // にPOSTでアクセスする
                  .post(`/schedules/${scheduleId}?delete=1`)
                  .end((err, res) => {
                    if (err) done(err);
                    // promiseの状態をfulfilledにする
                    resolve();
                  });
              });
            });
            // というpromiseを作成する

          // テスト
          // promiseDeletedがfulfilledになったら
          promiseDeleted.then(() => {
            // ぜんぜんわからんけど
            // Sequelizeオブジェクトもpromiseっぽく使える模様
            // scheduleIdと紐付いたコメントをすべて取得する
            const p1 = Comment.findAll({
              where: { scheduleId: scheduleId }
            }).then((comments) => {
              // TODO テストを実装
              // 取得件数は０か
              assert.equal(comments.length, 0);
              // console.log("COMMENTS=========");
              // console.dir(comments);
            });
            // scheduleIdと紐付いた出欠をすべて取得する
            const p2 = Availability.findAll({
              where: { scheduleId: scheduleId }
            }).then((availabilities) => {
              // TODO テストを実装
              // 取得件数は０か
              assert.equal(availabilities.length, 0);
            });
            // scheduleIdと紐付いた候補日をすべて取得する
            const p3 = Candidate.findAll({
              where: { scheduleId: scheduleId }
            }).then((candidates) => {
              // TODO テストを実装
              // 取得件数は０か
              assert.equal(candidates.length, 0);
            });
            // scheduleIdのスケジュールを取得する
            const p4 = Schedule.findById(scheduleId)
            .then((schedule) => {
              // TODO テストを実装
              // 取得内容がnullか
              assert.equal(schedule, null);
            });
            // すべてのpromiseがfulfilledになったら
            // then()のコールバック関数を実行する
            Promise.all([p1, p2, p3, p4]).then(() => {
              if (err) return done(err);
              done();
            });
          });
        });
    });
  });
});

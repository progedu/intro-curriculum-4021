// 'debug'モジュール呼び出し
const debug = require('debug');
// デバッガーを作成する
const appJs_debugger = debug('debug:app.js');
appJs_debugger('app.js処理開始');

// 必要なモジュールを読み込む
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var session = require('express-session');
var passport = require('passport');

// Modelの読み込み
var User = require('./models/user');
var Schedule = require('./models/schedule');
var Availability = require('./models/availability');
var Candidate = require('./models/candidate');
var Comment = require('./models/comment');
// Userテーブルが作成できたら
User.sync().then(() => {
  // ScheduleテーブルをUserに従属させて
  // （ScheduleのcreatedByカラムがUserの主キー(userId)に従う）
  Schedule.belongsTo(User, { foreignKey: 'createdBy' });
  // Shceduleテーブルを作成
  Schedule.sync();
  // CommentテーブルをUserに従属させて
  // （CommentのuserIdカラムがUserの主キー(userId)に従う）
  Comment.belongsTo(User, { foreignKey: 'userId' });
  // Commentテーブルを作成
  Comment.sync();
  // AvailabilityテーブルをUserに従属させる
  // （AvailabilityのuserIdカラムがUserの主キー(userId)に従う）  
  Availability.belongsTo(User, { foreignKey: 'userId' });
  // Candidateテーブルを作成できたら
  Candidate.sync().then(() => {
    // AvailabilityテーブルをCandidateにも従属させて
    // （AvailabilityのcandidateIdカラムがCandidateの主キー(candidateId)に従う）  
    Availability.belongsTo(Candidate, { foreignKey: 'candidateId' });
    // Availabilityテーブルを作成する
    Availability.sync();
  });
});

// passport-github2モジュールから
// passportを利用するのに必要なGitHubStrategyを取得する
var GitHubStrategy = require('passport-github2').Strategy;

// GitHubStrategyのコンストラクタに必要な
// GitHubに登録したアプリの情報
var GITHUB_CLIENT_ID = '09267a29992733700651';
var GITHUB_CLIENT_SECRET = 'e0f119d2ad023f727a108c1f957a50d1823d0198';
var GITHUB_CALLBACK_URL = 'http://localhost:8000/auth/github/callback'

// passportにユーザーデータをシリアライズする処理を登録する
passport.serializeUser(function (user, done) {
  appJs_debugger('ユーザーデータのシリアライズ処理開始');
  done(null, user);
  appJs_debugger('ユーザーデータのシリアライズ処理完了');
});

// passportにユーザーデータをデシリアライズする処理を登録する
passport.deserializeUser(function (obj, done) {
  appJs_debugger('ユーザーデータのデシリアライズ処理開始');
  done(null, obj);
  appJs_debugger('ユーザーデータのデシリアライズ処理完了');
});

// passportの設定
// GitHubを利用して認証を行う場合は
// 引数にGitHubStrategyオブジェクトを指定する
passport.use(
  new GitHubStrategy(
    {
      //GitHubに登録したアプリの情報を設定する
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL
    },
    // GitHub認証が実行された際に呼び出される処理
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        appJs_debugger('UserのUpsert実行');
        // UserのUpsert実行
        User.upsert({
          userId: profile.id,
          username: profile.username
        }).then(() => {
          done(null, profile);
        })
      });
    }
  )
);

// ルーターを読み込む
var routes = require('./routes/index');
// var users = require('./routes/users');
var login = require('./routes/login');
var logout = require('./routes/logout');
var schedules = require('./routes/schedules');
var availabilities = require('./routes/availabilities');
var comments = require('./routes/comments');

// Expressアプリを作成する
var app = express();

// helmetモジュールのハンドラを登録する
// X-Powered-Byヘッダを除去する
app.use(helmet());


// view engine setup
// 'views'というアプリ内変数に{アプリのディレクトリ}/viewsという文字列を登録する
// 今のところなくても正常に動くのでコメントアウトしている
// app.set('views', path.join(__dirname, 'views'));

// 'view engine'というアプリ内変数に'jade'という文字列を登録する
// これを指定しないとrender()が利用できない
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// loggerモジュールのハンドラを登録する。出力形式に開発用を指定。
app.use(logger('dev'));

// いろんなデータをJSON形式に変換するために必要らしい
// とりあえずコメントアウトしてるとres.headersがundefinedって言われた
app.use(bodyParser.json());

// これがないとフォームからPOSTでデータを受け取ることができない
// extendedがtrueだとqsライブラリでパースを行い、
// falseだとquerystringライブラリでパースを行う。
// よくわからん。どっちでも動いた。
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());

// 静的なファイルを配置するディレクトリを設定する
// これがないとpublic以下のファイルが動かない
app.use(express.static(path.join(__dirname, 'public')));

// sessionの初期化を行う
// （ユーザーデータを保存するためにセッション機能を利用する必要がある）
app.use(session(
  {
    // Cookieの暗号化に利用するキー（必須）
    secret: '1d405747bf2f04cd',
    // 今のところ違いがあんまりわからないが
    // falseにしとくほうがいいらしい
    // https://qiita.com/moomooya/items/00f89e425a3034b8ea14
    resave: false,
    saveUninitialized: false
  }
));

// passportの初期化を行う
app.use(passport.initialize());

// passportにsession機能をひもづける
app.use(passport.session());


// URLのアクセスを各ルーターにまわす
// 各ルーターのGET処理からはnext()が発行されないので
// 各ルーター内でget()が実行されると処理が終了する
app.use('/', routes);
// app.use('/users', users);
app.use('/login', login);
app.use('/logout', logout);
// 同じURLを指定することもできる
// schedulesのルーターでGET()（たぶんPOST()も）が発行されなければ
// availabilitiesのルーターに処理が回るのだろう
// まったく説明ないけど
app.use('/schedules', schedules);
app.use('/schedules', availabilities);
app.use('/schedules', comments);

// /auth/githubにGETでアクセスされた時に
// passportを使用した連携認証処理を行う
app.get('/auth/github',
  function (req, res, next) {
    appJs_debugger('連携認証画面表示');
    // こういう場所にもnext()が必要
    next();
  },
  // ユーザーにアプリのGitHub認証を許可するか確認する画面が表示される
  // scopeは利用を許可してもらうデータ
  // ユーザーが認証を許可すると
  // {GITHUB_CALLBACK_URL}?code=xxxxxxxxxxxxxxx
  // のURLへリダイレクトされる
  passport.authenticate(
    'github', { scope: ['user:email'] }),
  function (req, res) {
    appJs_debugger('passport.authenticate()完了');
  }
);

// ユーザーが連携認証の許可の操作をするとリダイレクトされるURL
app.get('/auth/github/callback',
  function (req, res, next) {
    appJs_debugger('ユーザーが認証許可をしました');
    next();
  },
  // おそらくここで実際の認証（ログイン）処理が行われているっぽい
  // 失敗した場合は/loginへリダイレクト
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    appJs_debugger('ユーザーがログインしました？');
    res.redirect('/');
  }
);


// catch 404 and forward to error handler
// 関数を記述してミドルウェアっぽく登録することもできる。
// 各ルーターでリクエストが拾われなかった場合のエラー処理
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
// 開発環境の場合のみスタックトレースを表示させるハンドラを表示する
if (app.get('env') === 'development') {
  // エラー用のハンドラは第一引数にエラーオブジェクトをとる
  // next()関数を発行していないので、開発環境の場合はここでエラー処理が終了する
  app.use(function (err, req, res, next) {
    // ステータスコード500はInternal Server Error
    res.status(err.status || 500);
    // render()の第一引数にはjadeのファイル名を指定する
    // 第二引数はjadeファイルに渡すパラメータ情報
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
// 開発環境以外の場合のみ実行されるエラー処理
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// モジュールにアプリを登録する
module.exports = app;

// 厳格モード
'use strict';
// sequelizeモジュールを呼び出す
const Sequelize = require('sequelize');
/** 
 * sequelizeオブジェクトを生成し、データベースに接続する
 * 第一引数：URL形式のデータベースの設定
 * 第二引数：オプションデータのオブジェクト
*/
const sequelize = new Sequelize(
  // {DBの種類}://{ユーザー名}:{パスワード}@{ホスト名}/{データベース名}　という形式？
  // postgresがいろいろ出てきてどれがどれかよくわからない
  'postgres://postgres:postgres@localhost/schedule_arranger',
  { logging: true }
);
// "database"でsequelizeオブジェクトを
// "Sequelize"でSequelizeクラスを呼び出せるようにする
module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};
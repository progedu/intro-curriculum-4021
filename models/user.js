// 厳格モード
'use strict';
// 自作のsequelize-loaderモジュールを呼び出す
const loader = require('./sequelize-loader');
// Sequelize自体
const Sequelize = loader.Sequelize;
// loader.databaseは設定を行ったsequelizeオブジェクト
// Userモデル定義を作成する。
const User = loader.database.define('users',
  {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false
    }
  },
  {
    // freezeTableNameプロパティはモデル名をそのままカラム名に使用するという意味らしい
    // trueだとRuby on Railsみたいにテーブル名を複数形にしてしまうようだ
    freezeTableName: true,
    timestamps: false
  }
);

module.exports = User;
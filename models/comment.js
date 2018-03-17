// 厳格モード
'use strict';
// 自作のsequelize-loaderモジュールを呼び出す
const loader = require('./sequelize-loader');
// Sequelize自体
const Sequelize = loader.Sequelize;
// Model定義
const Comment = loader.database.define(
  'comments',
  {
    // scheduleIdとuserIdの複合キーを設定する
    scheduleId: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    comment: {
      type: Sequelize.STRING,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false
  }
);

module.exports = Comment;
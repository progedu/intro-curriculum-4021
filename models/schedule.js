// 厳格モード
'use strict';
// 自作のsequelize-loaderモジュールを呼び出す
const loader = require('./sequelize-loader');
// Sequelize自体
const Sequelize = loader.Sequelize;
// Model定義
const Schedule = loader.database.define(
  'schedules',
  {
    // UUID(Universally Unique Identifier)
    // の値を主キーに用いることで主キーが推測されにくくなる
    scheduleId: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false
    },
    scheduleName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    memo: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    // 予定の作成者をあらわす
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    // createdByカラムにインデックスを設定する
    indexes: [
      {
        fields: ['createdBy']
      }
    ]
  }
);

module.exports = Schedule;
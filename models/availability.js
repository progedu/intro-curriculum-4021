// 厳格モード
'use strict';
// 自作のsequelize-loaderモジュールを呼び出す
const loader = require('./sequelize-loader');
// Sequelize自体
const Sequelize = loader.Sequelize;
// Model定義
const Availability = loader.database.define(
  'availabilities',
  {
    // candidateIdとuserIdの複合キーを設定する
    candidateId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    availability: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    scheduleId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    // scheduleIdにインデックスを設定する
    indexes: [
      {
        fields: ['scheduleId']
      }
    ]
  }
);

module.exports = Availability;
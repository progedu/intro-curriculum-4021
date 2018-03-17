// 厳格モード
'use strict';
// 自作のsequelize-loaderモジュールを呼び出す
const loader = require('./sequelize-loader');
// Sequelize自体
const Sequelize = loader.Sequelize;

// Model定義
const Candidate = loader.database.define(
  'candidates',
  {
    candidateId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    candidateName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    scheduleId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    // scheduleIdカラムにインデックスを設定する
    indexes: [
      {
        fields: ['scheduleId']
      }
    ]
  });

module.exports = Candidate;
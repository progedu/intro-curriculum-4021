'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize('postgres://b184362:postgres@localhost/schedule_arranger');

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};

'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/schedule_arranger',
  {
    operatorsAliases: false
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};

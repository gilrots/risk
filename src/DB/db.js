const Sequelize = require('Sequelize')
const sequelize = new Sequelize('Risk', 'postgres', 'gilir9', {
    host: 'localhost',
    dialect: 'postgres',
    operatorsAliases: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }});
require('sequelize-values')(sequelize);

module.exports = sequelize;
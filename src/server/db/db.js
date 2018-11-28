const PG = require('../../common/config').DB.PG;
const Sequelize = require('Sequelize');
const sequelize = new Sequelize(PG.database, PG.username, PG.password, PG.settings);
//require('sequelize-values')(sequelize);

module.exports = sequelize;

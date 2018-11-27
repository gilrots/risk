const PG = require('../../mocks/config').DB.PG;
const Sequelize = require('Sequelize');
const sequelize = new Sequelize(PG.name, PG.pg, PG.user, PG.params);
require('sequelize-values')(sequelize);

module.exports = sequelize;

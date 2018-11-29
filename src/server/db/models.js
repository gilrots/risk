const sequelize = require("./db");
const Sequelize = require('Sequelize');

const Users = sequelize.define('Users', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    username:Sequelize.STRING,
    password:Sequelize.STRING,
    accounts:Sequelize.ARRAY(Sequelize.STRING)
});

const Tables = sequelize.define('Tables', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    user:Sequelize.STRING,
    scheme:Sequelize.JSON,
    filter:Sequelize.JSON,
    excludes:Sequelize.ARRAY(Sequelize.STRING),
});

const Intras = sequelize.define('Intras', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    stockId: Sequelize.STRING,
    name: Sequelize.STRING,
    user: Sequelize.INTEGER,
    amount: Sequelize.DOUBLE,
});

const IPO = sequelize.define('IPO', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    name: Sequelize.STRING,
    data: Sequelize.ARRAY(Sequelize.JSON),
});

const IPOFavorites = sequelize.define('IPOFavorites', {
    id:{type:Sequelize.STRING, primaryKey:true},
    name: Sequelize.STRING,
});

Users.hasMany(Tables,{foreignKey:'user', sourceKey:'id'});
Users.hasMany(Intras,{foreignKey:'user', sourceKey:'id'});
//Tables.belongsTo(Users,{foreignKey:'user', targetKey:'id'})

module.exports = {
    Users,
    Tables,
    Intras,
    IPO
}


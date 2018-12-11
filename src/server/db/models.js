const sequelize = require("./db");
const Sequelize = require('Sequelize');

const Priviliges = sequelize.define('Priviliges', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    type:{type: Sequelize.STRING, unique: true},
});

const Users = sequelize.define('Users', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    username:{type: Sequelize.STRING, unique: true},
    password:Sequelize.STRING,
    accounts:Sequelize.ARRAY(Sequelize.STRING),
    type:Sequelize.INTEGER,
});

const Tables = sequelize.define('Tables', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    name:Sequelize.STRING,
    user:Sequelize.INTEGER,
    cols:Sequelize.ARRAY(Sequelize.JSON),
    risk:Sequelize.ARRAY(Sequelize.JSON),
    filter:Sequelize.JSON,
    excluded:Sequelize.ARRAY(Sequelize.STRING),
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
    user: Sequelize.INTEGER,
});

const IPOFavorites = sequelize.define('IPOFavorites', {
    id:{type:Sequelize.STRING, primaryKey:true},
    user: Sequelize.INTEGER,
    name: Sequelize.STRING,
});

Users.hasMany(Tables,{foreignKey:'user', sourceKey:'id'});
Users.hasMany(Intras,{foreignKey:'user', sourceKey:'id'});
Users.hasMany(IPO,{foreignKey:'user', sourceKey:'id'});
Users.hasMany(IPOFavorites,{foreignKey:'user', sourceKey:'id'});
Priviliges.hasMany(Users,{foreignKey:'type', sourceKey:'id'});

module.exports = {
    Users,
    Priviliges,
    Tables,
    Intras,
    IPO,
    IPOFavorites
}


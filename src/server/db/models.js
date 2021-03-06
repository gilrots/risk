const sequelize = require("./db");
const Sequelize = require('Sequelize');
const _ = require('lodash');

const Priviliges = sequelize.define('Priviliges', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    type:{type: Sequelize.STRING, unique: true},
});

const Users = sequelize.define('Users', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    username:{type: Sequelize.STRING, unique: true},
    password:Sequelize.STRING,
    accounts:{type:Sequelize.ARRAY(Sequelize.JSON), defaultValue: []},
    type:Sequelize.INTEGER,
});

const Tables = sequelize.define('Tables', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    name:Sequelize.STRING,
    user:Sequelize.INTEGER,
    cols:{type:Sequelize.ARRAY(Sequelize.JSON), defaultValue: []},
    risk:{type:Sequelize.ARRAY(Sequelize.JSON), defaultValue: []},
    filter:{type:Sequelize.JSON, defaultValue: {}},
    excluded:{type:Sequelize.ARRAY(Sequelize.STRING), defaultValue: []},
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
    amount: Sequelize.DOUBLE,
    data: {type:Sequelize.ARRAY(Sequelize.JSON), defaultValue: []},
    user: Sequelize.INTEGER,
});

const IPOFavorites = sequelize.define('IPOFavorites', {
    id:{type:Sequelize.STRING, unique:'ipoid', primaryKey:true},
    user:{type:Sequelize.INTEGER, unique:'ipoid', primaryKey:true},
    name: Sequelize.STRING,
});

const funcTypes = {operator:'operator',action:'action', format:'format'};
const funcArgsTypes = {number:'number',string:'string', date:'date'};

const Funcs = sequelize.define('Funcs', {
    id:{type:Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
    name: {type:Sequelize.STRING, unique:true},
    type: Sequelize.ENUM(_.values(funcTypes)),
    for: Sequelize.ENUM(_.values(funcArgsTypes)),
    func: Sequelize.TEXT,
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
    IPOFavorites,
    Funcs,
    funcTypes,
    funcArgsTypes
}


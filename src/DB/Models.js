const sequelize = require("./db")
const Sequelize = require('Sequelize')
const Users = sequelize.define('Users', {
    id:{type:Sequelize.INTEGER,
        primaryKey:true},
    UserName:Sequelize.STRING,
    Password:Sequelize.STRING,
    Accounts:Sequelize.ARRAY(Sequelize.STRING)
})

const Tables = sequelize.define('Tables', {
    id:{type:Sequelize.INTEGER,
        primaryKey:true},
    UserOwner:Sequelize.INTEGER,
    Query:Sequelize.STRING,
    Include:Sequelize.INTEGER
})

const Includes = sequelize.define('Includes', {
    UserOwner: Sequelize.INTEGER,
    TableOwner: Sequelize.INTEGER,
    RowData: Sequelize.JSON
})

Tables.hasMany(Includes,{foreginKey:'TableOwner',sourceKey:'id'})
Includes.belongsTo(Tables,{foreginKey:'TableOwner',targetKey:'id'})
Users.hasMany(Tables,{foreginKey:'UserOwner', sourceKey:'id'})
Tables.belongsTo(Users,{foreginKey:'UserOwner', targetKey:'id'})


module.exports = {
    Users,
    Tables,
    Includes
}
const Sequelize = require('Sequelize');
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

function Connectdb(username,password) {
    sequelize.authenticate()
        .then(() => {
            console.log("connection good");
            return Login(username,password);
        })
        .catch(err => {
            console.error("cant", err);
            return false;
        });
}
function Login(user,password){
    let returnval = [];
    sequelize.query('select "Accounts" from "Users" where "UserName"= :us and "Password"= :ps',{row:true,replacements:{us:user,ps:password}}).
    then(rowtables=> {
        if (rowtables[0].length != 0) {
            console.log(rowtables[0][0]["Accounts"]);
            returnval = rowtables[0][0]["Accounts"];
        }

        console.log("no");
        return returnval;
    }).catch(err=>{
        console.log(err)
        return false;
    });
}

module.exports = {Connectdb}

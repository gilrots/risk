const PG = require('../../mocks/config').DB.PG;
const Sequelize = require('Sequelize');
const sequelize = new Sequelize(PG.database, PG.username, PG.password, PG.settings);
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
    then(rowTables => {
        if (rowTables[0].length != 0) {
            console.log(rowTables[0][0]["Accounts"]);
            returnval = rowTables[0][0]["Accounts"];
        }
        console.log("no");
        return returnval;
    }).catch(err=>{
        console.log(err)
        return false;
    });
}
module.exports = {Connectdb}

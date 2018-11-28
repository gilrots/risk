const config = require('../../common/config');
const sequelize = require("../db/db");
const ADMIN = config.DB.admin;
const Users = require('../db/users');
const Auth = require('./auth');

function connect() {
    sequelize.authenticate()
        .then(() => {
            console.log("Connected to DB!");
            sequelize.sync().then(() => {
                console.log("Tables Created!");
            });
        })
        .catch(err => {
            console.error("Can't connect to DB: ", err);
        });
}

async function registerUser(params, res) {
    const {admin, password, username} = params;
    console.log(admin);
    if (admin !== ADMIN) {
        res.status(400).json({error: 'admin password wrong'});
    }
    else {
        const user = await Users.exist(username);
        if (user !== null) {
            res.status(400).json({error: 'username already exist!'});
        }
        else {
            try {
                const crypted = Auth.encryptPassword(password);
                const newUser = await Users.create(username, crypted);
                res.status(200).json({success: true});
            }
            catch (e) {
                res.status(500).json({error: 'Server error'});
                console.error(e);
            }
        }
    }
}

module.exports = {connect, registerUser};

const config = require('../../common/config');
const sequelize = require("../db/db");
const ADMIN = config.DB.admin;
const UsersDL = require('../db/users');
const IntrasDL = require('../db/intras');
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
        const user = await UsersDL.exist(username);
        if (user !== null) {
            res.status(400).json({error: 'username already exist!'});
        }
        else {
            try {
                const crypted = Auth.encryptPassword(password);
                const newUser = await UsersDL.create(username, crypted);
                res.status(200).json({success: true});
            }
            catch (e) {
                res.status(500).json({error: 'Server error'});
                console.error(e);
            }
        }
    }
}

async function getIntras(params) {
    return await IntrasDL.getAll();
}

async function setIntras(params) {
    const {intras} = params;
    let res = true;
    try {
        await IntrasDL.setAll(intras);
    }
    catch (e) {
        res = e.message;
    }
    return res
}

module.exports = {connect, registerUser, getIntras, setIntras};

const _ = require('lodash');
const sequelize = require("../db/db");
const UsersDL = require('../db/users');
const PriviligesDL = require('../db/priviliges');
const IntrasDL = require('../db/intras');
const IposDL = require('../db/ipo');
const FavsDL = require('../db/ipofavorites');
const Auth = require('./auth');
const Tables = require('./tables-logic');
const {UserAlreadyExistError,UserIsNotAllowedError,ServerError} = require('./errors');

const initModules = [PriviligesDL.init];
const adminID = 'admin';

async function connect(appModules) {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB!");
        await sequelize.sync();
        console.log("Sequelize synced!");
        await Promise.all(initModules.map(promise => promise()));
        console.log("DL Modules initialized!");
        const admin = await createOrDeleteAdmin();
        console.log(`Default admin init: ${admin}`);
        await Promise.all(appModules.map(promise => promise()));
        console.log("App Modules initialized!");
    }
    catch (err) {
        console.error("Can't connect to DB: ", err);
    }
}

async function createOrDeleteAdmin() {
    const users = await UsersDL.getAll();
    let result = undefined;
    if(_.isEmpty(users)){
        const admin = await PriviligesDL.getAdmin();
        await UsersDL.create(adminID, Auth.encryptPassword(adminID), admin.id);
        result = true;
    }
    else if (users.length > 1 && users.some(u => u.username === adminID)) {
        await UsersDL.deleteOne(adminID);
        result = false;
    }
    return result;
}

async function register(params) {
    const {admin, newUser} = params;
    const adminUser = await UsersDL.getOne(admin);
    const isAdmin = adminUser && await PriviligesDL.isAdmin(adminUser);
    if (!isAdmin || !Auth.isPasswordCorrect(admin.password, adminUser.password)) {
        throw new UserIsNotAllowedError('User is wrong or not an admin');
    }
    else {
        if (newUser.username === adminID || await UsersDL.exist(newUser.username)) {
            throw new UserAlreadyExistError('username already exist!');
        }
        else {
            try {
                const crypted = Auth.encryptPassword(newUser.password);
                const privilige = await PriviligesDL.getSimpleUser();
                const createdUser = await UsersDL.create(newUser.username, crypted, privilige.id);
                await Tables.createUserDefault(createdUser);
                await createOrDeleteAdmin();
                return {success: true};
            }
            catch (e) {
                console.error(e);
                throw new ServerError('Server error at login');
            }
        }
    }
}

async function getUserAccounts(params) {
    const {username, accounts} = await UsersDL.getAccounts(params.user);
    return {username, accounts};
}

async function setUserAccounts(params) {
    const {user,accounts} = params;
    let res = true;
    try {
        await UsersDL.updateAccounts(user,accounts);
    }
    catch (e) {
        res = e.message;
    }
    return res
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

async function getIPOs(params) {
    return await IposDL.getAll();
}

async function setIPOs(params) {
    const {ipos} = params;
    let res = true;
    try {
        await IposDL.setAll(ipos);
    }
    catch (e) {
        res = e.message;
    }
    return res
}

async function getIPOFavorites() {
    return await FavsDL.getAll();
}

async function updateIPOFavorite(params) {
    const {favorite, remove} = params;
    let res = true;
    try {
        if(remove) {
            await FavsDL.deleteOne(favorite);
        }
        else {
            await FavsDL.createOne(favorite);
        }
    }
    catch (e) {
        res = e.message;
    }
    return res
}

module.exports = {connect, register, getUserAccounts, setUserAccounts,
    getIntras, setIntras, getIPOs, setIPOs, getIPOFavorites, updateIPOFavorite};

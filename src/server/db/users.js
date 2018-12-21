const _ = require('lodash');
const Users = require('./models').Users;
const SeqUtils = require('./seq-utils');

async function getAll() {
    return Users.findAll();
}

async function getOne(user) {
    return Users.findOne({where:{username: user.username}});
}

async function create(username, password, type) {
    return SeqUtils.create(Users,{username,password, type});
}

async function deleteOne(username) {
    return Users.destroy({where: {username}});
}

async function exist(username) {
    const user = await Users.findOne({where:{username}});
    return !_.isEmpty(user);
}

async function getAccounts(user) {
    const {accounts} = await Users.findOne({where:{id: user.id}});
    return accounts;
}

async function updateAccounts(user, accounts) {
    return Users.update({accounts},{where:{id: user.id}});
}

module.exports = { create, exist, getAccounts, updateAccounts, getAll, getOne, deleteOne }

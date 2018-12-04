const Users = require('./models').Users;

async function create(username, password) {
    return Users.create({username,password});
}

async function exist(username) {
    return Users.findOne({where:{username}});
}

async function getAccounts(user) {
    return Users.findOne({where:{id: user.id}});
}

async function updateAccounts(user, accounts) {
    return Users.update({accounts},{where:{id: user.id}});
}

module.exports = { create, exist, getAccounts, updateAccounts }

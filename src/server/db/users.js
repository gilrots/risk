const Users = require('./models').Users;

function create(username, password) {
    return Users.create({username,password});
}

function exist(username) {
    return Users.findOne({where:{username: username}});
}

module.exports = { create, exist }

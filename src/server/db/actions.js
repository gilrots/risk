const Users = require('./models').Users;
const addUser = user => Users.create(user);
module.exports = { addUser }

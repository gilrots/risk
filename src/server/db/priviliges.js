const _ = require('lodash');
const Priviliges = require('./models').Priviliges;
const priviliges = require('../../common/config').server.priviliges;
const admin = priviliges[0];
const developer = priviliges[1];
const user = priviliges[2];

function init() {
    return Promise.all(priviliges.map(type => Priviliges.findOrCreate({where:{type},defaults:{type}})));
}

async function isAdmin(user) {
    const adminUser = await Priviliges.findOne({id:user.type});
    return !_.isEmpty(adminUser) && adminUser.type === admin;
}

async function getSimpleUser() {
    return Priviliges.findOne({where:{type:user}});
}

async function getAdmin() {
    return Priviliges.findOne({where:{type:admin}});
}

async function getAll() {
    return Priviliges.findAll({raw:true});
}

module.exports = { init, isAdmin, getSimpleUser, getAdmin, getAll }

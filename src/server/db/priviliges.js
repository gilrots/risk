const _ = require('lodash');
const Priviliges = require('./models').Priviliges;
const priviliges = require('../../common/config').server.priviliges;
const sysadmin = priviliges[0];
const developer = priviliges[1];
const sysuser = priviliges[2];

function init() {
    return Promise.all(priviliges.map(type => Priviliges.findOrCreate({where:{type},defaults:{type}})));
}

async function isAdmin(user) {
    const adminUser = await Priviliges.findOne({where:{id:user.type}});
    return !_.isEmpty(adminUser) && adminUser.type === sysadmin;
}

async function getSimpleUser() {
    return Priviliges.findOne({where:{type:sysuser}});
}

async function getAdmin() {
    return Priviliges.findOne({where:{type:sysadmin}});
}

async function getAll() {
    return Priviliges.findAll();
}

async function getRole(user) {
    const priv = await Priviliges.findOne({where:{id:user.type}});
    return priv.type;
}

module.exports = { init, isAdmin, getSimpleUser, getAdmin, getAll, getRole }

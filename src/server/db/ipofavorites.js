const Sequelize = require('Sequelize');
const Op = Sequelize.Op;
const IPOFavorties = require('./models').IPOFavorites;
const _ = require('lodash');

async function getAll(user) {
    return IPOFavorties.findAll({where:{user:user.id}});
}

async function exist(favorite) {
    return !_.isEmpty(await IPOFavorties.findOne({where: ({id,user} = favorite)}));
}

async function createOne(favorite) {
    return IPOFavorties.create(favorite);
}

async function deleteOne(favorite) {
    return IPOFavorties.destroy({
        where: ({id,user} = favorite)
    });
}

module.exports = { getAll, createOne, deleteOne, exist }


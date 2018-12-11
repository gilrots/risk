const Sequelize = require('Sequelize');
const Op = Sequelize.Op;
const IPOFavorties = require('./models').IPOFavorites;
const _ = require('lodash');

async function getAll() {
    return IPOFavorties.findAll();
}

async function setAll(favorites) {
    const parts = _.partition(favorites, 'id');
    const update = parts[0];
    const insert = parts[1];

    if(update.length !== 0){
        _.forEach(update,async updatedFav => await IPOFavorties.update(updatedFav, {where: {id: updatedFav.id}}));
        const updateIds = _.map(update,'id');
        await IPOFavorties.destroy({where: {id: {[Op.not]:updateIds}}});
    }
    else {
        await IPOFavorties.destroy({
            where: {},
            truncate: true
        });
    }

    if(insert.length !== 0){
        await IPOFavorties.bulkCreate(insert);
    }
}

async function createOne(favorite) {
    return IPOFavorties.create(favorite);
}

async function deleteOne(favorite) {
    return IPOFavorties.destroy({
        where: {id: favorite.id}
    });
}

module.exports = { getAll, setAll, createOne, deleteOne }


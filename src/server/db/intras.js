const Sequelize = require('Sequelize');
const Op = Sequelize.Op;
const Intras = require('./models').Intras;
const _ = require('lodash');

async function getAll() {
    return Intras.findAll();
}

async function setAll(intras) {
    const parts = _.partition(intras, 'id');
    const update = parts[0];
    const insert = parts[1];

    if(update.length !== 0){
        _.forEach(update,async updatedIntra => await Intras.update(updatedIntra, {where: {id: updatedIntra.id}}));
        const updateIds = _.map(update,'id');
        await Intras.destroy({where: {id: {[Op.not]:updateIds}}});
    }
    else {
        await Intras.destroy({
            where: {},
            truncate: true
        });
    }

    if(insert.length !== 0){
        await Intras.bulkCreate(insert);
    }
}

async function createOne(intra) {
    Intras.create(intra);
}

module.exports = { getAll, setAll, createOne }

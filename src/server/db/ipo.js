
const Sequelize = require('Sequelize');
const Op = Sequelize.Op;
const IPO = require('./models').IPO;
const _ = require('lodash');

async function getAll() {
    return IPO.findAll();
}

async function setAll(ipos) {
    const parts = _.partition(ipos, 'id');
    const update = parts[0];
    const insert = parts[1];

    if(update.length !== 0){
        _.forEach(update,async updatedIpo => await IPO.update(updatedIpo, {where: {id: updatedIpo.id}}));
        const updateIds = _.map(update,'id');
        await IPO.destroy({where: {id: {[Op.not]:updateIds}}});
    }
    else {
        await IPO.destroy({
            where: {},
            truncate: true
        });
    }

    if(insert.length !== 0){
        await IPO.bulkCreate(insert);
    }
}

async function createOne(ipo) {
    IPO.create(intra);
}

module.exports = { getAll, setAll, createOne }


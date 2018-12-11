const Sequelize = require('Sequelize');
const Op = Sequelize.Op;
const Tables = require('./models').Tables;
const _ = require('lodash');

async function getAll() {
    return Tables.findAll();
}

async function getOne(id) {
    return Tables.findOne({where: {id}});
}

async function setAll(tables) {
    const parts = _.partition(tables, 'id');
    const update = parts[0];
    const insert = parts[1];

    if(update.length !== 0){
        _.forEach(update,async updatedTable => await Tables.update(updatedTable, {where: {id: updatedTable.id}}));
        const updateIds = _.map(update,'id');
        await Tables.destroy({where: {id: {[Op.not]:updateIds}}});
    }
    else {
        await Tables.destroy({
            where: {},
            truncate: true
        });
    }

    if(insert.length !== 0){
        await Tables.bulkCreate(insert);
    }
}

async function createAll(tables) {
    return Tables.bulkCreate(tables);
}

async function createOne(table) {
    return Tables.create(table);
}

async function updateOne(table) {
    return Tables.update(table,{where: {id: table.id}});
}

async function duplicate(id) {
    const dupe = await getOne(id);
    delete dupe.id;
    dupe.name += ' Copy';
    return createOne(dupe);
}

async function remove(id) {
    return Tables.destroy({where: {id}});
}

module.exports = { getAll, setAll, createOne, createAll, updateOne, getOne, duplicate, remove }

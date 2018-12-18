const Tables = require('./models').Tables;
const SeqUtils = require('./seq-utils');

async function getAll() {
    return Tables.findAll();
}

async function getOne(id) {
    return Tables.findOne({where: {id}});
}

async function createAll(tables) {
    return Tables.bulkCreate(tables);
}

async function createOne(table) {
    return SeqUtils.create(Tables, table);
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

async function deleteOne(id) {
    return SeqUtils.deleteOne(Tables,{id});
}

module.exports = { getAll, createOne, createAll, updateOne, getOne, duplicate, deleteOne }

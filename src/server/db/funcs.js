const {Funcs,funcTypes, funcArgsTypes} = require('./models');
const SeqUtils = require('./seq-utils');

async function getAll() {
    return Funcs.findAll();
}

async function getAllOperators() {
    return Funcs.findAll({where: {type:funcTypes.operator}});
}

async function getAllActions() {
    return Funcs.findAll({where: {type:funcTypes.action}});
}

async function getAllFormats() {
    return Funcs.findAll({where: {type:funcTypes.format}});
}

async function getOne(id) {
    return Funcs.findOne({where: {id}});
}

async function getOneByName(name) {
    return Funcs.findOne({where: {name}});
}

async function createAll(tables) {
    return Funcs.bulkCreate(tables);
}

async function createOne(func) {
    return SeqUtils.create(Funcs, func);
}

async function updateOne(func) {
    return Funcs.update(func,{where: {id: func.id}});
}

async function deleteOne(id) {
    return SeqUtils.deleteOne(Funcs,{id});
}

module.exports = {
    getAll,
    getAllActions,
    getAllFormats,
    getAllOperators,
    createOne,
    createAll,
    updateOne,
    getOne,
    getOneByName,
    deleteOne,
    funcTypes,
    funcArgsTypes 
}

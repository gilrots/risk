const Sequelize = require('Sequelize');
const Op = Sequelize.Op;
const _ = require('lodash');

async function create(model, data) {
    created = await model.create(data);
    return created.get({plain:true});;
}

async function getAll(model, user) {
    return model.findAll({where:{user:user.id}});
}

async function setAll(model, data, user) {
    const parts = _.partition(data, 'id');
    const update = parts[0];
    const insert = parts[1];
    console.log('update',update);
    console.log('insert',insert);
    if(update.length !== 0){
        _.forEach(update,async updatedRow => await model.update(updatedRow, {where: {id: updatedRow.id}}));
        const updateIds = _.map(update,'id');
        await model.destroy({where: {id: {[Op.not]:updateIds}, user}});
    }
    else {
        await model.destroy({
            where: {user}
        });
    }

    if(insert.length !== 0){
        await model.bulkCreate(insert);
    }
}

async function exist(model, params) {
    return !_.isEmpty(await model.findOne({where: params}));
}

async function deleteOne(model, params) {
    return model.destroy({where: params});
}

module.exports = {
    create, setAll, getAll, deleteOne, exist
}


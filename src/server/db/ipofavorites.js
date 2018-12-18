const IPOFavorties = require('./models').IPOFavorites;
const SeqUtils = require('./seq-utils');

async function getAll(user) {
    return SeqUtils.getAll(IPOFavorties, user);
}

async function exist(favorite) {
    const {id,user} = favorite
    return SeqUtils.exist(IPOFavorties, {id,user})
}

async function createOne(favorite) {
    return SeqUtils.create(IPOFavorties, favorite);
}

async function deleteOne(favorite) {
    const {id,user} = favorite
    return SeqUtils.deleteOne(IPOFavorties, {id,user})
}

module.exports = { getAll, createOne, deleteOne, exist }


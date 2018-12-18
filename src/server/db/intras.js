const Intras = require('./models').Intras;
const SeqUtils = require('./seq-utils');

async function getAll(user) {
    return SeqUtils.getAll(Intras, user);
}

async function setAll(intras, user) {
    await SeqUtils.setAll(Intras, intras, user.id);
}

module.exports = { getAll, setAll }

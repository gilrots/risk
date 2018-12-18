const IPO = require('./models').IPO;
const SeqUtils = require('./seq-utils');

async function getAll(user) {
    return SeqUtils.getAll(IPO, user);
}

async function setAll(ipos, user) {
    await SeqUtils.setAll(IPO, ipos, user.id);
}

module.exports = { getAll, setAll }


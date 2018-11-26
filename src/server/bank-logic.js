const config = require('../mocks/config.json');
const Utils = require('../common/utils.js');
const _ = require('lodash');

const DB = {
    long: {},
    short: {},
    all:{},
    ids: undefined
};

function getDBSnap(){
    const snap = Utils.copy(DB);
    snap.ids = _.keys(snap.all);
    return snap;
}

function getAmount(stock) {
    return stock.StartDayQty + stock.FillQty;;
}

function getId(stock) {
    return stock.securityID;
}

function getStock(stockId) {
    return DB.all[stockId];
}

function getFields() {
    return _.map(config.bank.fields, field => ({id: field, name: field}));
}

function updateDB(stock, fromStocks, toStocks = undefined) {
    const id = getId(stock);
    if(fromStocks[id]) {
        delete fromStocks[id];
        delete DB.all[id];
    }
    if(toStocks){
        toStocks[id] = stock;
        DB.all[id] = stock;
    }
}

function updateStocksData(bankData) {
    const amount = getAmount(bankData);

    if(amount === 0) {
        updateDB(bankData, DB.short);
        updateDB(bankData, DB.long);
    }
    else if(amount > 0) {
        updateDB(bankData,DB.short, DB.long);
    }
    else {
        updateDB(bankData, DB.long, DB.short);
    }
}

function filter(bankSnap, ids){
    _.forEach(ids, id => {
        delete bankSnap.long[id];
        delete bankSnap.short[id];
        delete bankSnap.all[id];
    });
    bankSnap.ids = _.difference(bankSnap.ids, ids);
}

module.exports = {updateStocksData, getDBSnap, getFields, filter};

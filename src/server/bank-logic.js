const config = require('../mocks/config.json');
const Utils = require('../common/utils.js');
const _ = require('lodash');

const DB = {
    long: {},
    short: {},
    all:{},
    ids:[]
};

function getDBSnap(){
    return Utils.copy(DB);
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
        const index = DB.ids.indexOf(id);
        if(index > -1) {
            DB.ids.splice(index, 1);
        }
    }
    if(toStocks){
        toStocks[id] = stock;
        DB.all[id] = stock;
        DB.ids.push(id);
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

module.exports = {updateStocksData,getDBSnap, getFields};

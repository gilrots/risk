const config = require('../mocks/consts.json');
const Utils = require('./utils.js');

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

function getShorts() {
    return DB.short;
}

function getLongs() {
    return DB.long;
}

function getAllStocks() {
    return DB.all;
}

function getAllStockIds() {
    return DB.ids;
}

function getStock(stockId) {
    return DB.all[stockId];
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

module.exports = {updateStocksData,getDBSnap,getShorts,getLongs,getAllStocks,getStock,getAllStockIds};

const config = require('../../common/config.json');
const Utils = require('../../common/utils.js');
const _ = require('lodash');
const banks = config.bank.banks;
const idField = config.bank.fields[1];
const accntField = config.bank.fields[0];
const bankField = config.bank.bankField;
const timeout = config.bank.timeout;
const rn = () => new Date().getTime(); // Right-now
const DB = {
    long: {},
    short: {},
    all:{},
    ids: undefined
};

const BankLatency = _.chain(banks).keys().mapKeys(rn).value();

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
    updateBankLatency(bankData);
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

function filter(bankSnap, ids, accounts){
    const accntMap = _.chain(accounts).mapKeys(()=>true).value();
    const filteredIds = _.chain(bankSnap.all)
                            .values()
                            .filter(s => !accntMap[s[accntField]])
                            .map(idField)
                            .concat(ids)
                            .value();
    _.forEach(filteredIds, id => {
        delete bankSnap.long[id];
        delete bankSnap.short[id];
        delete bankSnap.all[id];
    });
    bankSnap.ids = _.difference(bankSnap.ids, filteredIds);
}

function updateBankLatency(bankData){
    const bank = bankData[bankField];
    if(bank){
        if(BankLatency[bank]){
            BankLatency[bank] = rn();
        }
        else{
            console.error(`Stock id: ${bankData.securityID} bank value isnt valid: ${bank}`);
        }
    }
    else{
        console.error(`Stock id: ${bankData.securityID} has no bank field`);
    }
}

function getBankLatency(){
    return _.chain(BankLatency).toPairs().reduce((acc, pair) => [...acc, {
        name: banks[pair[0]],
        error: (rn() - pair[1]) > timeout,
        message: '' 
    }],[]).value();
}

module.exports = {updateStocksData, getDBSnap, getFields, filter, getBankLatency};

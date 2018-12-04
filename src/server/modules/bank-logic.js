const config = require('../../common/config.json');
const Utils = require('../../common/utils.js');
const _ = require('lodash');
const banks = config.bank.banks;
const idField = config.bank.fields[1];
const accntField = config.bank.fields[0];
const sdqField = config.bank.fields[3];
const fqField = config.bank.fields[6];
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
    return stock[sdqField] + stock[fqField];;
}

function getId(stock) {
    return stock[idField];
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
    const deleteId = id => {
        delete bankSnap.long[id];
        delete bankSnap.short[id];
        delete bankSnap.all[id];
    }
    const accntMap = _.chain(accounts).mapKeys(()=>true).value();
    bankSnap.ids = _.chain(bankSnap.all)
                    .values()
                    .filter(s => !accntMap[s[accntField]])
                    .map(idField)
                    .concat(ids)
                    .uniq()
                    .forEach(deleteId)
                    .xor(bankSnap.ids)
                    .value();
}

function updateBankLatency(bankData){
    const bank = bankData[bankField];
    if(bank){
        if(BankLatency[bank]){
            BankLatency[bank] = rn();
        }
        else{
            console.error(`Stock id: ${getId(bankData)} bank value isnt valid: ${bank}`);
        }
    }
    else{
        console.error(`Stock id: ${getId(bankData)} has no bank field`);
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

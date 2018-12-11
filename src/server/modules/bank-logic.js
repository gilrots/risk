const config = require('../../common/config.json');
const Utils = require('../../common/utils.js');
const _ = require('lodash');
const banks = config.bank.banks;
const idField = config.bank.fields[1];
const accntField = config.bank.fields[0];
const sdqField = config.bank.fields[3];
const fqField = config.bank.fields[6];
const originField = config.bank.originField;
const origins = config.bank.origins;
const bankField = config.bank.bankField;
const timeout = config.bank.timeout;
const rn = () => new Date().getTime(); // Right-now
const DB = {
    long: {},
    short: {},
    all:{},
    ids: undefined
};
const appAccnt = "System"

const BankLatency = _.chain(banks).keys().mapKeys(rn).value();

function getDBSnap(){
    const snap = Utils.copy(DB);
    snap.ids = _.keys(snap.all);
    return snap;
}

function getAmount(stock) {
    return stock[sdqField] + stock[fqField];;
}

function setAmount(stock, amount) {
    stock[sdqField] = amount;
    stock[fqField] = 0;
}

function getId(stock) {
    return stock[idField];
}

function setId(stock, id) {
    stock[idField] = id;
}

function getAccount(stock) {
    return stock[accntField];
}

function setAccount(stock, account) {
    stock[accntField] = account;
}

function getOrigin(stock) {
    return stock[originField];
}

function setOrigin(stock, origin) {
    stock[originField] = origin;
}

function getFields() {
    return _.map(config.bank.fields, field => ({id: field, name: field}));
}

function updateDB(db, stock, fromStocks, toStocks = undefined) {
    const id = getId(stock);
    if(fromStocks[id]) {
        delete fromStocks[id];
        delete db.all[id];
    }
    if(toStocks){
        toStocks[id] = stock;
        db.all[id] = stock;
    }
}

async function updateStocksData(bankData, db = DB) {
    //console.log(getId(bankData));
    const amount = getAmount(bankData);
    if(!getOrigin(bankData)){
        updateBankLatency(bankData);
        setOrigin(bankData, origins.bank);
    }

    if (amount === 0) {
        updateDB(db, bankData, db.short);
        updateDB(db, bankData, db.long);
    }
    else if (amount > 0) {
        updateDB(db, bankData, db.short, db.long);
    }
    else {
        updateDB(db, bankData, db.long, db.short);
    }
    return true;
}

function addIntrasAndIPOs(bankSnap, intras, ipos){
    _.forEach(intras, intra => updateStocksData(formatOuter(intra.stockId, intra.amount, origins.intra), bankSnap));
    _.forEach(ipos, ipo => updateStocksData(formatOuter(ipo.id,ipo.amount, origins.ipo), bankSnap));
    bankSnap.ids = _.keys(bankSnap.all);
}

function filter(bankSnap, ids, accounts){
    const deleteId = id => {
        delete bankSnap.long[id];
        delete bankSnap.short[id];
        delete bankSnap.all[id];
    }
    const accntMap = _.chain(accounts).mapKeys(()=>true).value();
    accntMap[appAccnt] = true;
    bankSnap.ids = _.chain(bankSnap.all)
                    .values()
                    .filter(s => !accntMap[getAccount(s)])
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

function formatOuter(id, amount, origin){
    const stock = {}
    setId(stock, id);
    setAmount(stock, amount);
    setOrigin(stock, origin);
    setAccount(stock, appAccnt);
    return stock;
}

module.exports = {updateStocksData, getDBSnap, getFields, filter, getBankLatency, addIntrasAndIPOs};

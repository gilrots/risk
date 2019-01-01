const config = require('../../common/config.json').bank;
const Utils = require('../../common/utils.js');
const _ = require('lodash');
const {banks, fields, originField, origins, bankField, amountField, timeout, dataField, typeField} = config;
const idField = fields[1];
const accntField = fields[0];
const accntsField = `${accntField}s`;
const sdqField = fields[3];
const fqField = fields[6];
const presentationFields = [
    {id:idField,name:'מזהה נייר'},
    {id:amountField,name:'כמות'},
    {id:originField,name:'מקור'},
];
const rn = () => new Date().getTime(); // Right-now
const sysAccount = "System"
const bankTypes = _.keys(banks);
const BankLatency = _.chain(banks).keys().keyMap(rn).value();
const stockTypes = {
    none:'none',
    short:'short',
    long:'long',
}
const DB = {
    long: {},
    short: {},
    none: {},
    all:{},
    ids: []
};

function calcAmount(bankData) {
    return bankData[sdqField] + bankData[fqField];
}

function getAmount(stock) {
    return stock[amountField];
}

function getTotalAmount(stock, filter) {
    return _.sum(getAggregatedData(stock, amountField, filter));
}

function getId(stock) {
    return stock[idField];
}

function getAccount(bankData) {
    return bankData[accntField];
}

function getAccounts(bankData) {
    return bankData[accntsField];
}

function getAggregatedData(stock, method, filter) {
    return _.map(_.filter(getData(stock), filter), method);
}

function getOrigin(stock) {
    return stock[originField];
}

function getBank(bankData) {
    return bankData[bankField];
}

function getData(stock) {
    return _.flatMap(stock[dataField],_.values);
}

function setId(stock, id) {
    stock[idField] = id;
}

function setAccount(stock, account) {
    stock[accntField] = account;
}

function setAccounts(stock) {
    return stock[accntsField] = getAggregatedData(stock,getAccount);
}

function setOrigin(stock, origin) {
    stock[originField] = origin;
}

function setInitialAmount(bankData, amount) {
    bankData[sdqField] = amount;
    bankData[fqField]= 0;
}

function setAmount(stock, amount) {
    stock[amountField] = amount;
}

function setData(stock, bankData) {
    setAmount(bankData, calcAmount(bankData));
    _.setWith(stock,[dataField,getBank(bankData),getAccount(bankData)],bankData,Object);
}

function getFields() {
    return presentationFields;
}

async function updateDB(bankData) {
    updateBankLatency(bankData);
    updateStocks(bankData, origins.bank , DB);
    return true;
}

function updateStocks(bankData, origin, db) {
    const id = getId(bankData);
    let stock = db.all[id];
    if(stock === undefined) {
        stock = newStock(id, origin);
        db.all[id] = stock;
    }
    setData(stock, bankData);
    setAmount(stock, getTotalAmount(stock));
    setAccounts(stock);
}

function getLongShortIds(){
    return _.partition(DB.all, stock => getAmount(stock) !== 0)[0];
}

function getCustomDBSnap(excludes, accounts, intras, ipos){
    const snap = Utils.copy(DB);
    addIntrasAndIPOs(snap, intras, ipos);
    filter(snap, excludes, accounts);
    return snap;
}

function getStockType(stock){
    const amount = getAmount(stock);
    return amount === 0 ? stockTypes.none : (amount > 0 ?  stockTypes.long : stockTypes.short);
}

function addIntrasAndIPOs(bankSnap, intras, ipos){
    _.forEach(intras, intra => updateStocks(fakeStock(intra.stockId, intra.amount), origins.intra, bankSnap));
    _.forEach(ipos, ipo => updateStocks(fakeStock(ipo.id,ipo.amount), origins.ipo, bankSnap));
}

function filter(bankSnap, excludes, accounts){
    const excldMap = _.keyMap(excludes,() => true)
    const accntMap = _.keyMap(accounts.concat(sysAccount),() => true);
    const predicate = id => !excldMap[id] && getAccounts(bankSnap.all[id]).some(acct => accntMap[acct]);
    const divider = id => {
        const stock = bankSnap.all[id];
        setAmount(stock, getTotalAmount(stock,s => accntMap[getAccount(s)]));
        const type = getStockType(stock);
        bankSnap[type][id] = stock;
        if(type !== stockTypes.none){
            bankSnap.ids.push(id);
        }
    };
    _.chain(bankSnap.all).keys().filter(predicate).forEach(divider).value();
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

function newStock(id, origin) {
    const newData = {[dataField]:{}};
    setId(newData, id);
    setOrigin(newData, origin);
    return newData;
}

function fakeStock(id, amount){
    const fakeBankData = {};
    setId(fakeBankData, id);
    setInitialAmount(fakeBankData, amount);
    setAccount(fakeBankData, sysAccount);
    return fakeBankData;
}

module.exports = {
    updateDB,
    getCustomDBSnap,
    getFields,
    getBankLatency,
    getLongShortIds
};

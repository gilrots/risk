const config = require('../../common/config.json').bank;
const Utils = require('../../common/utils.js');
const _ = require('lodash');
const {banks, fields, originField, origins, bankField, amountField, timeout, dataField, typeField} = config;
const idField = fields[1];
const accntField = fields[0];
const accntsField = `${accntField}s`;
const banksField = `${bankField}s`;
const sdqField = fields[3];
const fqField = fields[6];
const lntField = fields[11];
const presentationFields = [
    {id:idField,name:'מזהה נייר'},
    {id:amountField,name:'כמות'},
    {id:originField,name:'מקור'},
    {id:banksField,name:'בנקים'},
    {id:accntsField,name:'חשבונות'},
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

function getLoan(stock) {
    return stock[lntField];
}

function getAmounts(stock, filter) {
    return getAggregatedData(stock, amountField, filter);
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

function getBanks(bankData) {
    return bankData[banksField];
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
    return stock[accntsField] = getAggregatedData(stock,accntField);
}

function setBanks(stock) {
    return stock[banksField] = _.keyMap(_.keys(stock[dataField]),k => _.keys(stock[dataField][k]));
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
    setBanks(stock);
}

function getLongShortIds(){
    return _.partition(DB.all, stock => getAmount(stock) !== 0)[0];
}

function getCustomDBSnap(excludes, accounts, intras, ipos){
    const bankSnap = Utils.copy(DB);
    addIntrasAndIPOs(bankSnap, intras, ipos);
    const divider = (id,params) => {
        const {snap, accntMap} = params;
        const stock = snap.all[id];
        setAmount(stock, getTotalAmount(stock,s => accntMap[getAccount(s)]));
        const type = getStockType(stock);
        snap[type][id] = stock;
        if(type !== stockTypes.none){
            snap.ids.push(id);
        }
    };
    filter(bankSnap, excludes, accounts.concat(sysAccount), divider);
    return bankSnap;
}

function getConflicts(accounts){
    const bankSnap = Utils.copy(DB);
    bankSnap.conflicts = [];
    const divider = (id,params) => {
        const {snap, accntMap} = params;
        const stock = snap.all[id];
        const amounts = getAmounts(stock, s => accntMap[getAccount(s)]);
        if(amounts.length > 1 && amounts.some(a=> a > 0) && amounts.some(a=> a < 0)){
        
            const conf = _.partition(amounts, a => a > 0);
            snap.conflicts.push({
                id: id,
                long: _.sum(conf[0]),
                short: _.sum(conf[1]),
                accounts: getAccounts(stock, s => accntMap[getAccount(s)])
            }); 
        } 
    };
    filter(bankSnap, [], accounts, divider);
    return bankSnap.conflicts;
}

function getLoans(accounts){
    const bankSnap = Utils.copy(DB);
    bankSnap.loans = [];
    const divider = (id,params) => {
        const {snap, accntMap} = params;
        const stock = snap.all[id];
        const data = getData(stock);
        _.forEach(data, bankData => {
            const accnt = getAccount(bankData);
            const loan = getLoan(bankData);
            if(accntMap[accnt] && loan && loan > 0) {
                snap.loans.push({
                    id: id,
                    bank: banks[getBank(bankData)],
                    account: accnt,
                    loan: loan,
                }); 
            } 
        })
    };
    filter(bankSnap, [], accounts, divider);
    return bankSnap.loans;
}

function getStockType(stock){
    const amount = getAmount(stock);
    return amount === 0 ? stockTypes.none : (amount > 0 ?  stockTypes.long : stockTypes.short);
}

function addIntrasAndIPOs(bankSnap, intras, ipos){
    _.forEach(intras, intra => updateStocks(fakeStock(intra.stockId, intra.amount), origins.intra, bankSnap));
    _.forEach(ipos, ipo => updateStocks(fakeStock(ipo.id,ipo.amount), origins.ipo, bankSnap));
}

function filter(bankSnap, excludes, accounts, divider){
    const excldMap = _.keyMap(excludes,() => true)
    const accntMap = _.keyMap(accounts,() => true);
    const predicate = id => !excldMap[id] && getAccounts(bankSnap.all[id]).some(acct => accntMap[acct]);
    const params = {accntMap:accntMap, snap:bankSnap};
    _.chain(bankSnap.all).keys().filter(predicate).forEach(id => divider(id, params)).value();
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
    getLongShortIds,
    getConflicts,
    getLoans
};

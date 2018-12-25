const config = require('../../common/config.json');
const Bank = require('./bank-logic');
const Tables = require('./tables-logic');
const Ace = require('./ace');
const DB = require('./database');
const Utils = require('../../common/utils.js');
const {TableNotExistError, DataRequestError} = require('./errors');

const _ = require('lodash');

function handleAceData(aceDB, stockId, aceData, aceFields) {
    aceDB.data[stockId] = Tables.formatAceData(stockId, aceDB, aceData, aceFields);
}

async function getTable(params) {
    const t0 = new Date().getTime();
    const { user } = params;
    const tableId = parseInt(params.tableId);
    const table = await Tables.getUserTableOrDefault(user, tableId);
    
    if (_.isEmpty(table)) {
        console.log("No such table id:", { tableId });
        return Tables.getResultFormat(user);
    }
    const {aceFields} = table.calculated;
    if (aceFields.length === 0) {
        console.log("No ace fields", { name: table.name })
        return Tables.getResultFormat(user);
    }

    let result = undefined;
    const aceLatency = { name: "Ace", error: false, message: '' };
    try {
        const accounts = await DB.getUserAccounts(params);
        const intras = await DB.getUserIntras(params);
        const ipos = await DB.getUserIPOs(params);
        const iposMap = _.reduce(ipos,(acc,ipo) => _.assign(acc,{[ipo.id]:ipo}),{});
        const ipoMapper = (ipo,errVal) => _.reduce(aceFields, (arr,field,i) => {
            const dataField = _.find(ipo.data, df => df.field.id === field);
            arr[i] = dataField && dataField.value ? dataField.value : errVal ;
            return arr;
        },[]);
        const aceQuery = Ace.getFieldsQuery(aceFields);
        const bankDB = Bank.getCustomDBSnap(table.excluded, accounts, intras, ipos);
        const aceDB = Ace.getAceDB();
        const promises = _.map(bankDB.ids, stockId =>
            new Promise(resolve => 
                Utils.tryAtleast(resolve, Utils.tryCounter(config.ace.tries, []),
                    innerResolve => {
                        Ace.getStockFields(stockId, aceQuery, iposMap[stockId], ipoMapper)
                        .then(aceData => {
                            handleAceData(aceDB, stockId, aceData, aceFields);
                            innerResolve(aceDB.missing[stockId] ? undefined : true);
                        });
                    })
            ));

        await Promise.all(promises);
        result = Tables.calculateTable(table, bankDB, aceDB, user);
    }
    catch (e) {
        result = Tables.getResultFormat(user);
        aceLatency.error = true;
        aceLatency.message = e.message;
        console.error(e);
    }
    result.latency = [aceLatency, ...Bank.getBankLatency()];
    const t1 = new Date().getTime();
    console.log(`Call to getTable took ${t1 - t0} milliseconds`);
    return result;
}

async function getTableMakerData() {
    let result = [];

    try {
        const data = await Ace.getAllSystemFields();
        if (data.length > 0) {
            result = { ace: data, bank: Bank.getFields() };
        }
    }
    catch(e){
        console.error("getTableMakerData error: ", e);
    }

    return result;
}

async function getFilterMakerData() {
    let result = {fields:['bb','ff'],actions:['bigger','smaller'],operators:["None","Or","And"], defaultOperator:"None"};

    try {
    }
    catch(e){
        console.error("getFilterMakerData error: ", e);
        throw new DataRequestError(e.message);
    }

    return result;
}

async function searchAceFields(params) {
    const { search } = params;
    const fields = await getTableMakerData();
    const result = { items: [] };
    if (_.isEmpty(fields))
        return result;
    result.items = _.limit(fields.ace, item => item.id.includes(search) || item.name.includes(search), 10);
    return result;
}

async function tableAction(params) {
    let result = 'No such action';
    const tableId = parseInt(params.tableId);
    switch (params.action) {
        case config.server.api.tableAction.actions.copy:
            result = await Tables.copyTable(tableId);
            break;
        case config.server.api.tableAction.actions.get:
            result = Tables.tableToClient(Tables.getTable(tableId));
            break
        case config.server.api.tableAction.actions.remove:
            result = await Tables.removeTable(tableId);
            break;
    }
    return result;
}

async function getTableExcludeList(params) {
    const tableId = parseInt(params.tableId);
    const table = Tables.getTable(tableId);
    if (_.isEmpty(table)) {
        throw new TableNotExistError(`No such table id ${tableId}`);
    }

    const ids = Bank.getLongShortIds();
    const excludes = table.excluded;
    const stocks = await Ace.getStocksNames(ids)
    const filtered = _.filter(stocks, stock => stock && stock.name);
    const parts = _.partition(filtered, stock => excludes.indexOf(stock.id) < 0);
    return { included: parts[0], excluded: parts[1] };
}

async function getTableFilter(params) {
    const tableId = parseInt(params.tableId);
    const table = Tables.getTable(tableId);
    if (_.isEmpty(table)) {
        throw new TableNotExistError(`No such table id ${tableId}`);
    }

    return table.filter;
}

module.exports = {
    getTable,
    getTableMakerData,
    tableAction,
    getTableExcludeList,
    getTableFilter,
    getFilterMakerData,
    searchAceFields 
};

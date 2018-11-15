const fetch = require("node-fetch");
const config = require('../mocks/config.json');
const Bank = require('./bank-logic');
const Tables = require('./tables-logic');
const Ace = require('./ace');
const Utils = require('./utils.js');

const _ = require('lodash');

function handleAceError(aceDB,e) {
    aceDB.errors.ace = true;
    aceDB.errors.data.push(e);
}

function handleAceData(aceDB, stockId, aceData, aceFields) {
    aceDB.errors.ace = false;
    aceDB.data[stockId] = Tables.formatAceData(stockId,aceDB,aceData,aceFields);
}

function getTable(tableId) {
    return new Promise((resolve, reject) => {
        const table =  Tables.GetTable(tableId);
        const bankDB = Bank.getDBSnap();
        const aceDB = Ace.getAceDB();
        let ids = bankDB.ids;
        if(table === undefined) {
            console.log("No such table id:", {tableId});
        }
        else if(table.calculated.aceFields.length === 0){
            console.log("No ace fields", {name:table.name})
        }
        else {
            const aceQuery = Ace.getFieldsQuery(table.calculated.aceFields);
            getAllAceData(resolve, reject, {table, bankDB,aceDB,aceQuery, ids, tries:0});
        }
    });
}

function getAllAceData(resolve, reject, data) {
    const t0 = new Date().getTime();
    const {table, bankDB,aceDB,aceQuery,ids} = data;
    const promises = _.map(ids, stockId =>
        fetch(Ace.setQueryId(stockId, aceQuery))
            .then(res => res.json())
            .then(aceData => handleAceData(aceDB, stockId, aceData, table.calculated.aceFields))
            .catch(e => handleAceError(aceDB, e)));

    Promise.all(promises).then(() => {
        const missingIds = _.keys(aceDB.errors.fieldsMissing);
        aceDB.errors.fieldsMissing = {};
        if(missingIds.length === 0 || data.tries > config.ace.tries) {
            try {
                const result = Tables.calculateTable(table,bankDB,aceDB);
                const t1 = new Date().getTime();
                console.log(`Call to table took ${t1 - t0} milliseconds`);
                resolve(result);
            }
            catch (e) {
                const error = Tables.getResultFormat();
                error.errors.ace = true;
                error.errors.errors = [e];
                resolve(error);
            }
        }
        else {
            data.ids = missingIds;
            data.tries++;
            getAllAceData(resolve, reject, data);
        }
    });
}

function getTableMakerData() {
    return new Promise(resolve => {
        Ace.getAllSystemFields().then(result => {
            if(result.length > 0){
                resolve({ace:result, bank: Bank.getFields()});
            }
            else {
                resolve([]);
            }
        })
    });
}



module.exports = {getTable, getTableMakerData};

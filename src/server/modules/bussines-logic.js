const config = require('../../common/config.json');
const Bank = require('./bank-logic');
const Tables = require('./tables-logic');
const Ace = require('./ace');
const DB = require('./database');
const Utils = require('../../common/utils.js');

const _ = require('lodash');

function handleAceError(aceDB, e) {
    aceDB.errors.ace = true;
    aceDB.errors.data.push(e);
}

function handleAceData(aceDB, stockId, aceData, aceFields) {
    aceDB.errors.ace = false;
    aceDB.data[stockId] = Tables.formatAceData(stockId, aceDB, aceData, aceFields);
}
function getTable(params) {
    const { user } = params;
    const  tableId = parseInt(params.tableId);
    console.log(params);
    return new Promise(resolve => {
        const table = Tables.getTable(tableId);
        const bankDB = Bank.getDBSnap();
        const aceDB = Ace.getAceDB();
        if (_.isEmpty(table)) {
            console.log("No such table id:", { tableId });
            resolve(Tables.getResultFormat(user));
        }
        else if (table.calculated.aceFields.length === 0) {
            console.log("No ace fields", { name: table.name })
            resolve(Tables.getResultFormat(user));
        }
        else {
            DB.getUserAccounts(params).then(({accounts}) => {
                Bank.filter(bankDB, table.excluded, accounts);
                const aceQuery = Ace.getFieldsQuery(table.calculated.aceFields);
                let ids = bankDB.ids;
                const counter = Utils.tryCounter(config.ace.tries, []);
                Utils.tryAtleast(resolve, counter,
                    innerResolve => {
                        const promises = _.map(ids, stockId =>
                            Utils.fetchJsonBackend(Ace.setQueryId(stockId, aceQuery))
                                .then(aceData => handleAceData(aceDB, stockId, aceData, table.calculated.aceFields))
                                .catch(e => handleAceError(aceDB, e)));
                        Promise.all(promises).then(() => {
                            const missingIds = _.keys(aceDB.errors.fieldsMissing);
                            aceDB.errors.fieldsMissing = {};
                            let result = undefined;

                            if (missingIds.length === 0 || counter.almost()) {
                                const aceLatency = { name: "Ace", error: false, message: '' };
                                try {
                                    result = Tables.calculateTable(table, bankDB, aceDB, user);
                                }
                                catch (e) {
                                    result = Tables.getResultFormat(user);
                                    aceLatency.error = true;
                                    aceLatency.message = e.message;
                                    console.error(e);
                                }
                                result.latency = [aceLatency, ...Bank.getBankLatency()];
                            }
                            else {
                                ids = missingIds;
                            }
                            innerResolve(result);
                        });
                    }
                );
            });
        }
    });
}

function getTableMakerData() {
    return new Promise(resolve => {
        Ace.getAllSystemFields().then(result => {
            if (result.length > 0) {
                resolve({ ace: result, bank: Bank.getFields() });
            }
            else {
                resolve([]);
            }
        }).catch(e => {
            console.error("getTableMakerData error: ", e);
            resolve([]);
        })
    });
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



function tableAction(params) {
    return new Promise(resolve => {
        let result = 'No such action';
        switch (params.action) {
            case config.server.api.tableAction.actions.copy:
                result = Tables.copyTable(params.tableId);
                break;
            case config.server.api.tableAction.actions.get:
                result = Tables.tableToClient(Tables.getTable(params.tableId));
                break
            case config.server.api.tableAction.actions.remove:
                result = Tables.removeTable(params.tableId);
                break;
        }
        resolve(result);
    });
}

function getTableExcludeList(params) {
    const { tableId } = params;
    return new Promise(resolve => {
        const table = Tables.getTable(tableId);
        if (table) {
            const ids = Bank.getDBSnap().ids;
            const excludes = table.excluded;
            Ace.getStocksNames(ids).then(stocks => {
                const filtered = _.filter(stocks, stock => stock && stock.name);
                const parts = _.partition(filtered, stock => excludes.indexOf(stock.id) < 0);
                resolve({ included: parts[0], excluded: parts[1] });
            });
        }
        else {
            resolve(Utils.jsonError(`No such table id ${tableId}`));
        }
    });
}

module.exports = { getTable, getTableMakerData, tableAction, getTableExcludeList, searchAceFields };

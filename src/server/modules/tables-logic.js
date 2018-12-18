const config = require('../../common/config.json');
const _ = require('lodash');
const Ace = require('./ace');
const {TableCouldNotBeParsedError,TableCouldNotBeUpdatedOrCreatedError} = require('./errors');
const Utils = require('../../common/utils');
const TablesDL = require('../db/tables'); 
const UsersDL = require('../db/users'); 
const DB = {
    types: ['long', 'short'],
    subTypes: ['risk'],
    replaceToken: 'Long/Short',
    sum: 'acc',
    tables: [],
    riskCols: [
        {
            name: 'Name',
            key: 'name',
        },
        {
            name: 'Value',
            key: 'value',
        },
    ],
    calculated: {
        cols: {
            long: [],
            short: [],
            risk: []
        },
        aceFields: [],
        aggregations: {
        }
    },
    generator: {
        actions: ['Bigger Than', 'Contains', 'Smaller Than', 'Starts With', 'Ends With'],
        operators: ['None', 'And', 'Or']
    }
};

const defaultCols = ["Name",
                    `${DB.replaceToken} Value`,
                    `${DB.replaceToken} Value %`,
                    "Amount",
                    "Syn Diff"].map(name => ({name, key:formatColKey(name)}));
const defaultRisk = [`${DB.replaceToken} Total Value`,
                    `${DB.replaceToken} Total Risk`,
                    `${DB.replaceToken} Duration`,
                    "Risk"].map((name,i) => ({
                        name,
                        key:formatKey(name),
                        type: name.includes(DB.replaceToken) ? DB.replaceToken : DB.subTypes[0],
                        order: i}));
const defaultAce = config.ace.defaultTableFields;

const defaultTable = {
    name: config.app.defaultTable.name,
    cols: [
        {
            ...defaultCols[0],
            func: {
                exp: '{a:0}',
                arguments: {
                    stock: [],
                    bank: [],
                    ace: [defaultAce[0]]
                },
                aggregations: [],
            }
        },
        {
            ...defaultCols[1],
            func: {
                exp: '{a:0}*({b:0}+{b:1})',
                arguments: {
                    stock: [],
                    bank: [config.bank.fields[3], config.bank.fields[6]],
                    ace: [defaultAce[1]]
                },
                aggregations: [],
            },
            format: 2,
        },
        {
            ...defaultCols[2],
            func: {
                exp: '{s:0}/{t:0}',
                arguments: {
                    stock: [defaultCols[1].key],
                    bank: [],
                    ace: []
                },
                aggregations: [{ key: `${DB.replaceToken}_total_value`, exp: `${DB.sum} + {s:0}` }],
            },
            format: 0
        },
        {
            ...defaultCols[3],
            func: {
                exp: '{b:0}+{b:1}',
                arguments: {
                    stock: [],
                    bank: [config.bank.fields[3], config.bank.fields[6]],
                    ace: []
                },
                aggregations: []
            }
        },
        {
            ...defaultCols[4],
            func: {
                exp: '{a:0}',
                arguments: {
                    stock: [],
                    bank: [],
                    ace: [defaultAce[2]]
                },
                aggregations: []
            },
            format: 1
        }],
    risk: [
        {
            ...defaultRisk[0],
            func: {
                exp: '{t:0}',
                arguments: {
                    stock: [defaultCols[1].key],
                    bank: [],
                    ace: []
                },
                aggregations: [{ key: `${DB.replaceToken}_total_value`, exp: `${DB.sum} + {s:0}` }]
            }
        },
        {
            ...defaultRisk[1],
            func: {
                exp: '({t:1} / {t:0}) * {t:2}',
                arguments: {
                    stock: [defaultCols[2].key, defaultCols[1].key],
                    bank: [],
                    ace: [defaultAce[3]]
                },
                aggregations: [
                    { key: `${DB.replaceToken}_total_duration`, exp: `${DB.sum} + {a:0}` },
                    { key: `${DB.replaceToken}_total_duration_per`, exp: `${DB.sum} + ({s:0} * {a:0})` },
                    { key: `${DB.replaceToken}_total_value`, exp: `${DB.sum} + {s:1}` }],
            }
        },
        {
            ...defaultRisk[2],
            func: {
                exp: '{t:1} / {t:0}',
                arguments: {
                    stock: [defaultCols[2].key],
                    bank: [],
                    ace: [defaultAce[3]]
                },
                aggregations: [
                    { key: `${DB.replaceToken}_total_duration`, exp: `${DB.sum} + {a:0}` },
                    { key: `${DB.replaceToken}_total_duration_per`, exp: `${DB.sum} + ({s:0} * {a:0})` }],
            }
        },
        {
            ...defaultRisk[3],
            func: {
                exp: '{t:0} / {t:1}',
                arguments: {
                    stock: [],
                    bank: [],
                    ace: []
                },
                aggregations: [
                    { key: 'long_total_risk', exp: '' },
                    { key: 'short_total_risk', exp: '' }],
            }
        }
    ],
    filter: {},
    excluded: []
}

const argsMap = {
    s: 'stock',
    b: 'bank',
    a: 'ace',
    t: 'result.aggs',
    regEx: /{(.):(\d)}/g
};

const clientTableFormat = {
    name: '',
    id: '',
    cols: [],
    risk: []
};

function replaceToken(obj, key, args) {
    const val = obj[key];
    if (typeof val === 'string' && val.toUpperCase().includes(DB.replaceToken.toUpperCase())) {
        const replace = key === 'name' ? _.startCase(args.type) : args.type;
        obj[key] = Utils.replaceAll(val, DB.replaceToken, replace);
    }
}

function setExpressions(obj, key, argsMap) {
    const val = obj[key];
    if (key === 'exp') {
        if (obj['arguments']) {
            argsMap.args = obj['arguments'];
            argsMap.aggs = obj['aggregations'];
        }

        const regEx = new RegExp(argsMap.regEx);
        const matches = val.match(regEx);
        if (matches !== null) {
            obj[key] = _.reduce(matches, (res, match) => {
                const groups = regEx.exec(matches);
                const source = argsMap[groups[1]];
                const property = argsMap.args[source] ? argsMap.args[source][groups[2]] : argsMap.aggs[groups[2]].key;
                const parsedExp = `${source}["${property}"]`;
                return Utils.replaceAll(res, match, parsedExp);
            }, val);
        }
    }
}

function formatResult(bank, ace) {
    const id = bank.securityID;
    return { 'stock': { id }, bank, 'ace': ace[id] };
}

function formatAceData(stockId, aceDB, aceData, aceFields) {
    return _.reduce(aceFields, (res, field, index) => {
        res[field] = Ace.getFieldValue(stockId, aceDB, aceData, index);
        return res; 
    }, {});
}

function parseTable(table) {
    table.riskCols = Utils.copy(DB.riskCols);
    table.calculated = Utils.copy(DB.calculated);
    //Sums (optimize) all ace fields required for the table
    table.calculated.aceFields = _.uniq(_.reduce([...table.cols, ...table.risk], (sum, col) => sum.concat(...col.func.arguments.ace), []));

    _.forEach(DB.types, type => {
        //TODO convert to foreach with risk sub type
        table.calculated.cols[type] = Utils.copy(table.cols);
        table.calculated.cols.risk = table.calculated.cols.risk.concat(Utils.copy(table.risk));

        Utils.treeForEach(table.calculated.cols, type, replaceToken, {type});
        Utils.treeForEach(table.calculated.cols, DB.subTypes[0], replaceToken, {type});

        //Sums (optimize) all aggregations value from al cols
        _.forEach(_.uniq(_.reduce(table.calculated.cols[type], (sum, col) => sum.concat(_.map(col.func.aggregations, 'key')), [])), key => table.calculated.aggregations[key] = undefined);
        _.forEach(_.uniq(_.reduce(table.calculated.cols.risk, (sum, col) => sum.concat(_.map(col.func.aggregations, 'key')), [])), key => table.calculated.aggregations[key] = undefined);

        Utils.treeForEach(table.calculated.cols, type, setExpressions, argsMap);
        Utils.treeForEach(table.calculated.cols, DB.subTypes[0], setExpressions, argsMap)
    });
    table.calculated.cols.risk = _.orderBy(_.uniqBy(table.calculated.cols.risk, col => col.name), ['order'], ['asc']);
    //console.log(table.calculated.aggregations);
}

function getResultFormat(user) {
    return {
        short: { cols: [], data: [], dataKey: 'stock' },
        long: { cols: [], data: [], dataKey: 'stock' },
        risk: { cols: [], data: [] },
        aggs: [],
        tables: _.chain(DB.tables).filter(t => t.user === user.id).map(t => ({id: t.id, name: t.name})).value(),
    };
}

function calculateTable(table, bankDB, aceDB, user) {
    const result = getResultFormat(user);
    //console.log(table.calculated.aggregations)
    result.aggs = Utils.copy(table.calculated.aggregations);
    _.forEach(DB.types, type => {
        // set presentation columns
        result[type].cols = [...table.calculated.cols[type]];

        // regular cols are ones that their value can be calculted only by ace & bank data
        const isRegularCol = col => _.isEmpty(col.func.aggregations) && _.isEmpty(col.func.arguments.stock);
        const partition = _.partition(table.calculated.cols[type], isRegularCol);
        const regularCols = partition[0];
        const aggregationCols = partition[1];
    
        //set stock values than can be computed from band data or ace
        _.forEach(bankDB[type], bankStock => {
            const res = formatResult(bankStock, aceDB.data);
            _.forEach(regularCols, col => {
                res.stock[col.key] = undefined;
                // these values may seem redundant but the eval func needs them
                const { stock, ace, bank } = res;
                const val = eval(col.func.exp);
                res.stock[col.key] = val;
                
            });
            _.forEach(aggregationCols, col => res.stock[col.key] = undefined);
            result[type].data.push(res);
        });
        _.forEach(result[type].data, d=>d.stock.origin = d.bank.Origin);

        // after all stocks are set with basic data, its time to calculate aggregations
        _.forEach(aggregationCols, col => {
            // calculate the aggregations
            _.forEach(col.func.aggregations, agg => {
                result.aggs[agg.key] = _.reduce(result[type].data, (acc, dat) => {
                    // these values may seem redundant but the eval func needs them
                    // also acc value
                    const { stock, ace, bank } = dat;
                    const val = eval(agg.exp);
                    return Utils.getNumber(val, acc);
                }, 0);
            });
            // now that aggregations values are computed, recalculate stock values that needed them
            _.forEach(result[type].data, dat => {
                const { stock, ace, bank } = dat;
                const val = eval(col.func.exp);
                dat.stock[col.key] = Utils.getNumber(val, Number.NaN);
            });
        });
        //console.log(result[type].data);
    });
    result.risk.cols = table.riskCols;
    _.forEach(table.calculated.cols.risk, col => {
        // after all stocks are set with basic data, its time to calculate aggregations
        // calculate the aggregations
        _.forEach(col.func.aggregations, agg => {
            if(!col.type){
                console.log(col);  
            } 
    
            if ((result.aggs[agg.key] === undefined || result.aggs[col.key] === undefined) && col.type !== DB.subTypes[0]) {
                const stocks = result[col.type].data;
                const aggResult = _.reduce(stocks, (acc, dat) => {
                    // these values may seem redundant but the eval func needs them
                    const { stock, ace, bank } = dat;
                    const val = eval(agg.exp);
                    return Utils.getNumber(val, acc);
                }, 0);
                result.aggs[col.key] = aggResult;
                result.aggs[agg.key] = aggResult;
            }
        });

        // now that aggregations values are computed, recalculate risk values that needed them
        const value = eval(col.func.exp);
        result.risk.data.push({ name: col.name, value });
    });
    return result;
}

function parseExpression(exp, argsMap) {
    return _.reduce(_.keys(argsMap), (acc, key) => Utils.replaceAll(acc, key, argsMap[key]), exp);
}

function formatKey(name){
    return Utils.replaceAll(name.toLowerCase(), ' ', '_');
}

function formatColKey(name){
    return Utils.replaceAll(formatKey(name), DB.replaceToken, '');
}

async function createTable(params) {
        const {data,user} = params;
        data.user = user.id;
        try {
            let isRisk = false;
            const parseCol = col => {
                const calc = _.reduce(col.params, (acc, param, index) => {
                    if (param.source === 'stock') {
                        param.item.id = formatColKey(param.item.id);
                    }
                    acc.arguments[param.source].push(param.item.id)
                    acc.argsMap[`X${index}`] = `{${param.source[0]}:${acc.arguments[param.source].length - 1}}`;
                    return acc;
                }, { arguments: { stock: [], bank: [], ace: [] }, argsMap: {}, aggregations: [] });

                _.forEach(col.aggregations, (agg, index) => {
                    calc.argsMap[`Y${index}`] = `{t:${index}}`;
                    calc.aggregations.push({ key: formatKey(agg.key), exp: `${DB.sum} ${parseExpression(agg.exp, calc.argsMap)}` })
                });
                riskData = isRisk ? {
                    order: col.order,
                    type: col.name.includes(DB.replaceToken) ? DB.replaceToken : DB.subTypes[0]
                } : {};
                
                return {
                    name: col.name,
                    key: formatColKey(col.name),
                    ...riskData,
                    func: {
                        exp: parseExpression(col.exp, calc.argsMap),
                        arguments: calc.arguments,
                        aggregations: calc.aggregations
                    },
                    format: col.format
                };
            };
            data.cols = data.cols.map(parseCol);
            isRisk = !isRisk;
            data.risk = data.risk.map(parseCol);
            console.log(_.map(data.risk, 'type'));
        }
        catch (e) {
            console.error(e);
            throw new TableCouldNotBeParsedError(e.message);
        }
        try {
            if (data.id) {
                const updateIndex = _.findIndex(DB.tables, tab => tab.id === data.id);
                if (updateIndex > -1) {
                    await TablesDL.updateOne(data);
                    const updatedTable = await TablesDL.getOne(data.id);
                    parseTable(updatedTable);
                    DB.tables[updateIndex] = updatedTable;
                    console.log("table updated");
                }
            }
            else {
                const newTable = await TablesDL.createOne(data);
                parseTable(newTable);
                DB.tables.push(newTable);
                console.log("table created");
            }
        }
        catch (e) {
            console.error(e);
            throw new TableCouldNotBeParsedError(e.message);
        }
        
        return true;
}

function getTable(tableId) {
    return _.find(DB.tables, table => tableId === table.id);
}

async function getUserTableOrDefault(user, tableId) {
    let table = getTable(tableId);
    if(!table && getUserTables(user).length === 0) {
        table = await createUserDefault(user);
    }
    return table;
}

async function updateTableExcludes(params) {
    const {exclude} = params;
    const tableId = parseInt(params.tableId);
    const table = getTable(tableId);
    if (table) {
        if (Array.isArray(exclude)) {
            table.excluded = exclude;
        }
        else {
            table.excluded.push(exclude);
        }

        await TablesDL.updateOne({id, excluded} = table);
    }
    return table !== undefined;
}

async function copyTable(tableId) {
    const table = getTable(tableId);
    let res;
    if (table) {
        const dupe = await TablesDL.duplicate(tableId);
        const copy = Utils.copy(table);
        copy.id = dupe.id;
        copy.name = dupe.name;
        parseTable(copy);
        DB.tables.push(copy);
        res = tableToClient(copy);
    }
    else {
        res = `No such table with id ${tableId}`;
    }

    return res;
}

async function removeTable(tableId) {
    const table = getTable(tableId);
    if (table) {
        await TablesDL.deleteOne(table.id);
        _.pull(DB.tables,table);
        return `Removed table with id: ${tableId}`;
    }
    return `No such table with id ${tableId}`;
}

function tableToClient(table) {
    const result = Utils.copy(clientTableFormat);
    if (table) {
        result.name = table.name;
        result.id = table.id;
        const colNameToKey = _.reduce(table.cols, (acc, col) => ({...acc,[col.key]:col.name}),{});
        let isRisk = false;
        const deparseCol = col => {
            const calc = _.reduce(_.keys(col.func.arguments), (acc, source) => {
                _.forEach(col.func.arguments[source], (id, index) => {
                    let paramId = source === 'stock' ? colNameToKey[id] : id;
                    acc.params.push({ source, item: { id:paramId } });
                    acc.argsMap[`{${source[0]}:${index}}`] = `X${acc.index++}`;
                });
                return acc;
            }, { params: [], argsMap: {}, index: 0, aggregations: [] });
            calc.agglen = col.func.aggregations.length;
            _.forEach(col.func.aggregations.reverse(), (agg, index) => {
                const revInd = calc.agglen - 1 - index;
                calc.argsMap[`{t:${revInd}}`] = `Y${revInd}`;
                calc.aggregations.push({ key: Utils.replaceAll(agg.key, '_', ' '), exp: parseExpression(agg.exp, calc.argsMap).replace(DB.sum,'') });
            });
            riskData = isRisk ? {
                order: col.order
            } : {};
            
            return {
                name: col.name,
                ...riskData,
                exp: parseExpression(col.func.exp, calc.argsMap),
                params: calc.params,
                aggregations: calc.aggregations.reverse(),
                format: col.format
            };
        };
        result.cols = table.cols.map(deparseCol);
        isRisk = !isRisk;
        result.risk = table.risk.map(deparseCol);
    }
    return result;
}

async function createUserDefault(user) {
    const newTable = _.assign(Utils.copy(defaultTable),{user:user.id});
    const createdTable = await TablesDL.createOne(newTable);
    parseTable(createdTable);
    console.log(createdTable);
    DB.tables.push(createdTable);
}

function getUserTables(user) {
    return _.filter(DB.tables, table => table.user === user.id);
}

async function init() {
    let allTables = await TablesDL.getAll();
    // if(_.isEmpty(allTables)){
    //     const allUsers = await UsersDL.getAll();
    //     const tables = allUsers.map(user => _.assign(Utils.copy(defaultTable),{user:user.id}))
    //     await TablesDL.createAll(tables);
    //     allTables = await TablesDL.getAll();
    // }
    DB.tables = allTables;
    _.forEach(DB.tables, parseTable);
}

module.exports = {
    init, getTable, calculateTable, formatAceData,
    getResultFormat, createTable, copyTable, removeTable,
    tableToClient, updateTableExcludes, createUserDefault,
    getUserTableOrDefault, getUserTables
};

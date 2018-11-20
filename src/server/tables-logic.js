const config = require('../mocks/config.json');
const _ = require('lodash');
const Ace = require('./ace');
const Utils = require('./utils.js');

const DB = {
    types: ['long','short'],
    subTypes: ['risk'],
    replaceToken: '$$$',
    tables: [{
        id: config.app.defaultTable.id,
        name: config.app.defaultTable.name,
        cols:  [
            {
                name: 'Name',
                key: 'name',
                func:{
                    exp:'{a:0}',
                    arguments: {
                        stock: [],
                        bank: [],
                        ace: ['name']
                    },
                    aggregations: [],
                }
            },
            {
                name: '$$$ Value',
                key: 'value',
                func:{
                    exp:'{a:0}*({b:0}+{b:1})',
                    arguments: {
                        stock:[],
                        bank: [config.bank.fields[3],config.bank.fields[6]],
                        ace: ['last']
                    },
                    aggregations: [],
                },
                format: 2,
            },
            {
                name: '$$$ Value %',
                key: 'valuePer',
                func:{
                    exp:'{s:0}/{t:0}',
                    arguments: {
                        stock:['value'],
                        bank: [],
                        ace: []
                    },
                    aggregations: [{key:'$$$_total_value', exp:'acc + {s:0}'}],
                },
                format: 0
            },
            {
                name: 'Amount',
                key: 'amount',
                func:{
                    exp:'{b:0}+{b:1}',
                    arguments: {
                        stock: [],
                        bank: [config.bank.fields[3], config.bank.fields[6]],
                        ace: []
                    },
                    aggregations: []
                }
            },
            {
                name: 'Syn Diff',
                key: 'syn_diff',
                func:{
                    exp:'{a:0}',
                    arguments: {
                        stock: [],
                        bank: [],
                        ace: ['syn_diff']
                    },
                    aggregations: []
                },
                format: 1
            }],
        risk:[
            {
                name: 'Total $$$',
                key: '$$$_total_value',
                type: '$$$',
                order: 0,
                func:{
                    exp:'{t:0}',
                    arguments: {
                        stock:['value'],
                        bank: [],
                        ace: []
                    },
                    aggregations: [{key:'$$$_total_value', exp:'acc + {s:0}'}]
                }
            },
            {
                name: 'Total $$$ Risk',
                key: '$$$_total_risk',
                type: '$$$',
                order: 1,
                func:{
                    exp:'({t:1} / {t:0}) * {t:2}',
                    arguments: {
                        stock:['valuePer', 'value'],
                        bank: [],
                        ace: ['duration_bruto']
                    },
                    aggregations: [
                        {key:'$$$_total_duration', exp:'acc + {a:0}'},
                        {key:'$$$_total_duration_per', exp:'acc + ({s:0} * {a:0})'},
                        {key:'$$$_total_value', exp:'acc + {s:1}'}],
                }
            },
            {
                name: '$$$ Duration',
                key: '$$$_total_duration',
                type: '$$$',
                order: 2,
                func:{
                    exp:'{t:1} / {t:0}',
                    arguments: {
                        stock:['valuePer'],
                        bank: [],
                        ace: ['duration_bruto']
                    },
                    aggregations: [
                        {key:'$$$_total_duration', exp:'acc + {a:0}'},
                        {key:'$$$_total_duration_per', exp:'acc + ({s:0} * {a:0})'}],
                }
            },
            {
                name: 'Risk',
                key: 'risk',
                type: 'risk',
                order: 3,
                func:{
                    exp:'{t:0} / {t:1}',
                    arguments: {
                        stock: [],
                        bank: [],
                        ace: []
                    },
                    aggregations: [
                        {key:'long_total_risk', exp:''},
                        {key:'short_total_risk', exp:''}],
                }
            }
        ]
    }],
    riskCols:[
        {
            name: 'Name',
            key: 'name',
        },
        {
            name: 'Value',
            key: 'value',
        },
    ],
    calculated:{
        cols:{
            long:[],
            short:[],
            risk:[]
        },
        aceFields: [],
        aggregations: {
        }
    },
    generator:{
        fields: {
            risk:config.bank.fields,
            ace: []
        },
        actions: ['Bigger Than', 'Contains', 'Smaller Than', 'Starts With', 'Ends With'],
        operators: ['None', 'And', 'Or']
    }
};

const argsMap = {
    s: 'stock',
    b: 'bank',
    a: 'ace',
    t: 'result.aggs',
    regEx: /{(.):(\d)}/g
};

function replaceToken(obj, key, args) {
    const val = obj[key];
    if (typeof val === 'string' && val.includes(args.token)) {
        const replace = key === 'name' ? args.name : args.part;
        obj[key] = Utils.replaceAll(val, args.token, replace);
    }
}

function setExpressions(obj, key, argsMap) {
    const val = obj[key];
    if (key === 'exp')  {
        if(obj['arguments']){
            argsMap.args = obj['arguments'];
            argsMap.aggs = obj['aggregations'];
        }

        const regEx = new RegExp(argsMap.regEx);
        const matches = val.match(regEx);
        if(matches !== null) {
            obj[key] = _.reduce(matches, (res, match) => {
                const groups = regEx.exec(matches);
                const source = argsMap[groups[1]];
                const property = argsMap.args[source] ? argsMap.args[source][groups[2]] : argsMap.aggs[groups[2]].key;
                const parsedExp = `${source}.${property}`;
                return Utils.replaceAll(res, match, parsedExp);
            }, val);
        }
    }
}

function formatResult(bank, ace) {
    const id = bank.securityID;
    return {'stock':{id:id}, 'bank':bank, 'ace':ace[id]};
}

function formatAceData(stockId, aceDB, aceData, aceFields) {
    return _.reduce(aceFields, (res, field, index) => {res[field] = Ace.getFieldValue(stockId, aceDB, aceData, index); return res;}, {});
}

function parseTable(table) {
    const token = DB.replaceToken;
    table.riskCols = Utils.copy(DB.riskCols);
    table.calculated = Utils.copy(DB.calculated);
    //Sums (optimize) all ace fields required for the table
    table.calculated.aceFields = _.uniq(_.reduce([...table.cols,...table.risk],(sum,col) => sum.concat(...col.func.arguments.ace),[]));

    _.forEach(DB.types, type => {
        //TODO convert to foreach with risk sub type
        const name = type.charAt(0).toUpperCase() + type.slice(1);
        const data = {name, part: type, token};
        table.calculated.cols[type] = Utils.copy(table.cols);
        table.calculated.cols.risk = table.calculated.cols.risk.concat(Utils.copy(table.risk));

        Utils.treeForEach(table.calculated.cols, type, replaceToken, data);
        Utils.treeForEach(table.calculated.cols, 'risk', replaceToken, data);

        //Sums (optimize) all aggregations value from al cols
        _.forEach(_.uniq(_.reduce(table.calculated.cols[type],(sum, col) => sum.concat(_.map(col.func.aggregations,'key')),[])), key => table.calculated.aggregations[key] = undefined);
        _.forEach(_.uniq(_.reduce(table.calculated.cols.risk,(sum, col) => sum.concat(_.map(col.func.aggregations,'key')),[])), key => table.calculated.aggregations[key] = undefined);

        Utils.treeForEach(table.calculated.cols, type, setExpressions, argsMap);
        Utils.treeForEach(table.calculated.cols, 'risk', setExpressions, argsMap)
    });
    table.calculated.cols.risk = _.orderBy(_.uniqBy(table.calculated.cols.risk, col => col.name),['order'],['asc']);
    //console.log(table.calculated.aggregations);
}

function getResultFormat() {
    return  {
        short:{cols:[], data:[], dataKey:'stock'},
        long:{cols:[], data:[], dataKey:'stock'},
        risk:{cols:[], data:[]},
        aggs:[],
        tables: _.map(DB.tables, table => ({id: table.id, name:table.name})),
        errors: {}
    };
}

function calculateTable(table, bankDB, aceDB) {
    const result = getResultFormat();
    //console.log(table.calculated.aggregations)
    result.aggs = Utils.copy(table.calculated.aggregations);
    result.errors = aceDB.errors;
    _.forEach(DB.types, type => {
        const aggs = [];
        // set presentation columns
        _.forEach(table.calculated.cols[type], col => {
            result[type].cols.push(col);
        });

        //set stock values than can be computed from band data or ace
        _.forEach(bankDB[type], bank => {
            const res = formatResult(bank, aceDB.data);

            _.forEach(table.calculated.cols[type], col => {
               res.stock[col.key] = undefined;
               // if stock needs a value based on aggregation of all stock, saves it for later
               if(col.func.aggregations.length === 0){
                   // these values may seem redundant but the eval func needs them
                   const {stock, ace, bank} = res;
                   const val = eval(col.func.exp);
                   res.stock[col.key] = val;
               }
               else {
                   aggs.push(col);
               }
            });

            //console.log(res.stock);
            result[type].data.push(res);
        });

        // after all stocks are set with basic data, its time to calculate aggregations
        _.forEach(aggs, col => {
            // calculate the aggregations
            _.forEach(col.func.aggregations, agg => {
                result.aggs[agg.key] =_.reduce(result[type].data, (acc, dat) => {
                    // these values may seem redundant but the eval func needs them
                    const {stock, ace, bank} = dat;
                    const val = eval(agg.exp);
                    return Utils.getNumber(val,acc);
                }, 0);
            });
            // now that aggregations values are computed, recalculate stock values that needed them
            _.forEach(result[type].data, dat => {
                    const {stock, ace, bank} = dat;
                    const val = eval(col.func.exp);
                    dat.stock[col.key] = Utils.getNumber(val,Number.NaN);
            });
        });
        //console.log(result[type].data);
    });

    result.risk.cols = table.riskCols;
    _.forEach(table.calculated.cols.risk, col => {
        // after all stocks are set with basic data, its time to calculate aggregations
        // calculate the aggregations
        _.forEach(col.func.aggregations, agg => {
            if((result.aggs[agg.key] === undefined || result.aggs[col.key] === undefined) && col.type !== DB.subTypes[0]) {
                const stocks = result[col.type].data;
                const aggResult =_.reduce(stocks, (acc, dat) => {
                    // these values may seem redundant but the eval func needs them
                    const {stock, ace, bank} = dat;
                    const val = eval(agg.exp);
                    return Utils.getNumber(val,acc);
                }, 0);
                result.aggs[col.key] = aggResult;
                result.aggs[agg.key] = aggResult;
            }
        });

        // now that aggregations values are computed, recalculate stock values that needed them
        const value = eval(col.func.exp);
        result.risk.data.push({name: col.name, value});
    });

    return result;
}


function createTable(data) {
  const formatKey = name => Utils.replaceAll(name.toLowerCase(),' ', '_');
  const parseExpression = (exp,argsMap) => _.reduce(_.keys(argsMap), (acc, key) => Utils.replaceAll(acc, key, argsMap[key]), exp);
  const generatetId = (ids) => {
      let id = Math.floor(Math.random() * 100000).toString();
      while (ids[id]){
          id = Math.floor(Math.random() * 100000).toString();
      }
      return id;
  };
  const newTable = {
      name: data.name,
      id: generatetId(_.map(DB.tables,tab => ({[tab.id]:true,}))),
      cols: _.map(data.cols, col => {
          const calc = _.reduce(col.params,(acc, param, index) => {
              if(param.source === 'stock') {
                  param.item.id = Utils.replaceAll(formatKey(param.item.id),DB.replaceToken,'')
              }
              acc.arguments[param.source].push(param.item.id)
              acc.argsMap[`X${index}`] = `{${param.source[0]}:${acc.arguments[param.source].length - 1}}`;
              return acc;
          },{arguments:{stock: [], bank: [], ace: []},argsMap:{}, aggregations:[]});

          _.forEach(col.aggregations, (agg, index) => {
              calc.argsMap[`Y${index}`] = `{t:${index}}`;
              calc.aggregations.push({ key:formatKey(agg.key), exp: `acc ${parseExpression(agg.exp,calc.argsMap)}`})
          });
          return {
              name: col.name,
              key: Utils.replaceAll(formatKey(col.name),DB.replaceToken,''),
              func:{
                  exp: parseExpression(col.exp,calc.argsMap),
                  arguments: calc.arguments,
                  aggregations: calc.aggregations
              },
              format: col.format
          };}),
      risk: []
  };
  parseTable(newTable);
  console.log();
  DB.tables.push(newTable);
}

function init() {
    _.forEach(DB.tables, parseTable);
}

function GetTable(tableId){
    return _.find(DB.tables, table => tableId === table.id);
}

module.exports = {init, GetTable, calculateTable, formatAceData, getResultFormat, createTable};

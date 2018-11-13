const fetch = require("node-fetch");
const express = require('express');
const _ = require('lodash');
const data = require('../mocks/mock-table.json');
const config = require('../mocks/consts.json');
const mock = _.values(data);
const bodyParser = require('body-parser');
const utils = require('./utils.js');
const StocksDB = {
    errors: {
        ace: false
    },
    riskTable: {
        // durationPerTotal: {
        //     long: 0,
        //     short: 0
        // },
        // durationTotal: {
        //     long: 0,
        //     short: 0
        // },
        total: {
            long: 0,
            short: 0
        },
        totalRisk: {
            long: 0,
            short: Number.NEGATIVE_INFINITY
        },
        maham: {
            long: 0,
            short: 0
        },
        risk: 0,

    },
    riskData:[],
    longs: {
        name:'long',
        data: {}
    },
    shorts: {
        name:'short',
        data: {}
    }
};

const TablesDB = {
    partition: ['long','short'],
    replaceToken: '$$$',
    tables: [{
      name: "Position Report",
      cols:  [
      {
          name: 'Name',
          key: 'name',
          arguments: {
              bank: [],
              ace: ['name']
          },
          aggregations: [],
          expression:'{a:0}',
      },
      {
          name: '$$$ Value',
          key: 'value',
          arguments: {
              stock:[],
              bank: [config.tableGenerator.fields[3],config.tableGenerator.fields[6]],
              ace: ['last']
          },
          aggregations: [],
          expression:'{a:0}*{b:0}*{b:1}',
          format: 2,
      },
      {
          name: '$$$ Value %',
          key: 'valuePer',
          arguments: {
              stock:['value'],
              bank: [],
              ace: []
          },
          aggregations: [{key:'$$$_total_value', exp:'acc + {s:0}'}],
          expression:'{s:0}/{ag:0}',
          format: 0,
      },
      {
          name: 'Amount',
          key: 'amount',
          arguments: {
              stock: [],
              bank: [config.tableGenerator.fields[3], config.tableGenerator.fields[6]],
              ace: []
          },
          aggregations: [],
          expression:'{b:0}*{b:1}'
      },
      {
          name: 'Syn Diff',
          key: 'syn_diff',
          arguments: {
              stock: [],
              bank: [],
              ace: ['syn_diff']
          },
          aggregations: [],
          expression:'{b:0}*{b:1}',
          format: 1
      }],
      risk:[
          {
              name: 'Total $$$',
              key: 'total_$$$',
              arguments: {
                  stock:['value'],
                  bank: [],
                  ace: []
              },
              aggregations: [{key:'$$$_total_value', exp:'acc + {s:0}'}],
              expression:'{ag:0}',
          },
          {
              name: 'Total $$$ Risk',
              key: 'total_$$$_risk',
              arguments: {
                  stock:['valuePer', 'value'],
                  bank: [],
                  ace: ['duration_bruto']
              },
              aggregations: [
                  {key:'$$$_total_duration', exp:'acc + {a:0}'},
                  {key:'$$$_total_duration_per', exp:'acc + ({s:0} * {a:0})'},
                  {key:'$$$_total_value', exp:'acc + {s:1}'}],
              expression:'({ag:0} * {ag:1}) / {ag:2}',
          },
          {
              name: '$$$ Duration',
              key: '$$$_duration',
              arguments: {
                  stock:['valuePer'],
                  bank: [],
                  ace: ['duration_bruto']
              },
              aggregations: [
                  {key:'$$$_total_duration', exp:'acc + {a:0}'},
                  {key:'$$$_total_duration_per', exp:'acc + ({s:0} * {a:0})'}],
              expression:'{ag:0} * {ag:1}',
          },
          {
              name: 'Risk',
              key: 'risk',
              arguments: {
                  stock: [],
                  bank: [],
                  ace: []
              },
              aggregations: [
                  {key:'long_total_value', exp:''},
                  {key:'short_total_value', exp:''}],
              expression:'{ag:0} / {ag:1}'
          }
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
      }
    }],
    generator:{
        fields: {
            risk:config.tableGenerator.fields,
            ace: []
        },
        actions: ['Bigger Than', 'Contains', 'Smaller Than', 'Starts With', 'Ends With'],
        operators: ['None', 'And', 'Or']
    }
};


function replaceToken(obj, key, args) {
    const val = obj[key];
    if (typeof val === 'string' && val.includes(args.token)) {
        const replace = key === 'name' ? args.name : args.part;
        obj[key] = val.replace(args.token, replace);
    }
}

function parseTableColumns(table) {
    const token = TablesDB.replaceToken;
    const parts = TablesDB.partition;

    //Sums (optimize) all ace fields required for the table
    table.calculated.aceFields = _.uniq(_.reduce([...table.cols,...table.risk],(sum,col) => sum.concat(...col.arguments.ace),[]));

    _.forEach(parts, part => {
        const name = part.charAt(0).toUpperCase() + part.slice(1);
        const data = {name, part, token};
        table.calculated.cols[part] = utils.copy(table.cols);
        table.calculated.cols.risk = table.calculated.cols.risk.concat(utils.copy(table.risk));

        utils.treeForEach(table.calculated.cols, part, replaceToken, data);
        utils.treeForEach(table.calculated.cols, 'risk', replaceToken, data);

        //Sums (optimize) all aggregations value from al cols
        _.forEach(_.uniq(_.reduce(table.calculated.cols[part],(sum,col) => sum.concat(_.map(col.aggregations,'key')),[])), key => table.calculated.aggregations[key] = undefined);
        _.forEach(_.uniq(_.reduce(table.calculated.cols.risk,(sum,col) => sum.concat(_.map(col.aggregations,'key')),[])), key => table.calculated.aggregations[key] = undefined);
    });
}
parseTableColumns(TablesDB.tables[0]);
console.log(TablesDB.tables[0].calculated);

function getSums(stocks,fields) {
    const res = {};
    _.forEach(fields, f => res[f] = 0);
    _.forEach(stocks,stock=>{
        for (let i = 0; i < fields.length; i++) {
            let val = stock[fields[i]];
            if(!Number.isNaN(val)){
                res[fields[i]] += val;
            }
        }
    })

    return res;
}
const sumFields = ['value', 'duration_bruto'];
function calcPercentages(toUpdate) {
    _.forEach(toUpdate,stocksData => {
        const sums = getSums(stocksData.data,sumFields);
        const totalValue = sums[sumFields[0]];
        const durationTotal = sums[sumFields[1]];
        StocksDB.riskTable.total[stocksData.name] = totalValue;
        //StocksDB.riskTable.durationTotal[stocksData.name] = durationTotal
        let durPerTotal = 0;
        _.forEach(stocksData.data, stock =>{
            stock.valuePer = stock.value / totalValue;
            durPerTotal += stock.valuePer * stock.duration_bruto;
        });
        //StocksDB.riskTable.durationPerTotal[stocksData.name] = durPerTotal;
        StocksDB.riskTable.maham[stocksData.name] = durPerTotal / durationTotal;
        StocksDB.riskTable.totalRisk[stocksData.name] = (durPerTotal / durationTotal) * totalValue;
        StocksDB.riskTable.risk = StocksDB.riskTable.totalRisk.long / StocksDB.riskTable.totalRisk.short;
        setRiskData();
    });
}

function updateStock(stock, fromStocks, toStocks = undefined) {
    let toUpdate = [];
    if(fromStocks.data[stock.id]) {
        delete fromStocks.data[stock.id];
        toUpdate.push(fromStocks);
    }
    if(toStocks){
        toStocks.data[stock.id] = stock;
        toUpdate.push(toStocks);
    }
    calcPercentages(toUpdate);
}

function updateStocksData(stockData) {
    if(stockData.amount === 0) {
        updateStock(stockData,StocksDB.shorts);
        updateStock(stockData, StocksDB.longs);
    }
    else if(stockData.amount > 0) {
        updateStock(stockData,StocksDB.shorts, StocksDB.longs);
    }
    else {
        updateStock(stockData, StocksDB.longs, StocksDB.shorts);
    }
}

function makeStockData(stock, aceData) {
    StocksDB.errors.ace = false;
    //console.log("stock data", {stock:stock,data:data});
    const amount = stock.StartDayQty + stock.FillQty;
    const value = amount * aceData.GetManyFieldsResult.Values[1];

    let stockData = {
        id: stock.securityID,
        name: aceData.GetManyFieldsResult.Values[0],
        value: value,
        valuePer: 0,
        amount: amount,
        duration_bruto: Number(aceData.GetManyFieldsResult.Values[3]),
        syn_diff: aceData.GetManyFieldsResult.Values[2]
    };

    updateStocksData(stockData);
    //console.log("final stock data", {stockData:stockData})
}

function setRiskData() {
    StocksDB.riskData = [
        {name:config.riskTable.total.short,     value: StocksDB.riskTable.total.short},
        {name:config.riskTable.total.long,      value: StocksDB.riskTable.total.long},
        {name:config.riskTable.totalRisk.short, value: StocksDB.riskTable.totalRisk.short},
        {name:config.riskTable.totalRisk.long,  value: StocksDB.riskTable.totalRisk.long},
        {name:config.riskTable.maham.short,     value: StocksDB.riskTable.maham.short},
        {name:config.riskTable.maham.long,      value: StocksDB.riskTable.maham.long},
        {name:config.riskTable.risk,            value: StocksDB.riskTable.risk},
    ];
}
const fields = ['name','last','syn_diff','duration_bruto'].toString();

function setStock(bankData){
    const id = Number(bankData.securityID);
    console.log(id);
    fetch(config.ace.queries.stockFields.replace(config.ace.idToken, id) + fields)
        .then(res=> res.json())
        .then(aceData => makeStockData(bankData, aceData))
        .catch(e => StocksDB.errors.ace = true);
}

// Generate mock data
setInterval(function () {
  const rand = Math.floor(Math.random() * mock.length);
  const stock = mock[rand];
  setStock(stock);
}, 1000);

const app = express();
app.use(express.static('dist'));
app.use(bodyParser.json())

const port = config.app.port;
//app.listen(port, () => console.log('Listening on port ' + port));

app.post('/gili', (req, res) => {
        const stock = req.body;
        setStock(stock);
    }
);

app.get('/api/getTableFields', (req, res) => {
    // console.log(StocksDB);
    return res.send(StocksDB);
});

app.get('/api/getData', (req, res) => {
    // console.log(StocksDB);
    return res.send(StocksDB);
});

app.get('/api/getConfig', (req, res) => {
    return res.send(config);
});


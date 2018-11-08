const fetch = require("node-fetch");
const express = require('express');
const _ = require('lodash');
const app = express();
const data = require('../mocks/mock-table.json');
const config = require('../mocks/consts.json');
const mock = _.values(data);
const bodyParser = require('body-parser');
const StocksDB = {
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
function calcPrecentages(toUpdate) {
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
    calcPrecentages(toUpdate);
}

function updateStocksData(stockData) {
    if(stockData.amount == 0) {
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

function makeStockData(stock, data) {
    //console.log("stock data", {stock:stock,data:data});
    const amount = stock.StartDayQty + stock.FillQty;
    const value = amount * data.GetManyFieldsResult.Values[1];

    let stockData = {
        id: stock.securityID,
        name: data.GetManyFieldsResult.Values[0],
        value: value,
        valuePer: 0,
        amount: amount,
        duration_bruto: Number(data.GetManyFieldsResult.Values[3]),
        syn_diff: data.GetManyFieldsResult.Values[2]
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

app.use(express.static('dist'));
app.use(bodyParser.json())

app.get('/api/getData', (req, res) => {
   // console.log(StocksDB);
    return res.send(StocksDB);
});

app.get('/api/getCols', (req, res) => {
  return res.send(config);
});

app.post('/gili', (req, res) => {
    const stock = req.body;
    const id = Number(stock.securityID);
    console.log(id);
    fetch(config.ace.stockData.replace(config.ace.token, id))
        .then(res=> res.json())
            .then(data => makeStockData(stock, data));
  }
);

const port = config.deborah.port;
app.listen(port, () => console.log('Listening on port ' + port));

setInterval(function () {
  const rand = Math.floor(Math.random() * mock.length);
  const stock = mock[rand];
    const id = Number(stock.securityID);
    fetch(config.ace.stockData.replace(config.ace.token, id))
        .then(res=> res.json())
            .then(data => makeStockData(stock, data));
}, 1000);

const fetch = require("node-fetch");
const express = require('express');
const _ = require('lodash');
const data = require('../mocks/mock-table.json');
const config = require('../mocks/consts.json');
const mock = _.values(data);
const bodyParser = require('body-parser');
const Bank = require('./bank-logic');
const Tables = require('./tables-logic');
const Logic = require('./data-logic');
Tables.init();

// Generate mock data
setInterval(function () {
  const rand = Math.floor(Math.random() * mock.length);
  const stock = mock[rand];
  Bank.updateStocksData(stock);
}, 200);

const app = express();
app.use(express.static('dist'));
app.use(bodyParser.json())

const port = config.app.port;
app.listen(port, () => console.log('Listening on port ' + port));

app.post('/gili', (req, res) => {
        const stock = req.body;
        Bank.updateStocksData(stock);
    }
);

app.get('/api/g', (req, res) => {
    Logic.getTable(0).then(result => res.send(result));
});

app.get('/api/getData', (req, res) => {
    // console.log(StocksDB);
    return res.send(StocksDB);
});

app.get('/api/getConfig', (req, res) => {
    return res.send(config);
});


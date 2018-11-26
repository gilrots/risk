const fetch = require("node-fetch");
const express = require('express');
const _ = require('lodash');
const data = require('../mocks/mock-table.json');
const config = require('../mocks/config.json');
const mock = _.values(data);
const bodyParser = require('body-parser');
const Bank = require('./bank-logic');
const Tables = require('./tables-logic');
const Logic = require('./data-logic');
const lala = require('../DB/Login');

Tables.init();
const port = config.server.port;

// Generate mock data
setInterval(function () {
  const rand = Math.floor(Math.random() * mock.length);
  const stock = mock[rand];
  Bank.updateStocksData(stock);
}, 200);

const app = express();
app.use(express.static('dist'));
app.use(bodyParser.json())

app.listen(port, () => console.log(`Server is up on port: ${port}`));

app.post(config.server.api.bankPost, (req, res) => Bank.updateStocksData(req.body));

app.get(config.server.api.getData, (req, res) => {
    const tableId = req.query.tableId;
    Logic.getTable(tableId).then(result => res.send(result));
});

app.get(config.server.api.getTableMakerData, (req, res) => {
    Logic.getTableMakerData().then(result => res.send(result));
});

app.get(config.server.api.getConfig, (req, res) => {
    return res.send(config);
});

app.post(config.server.api.getApp, (req,res) => {
    console.log("Im here");
    const user = req.body.UserName;
    const password = req.body.password;
    console
        .log(lala.Connectdb(user,password));
    return res.send();
});


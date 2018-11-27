const fetch = require("node-fetch");
const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const Bank = require('./modules/bank-logic');
const Tables = require('./modules/tables-logic');
const Logic = require('./modules/data-logic');
const Utils = require('../common/utils');
const Login = require('./db/login');

const config = require('../common/config.json');
const mockData = _.values(require('../mocks/mock-table.json'));

const api = config.server.api;
const mock = config.server.mock;
const port = config.server.port;
Tables.init();
// Generate mock data
if(mock.allow) {
    setInterval(() => Bank.updateStocksData(_.sample(mockData)), mock.interval);
}

const app = express();
app.use(express.static('dist'));
app.use(bodyParser.json())

app.listen(port, () => console.log(`Server is up on port: ${port}`));

//Posts
app.post(api.bankPost, (req, res) => Bank.updateStocksData(req.body));

app.post(api.createTable, (req, res) => Tables.createTable(req.body));

app.post(api.setExcludeList, (req, res) => {
    const {tableId,exclude} = req.body;
    res.send(JSON.stringify(Tables.updateTableExcludes(tableId, exclude)));
});

app.post(config.server.api.login, (req,res) => {
    console.log("Im here");
    const {user, password} = req.body;
    console.log(Login.Connectdb(user,password));
    return res.send();
});

//Gets
app.get(api.getData, (req, res) => Logic.getTable(req.query.tableId).then(result => res.send(result)));

app.get(api.getExcludeList, (req, res) => Logic.getTableExcludeList(req.query.tableId).then(result => res.send(result)));

app.get(api.getTableMakerData, (req, res) => Logic.getTableMakerData().then(result => res.send(result)));

app.get(api.tableAction.url, (req, res) => Logic.tableAction(req.query).then(result => res.send(result)));

app.get(api.getConfig, (req, res) => res.send(config));


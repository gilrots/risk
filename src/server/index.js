const path = require("path");
const fetch = require("node-fetch");
const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const Bank = require('./modules/bank-logic');
const Tables = require('./modules/tables-logic');
const Ace = require('./modules/ace');
const Logic = require('./modules/bussines-logic');
const DB = require('./modules/database');
const Auth = require('./modules/auth');
const Utils = require('../common/utils');

const config = require('../common/config.json');
const mockData = _.values(require('../mocks/mock-table.json'));
const api = config.server.api;
const mock = config.server.mock;
const port = config.server.port;

DB.connect();
Tables.init();
// Generate mock data
if (mock.allow) {
    setInterval(() => Bank.updateStocksData(_.sample(mockData)), mock.interval);
}

const app = express();
app.use(express.static('dist'));
app.use(bodyParser.json())

app.listen(port, () => console.log(`Server is up on port: ${port}`));

//Posts
app.post(api.bankPost, (req, res) => Bank.updateStocksData(req.body));

app.post(api.login, (req, res) => {
    Auth.login(req.body).then(token => res.json(token)).catch(e => res.json(e.message));
});

app.post(api.register, (req, res) => {
    DB.registerUser(req.body, res).then();
});

const {getPath} = Utils;

// Secured routes
const securedRouter = express.Router();
securedRouter.use(Auth.auth);
app.use('/api/secured', securedRouter);

securedRouter.post(getPath(api.createTable), (req, res) => Tables.createTable(req.body));

securedRouter.post(getPath(api.setExcludeList), (req, res) => {
    const {tableId, exclude} = req.body;
    res.send(JSON.stringify(Tables.updateTableExcludes(tableId, exclude)));
});

//Gets
securedRouter.get(getPath(api.getData), (req, res) => Logic.getTable(req.query.tableId).then(result => res.send(result)));

securedRouter.get(getPath(api.getExcludeList), (req, res) => Logic.getTableExcludeList(req.query.tableId).then(result => res.send(result)));

securedRouter.get(getPath(api.getTableMakerData), (req, res) => Logic.getTableMakerData().then(result => res.send(result)));

securedRouter.get(getPath(api.tableAction.url), (req, res) => Logic.tableAction(req.query).then(result => res.send(result)));

securedRouter.get(getPath(api.searchAce), (req, res) => Ace.search(req.query).then(result => res.json(result)));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'), function(err) {
        if (err) {
            res.status(500).send(err)
        }
    })
})

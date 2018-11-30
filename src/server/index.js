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
Utils.setMixins();

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

app.post(api.login, (req, res) => Auth.login(req.body).then(token => res.json(token)).catch(e => res.json(e.message)));

app.post(api.register, (req, res) => DB.registerUser(req.body, res).then());

const {getPath} = Utils;
const answer = (req,res,promise) => promise(req.body).then(result => res.json(result));
const answer2 = (req,res,promise) => promise(req.query).then(result => res.json(result));

// Secured routes
const secured = express.Router();
secured.use(Auth.auth);
app.use('/api/secured', secured);

//Secured posts
secured.post(getPath(api.createTable), (req, res) => Tables.createTable(req.body));

secured.post(getPath(api.setExcludeList), (req, res) => answer(req,res,Tables.updateTableExcludes));

secured.post(getPath(api.setIntras), (req, res) => answer(req,res,DB.setIntras));

secured.post(getPath(api.setIPOs), (req, res) => answer(req,res,DB.setIPOs));

secured.post(getPath(api.updateIPOFav), (req, res) => answer(req,res,DB.updateIPOFavorite));

//Secured gets
secured.get(getPath(api.getData), (req, res) => answer2(req,res,Logic.getTable));

secured.get(getPath(api.getExcludeList), (req, res) => answer2(req,res,Logic.getTableExcludeList));

secured.get(getPath(api.getTableMakerData), (req, res) => answer(req,res,Logic.getTableMakerData));

secured.get(getPath(api.tableAction.url), (req, res) => answer2(req,res,Logic.tableAction));

secured.get(getPath(api.searchAce), (req, res) => answer2(req,res,Ace.search));

secured.get(getPath(api.searchAceFields), (req, res) => answer2(req,res,Logic.searchAceFields));

secured.get(getPath(api.getIntras), (req, res) => answer2(req,res,DB.getIntras));

secured.get(getPath(api.getIPOs), (req, res) => answer2(req,res,DB.getIPOs));

secured.get(getPath(api.getIPOFavs), (req, res) => answer2(req,res,DB.getIPOFavorites));

//Redirect
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'), err => {
        if (err) {
            res.status(500).send(err);
        }
    })
})

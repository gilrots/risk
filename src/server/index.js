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

//Unsecurd Posts
app.post(api.bankPost, (req, res) => Bank.updateStocksData(req.body));

app.post(api.login, (req, res) => Auth.login(req.body).then(token => res.json(token)).catch(e => res.json(e.message)));

app.post(api.register, (req, res) => DB.registerUser(req.body, res).then());


const {getPath} = Utils;
const chainUser = (params,user) => _.assign(params,{user});
const answer = (req,res,promise,prop) => promise(chainUser(req[prop],req.user)).then(result => res.json(result));

// Secured routes
const secured = express.Router();
secured.use(Auth.auth);
app.use('/api/secured', secured);

const securedApi = {
    post: {
        [api.createTable]:Tables.createTable,
        [api.setExcludeList]:Tables.updateTableExcludes,
        [api.setUserAccounts]:DB.setUserAccounts,
        [api.setIntras]:DB.setIntras,
        [api.setIPOs]:DB.setIPOs,
        [api.updateIPOFav]:DB.updateIPOFavorite
    },
    get: {
        [api.getData]:Logic.getTable,
        [api.getExcludeList]:Logic.getTableExcludeList,
        [api.getUserAccounts]:DB.setUserAccounts,
        [api.getIntras]:DB.getIntras,
        [api.getIPOs]:DB.getIPOs,
        [api.getIPOFavs]:DB.getIPOFavorites,
        [api.tableAction.url]:Logic.tableAction,
        [api.searchAce]:Ace.search,
        [api.searchAceFields]:Logic.searchAceFields,
        [api.getTableMakerData]:Logic.getTableMakerData
    }
}
const methodParamsMap = {
    post: "body",
    get: "query"
};
_.forEach(_.keys(securedApi), key => _.forEach(_.toPairs(securedApi[key]), apiUrl => secured[key](getPath(apiUrl[0]), (req, res) => answer(req,res,apiUrl[1],methodParamsMap[key]))));
//_.forEach(_.toPairs(securedApi.post), apiPost => secured.post(getPath(apiPost[0]), (req, res) => answer(req,res,apiPost[1],"body")));
//_.forEach(_.toPairs(securedApi.get), apiGet => secured.get(getPath(apiGet[0]), (req, res) => answer(req,res,apiGet[1],"query")));


//Redirect
app.get('/*', (req, res) => 
    res.sendFile(path.join(__dirname, 'dist/index.html'), err => {
        if (err) {
            res.status(500).send(err);
        }
    })
);
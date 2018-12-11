const Utils = require('../common/utils'); //Important to keep utils first in order to init itself before other use
const path = require("path");
const express = require('express');
const _ = require('lodash');
const DB = require('./modules/database');
const Tables = require('./modules/tables-logic');
const bodyParser = require('body-parser');
const Bank = require('./modules/bank-logic');
const Ace = require('./modules/ace');
const Logic = require('./modules/bussines-logic');
const Auth = require('./modules/auth');
const {ServerError} = require('./modules/errors');

const config = require('../common/config.json');
const mockData = _.values(require('../mocks/mock-table.json'));
const api = config.server.api;
const mock = config.server.mock;
const port = config.server.port;

const modules = [Tables.init];
DB.connect(modules).then(() => runServer());

function runServer() {

const app = express();
app.use(express.static('dist'));
app.use(bodyParser.json())
const secured = express.Router();
secured.use(Auth.auth);
app.use('/api/secured', secured);

const methodParamsMap = {
    post: "body",
    get: "query"
};

const chainUser = (params,user) => _.isEmpty(user) ? params : _.assign(params,{user});
const handleError = (error,res) => {
    console.error(error);
    let status = 400;
    if(error instanceof ServerError){
        status = 500;
    }

    res.status(status).json({error:error.message});
}

const answer = async (req,res,promise,prop) => {
    try {
        const params = chainUser(req[prop],req.user);
        const result = await promise(params)
        res.json(result);
    }
    catch (e) {
        handleError(e,res);
    }
};

const routes = [
    {
        router: app,
        path: path => path,
        api: {
            post: {
                [api.bankPost]: Bank.updateStocksData,
                [api.login]:    Auth.login,
                [api.register]: DB.register,
            }
        }
    },
    {
        router: secured,
        path: path => Utils.getPath(path),
        api: {
            post: {
                [api.createTable]:      Tables.createTable,
                [api.setExcludeList]:   Tables.updateTableExcludes,
                [api.setUserAccounts]:  DB.setUserAccounts,
                [api.setIntras]:        DB.setIntras,
                [api.setIPOs]:          DB.setIPOs,
                [api.updateIPOFav]:     DB.updateIPOFavorite,
            },
            get: {
                [api.getData]:          Logic.getTable,
                [api.getExcludeList]:   Logic.getTableExcludeList,
                [api.searchAceFields]:  Logic.searchAceFields,
                [api.getTableMakerData]:Logic.getTableMakerData,
                [api.tableAction.url]:  Logic.tableAction,
                [api.getUserAccounts]:  DB.getUserAccounts,
                [api.getIntras]:        DB.getIntras,
                [api.getIPOs]:          DB.getIPOs,
                [api.getIPOFavs]:       DB.getIPOFavorites,
                [api.searchAce]:        Ace.search,
            }
        }
    }
]
_.forEach(routes, r => _.forKeys(r.api, key => _.forKeys(r.api[key], api => r.router[key](r.path(api), (req, res) => answer(req,res,r.api[key][api],methodParamsMap[key])))));


app.listen(port, () => console.log(`Server is up on port: ${port}`));

// Generate mock data
if (mock.allow) {
    setInterval(() => Utils.postJsonBackend(`http://localhost:${port}${api.bankPost}`,_.sample(mockData)), mock.interval);
}

//Redirect
app.get('/*', (req, res) => 
    res.sendFile(path.join(__dirname, 'dist/index.html'), err => {
        if (err) {
            res.status(500).send(err);
        }
    })
);

};
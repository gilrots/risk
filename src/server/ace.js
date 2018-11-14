const config = require('../mocks/consts.json');
const Utils = require('./utils.js');
const Ace = require('./ace');
const _ = require('lodash');

const idToken = config.ace.idToken;
const errorField = config.ace.error;

const DB = {
    errors:{
        ace: false,
        data: [],
        fieldsMissing: {}
    },
    data: {
    }
}

function getAceDB() {
    return Utils.copy(DB);
}

function getFieldsQuery(fields) {
    return config.ace.queries.stockFields + fields.toString();
}

function getFieldValue(stockId, aceDB, queryResult, index) {
    const val = queryResult.GetManyFieldsResult.Values[index];
    if(val === errorField) {
        aceDB.errors.fieldsMissing[stockId] = true;
    }
    return val;
}

function setQueryId(id,query) {
    return query.replace(idToken, Number(id))
}

module.exports = { getAceDB, getFieldsQuery, setQueryId, getFieldValue };

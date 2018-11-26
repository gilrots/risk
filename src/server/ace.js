const config = require('../mocks/config.json');
const fetch = require("node-fetch");
const Utils = require('../common/utils.js');
const _ = require('lodash');

const idToken = config.ace.idToken;
const errorField = config.ace.error;

const DB = {
    allFields: []
}

const tempDB = {
    errors:{
        ace: false,
        data: [],
        fieldsMissing: {}
    },
    data: {
    }
}

function getAceDB() {
    return Utils.copy(tempDB);
}

function appendParams(query , params) {
    return query + params.toString();
}

function getFieldQuery(field) {
    return appendParams(config.ace.queries.stockField, field);
}

function getFieldsQuery(fieldsArr) {
    return appendParams(config.ace.queries.stockFields, fieldsArr);
}

function getFieldsDataQuery(fieldsArr) {
    return appendParams(config.ace.queries.aceFieldsData, fieldsArr);
}

function getFieldValue(stockId, aceDB, queryResult, index) {
    let val = queryResult.GetManyFieldsResult.Values[index];
    if(val === errorField) {
        aceDB.errors.fieldsMissing[stockId] = true;
    }
    const num = Number(val);
    return Number.isNaN(num) ? val : num;
}

function setQueryId(id,query) {
    return query.replace(idToken, Number(id))
}

function getAllSystemFields() {
    return new Promise((resolve, reject) => {
        if (DB.allFields.length === 0) {
            Utils.tryAtleast(resolve, reject, 0, config.ace.tries, [],
                (innerResolve) => {
                    fetch(config.ace.queries.aceFields).then(res => res.json()).then(fieldsResult => {
                        if (fieldsResult === undefined || fieldsResult.GetAllFieldsResult === undefined || fieldsResult.GetAllFieldsResult === errorField) {
                            innerResolve(undefined);//throw 'ace returned no fields!'
                        }
                        else {
                            const urls = Utils.divideUrl(fieldsResult.GetAllFieldsResult, 1000, ',');
                            const promises = _.map(urls, urlParams => fetch(getFieldsDataQuery(urlParams)).then(res => res.json()));
                            Promise.all(promises).then(res => {
                                const allFieldsData = _.reduce(res, (acc,curr) => acc.concat(curr.GetMultiFieldInfoResult),[]);
                                DB.allFields = _.uniqBy(_.map(allFieldsData, fd => ({id: fd['Symbol'], name: fd['Name']})), 'id');
                                innerResolve(DB.allFields);
                            })
                        }
                    });
                });
        }
        else {
            resolve(DB.allFields);
        }
    });
}

function aceResponseValid(response, field) {
    return (response === undefined || response[field] === undefined || response[field] === errorField) ? errorField : response[field];
}

function getFieldName(fieldId) {
    if(DB.allFields.length === 0) {
        return fieldId;
    }
    const aceField = _.find(DB.allFields, field => field.id === fieldId);
    return aceField ? aceField.name : fieldId;
}

function getStocksNames(stockIds) {
    const aceQuery = getFieldQuery(config.ace.nameField);
    const queryResult = 'GetDataResult';
    const promises = stockIds.map(stockId =>
        new Promise((resolve, reject) => {
            Utils.tryAtleast(resolve, reject, 0, config.ace.tries, undefined,
                innerResolve =>
                    Utils.fetchJson(setQueryId(stockId, aceQuery)).then(response => {
                        const result = aceResponseValid(response, queryResult);
                        innerResolve(result !== errorField ? {id:stockId, name: result} : undefined);
                    }));
        })
    );

    return Promise.all(promises);
}

module.exports = { getAceDB, getFieldsQuery, setQueryId, getFieldValue, getAllSystemFields, getFieldName, getStocksNames };

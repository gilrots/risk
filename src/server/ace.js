const config = require('../mocks/config.json');
const fetch = require("node-fetch");
const Utils = require('./utils.js');
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

function getAllSystemFields2() {
    return new Promise((resolve, reject) => {
        if (DB.allFields.length === 0) {
            fetch(config.ace.queries.aceFields)
                .then(fieldsResult => {
                    console.log("fff", {query: config.ace.queries.aceFields, fieldsResult});
                    if (fieldsResult === undefined || fieldsResult.GetAllFieldsResult === errorField){
                        reject([]);//throw 'ace returned no fields!'
                    }
                    else {
                        fetch(getFieldsDataQuery(fieldsResult))
                            .then(fieldsData => {
                                DB.allFields = _.map(fieldsData, fd => ({id:fd['Symbol'], name:fd['Name']}));
                                resolve( DB.allFields);
                        })
                    }
                })
        }
        else {
            resolve(DB.allFields);
        }
    });
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

module.exports = { getAceDB, getFieldsQuery, setQueryId, getFieldValue, getAllSystemFields };

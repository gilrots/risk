const config = require('../../common/config.json');
const Utils = require('../../common/utils.js');
const _ = require('lodash');

const idToken = config.ace.idToken;
const errorField = config.ace.error;

const DB = {
    allFields: []
}

const tempDB = {
    missing: {},
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
        aceDB.missing[stockId] = true;
    }
    
    return Utils.getNumber(val, val);
}

function setQueryId(id,query) {
    return query.replace(idToken, Number(id))
}

function getAllSystemFields() {
    const queryResult = 'GetAllFieldsResult';
    return new Promise(resolve => {
        if (DB.allFields.length === 0) {
            Utils.tryAtleast(resolve, Utils.tryCounter(config.ace.tries, []),
                innerResolve => {
                    Utils.getJson(config.ace.queries.aceFields).then(fieldsResponse => {
                        const responseValue = aceResponseValid(fieldsResponse, queryResult);
                        if (responseValue === errorField) {
                            innerResolve(undefined);
                        }
                        else {
                            const urls = Utils.divideUrl(responseValue, 1000, ',');
                            const promises = _.map(urls, urlParams => Utils.getJson(getFieldsDataQuery(urlParams)));
                            Promise.all(promises).then(res => {
                                const allFieldsData = _.reduce(res, (acc,curr) => acc.concat(curr.GetMultiFieldInfoResult),[]);
                                DB.allFields = _.uniqBy(_.map(allFieldsData, fd => ({id: fd['Symbol'], name: fd['Name']})), 'id');
                                innerResolve(DB.allFields);
                            })
                        }
                    }).catch(e => {
                        //TODO make this catch redundant
                        console.error("Error at getAllSystemFields", e);
                        innerResolve(undefined);
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
        new Promise(resolve =>
            Utils.tryAtleast(resolve, Utils.tryCounter(config.ace.tries),
                innerResolve =>
                    Utils.getJson(setQueryId(stockId, aceQuery)).then(response => {
                        const result = aceResponseValid(response, queryResult);
                        innerResolve(result !== errorField ? {id: stockId, name: result} : undefined);
                    })))
    );

    return Promise.all(promises);
}

function search(params){
    const {search} = params;
    const query = encodeURI(config.ace.queries.searchStocks.replace(idToken, search));
    const queryResult = 'GetClusterValuesResult';
    return new Promise((resolve) => {
        Utils.getJson(query).then(res => {
            const result = aceResponseValid(res, queryResult);
            const items = [];
            if (result !== errorField && _.isEmpty(result["Error"])){
                const rows = result["Cells"];
                for (let i = 2; i < rows.length; i+=3) {
                    items.push({name:rows[i+1]["Value"], id:rows[i+2]["Value"]})
                }
            }

            resolve({items});
        });
    })
}

module.exports = { getAceDB, getFieldsQuery, setQueryId, getFieldValue, getAllSystemFields, getFieldName, getStocksNames, search };

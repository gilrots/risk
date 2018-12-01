const _ = require('lodash');
const fetch = require("node-fetch");
const User = require('../client/helpers/user');

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function treeForEach(obj, key, func, args) {
    const val = obj[key];
    if (val === null || val === undefined) {
        return;
    }
    else if (Array.isArray(val)) {
        _.forEach(val, (element, index) => treeForEach(val, index, func, args));
    }
    else if (typeof val === 'object') {
        _.forEach(_.keys(val), entry => {
            treeForEach(val, entry, func, args);
        });
    }
    else {
        func(obj, key, args);
    }
}


function performance(func, name) {
    const t0 = new Date().getTime();
    func();
    const t1 = new Date().getTime();
    console.log(`Call to ${name} took ${t1 - t0} milliseconds`);
}

function getNumber(val, fallback) {
    const num = Number(val);
    return Number.isNaN(num) ? fallback : num;
}

function tryCounter(maxTries, fallback = undefined) {
    const counter = {tries:0,maxTries,fallback};
    counter.next = () => counter.tries++;
    counter.done = () => counter.tries > counter.maxTries;
    counter.almost = () => counter.tries === counter.maxTries;
    return counter;
}

function setMixins() {
    const limit = function(collection, predicate, limit = 1) {
        return _.transform(collection, function(result, value) {
          predicate(value) && result.push(value);
          return result.length < limit;
        });
      };

    _.mixin({limit});
}

function tryAtleast(resolve, counter, promiseFunc) {
    new Promise(promiseFunc).then(result => {
        if (result !== undefined) {
            resolve(result);
        }
        else if (counter.done()) {
            resolve(counter.fallback);
        }
        else {
            counter.next();
            tryAtleast(resolve, counter, promiseFunc);
        }
    }).catch(e => {
        console.error("Error at tryAtleast", e);
        resolve(counter.fallback);
    });
}

function divideUrl(urlParams, maxCharsPerSegment, separator) {
    const res = [];
    res.push([]);
    let index = 0;
    let currLength = 0;
    const sepLeng = separator.length;
    _.forEach(urlParams, param => {
        if ((currLength + param.length) <= maxCharsPerSegment) {
            currLength += (param.length + sepLeng);
            res[index].push(param);
        }
        else {
            index++;
            res.push([]);
            res[index].push(param);
            currLength = param.length + sepLeng;
        }
    });
    return res;
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, search, replace) {
    return str.replace(new RegExp(escapeRegExp(search), 'gi'), replace);
}

function setUrl(link, params) {
    const url = link + "?";///new URL(link);
    const keys = Object.keys(params);
    return _.reduce(keys, (acc, key, index) => acc.concat(`${key}=${params[key]}${index === (keys.length - 1) ? '' : '&'}`), url);
}

function buildAuthHeader() {
    // return authorization header with jwt token
    let token = User.get();

    return token ? {'Authorization': 'Bearer ' + token} : {};
}

function getPath(fullPath) {
    return `/${_.last(fullPath.split('/'))}`;
}


function fetchJsonBackend(url, params) {
    let link = params ? setUrl(url, params) : url;
    return fetch(link).then(res => res.json());
}

function fetchJson(api, params, handler) {
    const headers = {...buildAuthHeader()};
    const url = params ? setUrl(api, params) : api;
    return fetch(url, {headers}).then(res => handleResponse(res, handler));
}

function postJson(url, object, handler) {
    const authHeader = buildAuthHeader();

    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(object),
        headers: {
            'Content-Type': 'application/json',
            ...authHeader,
        }
    }).then(res => handleResponse(res, handler));
}

function handleResponse(response, handler){
    if(response.status === 401){
        User.remove();
        history.push('/');
        return JSON.stringify(null);
    }
    else if(response.status === 200 && response.headers.get("token")){
        User.set(response.headers.get("token"));
    }
    if(handler) {
        handler(response);
    }
    return response.json();
}

function jsonError(message) {
    return {error: message};
}

function jsonResult(boolean) {
    return {operation: boolean};
}
const dateOptions = { day: '2-digit', month: '2-digit',hour: '2-digit',minute: '2-digit', };
function formatDate(date) {
    return new Date(Date.parse(date.toString())).toLocaleDateString();;
}

function moveTo(parent, fromArr, toArr, item, deletedIndex) {
    const to = [...parent[toArr], item];
    const from = [...parent[fromArr]];
    from.splice(deletedIndex, 1);
    return {[toArr]: to, [fromArr]: from};
}

module.exports = {
    copy, treeForEach, performance, getNumber,
    tryAtleast, tryCounter, divideUrl, replaceAll,
    setUrl, fetchJson, postJson, jsonError, moveTo, jsonResult,
    fetchJsonBackend, getPath, formatDate, setMixins
};



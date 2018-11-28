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

async function doUntilSuccess(promise) {
    let response;
    do {
        try {
            response = await promise;
        }
        catch (e) {
            console.log(e);
        }
    } while (!response);

    return response;
}

function tryAtleast(resolve, reject, tries, maxTries, fallback, promiseFunc) {
    new Promise(promiseFunc).then(result => {
        if (result !== undefined) {
            resolve(result);
        }
        else if (tries > maxTries) {
            resolve(fallback);
        }
        else {
            tryAtleast(resolve, reject, ++tries, maxTries, fallback, promiseFunc);
        }
    }).catch(e => {
        //reject(e);
        console.log(e);
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

function fetchJson(url, params) {
    const headers = {...buildAuthHeader()};
    let link = params ? setUrl(url, params) : url;
    return fetch(link, {headers}).then(res => res.json());
}

function fetchJsonBackend(url, params) {
    let link = params ? setUrl(url, params) : url;
    return fetch(link).then(res => res.json());
}

function buildAuthHeader() {
    // return authorization header with jwt token
    let token = User.get();

    return token ? {'Authorization': 'Bearer ' + token} : {};
}

function getPath(fullPath) {
    return `/${_.last(fullPath.split('/'))}`;
}

function postJson(url, object, asJson = true) {
    const authHeader = buildAuthHeader();

    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(object),
        headers: {
            'Content-Type': 'application/json',
            ...authHeader,
        }
    }).then(res => asJson ? res.json() : res);
}

function jsonError(message) {
    return {error: message};
}

function jsonResult(boolean) {
    return {operation: boolean};
}

function moveTo(parent, fromArr, toArr, item, deletedIndex) {
    const to = [...parent[toArr], item];
    const from = [...parent[fromArr]];
    from.splice(deletedIndex, 1);
    return {[toArr]: to, [fromArr]: from};
}

function handleResponse(response, notFoundCallback) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                notFoundCallback();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return;
    });
}

module.exports = {
    copy, treeForEach, performance, doUntilSuccess, getNumber,
    tryAtleast, divideUrl, replaceAll, setUrl, fetchJson, postJson, jsonError, moveTo, jsonResult
    , handleResponse, fetchJsonBackend, getPath
};



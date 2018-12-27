const _ = require('lodash');
const fetch = require("node-fetch");

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
    const num = typeof val === 'number' ? val : Number(val);
    return Number.isNaN(num) ? fallback : num;
}

function tryCounter(maxTries, fallback = undefined) {
    const counter = {tries:0,maxTries,fallback};
    counter.next = () => counter.tries++;
    counter.done = () => counter.tries > counter.maxTries;
    counter.almost = () => counter.tries === counter.maxTries;
    return counter;
}

async function runProdceduresSync(tasks) {
    await tasks.reduce((chain, task) => 
        chain.then(() => task().then())
        , Promise.resolve([]));
}

function setMixins() {
    const limit = function(collection, predicate, limit = 1) {
        return _.transform(collection, function(result, value) {
          predicate(value) && result.push(value);
          return result.length < limit;
        });
      };
    const keyMap = function(collection, getter) {
        return _.reduce(collection, function(result, curr) {
          result[curr] = getter(curr);
          return result;
        },{});
      };
    const forKeys = function(collection, iteratee) {
        return _.forEach(_.keys(collection),(key, index, collection) => iteratee(key,index,collection));
      };

    _.mixin({limit, keyMap, forKeys});
}

setMixins();

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

function getPath(fullPath) {
    return `/${_.last(fullPath.split('/'))}`;
}

function getJson(api, params, headers, handler) {
    const url = params ? setUrl(api, params) : api;
    return utilsFetch(url, headers ? {headers} : undefined, handler);
}

function toItem(item, idField='id', nameField='name') {
    return {id:item[idField],name:item[nameField]};
}

function toItems(array, idField='id', nameField='name') {
    return _.map(array, item => toItem(item,idField,nameField));
}

function postJson(url, object, headers = {}, handler) {
    return utilsFetch(url, {
        method: 'POST',
        body: JSON.stringify(object),
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        }
    }, handler);
}

function utilsFetch(url, object, handler) {
    return fetch(url, object).then(res => {
      if(handler){
          handler(res);
      } 
      return res.json();
    });
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

function wait(interval, predicate, callback) {
    setTimeout(() => {
        if (predicate()) {
            callback();
        }
        else {
            wait(interval, predicate, callback);
        }
    }, interval);
}

module.exports = {
    copy, treeForEach, performance, getNumber,
    tryAtleast, tryCounter, divideUrl, replaceAll,
    setUrl, getJson, postJson, moveTo,
    getPath, formatDate, wait, toItem, toItems,
    runProdceduresSync
};



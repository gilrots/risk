const _ = require('lodash');

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function treeForEach(obj, key, func, args) {
    const val = obj[key];
    if(val === null || val === undefined) {
        return;
    }
    else if(Array.isArray(val)){
        _.forEach(val, (element, index) => treeForEach(val,index,func, args));
    }
    else if(typeof val === 'object'){
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
    const t1 =  new Date().getTime();
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
        catch (e){
            console.log(e);
        }
    } while (!response);

    return response;
}

function tryAtleast(resolve, reject, tries, maxTries, fallback, promiseFunc) {
    new Promise(promiseFunc).then(result => {
        if(result !== undefined) {
            resolve(result);
        }
        else if(tries > maxTries) {
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
        if((currLength + param.length) <= maxCharsPerSegment) {
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

function replaceAll(str,search,replace) {
    const res= str.replace(new RegExp(escapeRegExp(search), 'gi'), replace);
    console.log('replace', {str,search,replace, res});
    return res;
}

module.exports = {copy, treeForEach, performance, doUntilSuccess, getNumber, tryAtleast, divideUrl,replaceAll};



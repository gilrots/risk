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

module.exports = {copy, treeForEach, performance, doUntilSuccess};



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

module.exports = {copy, treeForEach};



const _ = require('lodash');
const {toItems, getNumber,replaceAll} = require('../../common/utils.js');
const FuncsDL = require('../db/funcs');
const {FilterCouldNotBeParsedError} = require('./errors');
const {funcTypes, funcArgsTypes} = FuncsDL;
const Predicate = require('../../common/models/predicate');
const {errorField} = require('./ace');
const p = '@';//param
const v = '#';//value
const e = '~';//epsilon
const defaultOp = {name: 'None', type:funcTypes.operator, func:''};
const defaultFuncs = [
    defaultOp,
    {name: 'And', type:funcTypes.operator, func:'&&'},
    {name: 'Or', type:funcTypes.operator, func:'||'},

    {name: '=', type:funcTypes.action, func:`Math.apx(${p},${v},${e})`, for:funcArgsTypes.number},
    {name: '>', type:funcTypes.action, func:`${p} > ${v}`, for:funcArgsTypes.number},
    {name: '>=', type:funcTypes.action, func:`Math.gte(${p},${v},${e})`, for:funcArgsTypes.number},
    {name: '<', type:funcTypes.action, func:`${p} < ${v}`, for:funcArgsTypes.number},
    {name: '<=', type:funcTypes.action, func:`Math.lte(${p},${v},${e})`, for:funcArgsTypes.number},
    {name: 'Empty', type:funcTypes.action, func:`Math.empty(${p})`},
    {name: 'Contains', type:funcTypes.action, func:`${p}.toString().includes(${v})`, for:funcArgsTypes.string},
    {name: 'Starts With', type:funcTypes.action, func:`${p}.toString().startsWith(${v})`, for:funcArgsTypes.string},
    {name: 'Ends With', type:funcTypes.action, func:`${p}.toString().endsWith(${v})`, for:funcArgsTypes.string},
];

const DB = {
    operators: [],
    actions: [],
    defaultOperator: undefined,
    funcsMap:{}
}

async function sync() {
    DB.actions = await FuncsDL.getAllActions();
    DB.operators = await FuncsDL.getAllOperators();
}

function setMathFuncs() {
    Math.apx = function apx(v1, v2, epsilon) {
        return Math.abs(v1 - v2) < epsilon;
    };
    Math.gte = function gte(v1, v2,epsilon) {
        return Math.apx(v1,v2,epsilon) || v1 > v2;
    };
    Math.lte = function lte(v1, v2,epsilon) {
        return Math.apx(v1,v2,epsilon) || v1 < v2;
    };
    Math.empty = function empty(value) {
        return _.isNaN(value) || _.isNil(value) || value === "" || value === errorField;
    };
}

async function init() {
    setMathFuncs();
    await sync();
    if(_.isEmpty(DB.operators) || _.isEmpty(DB.actions)) {
        await FuncsDL.createAll(defaultFuncs);
        await sync();
    }
    DB.defaultOperator = DB.operators.find(op => op.name === defaultOp.name);
    DB.funcsMap = _.reduce([...DB.actions,...DB.operators],(acc,curr) => ({...acc,[curr.id]:curr}),{});
}

function getDefaultFilter() {
    return {isActive:false, predicates:[]};
}

function changeValue(value, type) {
    switch (type){
        case funcArgsTypes.number:
            return getNumber(value,Number.NaN);
        case funcArgsTypes.string:
            if(value === undefined || value === null){
                throw new FilterCouldNotBeParsedError("value must be textual!");
            }
            return `"${value}"`;
        case funcArgsTypes.date:
            return Date.parse(value);
    }
}

function replaceFuncTokens(action, param, value) {
    let func =  action.func.replace(p,param).replace(v,value);
    if(action.func.includes(e)){
        let epsilon = 1;
        if (value < 1) {
          epsilon = Math.pow(10,-1*(value.toString().split(".")[1].length));
        }
        func = func.replace(e,epsilon);
    }
    return func
}

function validateFilter(preds){
    const none = DB.defaultOperator.id;
    let error = undefined
    if(_.sumBy(preds,'right') !== _.sumBy(preds,'left')){
        error = "Left and right parenthesis number should be equal!";
    }
    else if(_.last(preds).operator !== none ||
            _.some(_.dropRight(preds), pred => pred.operator === none) ){
        error = "All operators except last one, should have a value!";
    }

    if(error) {
        throw new FilterCouldNotBeParsedError(error);
    }

    return true;
}

function parseFilter(filter) {
    const arg = 'functionTokenThatIsReallySpecial';
    const fm = DB.funcsMap;
    let predicate = () => true;
    const {predicates} = filter;
    if(!_.isEmpty(predicates) && validateFilter(predicates)) {
        const func = _.reduce(predicates, (acc,curr) => {
            const pred = Predicate.create(curr,val => changeValue(val,fm[curr.action].for));
            return acc + pred.expression(arg,(id, all) => all ? fm[id] : fm[id].func,replaceFuncTokens);
        },'');
        console.log(func); 
        predicate = new Function(arg,`return ${func}`);
    }

    return {active:filter.isActive, predicate};
}

function getFilterMetadata() {
    return {
        actions: toItems(DB.actions),
        operators: toItems(DB.operators),
        defaultOperator: DB.defaultOperator.id
    };
}

module.exports = {
    parseFilter,
    getFilterMetadata,
    getDefaultFilter,
    init,
};

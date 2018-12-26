const _ = require('lodash');
const {toItem,toItems} = require('../../common/utils.js');
const FuncsDL = require('../db/funcs');
const {funcTypes} = FuncsDL;
const p = '@';//param
const v = '#';//value
const defaultOp = {name: 'None', type:funcTypes.operator, func:''};
const defaultFuncs = [
    defaultOp,
    {name: 'And', type:funcTypes.operator, func:' && '},
    {name: 'Or', type:funcTypes.operator, func:' || '},

    {name: '=', type:funcTypes.action, func:`${p} === ${v}`},
    {name: '>', type:funcTypes.action, func:`${p} > ${v}`},
    {name: '>=', type:funcTypes.action, func:`${p} >= ${v}`},
    {name: '<', type:funcTypes.action, func:`${p} < ${v}`},
    {name: '<=', type:funcTypes.action, func:`${p} <= ${v}`},
    {name: 'Contains', type:funcTypes.action, func:`${p}.toString().includes(${v}.toString())`},
    {name: 'Starts With', type:funcTypes.action, func:`${p}.toString().startsWith(${v}.toString())`},
    {name: 'Ends With', type:funcTypes.action, func:`${p}.toString().endsWith(${v}.toString())`},
];

const DB = {
    operators: [],
    actions: [],
    defaultOperator: undefined
}

async function init() {
    DB.actions = await FuncsDL.getAllActions();
    DB.operators = await FuncsDL.getAllOperators();
    if(_.isEmpty(DB.operators) || _.isEmpty(DB.actions)) {
        await FuncsDL.createAll(defaultFuncs);
        DB.actions = await FuncsDL.getAllActions();
        DB.operators = await FuncsDL.getAllOperators();
    }
    DB.defaultOperator = await FuncsDL.getOneByName(defaultOp.name);
}

function getDefaultFilter() {
    return {isActive:false, predicates:[]};
}

function parseFilter(filter) {
    let predicate = new Function()

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

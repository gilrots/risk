const _ = require('lodash');
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
    defaultOperator: defaultOp
}

async function init() {
    DB.actions = await FuncsDL.getAllActions();
    DB.operators = await FuncsDL.getAllOperators();
    if(_.isEmpty(DB.actions) || _.isEmpty(DB.actions)) {
        await FuncsDL.createAll(defaultFuncs);
        DB.actions = await FuncsDL.getAllActions();
        DB.operators = await FuncsDL.getAllOperators();
    }
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
        actions: _.map(DB.actions, 'name'),
        operators: _.map(DB.operators, 'name'),
        defaultOperator: DB.defaultOperator.name
    };
}

module.exports = {
    parseFilter,
    getFilterMetadata,
    getDefaultFilter,
    init,
};

import _ from 'lodash';
import React, { Fragment } from 'react';
import { UncontrolledButtonDropdown,DropdownToggle, DropdownMenu, DropdownItem} from 'reactstrap';
const bankToColor = require('../../../common/config').bank.colors;
const bankToName = require('../../../common/config').bank.banks;

const err = '---';
function formatNumber(value, func){
    const num = Number(value);
    return Number.isNaN(num) ? err : func(num);
}
export const percentFormatter = value => formatNumber(value, num => (num * 100).toFixed((num * 100) < 1 ? 2 : 0) + '%');
export const percentFormatter100 = value => formatNumber(value, num => (num * 100).toFixed(2) + '%');
export const commasFormatter = value => formatNumber(value, num => Math.floor(num).toLocaleString('us'));
export const fix1Formatter = value => formatNumber(value, num => num.toFixed(1));
export const fix2Formatter = value => formatNumber(value, num => num.toFixed(2));
export const badgesFormatter =  value => _.map(_.keys(value), val => val &&
<UncontrolledButtonDropdown  key={val}>
      <DropdownToggle caret  color={bankToColor[val]}>
        {_.upperFirst(val)[0]}
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{bankToName[val]}</DropdownItem>
        <DropdownItem divider/>{
            _.map(value[val], v => <DropdownItem key={v}>{v}</DropdownItem>)
        }
      </DropdownMenu>
    </UncontrolledButtonDropdown>
);
export const listFormatter = value => formatNumber(value, num => num.toFixed(2));

export function getFormatter(func) {
    return props => func(props.value);
}

export const FormattersMap = [
    {
        name: '0.0%',
        func: percentFormatter
    },{
        name: '0.00%',
        func: percentFormatter100
    },{
        name: '1,000,000',
        func: commasFormatter
    },{
        name: '0.0',
        func: fix1Formatter
    },{
        name: '0.00',
        func: fix2Formatter
    },{
        name: 'Badges',
        func: badgesFormatter
    },{
        name: 'List',
        func: listFormatter
    }
];
_.forEach(FormattersMap, (f,i) => f.id = i);
export const FormattersFuncs = _.map(FormattersMap,'func');
export const Formatters = _.map(FormattersFuncs,getFormatter);
export const FormattersMenu = _.map(FormattersMap,x=> ({id:x.id, name:x.name}));



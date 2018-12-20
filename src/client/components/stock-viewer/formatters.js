const React = require('react');
const err = '---';
function formatNumber(value, func){
    const num = Number(value);
    return Number.isNaN(num) ? err : func(num);
}

export const percentFormatter = value => formatNumber(value, num => (num * 100).toFixed((num * 100) < 1 ? 2 : 0) + '%');
export const percentFormatter100 = value => formatNumber(value, num => (num * 100).toFixed(2) + '%');
export const commasFormatter = value => formatNumber(value, num => Math.floor(num).toLocaleString('us'));

class PercentFormatter extends React.Component {
    render() {
        return percentFormatter(this.props.value);
    }
}

class PercentFormatter100 extends React.Component {
    render() {
        return percentFormatter100(this.props.value);
    }
}

class CommasFormatter extends React.Component {
    render() {
        return commasFormatter(this.props.value);
    }
}

export const FormattersMap = [
    {
        id: 0,
        name: '0.0%',
        class: PercentFormatter,
        func: percentFormatter
    },{
        id: 1,
        name: '0.00%',
        class: PercentFormatter100,
        func: percentFormatter100
    },{
        id: 2,
        name: '1,000,000',
        class: CommasFormatter,
        func: commasFormatter
    }];

export const Formatters = _.map(FormattersMap,'class');
export const FormattersFuncs = _.map(FormattersMap,'func');
export const FormattersMenu = _.map(FormattersMap,x=> ({id:x.id, name:x.name}));



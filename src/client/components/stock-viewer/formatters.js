const React = require('react');

function percentFormatter(value){
    const per = Number(value) * 100;
    const percentComplete = per.toFixed(per < 1 ? 2 : 0) + '%';
    return percentComplete;
}

class PercentFormatter extends React.Component {
    render() {
        return percentFormatter(this.props.value);
    }
}

function percentFormatter100(value){
    const val = Number(value);
    const percentComplete = !Number.isNaN(val) ? ((val * 100).toFixed(2) + '%') : '---';
    return percentComplete;
}

class PercentFormatter100 extends React.Component {
    render() {
        return percentFormatter100(this.props.value);
    }
}

function commasFormatter(value){
    return Math.floor(Number(value)).toLocaleString('us');
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



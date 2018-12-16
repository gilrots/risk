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

export const Formatters = [PercentFormatter, PercentFormatter100, CommasFormatter];
export const FormattersFuncs = [percentFormatter, percentFormatter100, commasFormatter];



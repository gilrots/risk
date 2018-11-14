import PropTypes from 'prop-types';
const React = require('react');

class PercentFormatter extends React.Component {
    render() {
        const per = Number(this.props.value) * 100;
        const percentComplete = per.toFixed(per < 1 ? 2 : 0) + '%';
        return percentComplete;
    }
}

class PercentFormatter100 extends React.Component {
    render() {
        const val = Number(this.props.value);
        const percentComplete = !Number.isNaN(val) ? ((val * 100).toFixed(2) + '%') : '---';
        return percentComplete;
    }
}

class CommasFormatter extends React.Component {

    render() {
        const commas = Math.floor( Number(this.props.value)).toLocaleString('us');
        return commas;
    }
}

export const Formatters = [PercentFormatter, PercentFormatter100, CommasFormatter];



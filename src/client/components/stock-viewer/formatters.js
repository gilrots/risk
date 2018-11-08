import PropTypes from 'prop-types';
const React = require('react');

class PercentFormatter extends React.Component {
    static propTypes = {
        value: PropTypes.number.isRequired
    };

    render() {
        const per = this.props.value * 100;
        const percentComplete = per.toFixed(per < 1 ? 2 : 0) + '%';
        return percentComplete;
    }
}

class PercentFormatter100 extends React.Component {
    static propTypes = {
        value: PropTypes.any.isRequired
    };

    render() {
        const val = Number(this.props.value);
        const percentComplete = !Number.isNaN(val) ? ((val * 100).toFixed(2) + '%') : '---';
        return percentComplete;
    }
}

class CommasFormatter extends React.Component {
    static propTypes = {
        value: PropTypes.number.isRequired
    };

    render() {
        const commas = Math.floor(this.props.value).toLocaleString('us');
        return commas;
    }
}

export const Formatters = [PercentFormatter, PercentFormatter100, CommasFormatter];



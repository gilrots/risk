import React from 'react';
import PropTypes from "prop-types";
import Loader from "react-loader-spinner";

class RiskLoader extends React.Component {
    static propTypes = {
        loading: PropTypes.bool.isRequired,
    };

    render() {
        const {loading, children} = this.props;
        return loading ? <Loader type="Puff" color="#00BFFF" height="100" width="100"/> : children;
    }
}

export default RiskLoader;

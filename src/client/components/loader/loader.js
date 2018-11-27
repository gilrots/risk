import React from 'react';
import PropTypes from "prop-types";
import Loader from "react-loader-spinner";

class RiskLoader extends React.Component {
    static propTypes = {
        loading: PropTypes.bool.isRequired,
    };

    render() {
        return this.props.loading ?
            <div className="h-100 d-flex align-items-center justify-content-center">
                <Loader  type="Triangle" color="#00BFFF" height="100" width="100"/>
            </div> :
            this.props.children;
    }
}

export default RiskLoader;

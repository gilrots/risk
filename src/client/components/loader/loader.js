import React from 'react';
import PropTypes from "prop-types";
import Loader from "react-loader-spinner";

class RiskLoader extends React.Component {
    static propTypes = {
        loading: PropTypes.bool.isRequired,
        type: PropTypes.string,
        size: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.state = {
            type: props.type ? props.type : "Triangle",
            size: props.size ? props.size : "100",
        }
    }

    render() {
        const {type, size} = this.state;
        return this.props.loading ?
            <div className="h-100 d-flex align-items-center justify-content-center">
                <Loader  type={type} color="#00BFFF" height={size} width={size}/>
            </div> :
            this.props.children;
    }
}

export default RiskLoader;

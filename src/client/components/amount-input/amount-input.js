import React from 'react';
import PropTypes from "prop-types";
import {Input} from "reactstrap";
const commas = require('../../components/stock-viewer/formatters').commasFormatter;

class AmountInput extends React.Component {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        value: PropTypes.oneOfType([PropTypes.string,PropTypes.number]).isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {editMode:false, amount:Number(props.value)};
    }

    toggleEdit = () => {
        const {editMode, amount} = this.state;
        if(editMode) {
            const {onChange} = this.props;
            if(onChange){
                onChange(amount);
                
            }
        }
        this.setState({editMode:!editMode});
    }

    render() {
        const {editMode, amount} = this.state;
        const classes = `${editMode ? 'text-primary' : 'text-secondary pop-item'} ml-2 fas fa-edit`;
        return <span className="pop-box">
            {editMode ?
                <Input type="number" value={amount} onChange={e => this.setState({amount:e.target.value})}/> :
                commas(amount)}
            <i className={classes} onClick={this.toggleEdit}></i>
        </span>
    }
}

export default AmountInput;
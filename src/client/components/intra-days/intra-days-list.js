import React from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import {Container, Row, Col, Button} from "reactstrap";
import PropTypes from "prop-types";
import RiskLoader from "../loader/loader";
import RemoteSearchDropdown from "../search-dropdown/remote-search-dropdown";
const config = require('../../../common/config');
const api = config.server.api;
const debTime = config.app.searchDebounce;

class IntraDaysList extends React.Component {
    static propTypes = {
        tableId: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);

    }

    componentDidMount() {

    }

    include = (stock, index) => {
        this.setState(pervState => Utils.moveTo(pervState,'excluded','included', stock, index));
    }

    exclude = (stock, index) => {
        this.setState(pervState => Utils.moveTo(pervState,'included','excluded', stock, index));
    }

    updateExcludeTable = () => {
        const {tableId} = this.props;
        const exclude = _.map(this.state.excluded,'id');
        Utils.postJson(api.setExcludeList, {tableId, exclude}).then(response => {
            console.log(response);
        });
    }

    render() {
        return (
            <RiskLoader loading={false}>
                <Container>
                    <RemoteSearchDropdown query={api.searchAce} debounceTime={debTime} searchParam="search"/>
                </Container>
                <Button color="primary" onClick={this.updateExcludeTable}>Apply</Button>
            </RiskLoader>
        );
    }
}

export default IntraDaysList;

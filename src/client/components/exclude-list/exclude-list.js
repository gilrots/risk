import React from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import {Container, Row, Col, Button} from "reactstrap";
import PropTypes from "prop-types";
import RiskLoader from "../loader/loader";
import {StockList} from "./stock-list";
const api = require('../../../common/config').server.api;

class ExcludeList extends React.Component {
    static propTypes = {
        tableId: PropTypes.number.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {excluded:[], included:[], error: undefined};
        this.exclude = this.exclude.bind(this);
        this.include = this.include.bind(this);
        this.updateExcludeTable = this.updateExcludeTable.bind(this);
    }

    componentDidMount() {
        const {tableId} = this.props;
        Utils.fetchJson(api.getExcludeList, {tableId}).then(response => {
            console.log(response);
            this.setState(response)
        });
    }

    include(stock, index) {
        this.setState(pervState => Utils.moveTo(pervState,'excluded','included', stock, index));
    }

    exclude(stock, index) {
        this.setState(pervState => Utils.moveTo(pervState,'included','excluded', stock, index));
    }

    updateExcludeTable() {
        const {tableId} = this.props;
        const exclude = _.map(this.state.excluded,'id');
        Utils.postJson(api.setExcludeList, {tableId, exclude}).then(response => {
            console.log(response);
        });
    }

    render() {
        const {excluded, included} = this.state;
        return (
            <RiskLoader loading={included.length === 0}>
                <Container>
                    <Row>
                        <Col>
                            <StockList title="Included" stocks={included} color="danger"
                                       icon="fa fa-times" func={this.exclude}/>
                        </Col>
                        <Col>
                            <StockList title="Excluded" stocks={excluded} color="success"
                                       icon="fa fa-check" func={this.include}/>
                        </Col>
                    </Row>
                </Container>
                <Button color="primary" onClick={this.updateExcludeTable}>Apply</Button>
            </RiskLoader>
        );
    }
}

export default ExcludeList;

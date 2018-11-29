import React, { Fragment } from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import { Container, Row, Col, Button, Input, Table, Badge } from "reactstrap";
import RiskLoader from "../loader/loader";
import RemoteSearchDropdown from "../search-dropdown/remote-search-dropdown";

const config = require('../../../common/config');
const api = config.server.api;
const debTime = config.app.searchDebounce;

class IPOList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { ipos: [], selectedIndex: undefined, newIpo: '' };
    }

    componentDidMount() {
        this.getIpos();
    }

    getIpos = () => {
        Utils.fetchJson(api.getIPOs).then(ipos => {
            this.setState({ ipos });
        })
    }

    updateIPOs = () => {
        const { ipos } = this.state;
        Utils.postJson(api.setIPOs, { ipos }).then(response => {
            if (response === true) {
                this.getIpos();
            }
        });
    };

    addIPO = () => {
        this.setState(ps => ({
            ipos: [...ps.ipos, {
                name: ps.newIpo,
                data: [{ field: undefined, value: undefined }],
            }],
            selectedIndex: ps.ipos.length,
        }));
    };

    deleteIPO = index => {
        this.setState(ps => {
            const ipos = [...ps.ipos];
            ipos.splice(index, 1);
            return { ipos };
        });
    };

    updateIPOData = (fieldIndex, field, value) => {
        const { ipos, selectedIndex } = this.state;
        const data = ipos[selectedIndex].data.map((dataRow, i) => i === fieldIndex ? Object.assign({}, dataRow, { [field]: value }) : dataRow);
        this.setState(ps => ({
            ipos: ps.ipos.map((ipo, i) => i === selectedIndex ? Object.assign({}, ipo, { data }) : ipo)
        }));
    };

    addIPODataField = () => {
        const { selectedIndex } = this.state;
        this.setState(ps => ({
            ipos: ps.ipos.map((ipo, i) => i === selectedIndex ? Object.assign({}, ipo, { data: [...ipo.data, { field: undefined, value: undefined }] }) : ipo)
        }));
    };

    deleteIPODataField = (rowIndex) => {
        const { ipos, selectedIndex } = this.state;
        if(ipos[selectedIndex].data.length > 1) {
            const selectedIpoData = [...ipos[selectedIndex].data];
            selectedIpoData.data.splice(rowIndex, 1);
            this.setState(ps => ({
                ipos: ps.ipos.map((ipo, i) => i === selectedIndex ? Object.assign({}, ipo, { data: selectedIpoData }) : ipo)
            }));
        }
    };


    render() {
        const { ipos, newIpo, selectedIndex } = this.state;
        const selectedIpo = ipos[selectedIndex];
        const addDisabled = _.isEmpty(newIpo) || _.some(ipos, ipo => ipo.name === newIpo);
        return (<Container>
            <RiskLoader loading={!ipos}>
                {ipos &&
                    <Container>
                        <Row>
                            <Col>
                            <h6>IPO List</h6>{' '}

                            <div className="d-flex justify-content-center align-items-start p-3 h-100 w-100">
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Date</th>
                                            <th></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ipos.map((ipo, index) =>
                                            <tr className={`pop-box ${selectedIndex === index ? 'active' : ''}`} key={ipo.stockId} 
                                                onClick={(e) => {e.preventDefault(); this.setState({selectedIndex:index});}}>
                                                <th scope="row">{index + 1}</th>
                                                <td>{ipo.name}</td>
                                                <td>{ipo.createdAt ? Utils.formatDate(ipo.createdAt) : <Badge color='success'>NEW</Badge>}</td>
                                                <td align="center" style={{verticalAlign: "center"}}>
                                                    <Badge className="pop-item" color="danger"
                                                        onClick={(e) => {e.preventDefault(); this.deleteIPO(index);}}>
                                                        <i className="fa fa-times" />
                                                    </Badge>
                                                </td>
                                            </tr>)}
                                        <tr>
                                            <td colSpan="4"><Input type="text" value={newIpo}
                                                onChange={e => this.setState({ newIpo: e.target.value })} /></td>
                                            <td align="center">
                                                <Button color="success" onClick={() => this.addIPO()} disabled={addDisabled}>Add</Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                                </div>
                            </Col>
                            <Col>
                                <h6>{`Selected IPO Data${selectedIpo ? ': ' + selectedIpo.name : ' '}`}</h6>
                                <div className="d-flex justify-content-center align-items-start border border-primary rounded p-3 h-100 w-100">
                                    {selectedIpo ? <Table responsive striped>
                                        <thead>
                                            <tr>
                                                <th>Field</th>
                                                <th>Value</th>
                                                <th></th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedIpo.data.map((dataField, index) =>
                                                <tr className="pop-box" key={index.toString()}>
                                                    <td>
                                                        <RemoteSearchDropdown query={api.searchAceFields} debounceTime={debTime}
                                                            searchParam="search"
                                                            selected={dataField.field}
                                                            onSelected={item => this.updateIPOData(index, 'field', item)} />
                                                    </td>
                                                    <td>
                                                        <Input type="text" value={dataField.value}
                                                            onChange={e => this.updateIPOData(index, 'value', e.target.value)} />
                                                    </td>
                                                    <td align="center" style={{verticalAlign: "center"}}>
                                                        <Badge className="pop-item" color="danger"
                                                            onClick={() => this.deleteIPODataField(index)}>
                                                            <i className="fa fa-times"/>
                                                        </Badge>
                                                    </td>
                                                    <td align="center" style={{verticalAlign: "center"}}>
                                                        <Badge className="pop-item" color="secondary"
                                                            onClick={() => this.pinDataField(dataField.field)}>
                                                            <i className="fa fa-thumbtack"/>
                                                        </Badge>
                                                    </td>
                                                </tr>)}
                                            <tr>
                                                <td colSpan="3" align="right">
                                                    <Button outline className="rounded-circle" color="success" onClick={() => this.addIPODataField()}><i className="fa fa-plus"/></Button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table> : "Select IPO to view or edit fields"}
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Button color="primary" onClick={this.updateIPOs}>Update IPOs</Button>
                            </Col>
                        </Row>
                    </Container>}
            </RiskLoader>
        </Container>
        );
    }
}

export default IPOList;

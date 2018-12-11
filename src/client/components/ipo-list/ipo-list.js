import React, { Fragment } from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import { Container, Row, Col, Button, Input, Table, Badge } from "reactstrap";
import RiskLoader from "../loader/loader";
import RemoteSearchDropdown from "../search-dropdown/remote-search-dropdown";
import {get,post} from "../../helpers/client-utils"
const config = require('../../../common/config');
const api = config.server.api;
const debTime = config.app.searchDebounce;

class IPOList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { ipos: [], favs:[], selectedIndex: undefined, newIpo: '', newAmount:0 };
    }

    componentDidMount() {
        this.getIpos();
        this.getIPOFavs();
    }

    getIpos = () => {
        get(api.getIPOs).then(ipos => {
            this.setState({ ipos });
        })
    }

    getIPOFavs = () => {
        get(api.getIPOFavs).then(favs => {
            this.setState({ favs });
        })
    }

    updateIPOs = () => {
        const { ipos } = this.state;
        post(api.setIPOs, { ipos }).then(response => {
            if (response === true) {
                this.getIpos();
            }
        });
    };

    setFav = favorite => {
        post(api.updateIPOFav, { favorite }).then(response => {
            if (response === true) {
                this.getIPOFavs();
            }
        });
    };

    addIPO = () => {
        this.setState(ps => ({
            ipos: [...ps.ipos, {
                name: ps.newIpo,
                amount: ps.newAmount,
                data: ps.favs.length > 0 ? Utils.copy(ps.favs).map(fav => ({field:fav, value:fav.id === config.ace.nameField ? ps.newIpo : ''})) : [{ field: undefined, value: '' }],
            }],
            newIpo: '',
            newAmount: 0,
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
            selectedIpoData.splice(rowIndex, 1);
            this.setState(ps => ({
                ipos: ps.ipos.map((ipo, i) => i === selectedIndex ? Object.assign({}, ipo, { data: selectedIpoData }) : ipo)
            }));
        }
    };


    render() {
        const { ipos, newIpo, newAmount, selectedIndex, favs } = this.state;
        const selectedIpo = ipos[selectedIndex];
        const addDisabled = _.isEmpty(newIpo) || newAmount === 0 || _.some(ipos, ipo => ipo.name === newIpo);
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
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ipos.map((ipo, index) =>
                                            <tr className={`pop-box ${selectedIndex === index ? 'active' : ''}`} key={ipo.name} 
                                                onClick={(e) => {e.preventDefault(); this.setState({selectedIndex:index});}}>
                                                <th scope="row">{index + 1}</th>
                                                <td>{ipo.name}</td>
                                                <td>{Math.floor(ipo.amount).toLocaleString('us')}</td>
                                                <td>{ipo.createdAt ? Utils.formatDate(ipo.createdAt) : <Badge color='success'>NEW</Badge>}</td>
                                                <td align="center" style={{verticalAlign: "center"}}>
                                                    <Badge className="pop-item" color="danger"
                                                        onClick={(e) => {e.stopPropagation(); this.deleteIPO(index);}}>
                                                        <i className="fa fa-times" />
                                                    </Badge>
                                                </td>
                                            </tr>)}
                                        <tr>
                                            <td colSpan="2"><Input type="text" value={newIpo} placeholder="Name..."
                                                onChange={e => this.setState({ newIpo: e.target.value })} /></td>
                                            <td colSpan="2"><Input type="number" value={newAmount} placeholder="Amount..."
                                                onChange={e => this.setState({ newAmount: e.target.value })} /></td>
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
                                              <tr className="pop-box" key={index}>
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
                                                        <Badge color={dataField.field && _.some(favs,f => f.id === dataField.field.id) ? "primary" : "secondary"}
                                                            onClick={() => this.setFav(dataField.field)}>
                                                            <i className="fa fa-thumbtack"/>
                                                        </Badge>
                                                    </td>
                                                    <td align="center" style={{verticalAlign: "center"}}>
                                                        <Badge className="pop-item" color="danger"
                                                            onClick={() => this.deleteIPODataField(index)}>
                                                            <i className="fa fa-times"/>
                                                        </Badge>
                                                    </td>
                                            </tr>)}
                                            <tr>
                                                <td colSpan="4" align="right">
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

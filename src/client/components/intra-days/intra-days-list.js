import React, {Fragment} from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import {Container, Button, Input, Table, Badge} from "reactstrap";
import RiskLoader from "../loader/loader";
import RemoteSearchDropdown from "../search-dropdown/remote-search-dropdown";

const config = require('../../../common/config');
const api = config.server.api;
const debTime = config.app.searchDebounce;

class IntraDaysList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {intras: undefined, selected: undefined, amount: 0}
    }

    componentDidMount() {
        this.getIntras();
    }

    getIntras = () => {
        Utils.fetchJson(api.getIntras).then(intras => {
            this.setState({intras});
        })
    }

    updateIntras = () => {
        const {intras} = this.state;
        Utils.postJson(api.setIntras, {intras}).then(response => {
            if(response === true){
                this.getIntras();
            }
        });
    };

    addIntra = () => {
        this.setState(ps => ({
            intras: [...ps.intras,
                {
                    name: ps.selected.name,
                    stockId: ps.selected.id,
                    user: 1,
                    amount: ps.amount
                }],
            selected: undefined,
            amount: 0
        }));
    };

    setAmount = (index, amount) => {
        this.setState(ps => ({
            intras: ps.intras.map((intra, pindex) => (pindex === index ? Object.assign({}, intra, {amount}) : intra))
        }));
    };

    deleteIntra = index => {
        this.setState(ps => {
            const intras = [...ps.intras];
            intras.splice(index, 1);
            return {intras};
        });
    };

    render() {
        const {intras, amount, selected} = this.state;
        const addDisabled = selected === undefined || amount === 0 || _.find(intras,intra => intra.stockId === selected.id) !== undefined;
        return (<Container>
                <RiskLoader loading={!intras}>
                    {intras && <Fragment>
                        <Table responsive striped>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Amount</th>
                                <th>Created</th>
                                <th>Delete</th>
                            </tr>
                            </thead>
                            <tbody>
                            {intras.map((intra, index) =>
                                <tr className="pop-box" key={intra.stockId}>
                                    <th scope="row">{index + 1}</th>
                                    <td>{intra.name}</td>
                                    <td><Input type="number" value={intra.amount}
                                               onChange={e => this.setAmount(index, e.target.value)}/></td>
                                    <td align="center">{intra.createdAt ? Utils.formatDate(intra.createdAt) : <Badge color='success'>NEW</Badge>}</td>
                                    <td>
                                        <Button outline className="rounded-circle ml-2 pop-item" color="danger"
                                               onClick={() => this.deleteIntra(index)}>
                                            <i className="fa fa-times"/>
                                        </Button>
                                    </td>
                                </tr>)}
                            <tr>
                                <th scope="row">{intras.length + 1}</th>
                                <td><RemoteSearchDropdown query={api.searchAce} debounceTime={debTime}
                                                          searchParam="search"
                                                          onSelected={item => this.setState({selected: item})}/></td>
                                <td><Input type="number" value={amount}
                                           onChange={e => this.setState({amount: Number(e.target.value)})}/></td>
                                <td colSpan={2} align="center">
                                    <Button color="success" onClick={() => this.addIntra()} disabled={addDisabled}>Add</Button>
                                </td>
                            </tr>
                            </tbody>
                        </Table>
                        <Button color="primary" onClick={this.updateIntras}>Update</Button>
                    </Fragment>}
                </RiskLoader>
            </Container>
        );
    }
}

export default IntraDaysList;

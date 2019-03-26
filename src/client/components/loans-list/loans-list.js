import React from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import {Container, Table} from "reactstrap";
import RiskLoader from "../loader/loader";
import {get} from "../../helpers/client-utils"
const config = require('../../../common/config');
const api = config.server.api;

class LoansList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {loans: undefined}
    }

    componentDidMount() {
        this.getLoans();
    }

    getLoans = () => {
        get(api.getLoans).then(loans => {
            this.setState({loans});
        })
    }

    render() {
        const {loans} = this.state;
        return <Container>
                <RiskLoader loading={!loans}>
                    {loans && 
                        <Table responsive striped>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Account</th>
                                <th>Bank</th>
                                <th>Loan</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loans.map((loan, index) =>
                                <tr key={loan.id}>
                                    <th scope="row">{index + 1}</th>
                                    <td>{loan.id}</td>
                                    <td>{loan.name}</td>
                                    <td>{loan.account}</td>
                                    <td>{loan.bank}</td>
                                    <td>{loan.amount}</td>
                                </tr>)}
                            </tbody>
                        </Table>}
                </RiskLoader>
            </Container>;
    }
}

export default LoansList;

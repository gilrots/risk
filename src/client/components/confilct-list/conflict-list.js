import React from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import {Container, Table} from "reactstrap";
import RiskLoader from "../loader/loader";
import {get} from "../../helpers/client-utils"
const config = require('../../../common/config');
const api = config.server.api;

class ConflictList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {conflicts: undefined}
    }

    componentDidMount() {
        this.getConflicts();
    }

    getConflicts = () => {
        get(api.getConflicts).then(conflicts => {
            this.setState({conflicts});
        })
    }
    
    render() {
        const {conflicts} = this.state;
        return <Container>
                <RiskLoader loading={!conflicts}>
                    {conflicts && 
                        <Table responsive striped>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Long</th>
                                <th>Short</th>
                                <th>Accounts</th>
                            </tr>
                            </thead>
                            <tbody>
                            {conflicts.map((conflict, index) =>
                                <tr key={conflict.id}>
                                    <th scope="row">{index + 1}</th>
                                    <td>{conflict.id}</td>
                                    <td>{conflict.name}</td>
                                    <td className="longs">{conflict.long.toLocaleString('us')}</td>
                                    <td className="shorts">{conflict.short.toLocaleString('us')}</td>
                                    <td>{conflict.accounts.map(acnt =>
                                        <Badge color="primary" key={acnt}>{acnt}</Badge>
                                    )}</td>
                                </tr>)}
                            </tbody>
                        </Table>}
                </RiskLoader>
            </Container>;
    }
}

export default ConflictList;

import React from 'react';
import _ from 'lodash';
import * as Utils from '../../../common/utils';
import { Container, Button, Input, Table, Badge, Form, FormGroup, Label, InputGroup, InputGroupAddon } from "reactstrap";

const config = require('../../../common/config');
const api = config.server.api;

class RiskSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = { username: '', accounts: [], newAccount: '' };
    }

    componentDidMount() {
        this.getUser();
    }

    getUser = () => {
        Utils.fetchJson(api.getUserAccounts).then(user => {
            this.setState(user);
        })
    }

    save = () => {
        const { accounts } = this.state;
        Utils.postJson(api.setUserAccounts, { accounts }).then(response => {
            if (response === true) {
                this.getUser();
            }
        });
    };

    addAccount = () => {
        this.setState(ps => ({
            accounts: [...ps.accounts, ps.newAccount],
            newAccount: ''
        }));
    };

    deleteAccount = index => {
        this.setState(ps => {
            const accounts = [...ps.accounts];
            accounts.splice(index, 1);
            return { accounts };
        });
    };

    render() {
        const { accounts, newAccount, username } = this.state;
        const addDisabled = _.isEmpty(newAccount) || accounts.includes(newAccount);
        return <Container>
            <h4>{username}</h4>
            <Form>
                <FormGroup>
                    <Label for="add-acc">Accounts</Label>
                    <br />
                    {accounts.map((acnt, index) =>
                        <Button key={acnt} className="pop-box mr-2" color="primary">
                            <span className="mr-2">{acnt}</span>
                            <Badge color="danger" className="pop-item"
                                onClick={() => this.deleteAccount(index)}>
                                <i className="fa fa-times" />
                            </Badge>
                        </Button>)}
                    <br />
                    <br />
                    <InputGroup>
                        <Input type="number" id="add-acc" name="settings" value={newAccount}
                            placeholder="Add account"
                            onChange={e => this.setState({ newAccount: e.target.value })} />
                        <InputGroupAddon addonType="append">
                            <Button color="success" disabled={addDisabled}
                                onClick={() => this.addAccount()}>Add</Button>
                        </InputGroupAddon>
                    </InputGroup>
                </FormGroup>
            </Form>
            <Button color="primary" onClick={this.save}>Save</Button>
        </Container>;
    }
}

export default RiskSettings;

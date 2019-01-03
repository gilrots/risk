import React from 'react';
import _ from 'lodash';
import {get, post, notify} from "../../helpers/client-utils"
import { Container, Button, Input, Badge, Form, FormGroup, Label, InputGroup, InputGroupAddon } from "reactstrap";
import SearchDropdown from "../search-dropdown/search-dropdown";

const config = require('../../../common/config');
const {getUserSettings, setUserSettings} = config.server.api;

class RiskSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = { user: {}, users:[],selectedUser:undefined, newAccount: '', isAdmin:false };
        this.usersMap = [];
    }

    componentDidMount() {
        this.getSettings();
    }

    getSelected = (userId, users = this.state.users) => ({selectedUser:users.find(u => u.id === userId) || undefined});

    getSettings = () => {
        get(getUserSettings).then(settings => {
            if(settings.error){
                notify(this, settings, "Open User Settings");
            }
            else{
                this.usersMap = _.map(settings.users,user=>({id:user.id.toString(),name:user.username}));
                const sett = Object.assign(settings,this.getSelected(settings.user.id, settings.users))
                console.log(sett);
                this.setState(sett);
            }
        })
    }

    updateSettings = () => {
        const { users } = this.state;
        post(setUserSettings, { users:users.filter(u=>u.changed) }).then(res => {
            notify(this, res, "Update Settings");
            if (res === true) {
                this.getSettings();
            }
        });
    };

    updateAccount = func => {
        this.setState(({selectedUser, users, newAccount}) => {
            const accounts = func(selectedUser,newAccount);
            const newSelected = Object.assign({},selectedUser,{accounts},{changed:true});
            return {
            selectedUser:newSelected,
            users: users.map(user => user.id === newSelected.id ? newSelected: user),
            newAccount: ''
        }});
    };

    addAccount = () => this.updateAccount((selectedUser,newAccount) => [...selectedUser.accounts, {id:newAccount,active:true}]);

    toggleAccount = acc => this.updateAccount(selectedUser => selectedUser.accounts.map(accnt => accnt.id === acc.id ?  {id:acc.id, active:!acc.active}: accnt));

    deleteAccount = index => 
        this.updateAccount(selectedUser => {
            const accounts = [...selectedUser.accounts];
            accounts.splice(index, 1);
            return accounts;
        });

    save() {
        this.updateSettings();
    }

    render() {
        const { selectedUser,isAdmin,newAccount } = this.state;
        const addDisabled = _.isEmpty(newAccount) || selectedUser.accounts.includes(newAccount);
        return selectedUser ? <Container>
            <h4>{selectedUser.username}</h4>
            <Label for="add-acc">Accounts</Label>
            <br />
            {!_.isEmpty(selectedUser.accounts) ? selectedUser.accounts.map((acnt, index) =>
                <Button key={acnt.id} className="pop-box mr-2 mb-2" color={acnt.active ? "primary" : "secondary"}>
                    <span className="mr-2">{acnt.id}</span>
                    <i className={`mr-2 fa fa-${acnt.active ? 'eye' : 'eye-slash'}`} onClick={() => this.toggleAccount(acnt)}/>
                    {isAdmin && <Badge color="danger" className="pop-item"
                        onClick={() => this.deleteAccount(index)}>
                        <i className="fa fa-times" />
                    </Badge>}
                </Button>) : "No accounts."}
            <br />
            <br />
            {isAdmin &&
                <div>
                    <div>
                        Select user to edit accounts:
                        <SearchDropdown
                            items={this.usersMap} selectedId={selectedUser.id.toString()}
                            onSelected={item => this.setState(this.getSelected(Number(item.id)))} />
                    </div>
                    <InputGroup>
                        <Input type="number" id="add-acc" name="settings" value={newAccount}
                            placeholder="Add account"
                            onChange={e => this.setState({ newAccount: e.target.value })} />
                        <InputGroupAddon addonType="append">
                            <Button color="success" disabled={addDisabled}
                                onClick={() => this.addAccount()}>Add</Button>
                        </InputGroupAddon>
                    </InputGroup>
                </div>
            }
        </Container> : '---';
    }
}

export default RiskSettings;

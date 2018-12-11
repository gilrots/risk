import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, Label, Input, FormGroup, FormFeedback } from 'reactstrap';
import RiskLoader from "../loader/loader";
import {post} from "../../helpers/client-utils"
import PropTypes from "prop-types";
const config = require('../../../common/config');
const api = config.server.api;

class Register extends React.Component {
    static propTypes = {
        onAlert: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            adminUser: '',
            adminPassword: '',
            username: '',
            password: '',
            submitted: false,
            registering: false
        };

    }

    handleChange = e => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleSubmit = e => {
        e.preventDefault();

        this.setState({ submitted: true });
        const { adminUser, adminPassword, username, password } = this.state;
        if (adminUser && adminPassword && username && password) {
            this.setState({ registering: true }, () => {
                this.register(adminUser, adminPassword, username, password).then(() => { this.setState({ registering: false }) });
            });
        }
    }

    register(adminUser, adminPassword, username, password) {
        const data = {
            admin: { username: adminUser, password: adminPassword },
            newUser: { username, password }
        }
        return post(api.register, data, response => {
            if (response.ok) {
                this.alert('success', "User registered successfully!");
            }
        }).then(result => {
            const {error} = result;
            if(error){
                this.alert('danger', error);
            }
        });
    }

    alert(type, message) {
        const alert = this.props.onAlert;
        if (alert) {
            alert({ type, message });
        }
    }

    render() {
        const { username, password, adminUser, adminPassword, submitted, registering } = this.state;
        return (
            <div className="col-md-6 col-md-offset-3">
                <h2>Register</h2>
                <Form name="form" onSubmit={this.handleSubmit}>
                    <FormGroup>
                        <Label for="adminUser">Admin user</Label>
                        <Input type="text" name="adminUser" value={adminUser} onChange={this.handleChange} invalid={submitted && !adminUser} />
                        {submitted && !adminUser && <FormFeedback valid={false}>Admin username is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label for="adminPassword">Admin password</Label>
                        <Input type="password" name="adminPassword" value={adminPassword} onChange={this.handleChange} invalid={submitted && !adminPassword} />
                        {submitted && !adminPassword && <FormFeedback valid={false}>Admin password is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label for="username">Username</Label>
                        <Input type="text" name="username" value={username} onChange={this.handleChange} invalid={submitted && !username} />
                        {submitted && !username && <FormFeedback valid={false}>Username is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label for="password">Password</Label>
                        <Input type="password" name="password" value={password} onChange={this.handleChange} invalid={submitted && !password} />
                        {submitted && !password && <FormFeedback valid={false}>Password is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Button color="primary" disabled={registering}>
                            {registering ? <RiskLoader size="20" type="ThreeDots" loading={true} /> : 'Register'}
                        </Button>
                        <Link to="/login" className="btn btn-link">Login</Link>
                    </FormGroup>
                </Form>
            </div>
        );
    }
}

export default Register;

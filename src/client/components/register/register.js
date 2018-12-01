import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, Label, Input, FormGroup, FormFeedback } from 'reactstrap';
import RiskLoader from "../loader/loader";
import * as Utils from "../../../common/utils";
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
            admin: '',
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
        const { admin, username, password } = this.state;
        if (admin && username && password) {
            this.setState({ registering: true }, () => {
                this.register(admin, username, password).then(() => { this.setState({ registering: false }) });
            });
        }
    }

    register(admin, username, password) {
        return Utils.postJson(api.register, { admin, username, password }, response => {
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
        const { username, password, admin, submitted, registering } = this.state;
        return (
            <div className="col-md-6 col-md-offset-3">
                <h2>Register</h2>
                <Form name="form" onSubmit={this.handleSubmit}>
                    <FormGroup>
                        <Label for="admin">Admin password</Label>
                        <Input type="password" name="admin" value={admin} onChange={this.handleChange} invalid={submitted && !admin} />
                        {submitted && !admin && <FormFeedback valid={false}>Admin password is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label for="username">Username</Label>
                        <Input name="username" type="text" value={username} onChange={this.handleChange} invalid={submitted && !username} />
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

import React from 'react';
import {Link} from 'react-router-dom';
import {Button, Form, Label, Input, FormGroup, FormFeedback} from 'reactstrap';
import RiskLoader from "../loader/loader";
import * as Utils from "../../../common/utils";
import * as User from "../../helpers/user";
import PropTypes from "prop-types";
import history from "../../helpers/history";
import {post} from "../../helpers/client-utils"

const config = require('../../../common/config');
const api = config.server.api;

class Login extends React.Component {
    static propTypes = {
        onAlert: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        User.remove();
        this.state = {
            username: '',
            password: '',
            submitted: false,
            loggedIn: false,
            loggingIn: false,
            user: undefined
        };
    }

    handleChange = (e) => {
        const {name, value} = e.target;
        this.setState({[name]: value});
    };

    handleSubmit = (e) => {
        e.preventDefault();

        this.setState({submitted: true});
        const {username, password} = this.state;
        if (username && password) {
            this.login(username, password);
        }
    };

    login(username, password) {
        this.setState({loggingIn: true}, () => {
            post(api.login, {username, password})
                .then(res => {
                    if(res.token){
                        User.set(res.token);
                        history.push('/');
                    }
                    else if (res.error) {
                        this.setState({loggingIn:false});
                        this.alert('danger', res.error);
                    }
            });
        })
    }

    alert(type, message) {
        const alert = this.props.onAlert;
        if (alert) {
            alert({type, message});
        }
    }

    render() {
        const {username, password, submitted, loggingIn} = this.state;
        return (
            <div className="col-md-6 col-md-offset-3">
                <h2>Login</h2>
                <Form name="form" onSubmit={this.handleSubmit}>
                    <FormGroup>
                        <Label for="username">Username</Label>
                        <Input name="username" value={username} onChange={this.handleChange}
                               invalid={submitted && !username}/>
                        {submitted && !username && <FormFeedback valid={false}>Username is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label for="password">Password</Label>
                        <Input type="password" name="password" value={password} onChange={this.handleChange}
                               invalid={submitted && !password}/>
                        {submitted && !password && <FormFeedback valid={false}>Password is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Button color="primary" disabled={loggingIn}>{loggingIn ? <RiskLoader size="20" type="ThreeDots" loading={true}/>  : 'Login'}</Button>
                        <Link to="/register" className="btn btn-link">Register</Link>
                    </FormGroup>
                </Form>
            </div>
        );
    }
}

export default Login;

import React from 'react';
import { Link } from 'react-router-dom';
import {Container, Row, Col, Button, Form, Label, Input, FormGroup, FormFeedback } from 'reactstrap';
import RiskLoader from "../loader/loader";
import * as Utils from "../../../common/utils";
import * as User from "../../helpers/user";
import PropTypes from "prop-types";
import history from "../../helpers/history";

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
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleSubmit = (e) => {
        e.preventDefault();

        this.setState({ submitted: true });
        const { username, password } = this.state;
        if (username && password) {
            this.login(username, password);
        }
    };

    login(username, password) {
        this.setState({loggingIn:true}, () => {
            this.authenticate(username, password).then(
                user => {
                    //this.setState({user,loggedIn:true});
                    history.push('/');
                },
                error => {
                    this.alert('danger', error.toString());
                }
            );
        })
    }

    authenticate(username, password) {
        return Utils.postJson2(`api/login`, { username, password })
            .then(response => Utils.handleResponse(response, User.remove()))
            .then(user => {
                // login successful if there's a jwt token in the response
                if (user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    User.set(user);
                }

                return user;
            });
    }

    alert(type, message){
        const alert = this.props.onAlert;
        if(alert) {
            alert({type, message});
        }
    }

    render() {
        const { username, password, submitted, loggingIn } = this.state;
        return (
            <div className="col-md-6 col-md-offset-3">
                <h2>Login</h2>
                <Form name="form" onSubmit={this.handleSubmit}>
                    <FormGroup>
                        <Label for="username">Username</Label>
                        <Input name="username" value={username} onChange={this.handleChange} invalid={submitted && !username}/>
                        {submitted && !username && <FormFeedback valid={false}>Username is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label for="password">Password</Label>
                        <Input name="password" value={password} onChange={this.handleChange} invalid={submitted && !password} />
                        {submitted && !password && <FormFeedback valid={false}>Password is required</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Button color="primary">Login</Button>
                        {loggingIn && <RiskLoader loading={true}/>}
                        <Link to="/register" className="btn btn-link">Register</Link>
                    </FormGroup>
                </Form>
            </div>
        );
    }
}

export default Login;

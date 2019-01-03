import React from 'react';
import {Router, Route, Redirect} from 'react-router-dom';
import {Jumbotron, Container, Alert} from "reactstrap";
import history from "./helpers/history";
import PrivateRoute from "./components/private-route/private-route";
import Login from "./components/login/login";
import Register from "./components/register/register";
import App from "./App";
import * as User from "./helpers/user";

class Risk extends React.Component {
    constructor(props) {
        super(props);
        this.state = {alert: {}};
        history.listen(() => {
            this.setState({alert: {}});
        });
    }

    childAlert = alert => this.setState({alert}, () => setTimeout(() => this.setState({alert: {}}), 10000));

    render() {
        const {alert} = this.state;
        const loggedIn = User.exist();
        return (
            <Router history={history}>
                <Container fluid className="d-flex flex-fill flex-column">
                    <PrivateRoute exact path="/" component={App}/>
                    {!loggedIn && <Jumbotron>
                        <Container>
                            <div className="col-sm-8 col-sm-offset-2">
                                <Alert color={alert.type} isOpen={alert.message !== undefined}
                                       toggle={() => this.setState({alert: {}})}>
                                    {alert.message ? alert.message : ''}
                                </Alert>
                                <Route exact path="/login" render={() => <Login onAlert={this.childAlert}/>}/>
                                <Route exact path="/register" render={() => <Register onAlert={this.childAlert}/>}/>
                                <Redirect from="/*" to="/" />
                            </div>
                        </Container>
                    </Jumbotron>}
                </Container>
            </Router>
        );
    }
}

export default Risk;

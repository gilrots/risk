import React from 'react';
import { Router, Route } from 'react-router-dom';
import {Jumbotron, Container, Alert} from "reactstrap";
import history from "./helpers/history";
import PrivateRoute from "./components/private-route/private-route";
import Login from "./components/login/login";
// import Register from "./components/register/register";
import App from "./App";

class Risk extends React.Component {
    constructor(props) {
        super(props);
        this.state = {alert:{}};
        history.listen(() => {
            this.setState({alert:{}});
        });
    }

    childAlert = alert => this.setState(alert);

    render() {
        const { alert } = this.state;
        return (
            <Jumbotron>
                <Container>
                    <div className="col-sm-8 col-sm-offset-2">
                        {alert.message && <Alert className={`alert ${alert.type}`}>{alert.message}</Alert>}
                        <Router history={history}>
                            <div>
                                <PrivateRoute exact path="/" component={App} />
                                <Route path="/login" render={() => <Login onAlert={this.childAlert}/>} />
                                {/*<Route path="/register" render={() => <Register onAlert={this.childAlert}/>} />*/}
                            </div>
                        </Router>
                    </div>
                </Container>
            </Jumbotron>
        );
    }
}

export default Risk;

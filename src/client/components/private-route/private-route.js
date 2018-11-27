import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import * as User from "../../helpers/user";

const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={props => (
        User.exist()
            ? <Component {...props} />
            : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
    )} />
)

export default PrivateRoute;

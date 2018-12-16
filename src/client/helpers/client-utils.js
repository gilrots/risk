 import { getJson, postJson } from "../../common/utils";
 import * as User from "./user";
 import history from "./history";
 import _ from 'lodash';

function buildAuthHeader() {
    // return authorization header with jwt token
    let token = User.get();
    return token ? {'Authorization': 'Bearer ' + token} : {};
}

function handleResponse(response, handler){
    if(response.status === 401 || response.status === 403){
        User.remove();
        history.push('/');
        return JSON.stringify(null);
    }
    else if(response.status === 200 && response.headers.get("token")){
        User.set(response.headers.get("token"));
    }
    if(handler) {
        handler(response);
    }
}

export function get(api, params, handler) {
    const headers = {...buildAuthHeader()};
    return getJson(api, params, headers, res => handleResponse(res,handler));
}

export function post(url, object, handler) {
    const authHeader = buildAuthHeader();
    return postJson(url, object, authHeader, res => handleResponse(res,handler));
}

export function notify(component, response, title, message = "Action completed!") {
    const onAlert = component.props.onAlert;
    if(onAlert) {
        const alert = response.error ? 
        {title: `${title} - Error!`, message: response.error, type: 'danger'} :
        {title, message, type: 'success'};
        onAlert(alert);
    }
}

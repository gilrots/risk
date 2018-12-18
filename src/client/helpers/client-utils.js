 import { getJson, postJson } from "../../common/utils";
 import * as User from "./user";
 import history from "./history";
 import _ from 'lodash';
 let polling = undefined;

function buildAuthHeader() {
    // return authorization header with jwt token
    let token = User.get();
    return token ? {'Authorization': 'Bearer ' + token} : {};
}

function handleResponse(response, handler){
    if(response.status === 401 || response.status === 403){
        User.remove();
        stopPolling();
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

export function exportCSV(name, tables, formatters) {
   return new Promise(resolve => {
        const totalCols = _.sumBy(tables,'table.cols.length') + tables.length;
        const totalRows = _.maxBy(tables,'table.data.length').table.data.length + 2;
        const result = Array(totalRows);
        for (let i = 0; i < result.length; i++) {
            result[i] = _.fill(Array(totalCols),' ');
        }
    
        let c = 0;
        _.forEach(tables, table => {
            result[0][c] = table.name;
            const {cols,data,dataKey} =  table.table;
            _.forEach(cols, (col,i) => {
                result[1][c + i] = col.name;
                _.forEach(data, (row,j) => {
                    let value = dataKey ? row[dataKey][col.key] : row[col.key];
                    if(col.format) {
                        value = formatters[col.format](value);
                    }
                    value = value !== undefined && value !== null ? value.toString() : '---';
                    if(value.includes(',')){
                        value = `"${value}"`
                    }
                    result[2 + j][c + i] = value;
                });
            });
            c+=(cols.length + 1);
        });
    
        let csv = '';
        _.forEach(result, row => {
            csv += row.join(',');
            csv += "\n";
        });
        console.log(csv);
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURI(csv));
        element.setAttribute('download', `${name}-${new Date().toLocaleString('us')}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        resolve();
   });
}

export function setPolling(id) {
    polling = id;
}

export function stopPolling() {
    if(polling !== undefined);
    {
        clearInterval(polling);
        polling = undefined;
    }
}
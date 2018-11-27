const USER = '123RISK_USER321';

function exist() {
    return localStorage.getItem(USER) !== null;
}

function get() {
    return JSON.parse(localStorage.getItem(USER));
}

function set(user) {
    localStorage.setItem(USER, JSON.stringify(user));
}

function remove() {
    localStorage.removeItem(USER);
}

module.exports = {exist,get,set,remove};

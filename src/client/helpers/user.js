const USER = '123RISK_USER321';

function exist() {
    return !_.isEmpty(localStorage.getItem(USER));
}

function get() {
    const token = localStorage.getItem(USER);
    if (_.isEmpty(token)) {
        return token;
    } else {
        return JSON.parse(token);
    }
}

function set(user) {
    localStorage.setItem(USER, JSON.stringify(user));
}

function remove() {
    localStorage.removeItem(USER);
}

module.exports = {exist,get,set,remove};

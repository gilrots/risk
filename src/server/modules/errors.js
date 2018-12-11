class UserIsNotAllowedError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, UserIsNotAllowedError);
    }
}
class UserAlreadyExistError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, UserAlreadyExistError);
    }
}
class ServerError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, ServerError);
    }
}

class LoginError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, LoginError);
    }
}

module.exports = { UserIsNotAllowedError, UserAlreadyExistError, ServerError, LoginError};
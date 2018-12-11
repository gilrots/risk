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

class TableNotExistError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, TableNotExistError);
    }
}

class TableCouldNotBeUpdatedOrCreatedError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, TableCouldNotBeUpdatedOrCreatedError);
    }
}

class TableCouldNotBeParsedError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, TableCouldNotBeParsedError);
    }
}

module.exports = {
    UserIsNotAllowedError,
    UserAlreadyExistError,
    ServerError,
    LoginError,
    TableNotExistError,
    TableCouldNotBeParsedError,
    TableCouldNotBeUpdatedOrCreatedError
};
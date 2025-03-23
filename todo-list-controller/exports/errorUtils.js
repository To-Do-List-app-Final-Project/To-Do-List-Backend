const { UNAUTHORIZED, BAD_REQUEST, FORBIDDEN, SERVER, NOT_FOUND } = require("../errorcodes/index.code");
class CommonError extends Error {
    constructor(code = null, message = null, errorData = null) {
        super(message ? message : '');
        this.code = code;
        this.errorData = errorData;
    }
}

class BadRequestError extends CommonError {
    constructor(code = null, message = null, errorData = null) {
        super(code, message, errorData);
    }
}

class NotFoundError extends CommonError {
    constructor(code, message, errorData) {
        super(code, message, errorData);
    }
}

class AuthorizationError extends CommonError {
    constructor(code, message, errorData) {
        super(code, message, errorData);
    }
}

class ForbiddenError extends CommonError {
    constructor(code, message, errorData) {
        super(code, message, errorData);
    }
}

const ErrorHelper = (err) => {
    let result = { ...SERVER }
    if (err instanceof BadRequestError) {
        result = { ...BAD_REQUEST };
    } else if (err instanceof AuthorizationError) {
        result = { ...UNAUTHORIZED };
    } else if (err instanceof ForbiddenError) {
        result = { ...FORBIDDEN };
    } else if (err instanceof NotFoundError) {
        result = { ...NOT_FOUND };
    } else if (err instanceof CommonError) {
        result = { ...SERVER };
    } else if (err instanceof Error) {
        result = err;
    }
    {
        let code = err.code;
        if (code) {
            if (typeof code == 'object') {
                result = code;
            } else {
                result.errorCode = code ? code : result.errorCode;
            }
        }
        result.message = err.message ? err.message : result.message;
    }
    result.errorData = err.errorData;
    
    return result;
}

module.exports = {
    CommonError,
    BadRequestError,
    NotFoundError,
    AuthorizationError,
    ForbiddenError,
    ErrorHelper
}


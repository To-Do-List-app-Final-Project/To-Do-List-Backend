const VAR_MESSAGE = (code, vars) => {
    let msg = code.message;
    for (let i = 0; i < vars.length; i++) {
        let regex = "${" + i + "}";
        msg = msg.replace(regex, vars[i]);
    }
    return { ...code, message: msg };
}

const ERROR_MESSAGE = (message) => ({
    errorCode: 2008010,
    status: 400,
    message: message,
});

module.exports = {
    //登陆
    BAD_REQUEST: {
        errorCode: 940000,
        status: 400,
        message: "Bad request",
    },
    UNAUTHORIZED: {
        errorCode: 940100,
        status: 401,
        message: "Unauthorized or Expired Token. Please Login and Try Again Later",
    },
    PUBLIC_UNAUTHORIZED: {
        errorCode: 940103,
        status: 401,
        message: "Public Access Unauthorized Token. Please Try Again Later",
    },
    NO_TOKEN: { errorCode: 940101, status: 401, message: "No token" },
    TOKEN_ERROR: { errorCode: 940102, status: 401, message: "Token error" },

    FORBIDDEN: { errorCode: 940300, status: 403, message: "Forbidden" },
    NOT_FOUND: { errorCode: 940400, status: 404, message: "Not found" },
    SERVER: { errorCode: 950000, status: 500, message: "Server error" },
    PARAMETER_ERROR: { errorCode: 960000, status: 403, message: "Parameters must not null!" },
    PARAM_VALUE_ERROR: { errorCode: 960001, status: 403, message: "Parameter key ${0} value not equal ${1}." },
    PARAM_NOT_NULL: { errorCode: 960002, status: 403, message: "Parameter key ${0} must not null." },

    //
    GENERATE_TOKEN_ERROR: { errorCode: 100003, status: 400, message: "Cannot Sign JWT Token" },
    WRONG_USERNAME_PASSWORD: { errorCode: 100002, status: 400, message: "Invalid username / password" },
    GENERATE_SERVER_ERROR: { errorCode: 100004, status: 500, message: "Internal Server Error" },
    GENERATE_PARAMETERS_ERROR: { errorCode: 100005, status: 400, message: "Error in request parameters" },

    ADD_FAILED: { errorCode: 100006, status: 400, message: "Add Failed" },
    UPDATE_FAILED: { errorCode: 100007, status: 400, message: "Update Failed" },
    NOT_EXIST: { errorCode: 100025, status: 404, message: "Not exist" },
    QUERY_ERROR: { errorCode: 100008, status: 500, message: "query error" },
    SAVE_ERROR: { errorCode: 100009, status: 500, message: "save error" },
    UPDATE_ERROR: { errorCode: 100010, status: 500, message: "update error" },
    SIGNED_FAILED: { errorCode: 100012, status: 400, message: "sign failed" },
    UPLOAD_FAILED_LIMIT_SIZE: { errorCode: 100013, status: 400, message: "upload failed for limit size" },
    DATA_EMPTY: { errorCode: 100014, status: 400, message: "data is empty" },
    DATA_LIST_ERROR: { errorCode: 100015, status: 400, message: "data list is error" },
    IMPORT_DATA_FAILED: { errorCode: 100016, status: 400, message: "import data failed" },
    DATA_EXISTS: { errorCode: 100017, status: 400, message: "some data is exists" },
    DOWNlOAD_FAILED: { errorCode: 100018, status: 400, message: "download file failed" },
    FILE_READ_FAILED: { errorCode: 100019, status: 400, message: "download file failed" },
    REMOVE_FAILED: { errorCode: 100020, status: 400, message: "remove failed" },
    PASSWORD_FAILED: { errorCode: 100021, status: 403, message: "Password is wrong" },
    NO_NEED_ACTION: { errorCode: 100022, status: 403, message: "No need action" },
    STATUS_CANNOT_CHANGE: { errorCode: 100023, status: 400, message: "Status cannot change" },
    INFO_INCOMPLETE: { errorCode: 100024, status: 400, message: "Incomplete information" },
    WRONG_CURRENT_PASSWORD: { errorCode: 1000025, status: 400, message: "Incorrect current password!" },
    VAR_MESSAGE,
    ERROR_MESSAGE
}

const { HEADERS } = require('./constants');

const successHandles = (res, data, message) => {
    res.writeHead(200, HEADERS);
    res.write(
        JSON.stringify({
            status: 'success',
            data,
            message,
        })
    );
    res.end();
};

const errorHandles = (res, httpStatus, message) => {
    res.writeHead(httpStatus, HEADERS);
    res.write(
        JSON.stringify({
            status: 'error',
            message,
        })
    );
    res.end();
};

module.exports = { successHandles, errorHandles };

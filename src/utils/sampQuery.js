const query = require('samp-query');
const config = require('../config');

/**
 * Queries the live SA-MP server defined in config.server.ip.
 * @returns {Promise<object>} The server query response payload.
 */
function queryServer() {
    return new Promise((resolve, reject) => {
        // Parse IP and port from "127.0.0.1:7777" format
        const [host, port] = config.server.ip.split(':');

        const options = {
            host: host || '127.0.0.1',
            port: Number(port) || 7777,
            timeout: 2500 // Timeout in milliseconds
        };

        query(options, (error, response) => {
            if (error) {
                return reject(error);
            }
            resolve(response);
        });
    });
}

module.exports = { queryServer };
const mysql = require('mysql2/promise');

// Initialize the MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'samp_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Executes a parameterized SQL query against the connection pool.
 * @param {string} sql - The SQL statement to run.
 * @param {Array<any>} [params=[]] - The parameters to safely interpolate into the query.
 * @returns {Promise<any>} The query results.
 */
async function query(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results;
}

/**
 * Tests the database connection and verifies connectivity.
 * @returns {Promise<boolean>} True if connection succeeded, false otherwise.
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`[DATABASE] Successfully connected to MySQL database: ${process.env.DB_NAME || 'samp_database'}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('[DATABASE ERROR] Failed to connect to MySQL database:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    query,
    testConnection
};
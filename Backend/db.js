import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('Conectado a MySQL');
} catch(error) {
    console.error('No se pudo conectar a MySQL:', error.message);
    process.exit(1);
}
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';

const [, , email, password] = process.argv;

if (!email || !password) {
    console.error('Uso: npm run crear-admin -- <correo> <contraseña>');
    process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

await pool.execute(
    `INSERT INTO usuarios (email, password, role) VALUES (?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin'`,
    [email, hash]
);

console.log(`Administrador ${email} creado o actualizado.`);
await pool.end();
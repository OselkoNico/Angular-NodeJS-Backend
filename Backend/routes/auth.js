import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

const RONDAS = 10;

function crearToken(usuario) {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );
}

router.post('/register', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'El correo y la contraseña son obligatorios.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 8 caracteres.'
        });
    }

    try {
        const hash = await bcrypt.hash(password, RONDAS);

        const [resultado] = await pool.execute(
            'INSERT INTO usuarios (email, password) VALUES (?, ?)',
            [email, hash]
        );

        const usuario = { id: resultado.insertId, email, role: 'user' };

        res.status(201).json({
            message: 'Usuario creado',
            token: crearToken(usuario),
            usuario
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                message: 'Ya existe una cuenta con ese correo.'
            });
        }

        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'El correo y la contraseña son obligatorios.'
        });
    }

    try {
        const [filas] = await pool.execute(
            'SELECT id, email, password, role FROM usuarios WHERE email = ?',
            [email]
        );

        const usuario = filas[0];
        const correcta = usuario && await bcrypt.compare(password, usuario.password);

        if (!correcta) {
            return res.status(401).json({
                message: 'Credenciales incorrectas.'
            });
        }

        res.status(200).json({
            message: 'Ok',
            token: crearToken(usuario),
            usuario: { id: usuario.id, email: usuario.email, role: usuario.role }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/me', verificarToken, (req, res) => {
    res.status(200).json({
        message: 'Ok',
        usuario: {
            id: req.usuario.id,
            email: req.usuario.email,
            role: req.usuario.role
        }
    });
});

export default router;
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';

vi.mock('../db.js', () => ({
    pool: {
        execute: vi.fn(),
        query: vi.fn(),
    },
}));

import { app } from '../app.js';
import { pool } from '../db.js';

describe('POST /auth/login', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('devuelve un token y el usuario con credenciales correctas', async () => {
        const hash = await bcrypt.hash('micontrasena123', 10);
        pool.execute.mockResolvedValueOnce([[
            { id: 1, email: 'admin@ejemplo.com', password: hash, role: 'admin' }
        ]]);

        const respuesta = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@ejemplo.com', password: 'micontrasena123' });

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.token).toBeTruthy();
        expect(respuesta.body.usuario.role).toBe('admin');
        expect(respuesta.body.usuario.password).toBeUndefined();
    });

    it('responde 401 con la contraseña incorrecta', async () => {
        const hash = await bcrypt.hash('micontrasena123', 10);
        pool.execute.mockResolvedValueOnce([[
            { id: 1, email: 'admin@ejemplo.com', password: hash, role: 'admin' }
        ]]);

        const respuesta = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@ejemplo.com', password: 'equivocada' });

        expect(respuesta.status).toBe(401);
    });

    it('devuelve el mismo mensaje si el correo no existe', async () => {
        pool.execute.mockResolvedValueOnce([[]]);

        const respuesta = await request(app)
            .post('/auth/login')
            .send({ email: 'nadie@ejemplo.com', password: 'loquesea' });

        expect(respuesta.status).toBe(401);
        expect(respuesta.body.message).toBe('Credenciales incorrectas.');
    });
});

describe('POST /auth/register', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('rechaza contraseñas de menos de ocho caracteres', async () => {
        const respuesta = await request(app)
            .post('/auth/register')
            .send({ email: 'nuevo@ejemplo.com', password: 'corta' });

        expect(respuesta.status).toBe(400);
        expect(pool.execute).not.toHaveBeenCalled();
    });

    it('crea la cuenta siempre con rol de usuario normal', async () => {
        pool.execute.mockResolvedValueOnce([{ insertId: 5 }]);

        const respuesta = await request(app)
            .post('/auth/register')
            .send({ email: 'nuevo@ejemplo.com', password: 'micontrasena123' });

        expect(respuesta.status).toBe(201);
        expect(respuesta.body.usuario.role).toBe('user');
    });
});
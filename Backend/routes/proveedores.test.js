import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db.js', () => ({
    pool: {
        execute: vi.fn(),
        query: vi.fn(),
    },
}));

import { app } from '../app.js';
import { pool } from '../db.js';

const PROVEEDOR = {
    cif: 'B12345678',
    name: 'Suministros García S.L.',
    activity: 'Distribución',
    address: 'C/ Mayor 12',
    city: 'Valencia',
    postalCode: '46001',
    phone: '961234567',
};

const tokenAdmin = jwt.sign(
    { id: 1, email: 'admin@ejemplo.com', role: 'admin' },
    process.env.JWT_SECRET
);

const tokenUsuario = jwt.sign(
    { id: 2, email: 'usuario@ejemplo.com', role: 'user' },
    process.env.JWT_SECRET
);

describe('GET /proveedores', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('responde 401 sin token', async () => {
        const respuesta = await request(app).get('/proveedores');

        expect(respuesta.status).toBe(401);
        expect(pool.execute).not.toHaveBeenCalled();
    });

    it('devuelve la página y el total a un usuario identificado', async () => {
        pool.execute
            .mockResolvedValueOnce([[{ total: 25 }]])
            .mockResolvedValueOnce([[PROVEEDOR]]);

        const respuesta = await request(app)
            .get('/proveedores')
            .set('Authorization', `Bearer ${tokenUsuario}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.total).toBe(25);
        expect(respuesta.body.totalPages).toBe(3);
        expect(respuesta.body.proveedores).toHaveLength(1);
    });
});

describe('DELETE /proveedores/:cif', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('responde 403 a un usuario sin rol de administrador', async () => {
        const respuesta = await request(app)
            .delete('/proveedores/B12345678')
            .set('Authorization', `Bearer ${tokenUsuario}`);

        expect(respuesta.status).toBe(403);
        expect(pool.execute).not.toHaveBeenCalled();
    });

    it('elimina el proveedor si quien lo pide es administrador', async () => {
        pool.execute
            .mockResolvedValueOnce([[PROVEEDOR]])
            .mockResolvedValueOnce([{ affectedRows: 1 }]);

        const respuesta = await request(app)
            .delete('/proveedores/B12345678')
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body.deletedProvider.cif).toBe('B12345678');
    });

    it('responde 404 si el CIF no existe', async () => {
        pool.execute.mockResolvedValueOnce([[]]);

        const respuesta = await request(app)
            .delete('/proveedores/NOEXISTE')
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(respuesta.status).toBe(404);
    });
});

describe('POST /proveedores', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('traduce el CIF duplicado de MySQL a un 400', async () => {
        const errorDuplicado = new Error('Duplicate entry');
        errorDuplicado.code = 'ER_DUP_ENTRY';
        pool.execute.mockRejectedValueOnce(errorDuplicado);

        const respuesta = await request(app)
            .post('/proveedores')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ cif: 'B12345678', name: 'Suministros García S.L.' });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.message).toContain('CIF');
    });

    it('exige el CIF y el nombre', async () => {
        const respuesta = await request(app)
            .post('/proveedores')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ cif: 'B12345678' });

        expect(respuesta.status).toBe(400);
        expect(pool.execute).not.toHaveBeenCalled();
    });
});
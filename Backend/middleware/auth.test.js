import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { verificarToken, soloAdmin } from './auth.js';

function crearRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('verificarToken', () => {
    let res;
    let next;

    beforeEach(() => {
        res = crearRes();
        next = vi.fn();
    });

    it('rechaza con 401 si no hay cabecera de autorización', () => {
        verificarToken({ headers: {} }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rechaza con 401 si el esquema no es Bearer', () => {
        verificarToken({ headers: { authorization: 'Basic abc123' } }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rechaza con 401 si el token está manipulado', () => {
        const token = jwt.sign({ id: 1, role: 'user' }, 'otro-secreto-distinto');

        verificarToken({ headers: { authorization: `Bearer ${token}` } }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rechaza con 401 si el token ha caducado', () => {
        const token = jwt.sign(
            { id: 1, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '-1s' }
        );

        verificarToken({ headers: { authorization: `Bearer ${token}` } }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('deja pasar un token válido y expone el usuario en la petición', () => {
        const token = jwt.sign(
            { id: 7, email: 'a@b.com', role: 'admin' },
            process.env.JWT_SECRET
        );
        const req = { headers: { authorization: `Bearer ${token}` } };

        verificarToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.usuario.id).toBe(7);
        expect(req.usuario.role).toBe('admin');
    });
});

describe('soloAdmin', () => {
    let res;
    let next;

    beforeEach(() => {
        res = crearRes();
        next = vi.fn();
    });

    it('rechaza con 403 a un usuario sin rol de administrador', () => {
        soloAdmin({ usuario: { role: 'user' } }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('rechaza con 403 si no hay usuario en la petición', () => {
        soloAdmin({}, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deja pasar a un administrador', () => {
        soloAdmin({ usuario: { role: 'admin' } }, res, next);

        expect(next).toHaveBeenCalled();
    });
});
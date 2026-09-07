import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

const CAMPOS = 'cif, name, activity, address, city, postal_code AS postalCode, phone';

router.get('/', async (req, res, next) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search ?? '').trim();

    const filtro = search ? 'WHERE name LIKE ? OR cif LIKE ?' : '';
    const parametros = search ? [`%${search}%`, `%${search}%`] : [];

    try {
        const [filas] = await pool.execute(
            `SELECT COUNT(*) AS total FROM proveedores ${filtro}`,
            parametros
        );
        const total = filas[0].total;

        const [proveedores] = await pool.execute(
            `SELECT ${CAMPOS} FROM proveedores ${filtro}
             ORDER BY name
             LIMIT ${limit} OFFSET ${offset}`,
            parametros
        );

        res.status(200).json({
            message: 'Ok',
            proveedores,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:cif', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT ${CAMPOS} FROM proveedores WHERE cif = ?`,
            [req.params.cif]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'CIF not found.'
            });
        }

        res.status(200).json({
            message: 'Ok',
            company: rows[0]
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    const { cif, name, activity, address, city, postalCode, phone } = req.body;

    if (!cif || !name) {
        return res.status(400).json({
            message: 'Proveedor data mandatory'
        });
    }

    try {
        await pool.execute(
            `INSERT INTO proveedores (cif, name, activity, address, city, postal_code, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cif, name, activity ?? null, address ?? null, city ?? null, postalCode ?? null, phone ?? null]
        );

        res.status(201).json({
            message: 'Created',
            proveedor: { cif, name, activity, address, city, postalCode, phone }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                message: 'Ya existe un proveedor con ese CIF'
            });
        }

        next(error);
    }
});

router.put('/:cif', async (req, res, next) => {
    const { name, activity, address, city, postalCode, phone } = req.body;

    if (!name) {
        return res.status(400).json({
            message: 'Proveedor data or cif param mandatory'
        });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE proveedores
             SET name = ?, activity = ?, address = ?, city = ?, postal_code = ?, phone = ?
             WHERE cif = ?`,
            [name, activity ?? null, address ?? null, city ?? null, postalCode ?? null, phone ?? null, req.params.cif]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'No se encontró ningún proveedor con ese CIF'
            });
        }

        res.status(200).json({
            message: 'Ok',
            proveedor: { cif: req.params.cif, name, activity, address, city, postalCode, phone }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:cif', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT ${CAMPOS} FROM proveedores WHERE cif = ?`,
            [req.params.cif]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontró ningún proveedor con ese cif'
            });
        }

        await pool.execute(
            'DELETE FROM proveedores WHERE cif = ?',
            [req.params.cif]
        );

        res.status(200).json({
            message: 'Ok',
            deletedProvider: rows[0]
        });
    } catch (error) {
        next(error);
    }
});

export default router;
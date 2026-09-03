import express from 'express';
const router = express.Router();

const proveedores = [];

router.get('/', (req, res) => {
    res.status(200).json({
        message: 'Ok',
        proveedores
    });
});

router.get('/:cif', (req, res) => {
    const company = proveedores.find(
        proveedor => proveedor.cif === req.params.cif
    );

    if (!company) {
        return res.status(404).json({
            message: 'CIF not found.'
        });
    }

    res.status(200).json({
        message: 'Ok',
        company
    });
});

router.post('/', (req, res) => {
    if(!req.body.cif) {
        return res.status(400).json({
            message: 'Proveedor data mandatory'
        });
    }

    const existingProvider = proveedores.find(
        proveedor => proveedor.cif === req.body.cif
    );

    if(existingProvider) {
        return res.status(400).json({
            message: 'CIF already exists'
        });
    }

    proveedores.push(req.body);

    res.status(201).json({
        message: 'Created',
        proveedor: req.body
    });
});

router.put('/:cif', (req, res) => {
    if(!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: 'Proveedor data or cif param mandatory'
        });
    }

    const proveedorIndex = proveedores.findIndex(
        proveedor => proveedor.cif === req.params.cif
    );

    if(proveedorIndex < 0) {
        return res.status(404).json({
            message: 'No se encontró ningún proveedor con ese CIF'
        });
    }

    const { cif, ...updatedData } = req.body;

    proveedores[proveedorIndex] = {
        ...proveedores[proveedorIndex],
        ...updatedData
    };

    res.status(200).json({
        message:'Ok',
        proveedor: proveedores[proveedorIndex]
    });
});

router.delete('/:cif', (req, res) => {
    const proveedorIndex = proveedores.findIndex(
        proveedor => proveedor.cif === req.params.cif
    );

    if(proveedorIndex < 0) {
        return res.status(404).json({
            message: 'No se encontró ningún proveedor con ese cif'
        });
    }

    const [deletedProvider] = proveedores.splice(proveedorIndex, 1);

    res.status(200).json({
        message: 'Ok',
        deletedProvider
    });
});

export default router;
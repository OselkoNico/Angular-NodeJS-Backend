import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
    const cabecera = req.headers.authorization ?? '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'No has iniciado sesión.'
        });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({
            message: 'La sesión no es válida o ha caducado.'
        });
    }
}

export function soloAdmin(req, res, next) {
    if (req.usuario?.role !== 'admin') {
        return res.status(403).json({
            message: 'No tienes permisos para realizar esta operación.'
        });
    }

    next();
}
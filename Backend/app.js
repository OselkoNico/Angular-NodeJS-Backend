import express from 'express';
import cors from 'cors';
import router from './routes/proveedores.js';
import authRouter from './routes/auth.js';

export const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
}));

app.use(express.json());

app.use('/auth', authRouter);
app.use('/proveedores', router);

app.use((req, res) => {
    res.status(404).json({
        message: 'Incorrect route or params.',
    })
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({
        message: 'Error interno del servidor.',
    });
});
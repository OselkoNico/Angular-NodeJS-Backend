import 'dotenv/config';
import express from 'express';
import router from './routes/proveedores.js';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
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

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
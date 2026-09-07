import { describe, it, expect } from 'vitest';
import { parsearPaginacion } from './paginacion.js';

describe('parsearPaginacion', () => {

    it('usa la primera página y diez elementos por defecto', () => {
        expect(parsearPaginacion({})).toEqual({ page: 1, limit: 10, offset: 0 });
    });

    it('calcula el desplazamiento a partir de la página y el tamaño', () => {
        expect(parsearPaginacion({ page: '3', limit: '10' }).offset).toBe(20);
        expect(parsearPaginacion({ page: '2', limit: '5' }).offset).toBe(5);
    });

    it('acota el tamaño de página a un máximo de cien', () => {
        expect(parsearPaginacion({ limit: '999999' }).limit).toBe(100);
    });

    it('impide tamaños de página nulos o negativos', () => {
        expect(parsearPaginacion({ limit: '0' }).limit).toBe(10);
        expect(parsearPaginacion({ limit: '-5' }).limit).toBe(10);
    });

    it('impide páginas anteriores a la primera', () => {
        expect(parsearPaginacion({ page: '0' }).page).toBe(1);
        expect(parsearPaginacion({ page: '-3' }).page).toBe(1);
    });

    it('ignora los valores no numéricos en lugar de propagar NaN', () => {
        const resultado = parsearPaginacion({ page: 'abc', limit: 'xyz' });

        expect(resultado).toEqual({ page: 1, limit: 10, offset: 0 });
    });

    it('descarta las páginas decimales, que producirían un desplazamiento no entero', () => {
        expect(parsearPaginacion({ page: '2.5' }).page).toBe(1);
        expect(parsearPaginacion({ page: '2.5', limit: '3' }).offset).toBe(0);
    });

});
export function parsearPaginacion(query = {}) {
    const pageBruta = Number(query.page);
    const limitBruto = Number(query.limit);

    const page = Number.isInteger(pageBruta) && pageBruta > 0
        ? pageBruta
        : 1;

    const limit = Number.isInteger(limitBruto) && limitBruto > 0
        ? Math.min(100, limitBruto)
        : 10;

    return { page, limit, offset: (page - 1) * limit };
}
import { api } from './api';

export const analiticaService = {
  async consultar(nombre) {
    const respuesta = await api(`/analitica/${nombre}`, { timeoutMs: 45000 });
    if (!Array.isArray(respuesta?.data)) {
      throw new Error('La respuesta de analítica no contiene una lista de resultados.');
    }
    return respuesta.data;
  },
};

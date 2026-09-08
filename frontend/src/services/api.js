export const isDemo = import.meta.env.VITE_USE_MOCKS !== 'false';
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
let token = null;
export function setToken(value) { token = value; }
export async function api(path, options = {}) {
  if (!base) throw new Error('Falta configurar la URL del API Gateway.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}${path}`, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : `No se pudo completar la solicitud (${response.status}).`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('La solicitud tardó demasiado. Inténtalo nuevamente.');
    if (error instanceof TypeError) throw new Error('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.');
    throw error;
  } finally { clearTimeout(timer); }
}

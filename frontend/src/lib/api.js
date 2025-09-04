const API_URL = 'http://localhost:3000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error de API');
  }
  return res.json();
}

export const login = (username, password) =>
  apiFetch('/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const getCars = () => apiFetch('/carros');
export const getTramos = () => apiFetch('/tramos');
export const getTarifaActiva = () => apiFetch('/tarifa/activa');
export const getUsuarios = () => apiFetch('/usuarios');
export const getRoles = () => apiFetch('/roles');
export const createUser = (data) => apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id, data) => apiFetch(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id) => apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
export const changePassword = (id, oldPassword, newPassword) =>
  apiFetch(`/usuarios/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ oldPassword, newPassword })
  });

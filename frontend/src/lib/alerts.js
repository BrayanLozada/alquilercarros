const messages = {
  'credenciales inválidas': 'Debe ingresar usuario y contraseña.',
  'usuario inválido': 'Usuario no encontrado.',
  'contraseña inválida': 'Contraseña incorrecta.',
  'username inválido': 'Nombre de usuario inválido.',
  'password inválido': 'Contraseña inválida.',
  'role_id inválido': 'Rol inválido.',
  'rol inválido': 'Rol inválido.',
  'minutos inválido': 'Minutos inválidos.',
  'nombre requerido': 'Nombre requerido.',
  'estado inválido': 'Estado inválido.'
};

export function getErrorMessage(msg = '') {
  const key = msg.toLowerCase();
  return messages[key] || msg || 'Error inesperado.';
}

export function showError(err) {
  const message = typeof err === 'string' ? err : err?.message;
  alert(getErrorMessage(message));
}

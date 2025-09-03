export const seedCars = [
  { id: 1, nombre: "Buggy Rojo", color: "Rojo", modelo: "XR-01", estado: "disponible" },
  { id: 2, nombre: "Monster Verde", color: "Verde", modelo: "MT-2", estado: "disponible" },
  { id: 3, nombre: "Rally Azul", color: "Azul", modelo: "RX-A", estado: "mantenimiento" },
  { id: 4, nombre: "Drift Negro", color: "Negro", modelo: "DF-8", estado: "disponible" },
];

export const seedTramos = [
  { id: 1, minutos: 15, activo: true, orden: 1 },
  { id: 2, minutos: 30, activo: true, orden: 2 },
  { id: 3, minutos: 45, activo: false, orden: 3 },
];

export const seedUsuarios = [
  { id: 1, nombre: "Ana", usuario: "ana", rol: "operador" },
  { id: 2, nombre: "Luis", usuario: "luis", rol: "supervisor" },
  { id: 3, nombre: "Admin", usuario: "admin", rol: "admin" },
];

export const tarifaGlobal = 8000; // COP por tramo

export function formatoMoneda(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

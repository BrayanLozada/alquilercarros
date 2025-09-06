# Sistema de alquiler de vehiculos a control remoto

Este repositorio contiene la estructura base de un sistema con frontend y backend.

## Frontend

Construido con [React](https://react.dev/) y [Vite](https://vitejs.dev/)
configurado con [Tailwind CSS](https://tailwindcss.com/).
El código fuente se encuentra en el directorio `frontend`.

## Backend

API desarrollada en [Node.js](https://nodejs.org/) usando
[Express](https://expressjs.com/) con conexión a una base de datos
[SQLite](https://www.sqlite.org/index.html). El código fuente se encuentra en
 el directorio `backend`.

## Reportes

El backend expone varias rutas para obtener listados y estadísticas de los
alquileres. Todos los endpoints devuelven JSON por defecto y soportan los
parámetros `?format=csv` o `?format=xlsx` para descargar la información.

- `GET /reportes/alquileres-dia?fecha=YYYY-MM-DD`: alquileres de la fecha y
  conteo total.
- `GET /reportes/metodos-pago?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`: cantidades y
  montos por método de pago.
- `GET /reportes/ingresos?periodo=diario|semanal|mensual`: sumatoria de ingresos
  por período.
- `GET /reportes/ocupacion?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`: tiempo en uso vs
  disponible por carro.
- `POST /cierres-turno`: registra el cierre de turno de un operador y los
  totales asociados.

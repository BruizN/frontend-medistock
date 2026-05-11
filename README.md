# MEDISTOCK Frontend (Cliente SPA)

Este es el repositorio del cliente frontend construido con Vite y React para conectarse a la API de Medistock.

## Arquitectura (Despliegue Separado)
Esta aplicación está diseñada para ser desplegada en un servidor distinto al backend (ej. AWS S3 + CloudFront, Vercel, o un EC2 separado), cumpliendo con la necesidad de separación física de componentes y demostrando la integración HTTP.

## Instalación y Uso Local
1. `npm install`
2. `npm run dev`

## Configuración
La aplicación se comunica por defecto con `http://localhost:8000/api/v1` (Backend).

## Repositorio Backend
Asegúrate de clonar y levantar el servidor Backend en su propio entorno para que este cliente pueda funcionar.

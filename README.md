# EduAudio IA

## Descripción

EduAudio IA es una plataforma web desarrollada para transformar documentos PDF y Word en contenido auditivo mediante Inteligencia Artificial.

El sistema extrae el contenido del documento, genera un resumen inteligente mediante Gemini IA y posteriormente convierte dicho resumen en audio. Además, permite visualizar el resumen sincronizado durante la reproducción para mejorar la comprensión del contenido.

---

## Características principales

- Registro e inicio de sesión de usuarios.
- Recuperación de contraseña por correo electrónico.
- Carga de documentos PDF y Word.
- Generación de resúmenes inteligentes.
- Conversión automática de texto a audio.
- Biblioteca personal de audios.
- Reproducción de audio sincronizada con texto.
- Gestión de perfil de usuario.
- Descarga, edición y eliminación de audios.

---

## Tecnologías utilizadas

### Frontend
- React
- Vite
- JavaScript
- CSS Modules

### Backend
- Node.js
- Express

### Base de datos
- MongoDB Atlas

### Inteligencia Artificial
- Gemini IA

### Almacenamiento
- Cloudinary

### Servicio de correo
- Resend

### Conversión de texto a voz
- gTTS

### Despliegue
- Vercel
- Railway

### Pruebas
- Vitest
- Cypress
- Apache JMeter

---

## Arquitectura

Frontend (React + Vite)
↓
API REST
↓
Backend (Node.js + Express)
↓
MongoDB Atlas
Gemini IA
Cloudinary

---

## Flujo de funcionamiento

PDF / DOCX
↓
Extracción de texto
↓
Limpieza del contenido
↓
Generación de resumen mediante Gemini IA
↓
Conversión de texto a voz
↓
Almacenamiento en Cloudinary
↓
Registro en MongoDB
↓
Biblioteca de audios

---

## Pruebas realizadas

### Vitest
Pruebas unitarias para validar componentes y funcionalidades individuales.

### Cypress
Pruebas End-to-End para verificar los flujos principales del sistema.

### Apache JMeter
Pruebas de carga para evaluar rendimiento y tiempos de respuesta.

---

## Autor

Karina Romero Méndez

Tecnólogo en Análisis y Desarrollo de Software (ADSO)

SENA
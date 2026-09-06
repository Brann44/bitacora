# Bitácora Semanal Pro (Supabase + Vercel + Gmail)

Aplicación moderna, desacoplada y ultra rápida para el control y registro de actividades semanales, subtareas, tiempos, metas y reportes ejecutivos enviados por Gmail.

---

## 🚀 Características Principales

- **Gestión de Actividades Semanales**: Registro interactivo de lunes a domingo con toggle estilo *Habit Tracker*.
- **Subtareas y Desglose de Horas**: Registro detallado de tiempos y notas por tarea.
- **Metas Semanales**: Seguimiento de objetivos prioritarios por semana con barra de progreso.
- **Reportes Ejecutivos**:
  - Descarga directa en **PDF** con diseño ejecutivo.
  - Exportación a **Excel (.xlsx)**.
  - Envío automático por **Gmail** con cuerpo en HTML estilizado y PDF adjunto.
- **Base de Datos en la Nube (Supabase)**: Sincronización multi-dispositivo en tiempo real sobre PostgreSQL.
- **Respaldo Local-First**: Funciona de inmediato sin conexión y permite exportar/importar respaldos completos en formato **JSON**.
- **Tema Oscuro y Claro**: Paleta moderna Slate con diseño responsivo.

---

## 📦 Comandos con Bun

```bash
# 1. Instalar dependencias
bun install

# 2. Iniciar servidor de desarrollo
bun run dev

# 3. Compilar para producción
bun run build

# 4. Previsualizar compilación
bun run preview
```

---

## 🗄️ Configuración de Supabase (1 minuto)

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo gratuito.
2. En el menú lateral izquierdo, ve a **SQL Editor** -> **New Query**.
3. Abre el archivo `supabase_schema.sql` de este proyecto, copia todo su contenido, pégalo en el editor de Supabase y haz clic en **Run**.
4. Ve a **Project Settings** -> **API** y copia:
   - `Project URL`
   - `anon public key`
5. Puedes pegarlas en el archivo `.env` o directamente en la pantalla de **Ajustes (Supabase Cloud)** dentro de la aplicación.

---

## ✉️ Configuración de Gmail para Envío de Reportes

Para enviar tus reportes directamente desde tu cuenta personal de Gmail:

1. Ve a tu cuenta de Google: [myaccount.google.com](https://myaccount.google.com).
2. Entra a la sección **Seguridad**.
3. Asegúrate de tener activa la **Verificación en 2 pasos**.
4. Busca **Contraseñas de aplicaciones** (o ingresa a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
5. Crea una clave llamada `Bitacora` y copia el código de 16 caracteres generado.
6. En Vercel o en tu `.env`, configura:
   ```env
   GMAIL_USER=tu_correo@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```

---

## ☁️ Despliegue en Vercel

1. Sube este repositorio a tu GitHub o usa el CLI de Vercel (`vercel`).
2. En el panel de Vercel, agrega las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
3. ¡Listo! Tu Bitácora estará disponible en `https://tu-proyecto.vercel.app`.

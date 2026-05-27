# 🚀 AuraScan: Web Audit Engine (Static Version)

**AuraScan** es una herramienta de auditoría técnica avanzada, rápida y ligera diseñada para evaluar instantáneamente la salud técnica y SEO de cualquier sitio web en tiempo real.

Esta es la **versión 100% estática** de la aplicación, ejecutada íntegramente en el navegador del cliente. No requiere base de datos, PHP, servidores backend ni dependencias externas pesadas. Es ideal para ser subida y desplegada de forma gratuita en **GitHub Pages**, Vercel, Netlify o cualquier otro hosting de archivos estáticos.

---

## 📑 Características Principales

* **Auditoría SEO On-Page:** Análisis de etiquetas meta, encabezados (H1-H6), densidad de contenido, alt en imágenes y legibilidad.
* **Escáner de Seguridad HTTP:** Verificación de protocolo SSL/HTTPS y estimación de cabeceras de seguridad activas.
* **Detección de Stack Tecnológico:** Identificación de CMS, frameworks JavaScript, CDNs y scripts de terceros.
* **Core Web Vitals Heurísticos:** Estimaciones de velocidad (LCP, CLS, FID) y adaptabilidad móvil.
* **Inspección de Enlaces:** Verificación en paralelo de la integridad de los enlaces usando proxies CORS en Javascript.
* **Exportación de Datos:** Descarga de reportes en JSON y reportes listos para imprimir en PDF.

---

## 💻 Arquitectura y Estructura de Carpetas

La aplicación está organizada de la siguiente manera:

```text
├── index.html          # Interfaz principal (HTML) y modal de ayuda integrado
└── assets/
    ├── css/
    │   └── style.css   # Estilos premium con tema oscuro y glassmorphism
    └── js/
        └── main.js     # Lógica de scraping y análisis en el cliente
```

### Flujo de Datos en el Cliente
1. El frontend toma la URL y la envía a través de un proxy CORS seguro y gratuito (AllOrigins).
2. El script recibe la estructura HTML de la página objetivo y la parsea localmente en el navegador usando la API nativa `DOMParser()`.
3. Se ejecutan los algoritmos de análisis y se renderiza dinámicamente el panel interactivo de resultados.

---

## 🚀 Despliegue en GitHub Pages

Para subir y hospedar esta herramienta de forma gratuita:

1. Crea un repositorio en tu cuenta de GitHub (ej. `aurascan`).
2. Sube todos los archivos del proyecto (`index.html`, `assets/`, `robots.txt`, `README.md`) al repositorio.
3. Ve a la pestaña **Settings** (Configuración) de tu repositorio.
4. En el menú lateral izquierdo, haz clic en **Pages**.
5. Bajo **Build and deployment**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
6. Haz clic en **Save** (Guardar).
7. En un par de minutos, GitHub te proporcionará el enlace público del sitio (ej. `https://tu-usuario.github.io/aurascan/`).

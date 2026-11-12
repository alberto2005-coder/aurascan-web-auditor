# AuraScan — auditoría web

[![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![GPL-3.0](https://img.shields.io/badge/Licencia-GPL--3.0-blue)](LICENSE)

[Español](#español) · [English](#english)

---

## Español

### Índice

- [Descripción](#descripción)
- [Qué analiza](#qué-analiza)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Ejecución local](#ejecución-local)
- [Despliegue](#despliegue)
- [Limitaciones y uso responsable](#limitaciones-y-uso-responsable)
- [Licencia](#licencia)

### Descripción

**AuraScan** es una suite de auditoría técnica web: una interfaz estática en HTML, CSS y JavaScript acompañada de un pequeño backend en **PHP** que hace de proxy para descargar el HTML remoto y ejecutar los escaneos de red.

### Qué analiza

- **SEO técnico**: títulos, metadatos, `robots.txt`, canonical, `hreflang` y jerarquía de encabezados `H1`–`H6`.
- **Open Graph y Twitter Cards**: cómo se verá la página al compartirla.
- **Rendimiento**: heurísticas de Core Web Vitals, peso del HTML y compresión.
- **Seguridad HTTP**: HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y contenido mixto.
- **Tecnologías visibles** en la página (CMS, analítica, frameworks).
- **Enlaces e imágenes**: comprobación de estado de cada recurso.
- **Subdominios comunes** con verificación de respuesta.
- **Puertos básicos** del host objetivo.
- **Exportación**: JSON, Markdown, PDF, `sitemap.xml` y `robots.txt`.

### Estructura del proyecto

```text
aurascan-web-auditor/
├── index.php              # Punto de entrada del frontend
├── api/
│   ├── proxy.php          # Proxy CORS y descarga remota
│   ├── ports.php          # Escaneo de puertos
│   └── subdomains.php     # Escaneo de subdominios
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── audit-engine.js # Motor de auditoría
│       ├── main.js         # Orquestación de la interfaz
│       └── ui-render.js    # Renderizado de resultados
├── php-portable/          # PHP portable para Windows (opcional)
├── robots.txt
├── LICENSE
└── README.md
```

### Requisitos

- **PHP 7.4 o superior**.
- Un servidor web (Apache, Nginx o el servidor integrado de PHP).
- Navegador moderno con `fetch()`, `DOMParser()` y módulos ES.

El frontend es estático, pero **necesita el backend PHP** de `api/`: sin él no puede descargar la página remota ni escanear red.

### Ejecución local

```bash
php -S localhost:8000
```

Abre <http://localhost:8000>. En Windows sin PHP instalado puedes usar la carpeta `php-portable/`.

### Despliegue

Sube el proyecto a un hosting con **PHP** y HTTPS. Los tres endpoints de `api/` deben poder hacer peticiones salientes; si el hosting las bloquea, la auditoría remota fallará. Activa `mod_rewrite` si usas Apache (el `.htaccess` ya está incluido).

### Limitaciones y uso responsable

- Algunos sitios bloquean el proxy por CORS, *rate limiting* o protección anti-bot.
- Los resultados de puertos y subdominios dependen de la red y de los permisos del servidor.
- Escanea **solo** dominios propios o para los que tengas autorización expresa. El escaneo de puertos y subdominios de terceros sin permiso puede ser ilegal según el país.

### Licencia

**GNU General Public License v3.0 (GPL-3.0)** — consulta [LICENSE](LICENSE).

---

## English

### Table of contents

- [Overview](#overview)
- [What it analyses](#what-it-analyses)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Running locally](#running-locally)
- [Deployment](#deployment)
- [Limitations and responsible use](#limitations-and-responsible-use)
- [License](#license)

### Overview

**AuraScan** is a technical web audit suite: a static HTML, CSS and JavaScript frontend backed by a small **PHP** service that proxies the remote HTML download and runs the network scans.

### What it analyses

- **Technical SEO**: titles, metadata, `robots.txt`, canonical, `hreflang` and the `H1`–`H6` hierarchy.
- **Open Graph and Twitter Cards**: how the page looks when shared.
- **Performance**: Core Web Vitals heuristics, HTML weight and compression.
- **HTTP security**: HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and mixed content.
- **Visible technologies**: CMS, analytics and frameworks.
- **Links and images**: status checks for every resource.
- **Common subdomains** with response verification.
- **Basic ports** on the target host.
- **Exports**: JSON, Markdown, PDF, `sitemap.xml` and `robots.txt`.

### Project structure

```text
aurascan-web-auditor/
├── index.php              # Frontend entry point
├── api/
│   ├── proxy.php          # CORS proxy and remote fetch
│   ├── ports.php          # Port scanning
│   └── subdomains.php     # Subdomain scanning
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── audit-engine.js # Audit engine
│       ├── main.js         # UI orchestration
│       └── ui-render.js    # Result rendering
├── php-portable/          # Portable PHP for Windows (optional)
├── robots.txt
├── LICENSE
└── README.md
```

### Requirements

- **PHP 7.4 or later**.
- A web server (Apache, Nginx or PHP's built-in server).
- A modern browser with `fetch()`, `DOMParser()` and ES modules.

The frontend is static but **requires the PHP backend** under `api/`: without it, it cannot download the remote page or scan the network.

### Running locally

```bash
php -S localhost:8000
```

Open <http://localhost:8000>. On Windows without PHP installed you can use the `php-portable/` folder.

### Deployment

Deploy to a host with **PHP** and HTTPS. The three `api/` endpoints must be allowed to make outbound requests; if the host blocks them, remote audits will fail. Enable `mod_rewrite` on Apache (the `.htaccess` is already included).

### Limitations and responsible use

- Some sites block the proxy through CORS, rate limiting or anti-bot protection.
- Port and subdomain results depend on the network and server permissions.
- Scan **only** domains you own or have explicit permission to test. Port and subdomain scanning of third parties without authorisation may be illegal in your country.

### License

**GNU General Public License v3.0 (GPL-3.0)** — see [LICENSE](LICENSE).

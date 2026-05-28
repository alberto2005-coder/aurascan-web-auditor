# 🚀 AuraScan: Web Audit Engine
**AuraScan** es una suite de auditoría técnica web que combina una interfaz de cliente moderna con una pequeña API backend en PHP para permitir análisis SEO, seguridad, enlaces, subdominios y puertos.

> Esta aplicación usa HTML/CSS/JS en el frontend y requiere el backend PHP disponible en `api/` para la extracción de contenido remoto y los escaneos de red.

---

## 📌 Qué hace AuraScan

* Auditoría SEO técnica de páginas web.
* Revisión de encabezados (`H1`-`H6`), metadatos y etiquetas Open Graph.
* Análisis heurístico de Core Web Vitals y rendimiento percibido.
* Inspección de seguridad HTTP y soporte SSL.
* Detección de tecnologías visibles en la página.
* Verificación de enlaces e imágenes con comprobación de estado.
* Escaneo de subdominios comunes con verificación de respuesta.
* Escaneo de puertos básicos del host objetivo.
* Exportación de resultados a JSON, Markdown, PDF, sitemap y robots.txt.

---

## 📂 Estructura del proyecto

```text
├── index.php                 # Punto de entrada del frontend
├── LICENSE                  # Licencia personalizada del proyecto
├── README.md                # Documentación del proyecto
├── robots.txt               # Reglas de rastreo para bots
├── api/
│   ├── proxy.php            # Proxy CORS / fetch remoto
│   ├── ports.php            # Escaneo de puertos del host objetivo
│   └── subdomains.php       # Búsqueda de subdominios comunes
├── assets/
│   ├── css/
│   │   └── style.css        # Estilos principales
│   └── js/
│       ├── main.js          # Lógica de auditoría principal
│       └── ui-render.js     # Renderizado de resultados y ventanas
└── php-portable/            # PHP portable para Windows (opcional)
```

---

## ⚙️ Requisitos

* PHP 7.4 o superior.
* Un servidor web o el servidor PHP integrado (`php -S localhost:8000`).
* Navegador moderno con soporte para `fetch()`, `DOMParser()` y ES modules.

> El frontend es estático, pero necesita el backend PHP en `api/` para funcionar correctamente. No es una aplicación completamente estática en entornos sin PHP.

---

## 🚀 Cómo ejecutar localmente

1. Abre una terminal en la raíz del proyecto.
2. Ejecuta:

```powershell
php -S localhost:8000
```

3. Abre `http://localhost:8000` en tu navegador.

### Uso con la carpeta `php-portable`

Si usas Windows y no tienes PHP instalado, puedes ejecutar el servidor portable desde `php-portable`.

---

## 🛠️ Despliegue recomendado

Para un despliegue completo, usa un hosting que soporte PHP, ya que `api/` contiene los endpoints necesarios:

* `api/proxy.php` — obtención del HTML remoto.
* `api/subdomains.php` — escaneo de subdominios.
* `api/ports.php` — escaneo de puertos.

Si deseas mantenerlo local, basta con la carpeta raíz y PHP disponible en el servidor.

---

## 📜 Licencia

Este proyecto se distribuye bajo una licencia personalizada de **Alberto Ortiz (alberto2005-coder)**.

Resumen clave:

* ✅ Uso no comercial permitido.
* ❌ Prohibido el uso comercial sin autorización escrita.
* 🔁 Los forks deben mantener atribución visible y las mismas restricciones.
* 📌 Debe incluirse una copia completa del archivo `LICENSE` en redistribuciones.

Consulta el archivo `LICENSE` para los términos completos.

---

## 💡 Notas importantes

* La auditoría remota depende de la capacidad del objetivo para ser descargado vía HTTP(S).
* Algunos sitios con protección anti-bots o políticas CORS pueden bloquear el proxy.
* Los resultados de puertos y subdominios pueden variar según el entorno de red y permisos.

---

## 🤝 Atribución

Basado en el trabajo original de Alberto Ortiz (`alberto2005-coder`).

Mantén esta referencia visible en tu documentación y en cualquier fork o modificación.

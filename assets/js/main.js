// AuraScan Static Web Auditor - Orchestrator

let auditData = null;
let currentTab = 'tab-issues';
let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // Lucide Icons init
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Form Binding
    const auditForm = document.getElementById('auditForm');
    if (auditForm) {
        auditForm.addEventListener('submit', handleAuditSubmit);
    }

    // Theme Toggle binding
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('aurascan-theme') || 'dark';
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
        }

        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            if (isLight) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('aurascan-theme', 'dark');
                themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('aurascan-theme', 'light');
                themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    // Tab Binding
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            switchTab(target);
        });
    });

    // Help modal binding
    const helpToggleBtn = document.getElementById('helpToggleBtn');
    const helpCloseBtn = document.getElementById('helpCloseBtn');
    const helpOverlay = document.getElementById('helpOverlay');

    if (helpToggleBtn && helpOverlay) {
        helpToggleBtn.addEventListener('click', () => helpOverlay.classList.add('show'));
    }
    if (helpCloseBtn && helpOverlay) {
        helpCloseBtn.addEventListener('click', () => helpOverlay.classList.remove('show'));
    }

    // Help navigation binding
    const helpNavBtns = document.querySelectorAll('.help-nav-btn');
    helpNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            document.querySelectorAll('.help-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetSec = document.getElementById(target);
            if (targetSec) targetSec.classList.add('active');
        });
    });

    // FAQ accordions binding
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Filter Chips binding
    const chips = document.querySelectorAll('.filter-chips .chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.getAttribute('data-filter');
            renderIssues();
        });
    });

    // Export bindings
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportPDF);

    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);

    const exportMdBtn = document.getElementById('exportMdBtn');
    if (exportMdBtn) exportMdBtn.addEventListener('click', exportMarkdown);

    const exportSitemapBtn = document.getElementById('exportSitemapBtn');
    if (exportSitemapBtn) exportSitemapBtn.addEventListener('click', exportSitemap);

    const exportRobotsBtn = document.getElementById('exportRobotsBtn');
    if (exportRobotsBtn) exportRobotsBtn.addEventListener('click', exportRobots);

    // History initialization
    renderHistoryList();
    
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('aurascan_audit_history');
            renderHistoryList();
        });
    }
});

async function handleAuditSubmit(e) {
    e.preventDefault();
    const urlInput = document.getElementById('targetUrl');
    const keywordInput = document.getElementById('targetKeyword');
    const loader = document.getElementById('loader');
    const dashboard = document.getElementById('dashboard');
    const loaderTitle = document.getElementById('loaderTitle');
    const loaderSub = document.getElementById('loaderSub');

    if (!urlInput.value) return;

    let targetUrl = urlInput.value.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }
    const targetKeyword = keywordInput ? keywordInput.value.trim() : '';

    // Reset layout & show loader
    dashboard.classList.add('hidden');
    loader.classList.remove('hidden');
    loaderTitle.textContent = "Conectando con el sitio objetivo...";
    loaderSub.textContent = "Obteniendo código fuente mediante proxy local...";

    const progressFill = document.querySelector('.loader-progress-fill');
    if (progressFill) {
        progressFill.style.animation = 'none';
        void progressFill.offsetWidth;
        progressFill.style.animation = 'loaderProgress 30s linear forwards';
    }

    try {
        const startTime = performance.now();
        const proxyUrl = `api/proxy.php?url=${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('El proxy CORS no responde o rechazó la conexión.');

        const data = await response.json();
        const endTime = performance.now();
        const responseTime = (endTime - startTime) / 1000;

        if (!data || !data.contents) {
            throw new Error('El sitio solicitado no permite ser auditado de forma estática o el proxy no devolvió datos.');
        }

        const html = data.contents;
        const sizeKb = parseFloat((html.length / 1024).toFixed(1));

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Stage 1: Core SEO Audit
        loaderTitle.textContent = "Ejecutando auditoría SEO...";
        loaderSub.textContent = "Analizando estructura semántica y etiquetas meta...";
        auditData = runClientSideAudit(targetUrl, targetKeyword, doc, html, responseTime, sizeKb);

        // Stage 2: Subdomains Scan
        loaderTitle.textContent = "Analizando subdominios...";
        loaderSub.textContent = "Escaneando resolución de subdominios comunes de red...";
        await startSubdomainsScan();

        // Stage 3: Port Scan
        loaderTitle.textContent = "Escaneando puertos de red...";
        loaderSub.textContent = "Verificando el estado de servicios del servidor...";
        await startPortsScan();

        // Hide loader & show results
        loader.classList.add('hidden');
        dashboard.classList.remove('hidden');

        // Draw views using ui-render.js
        renderDashboard();

        // Save to localStorage history
        saveAuditToHistory(auditData);

        // Stage 4: Link Integrity (Ejecutado en segundo plano)
        checkLinksBatch(0, 15);

    } catch (err) {
        console.error(err);
        loader.classList.add('hidden');
        alert(`Error de Auditoría: ${err.message}\n\nNota técnica: Sitios con alta seguridad (como GitHub o Google) suelen bloquear proxies CORS públicos. Intente con un sitio web estándar.`);
    }
}

async function checkLinksBatch(offset, limit) {
    if (!auditData) return;
    const sum = auditData.links_summary;
    const allLinks = sum.all_links_list || [];

    const batch = allLinks.slice(offset, offset + limit);
    if (batch.length === 0) return;

    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    if (loadMoreWrapper) {
        loadMoreWrapper.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted);">Comprobando enlaces...</span>';
    }

    const promises = batch.map(async (linkUrl) => {
        try {
            const proxyUrl = `api/proxy.php?url=${encodeURIComponent(linkUrl)}`;
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 6000);

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(id);

            if (!response.ok) {
                return {
                    url: linkUrl,
                    status: null,
                    broken: true,
                    texts: sum.link_texts[linkUrl] || ['[Enlace]']
                };
            }

            const data = await response.json();
            const status = data.status;
            
            const broken = (status === null || (status >= 400 && status !== 403 && status !== 401));

            return {
                url: linkUrl,
                status: status,
                broken: broken,
                texts: sum.link_texts[linkUrl] || ['[Enlace]']
            };
        } catch (e) {
            return {
                url: linkUrl,
                status: null,
                broken: true,
                texts: sum.link_texts[linkUrl] || ['[Enlace]']
            };
        }
    });

    const results = await Promise.all(promises);

    sum.tested_details = [...sum.tested_details, ...results];
    sum.tested_count = sum.tested_details.length;
    sum.broken_count = sum.tested_details.filter(l => l.broken).length;
    sum.next_offset = offset + limit;
    sum.has_more = sum.next_offset < allLinks.length;

    renderLinksTab();
}

async function loadMoreLinks() {
    if (!auditData) return;
    const sum = auditData.links_summary;
    await checkLinksBatch(sum.next_offset, 15);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.getAttribute('id') === tabId);
    });

    currentTab = tabId;
}

function getMarkdownReport() {
    if (!auditData) return "";
    
    let md = `# Reporte de Auditoría AuraScan: ${new URL(auditData.url).hostname}\n\n`;
    md += `- **URL Auditada**: ${auditData.url}\n`;
    md += `- **Puntuación Global**: ${auditData.seo_score}%\n`;
    md += `- **Fecha del Reporte**: ${new Date().toLocaleString()}\n`;
    md += `- **Seguridad SSL**: ${auditData.ssl ? 'Seguro (HTTPS)' : 'Inseguro (HTTP)'}\n`;
    md += `- **Tiempo de Respuesta**: ${auditData.metadata.response_time_seconds ? auditData.metadata.response_time_seconds.toFixed(2) + 's' : 'N/A'}\n`;
    md += `- **Tamaño de Página**: ${auditData.metadata.page_size_kb || 0} KB\n\n`;

    md += `## Puntuaciones por Categoría\n\n`;
    const sub = auditData.sub_scores || {};
    md += `- **SEO Técnico**: ${sub.seo || 0}%\n`;
    md += `- **Accesibilidad**: ${sub.accessibility || 0}%\n`;
    md += `- **Contenido y Estructura**: ${sub.content || 0}%\n`;
    md += `- **Rendimiento (Web Vitals)**: ${sub.performance || 0}%\n`;
    md += `- **Seguridad de Servidor**: ${(auditData.security && auditData.security.security_score) || 0}%\n\n`;

    md += `## Metadatos Principales\n\n`;
    md += `- **Título (etiqueta title)**: ${auditData.metadata.title || '*No detectado*'}\n`;
    md += `- **Descripción (Meta Description)**: ${auditData.metadata.description || '*No detectada*'}\n\n`;

    md += `## Problemas Detectados\n\n`;
    let issues = auditData.issues || [];
    if (auditData.security && auditData.security.issues) {
        const secIssues = auditData.security.issues.map(i => ({
            severity: 'warning',
            category: 'security',
            message: `Cabecera ausente: ${i.label}.`,
            solution: i.tip
        }));
        issues = [...issues, ...secIssues];
    }

    if (issues.length === 0) {
        md += `*No se detectaron problemas.* \n\n`;
    } else {
        issues.forEach((issue, idx) => {
            md += `### ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
            md += `- **Categoría**: ${issue.category ? issue.category.toUpperCase() : 'SEO'}\n`;
            if (issue.solution) {
                md += `- **Solución recomendada**: ${issue.solution}\n`;
            }
            md += `\n`;
        });
    }

    md += `## Estructura de Encabezados (H1-H6)\n\n`;
    const headings = auditData.headings || [];
    if (headings.length === 0) {
        md += `*No se detectaron encabezados.*\n\n`;
    } else {
        headings.forEach(h => {
            md += `${'#'.repeat(h.level + 2)} H${h.level}: ${h.text || '[Vacío]'}\n`;
        });
        md += `\n`;
    }

    md += `## Análisis de Contenido\n\n`;
    const content = auditData.content || {};
    md += `- **Cantidad de Palabras**: ${content.word_count || 0}\n`;
    md += `- **Tiempo de lectura estimado**: ${content.reading_time_minutes || 0} min\n`;
    md += `- **Longitud promedio de oraciones**: ${content.avg_sentence_length || 0} palabras\n`;
    if (content.placeholders_detected && content.placeholders_detected.length > 0) {
        md += `- **Marcadores de texto (Placeholders) detectados**: ${content.placeholders_detected.join(', ')}\n`;
    }
    
    const kw = auditData.keyword_analysis;
    if (kw) {
        md += `\n### Palabra Clave Objetivo: "${kw.keyword}"\n\n`;
        md += `- **Presente en Título**: ${kw.in_title ? 'Sí' : 'No'}\n`;
        md += `- **Presente en Meta Descripción**: ${kw.in_description ? 'Sí' : 'No'}\n`;
        md += `- **Presente en H1**: ${kw.in_h1 ? 'Sí' : 'No'}\n`;
        md += `- **Ocurrencias**: ${kw.occurrences} veces\n`;
        md += `- **Densidad**: ${kw.density_pct}%\n`;
    }
    md += `\n`;

    md += `## Seguridad de Cabeceras HTTP\n\n`;
    const sec = auditData.security;
    if (sec && sec.headers) {
        md += `- **Puntuación de Seguridad**: ${sec.security_score || 0}%\n`;
        md += `- **HTTPS activo**: ${sec.https_ok ? 'Sí' : 'No'}\n\n`;
        md += `| Cabecera | Estado | Valor / Recomendación |\n`;
        md += `| --- | --- | --- |\n`;
        Object.keys(sec.headers).forEach(key => {
            const h = sec.headers[key];
            md += `| ${h.label} | ${h.present ? '✅ Detectada' : '❌ No detectada'} | ${h.present ? h.value : h.tip} |\n`;
        });
    }
    md += `\n`;

    md += `## Tecnología Detectada\n\n`;
    const tech = auditData.tech;
    if (tech) {
        md += `### Stack Tecnológico\n\n`;
        const techs = tech.technologies || [];
        if (techs.length === 0) {
            md += `*No se detectaron tecnologías con cabeceras o meta etiquetas estándar.*\n\n`;
        } else {
            techs.forEach(t => {
                md += `- **${t.name}** (${t.type})\n`;
            });
            md += `\n`;
        }

        md += `### Scripts de terceros (Trackers / API)\n\n`;
        const third = tech.third_party || [];
        if (third.length === 0) {
            md += `*No se detectaron scripts de terceros.*\n\n`;
        } else {
            third.forEach(s => {
                md += `- **${s.name}** (${s.blocking ? 'Bloqueante' : 'Diferido/Asíncrono'})\n`;
            });
            md += `\n`;
        }
    }

    md += `## Core Web Vitals y Rendimiento Estático\n\n`;
    if (tech && tech.cwv) {
        const cwv = tech.cwv;
        md += `- **Carga de Imagen Principal (LCP)**: ${cwv.lcp_lazy_loaded ? 'Rendimiento Mejorable (Lazy Loaded)' : 'Excelente (Cargada Directamente)'}\n`;
        md += `- **Riesgo de Desplazamiento de Diseño (CLS)**: ${cwv.cls_risk_images > 0 ? `Riesgo Medio (${cwv.cls_risk_images} imágenes sin width/height explícitos)` : 'Bajo / Excelente'}\n`;
        md += `- **Bloqueo de Interactividad (FID)**: ${cwv.blocking_scripts && cwv.blocking_scripts.length > 0 ? 'Retraso potencial por scripts bloqueantes' : 'Excelente (Sin scripts bloqueantes)'}\n`;
        md += `- **Total de Scripts cargados**: ${cwv.total_scripts || 0}\n`;
        md += `- **Total de Hojas de Estilo**: ${cwv.total_stylesheets || 0}\n\n`;
    }

    md += `## Subdominios Descubiertos\n\n`;
    const subdomains = auditData.subdomains_scan;
    if (subdomains && subdomains.subdomains && subdomains.subdomains.length > 0) {
        md += `| Subdominio | IP | Estado |\n`;
        md += `| --- | --- | --- |\n`;
        subdomains.subdomains.forEach(sub => {
            md += `| ${sub.subdomain} | ${sub.ip} | ${sub.status} |\n`;
        });
    } else {
        md += `*No se detectaron subdominios adicionales activos.*\n`;
    }
    md += `\n`;

    md += `## Escáner de Puertos Abiertos (Host Principal)\n\n`;
    const ports = auditData.ports_scan;
    if (ports && ports.ports && ports.ports.length > 0) {
        md += `**Dirección IP**: ${ports.ip || 'No resuelta'}\n\n`;
        md += `| Puerto | Servicio | Estado |\n`;
        md += `| --- | --- | --- |\n`;
        ports.ports.forEach(p => {
            md += `| ${p.port} | ${p.service} | ${p.status === 'Open' ? '🟢 Abierto' : '🔴 Cerrado'} |\n`;
        });
    } else {
        md += `*No se completó el escaneo de puertos o no se encontraron puertos abiertos.*\n`;
    }
    md += `\n`;

    md += `## Integridad de Enlaces\n\n`;
    const links = auditData.links_summary;
    if (links) {
        md += `- **Enlaces Totales Encontrados**: ${links.total_found || 0}\n`;
        md += `- **Enlaces Verificados**: ${links.tested_count || 0}\n`;
        md += `- **Enlaces Rotos**: ${links.broken_count || 0}\n\n`;

        if (links.tested_details && links.tested_details.length > 0) {
            md += `### Detalles de Enlaces Verificados\n\n`;
            md += `| URL de Enlace | Texto de Ancla | Código Estado | Estado |\n`;
            md += `| --- | --- | --- | --- |\n`;
            links.tested_details.forEach(l => {
                md += `| ${l.url} | ${l.texts ? l.texts.join(', ') : ''} | ${l.status || 'Offline'} | ${l.broken ? '❌ Roto' : '✅ Correcto'} |\n`;
            });
        }
    }
    md += `\n`;

    md += `--- \n*Reporte generado automáticamente por AuraScan Web Auditor.*`;
    return md;
}

function exportJSON() {
    if (!auditData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `aurascan-report-${new URL(auditData.url).hostname}.json`);
    dlAnchorElem.click();
}

function exportMarkdown() {
    const md = getMarkdownReport();
    if (!md) return;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `aurascan-report-${new URL(auditData.url).hostname}.md`);
    dlAnchorElem.click();
}

function exportPDF() {
    if (!auditData) return;
    const mdContent = getMarkdownReport();
    
    let htmlContent = "";
    if (window.marked && window.marked.parse) {
        htmlContent = window.marked.parse(mdContent);
    } else {
        htmlContent = mdContent.replace(/\n/g, '<br>');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Por favor, permite las ventanas emergentes (pop-ups) para generar el PDF del reporte.");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte AuraScan - ${new URL(auditData.url).hostname}</title>
            <style>
                body {
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    line-height: 1.6;
                    color: #0f172a;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-size: 14px;
                }
                h1 {
                    font-size: 2.2rem;
                    color: #0f172a;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                h2 {
                    font-size: 1.5rem;
                    color: #1e3a8a;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 6px;
                    margin-top: 30px;
                    margin-bottom: 15px;
                }
                h3 {
                    font-size: 1.2rem;
                    color: #0f172a;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                ul, ol {
                    padding-left: 20px;
                    margin-bottom: 15px;
                }
                li {
                    margin-bottom: 6px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    margin-bottom: 20px;
                    font-size: 12px;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 8px 12px;
                    text-align: left;
                }
                th {
                    background-color: #f1f5f9;
                    font-weight: 600;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                a {
                    color: #2563eb;
                    text-decoration: none;
                }
                hr {
                    border: 0;
                    border-top: 1px solid #e2e8f0;
                    margin: 30px 0;
                }
                @media print {
                    body {
                        padding: 20px;
                    }
                    table {
                        page-break-inside: avoid;
                    }
                    h1, h2, h3 {
                        page-break-after: avoid;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="background:#f1f5f9; padding:15px; text-align:center; border-bottom:1px solid #cbd5e1; margin-bottom:20px; font-family:sans-serif;">
                <button onclick="window.print()" style="padding:10px 20px; font-weight:bold; background:#2563eb; color:white; border:none; border-radius:5px; cursor:pointer; font-size:14px;">Imprimir / Guardar como PDF</button>
                <button onclick="window.close()" style="padding:10px 20px; margin-left:10px; background:#64748b; color:white; border:none; border-radius:5px; cursor:pointer; font-size:14px;">Cerrar Ventana</button>
            </div>
            <div style="padding: 0 20px;">
                ${htmlContent}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function exportSitemap() {
    if (!auditData) return;
    
    const baseUrl = auditData.url;
    let linksList = auditData.internal_links || [];
    
    if (!linksList.includes(baseUrl)) {
        linksList = [baseUrl, ...linksList];
    }
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    linksList.forEach(link => {
        const escapedLink = link
            .replace(/&/g, '&amp;')
            .replace(/'/g, '&apos;')
            .replace(/"/g, '&quot;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;');
            
        xml += `  <url>\n`;
        xml += `    <loc>${escapedLink}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>${link === baseUrl ? '1.0' : '0.8'}</priority>\n`;
        xml += `  </url>\n`;
    });
    
    xml += `</urlset>`;
    
    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xml);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `sitemap.xml`);
    dlAnchorElem.click();
}

function exportRobots() {
    if (!auditData) return;
    
    const parsedUrl = new URL(auditData.url);
    const domain = parsedUrl.origin;
    
    let txt = `# Robots.txt generado automaticamente por AuraScan para ${parsedUrl.hostname}\n`;
    txt += `# Fecha: ${new Date().toLocaleDateString()}\n\n`;
    txt += `User-agent: *\n`;
    txt += `Allow: /\n\n`;
    txt += `# Rutas comunes a bloquear para mejorar seguridad y evitar rastreo innecesario\n`;
    txt += `Disallow: /admin/\n`;
    txt += `Disallow: /login/\n`;
    txt += `Disallow: /wp-admin/\n`;
    txt += `Disallow: /private/\n`;
    txt += `Disallow: /temp/\n`;
    txt += `Disallow: /cgi-bin/\n\n`;
    txt += `# Referencia al Sitemap\n`;
    txt += `Sitemap: ${domain}/sitemap.xml\n`;
    
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `robots.txt`);
    dlAnchorElem.click();
}

const HISTORY_KEY = 'aurascan_audit_history';
const MAX_HISTORY = 5;

function saveAuditToHistory(data) {
    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        // Remove existing audit for same URL
        history = history.filter(item => item.url !== data.url);
        // Prepend new audit
        history.unshift(data);
        // Slice to MAX_HISTORY
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistoryList();
    } catch (e) {
        console.error("Error saving audit to history:", e);
    }
}

function renderHistoryList() {
    const list = document.getElementById('recentAuditsList');
    const container = document.getElementById('recentAudits');
    if (!list || !container) return;

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    if (history.length === 0) {
        container.classList.add('hidden');
        list.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = '';

    history.forEach(item => {
        let hostname = item.url;
        try {
            hostname = new URL(item.url).hostname;
        } catch(e) {}
        
        const score = item.seo_score || 0;
        let scoreClass = 'critical';
        if (score >= 90) scoreClass = 'excellent';
        else if (score >= 80) scoreClass = 'good';
        else if (score >= 70) scoreClass = 'warning';

        const chip = document.createElement('div');
        chip.className = 'recent-chip';
        chip.innerHTML = `
            <span>${hostname}</span>
            <span class="score-badge ${scoreClass}">${score}%</span>
        `;
        chip.addEventListener('click', () => {
            auditData = item;
            const dashboard = document.getElementById('dashboard');
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
            if (dashboard) dashboard.classList.remove('hidden');
            
            // Set search input values
            const urlInput = document.getElementById('targetUrl');
            if (urlInput) urlInput.value = item.url;
            const keywordInput = document.getElementById('targetKeyword');
            if (keywordInput && item.keyword_analysis) {
                keywordInput.value = item.keyword_analysis.keyword || '';
            }

            renderDashboard();
        });
        list.appendChild(chip);
    });
}

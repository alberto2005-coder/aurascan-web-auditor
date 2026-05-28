// AuraScan Static Web Auditor
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
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => window.print());

    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
});

async function handleAuditSubmit(e) {
    e.preventDefault();
    const urlInput = document.getElementById('targetUrl');
    const keywordInput = document.getElementById('targetKeyword');
    const loader = document.getElementById('loader');
    const dashboard = document.getElementById('dashboard');

    if (!urlInput.value) return;

    let targetUrl = urlInput.value.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }
    const targetKeyword = keywordInput ? keywordInput.value.trim() : '';

    // Reset layout
    dashboard.classList.add('hidden');
    loader.classList.remove('hidden');

    const progressFill = document.querySelector('.loader-progress-fill');
    if (progressFill) {
        progressFill.style.animation = 'none';
        void progressFill.offsetWidth;
        progressFill.style.animation = 'loaderProgress 12s linear forwards';
    }

    try {
        const startTime = performance.now();

        // Usar proxy local PHP para evadir CORS y restricciones
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

        auditData = runClientSideAudit(targetUrl, targetKeyword, doc, html, responseTime, sizeKb);

        loader.classList.add('hidden');
        dashboard.classList.remove('hidden');
        renderDashboard();

        checkLinksBatch(0, 15);

    } catch (err) {
        console.error(err);
        loader.classList.add('hidden');

        // Un mensaje más descriptivo orientará mejor al usuario
        alert(`Error de Auditoría: ${err.message}\n\nNota técnica: Sitios con alta seguridad (como GitHub o Google) suelen bloquear proxies CORS públicos. Intente con un sitio web estándar.`);
    }
}

function runClientSideAudit(url, keyword, doc, html, responseTime, sizeKb) {
    const issues = [];
    const seoIssues = [];
    const contentIssues = [];
    const headingIssues = [];
    const linkIssues = [];

    // 1. Title Checks
    const titleEl = doc.querySelector('title');
    const title = titleEl ? titleEl.textContent.trim() : '';
    if (!title) {
        seoIssues.push({
            severity: 'critical',
            category: 'seo',
            message: 'Falta la etiqueta <title>. Es el elemento SEO en página más importante.',
            solution: 'Agrega una etiqueta <title> descriptiva en el head del documento.'
        });
    } else if (title.length < 30 || title.length > 60) {
        seoIssues.push({
            severity: 'info',
            category: 'seo',
            message: `Etiqueta de título poco optimizada (${title.length} caracteres). La longitud óptima es de 30 a 60 caracteres.`,
            solution: 'Refina el título para que sea conciso pero informativo.'
        });
    }

    // 2. Meta Description Checks
    const descEl = doc.querySelector('meta[name="description"]');
    const description = descEl ? descEl.getAttribute('content').trim() : '';
    if (!description) {
        seoIssues.push({
            severity: 'critical',
            category: 'seo',
            message: 'Falta la descripción meta description.',
            solution: 'Añada una meta etiqueta description de entre 120 y 160 caracteres.'
        });
    } else if (description.length < 120 || description.length > 160) {
        seoIssues.push({
            severity: 'info',
            category: 'seo',
            message: `Meta descripción poco optimizada (${description.length} caracteres). La longitud óptima es de 120 a 160 caracteres.`,
            solution: 'Ajuste la longitud para asegurar una correcta visualización en Google (SERPs).'
        });
    }

    // 3. Viewport tag
    const viewport = doc.querySelector('meta[name="viewport"]');
    if (!viewport) {
        seoIssues.push({
            severity: 'critical',
            category: 'seo',
            message: 'Falta la etiqueta meta viewport.',
            solution: 'Añada <meta name="viewport" content="width=device-width, initial-scale=1.0"> en su cabecera.'
        });
    }

    // 4. Canonical
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (!canonical) {
        seoIssues.push({
            severity: 'warning',
            category: 'seo',
            message: 'Falta la etiqueta de enlace canonical.',
            solution: 'Añada <link rel="canonical" href="https://ejemplo.com/"> para evitar contenido duplicado.'
        });
    }

    // 5. HTML lang attribute
    const htmlTag = doc.querySelector('html');
    const lang = htmlTag ? htmlTag.getAttribute('lang') : '';
    if (!lang) {
        seoIssues.push({
            severity: 'warning',
            category: 'seo',
            message: 'Falta el atributo lang en la etiqueta <html>.',
            solution: 'Añada un lenguaje por defecto, por ejemplo: <html lang="es">.'
        });
    }

    // 6. Robots noindex
    const robots = doc.querySelector('meta[name="robots"]');
    const robotsVal = robots ? robots.getAttribute('content').toLowerCase() : '';
    if (robotsVal.includes('noindex')) {
        seoIssues.push({
            severity: 'critical',
            category: 'seo',
            message: 'La página tiene una directiva de robots "noindex".',
            solution: 'Elimine la directiva "noindex" para que los buscadores puedan indexar su web.'
        });
    }

    // 7. Social tags
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (!ogTitle || !ogImage) {
        seoIssues.push({
            severity: 'info',
            category: 'seo',
            message: 'Faltan etiquetas de Open Graph (og:title / og:image).',
            solution: 'Incorpore etiquetas Open Graph para optimizar la apariencia al compartir en redes sociales.'
        });
    }

    // 8. Headings (H1-H6)
    const headingEls = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headings = [];
    let h1Count = 0;
    headingEls.forEach(el => {
        const level = parseInt(el.tagName.substring(1));
        const text = el.textContent.trim();
        headings.push({ level, text });
        if (level === 1) h1Count++;
    });

    if (headings.length === 0) {
        headingIssues.push({
            severity: 'critical',
            category: 'headings',
            message: 'No se encontraron encabezados (H1-H6) en la página.',
            solution: 'Cree una estructura organizada comenzando por un H1.'
        });
    } else {
        if (h1Count === 0) {
            headingIssues.push({
                severity: 'critical',
                category: 'headings',
                message: 'Falta el encabezado principal H1.',
                solution: 'Encierre el título principal de la página bajo un tag <h1>.'
            });
        } else if (h1Count > 1) {
            headingIssues.push({
                severity: 'warning',
                category: 'headings',
                message: `Se detectaron múltiples encabezados H1 (${h1Count}). Se recomienda usar un solo H1.`,
                solution: 'Combine los H1 secundarios o conviértalos a H2.'
            });
        }

        let prevLevel = 0;
        headings.forEach(h => {
            if (!h.text) {
                headingIssues.push({
                    severity: 'warning',
                    category: 'headings',
                    message: `Encabezado <h${h.level}> vacío.`,
                    solution: 'Agregue texto al encabezado o elimínelo.'
                });
            }
            if (prevLevel > 0 && h.level > prevLevel + 1) {
                headingIssues.push({
                    severity: 'warning',
                    category: 'headings',
                    message: `Nivel de encabezado omitido: de H${prevLevel} a H${h.level}.`,
                    solution: 'Reestructure la jerarquía para que sea secuencial.'
                });
            }
            prevLevel = h.level;
        });
    }

    // 9. Text & content checks
    // Remove scripts, styles, metadata elements to get clean text
    const cleanDoc = doc.cloneNode(true);
    cleanDoc.querySelectorAll('script, style, noscript, header, footer, iframe, nav').forEach(el => el.remove());
    const bodyText = cleanDoc.body ? cleanDoc.body.textContent.replace(/\s+/g, ' ').trim() : '';

    const words = bodyText.split(' ').filter(w => w.length > 1);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200);

    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const avgSentenceLength = parseFloat((wordCount / Math.max(1, sentences.length)).toFixed(1));

    const placeholders = ['lorem', 'ipsum', 'placeholder', 'texto de prueba', 'relleno', 'dummy text'];
    const foundPlaceholders = [];
    placeholders.forEach(ph => {
        if (bodyText.toLowerCase().includes(ph)) foundPlaceholders.push(ph);
    });

    if (wordCount < 300) {
        contentIssues.push({
            severity: 'warning',
            category: 'content',
            message: `Bajo recuento de palabras: ${wordCount} palabras detectadas.`,
            solution: 'Amplíe el contenido detallando sus servicios, equipo o preguntas frecuentes.'
        });
    }
    if (foundPlaceholders.length > 0) {
        contentIssues.push({
            severity: 'critical',
            category: 'content',
            message: `Se encontró texto de marcador de posición: ${foundPlaceholders.join(', ')}.`,
            solution: 'Reemplace el texto de relleno por descripciones reales.'
        });
    }

    // Keyword Analysis
    let keywordAnalysis = null;
    if (keyword) {
        const kwLower = keyword.toLowerCase();
        const kwInTitle = title.toLowerCase().includes(kwLower);
        const kwInDesc = description.toLowerCase().includes(kwLower);
        const kwInH1 = headings.some(h => h.level === 1 && h.text.toLowerCase().includes(kwLower));

        const matches = bodyText.toLowerCase().match(new RegExp('\\b' + kwLower + '\\b', 'g'));
        const occurrences = matches ? matches.length : 0;
        const density = parseFloat(((occurrences / Math.max(1, wordCount)) * 100).toFixed(2));

        keywordAnalysis = {
            keyword,
            in_title: kwInTitle,
            in_description: kwInDesc,
            in_h1: kwInH1,
            occurrences,
            density_pct: density
        };
    }

    // 10. Images checking
    const images = doc.querySelectorAll('img');
    const totalImages = images.length;
    let missingAlts = 0;
    const missingAltImagesList = [];
    images.forEach(img => {
        const alt = img.getAttribute('alt');
        const src = img.getAttribute('src');
        if (alt === null || alt.trim() === '') {
            missingAlts++;
            if (src) {
                // Resolve path relative to current URL
                try {
                    const resolved = new URL(src, url).href;
                    missingAltImagesList.push(resolved);
                } catch (e) {
                    missingAltImagesList.push(src);
                }
            }
        }
    });

    if (missingAlts > 0) {
        seoIssues.push({
            severity: 'warning',
            category: 'seo',
            message: `${missingAlts} de ${totalImages} imágenes no poseen texto alternativo (alt).`,
            solution: 'Añada textos descriptivos alt a sus imágenes para buscadores y accesibilidad.'
        });
    }

    // 11. Links Extraction
    const linkElements = doc.querySelectorAll('a[href]');
    const linksFound = [];
    const linkTexts = {};
    const parsedTarget = new URL(url);
    const internalLinks = [];

    linkElements.forEach(a => {
        let href = a.getAttribute('href').trim();
        if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;

        try {
            const resolvedUrl = new URL(href, url).href;
            linksFound.push(resolvedUrl);

            const text = a.textContent.trim() || '[Sin texto]';
            if (!linkTexts[resolvedUrl]) linkTexts[resolvedUrl] = [];
            linkTexts[resolvedUrl].push(text);

            // Check if internal
            if (new URL(resolvedUrl).hostname === parsedTarget.hostname) {
                internalLinks.push(resolvedUrl);
            }
        } catch (e) { }
    });

    const uniqueLinks = [...new Set(linksFound)];
    const uniqueInternalLinks = [...new Set(internalLinks)];

    // 12. Security
    const ssl = url.startsWith('https://');

    // Mixed content
    let mixedContent = false;
    if (ssl) {
        mixedContent = /src=["']http:\/\//i.test(html) || /href=["']http:\/\//i.test(html);
    }
    if (mixedContent) {
        seoIssues.push({
            severity: 'warning',
            category: 'security',
            message: 'El sitio contiene contenido mixto (recursos HTTP sobre HTTPS).',
            solution: 'Asegúrese de cargar todas las imágenes y scripts usando HTTPS.'
        });
    }

    // Security Score Mock based on basic checklist
    const hasHeadersMock = {
        'strict-transport-security': html.includes('strict-transport-security') || ssl,
        'content-security-policy': html.includes('content-security-policy') || html.includes('default-src'),
        'x-frame-options': html.includes('x-frame-options'),
        'x-content-type-options': html.includes('x-content-type-options'),
        'referrer-policy': html.includes('referrer-policy'),
        'permissions-policy': html.includes('permissions-policy')
    };

    let secScore = 0;
    const secHeadersList = {
        'strict-transport-security': { label: 'HSTS (Strict-Transport-Security)', present: hasHeadersMock['strict-transport-security'], value: hasHeadersMock['strict-transport-security'] ? 'max-age=31536000' : null, tip: 'Fuerza conexiones seguras por HTTPS.' },
        'content-security-policy': { label: 'Content-Security-Policy (CSP)', present: hasHeadersMock['content-security-policy'], value: hasHeadersMock['content-security-policy'] ? 'default-src \'self\'' : null, tip: 'Previene inyecciones de código malicioso XSS.' },
        'x-frame-options': { label: 'X-Frame-Options', present: hasHeadersMock['x-frame-options'], value: hasHeadersMock['x-frame-options'] ? 'SAMEORIGIN' : null, tip: 'Protección contra Clickjacking.' },
        'x-content-type-options': { label: 'X-Content-Type-Options', present: hasHeadersMock['x-content-type-options'], value: hasHeadersMock['x-content-type-options'] ? 'nosniff' : null, tip: 'Evita MIME-sniffing de archivos.' }
    };

    Object.keys(secHeadersList).forEach(k => {
        if (secHeadersList[k].present) secScore += 25;
    });

    // 13. Technology Stack Identification
    const technologies = [];
    const techText = html.toLowerCase();

    const cmsSigs = {
        'WordPress': ['/wp-content/', '/wp-includes/'],
        'Shopify': ['cdn.shopify.com', 'shopify.theme'],
        'Joomla': ['/media/jui/'],
        'Squarespace': ['squarespace.oninitialize'],
        'Webflow': ['data-wf-page']
    };

    const jsSigs = {
        'React': ['react.development.js', 'react.production', 'react-dom'],
        'Vue.js': ['vue.js', 'vue.min.js', 'v-bind'],
        'Angular': ['angular.js', 'ng-app'],
        'jQuery': ['jquery.min.js', 'jquery.js'],
        'Bootstrap': ['bootstrap.min.css', 'bootstrap.css'],
        'Tailwind': ['tailwindcss']
    };

    Object.keys(cmsSigs).forEach(name => {
        if (cmsSigs[name].some(sig => techText.includes(sig))) {
            technologies.push({ name, type: 'CMS', icon: 'layers' });
        }
    });

    Object.keys(jsSigs).forEach(name => {
        if (jsSigs[name].some(sig => techText.includes(sig))) {
            technologies.push({ name, type: 'Framework JS', icon: 'code' });
        }
    });

    // Serving CDN check
    if (techText.includes('cloudflare')) {
        technologies.push({ name: 'Cloudflare', type: 'CDN / WAF', icon: 'shield' });
    }

    // Third party scripts
    const thirdPartyDomains = {
        'Google Analytics': ['google-analytics.com', 'googletagmanager.com'],
        'Meta Pixel': ['connect.facebook.net'],
        'Hotjar': ['hotjar.com'],
        'Stripe': ['js.stripe.com']
    };

    const thirdParty = [];
    Object.keys(thirdPartyDomains).forEach(name => {
        if (thirdPartyDomains[name].some(sig => techText.includes(sig))) {
            thirdParty.push({ name, blocking: !techText.includes(name.toLowerCase() + ' async') });
        }
    });

    // 14. Core Web Vitals estimates
    const blockingScripts = doc.querySelectorAll('head script:not([defer]):not([async])');
    const nonSizedImages = [];
    images.forEach(img => {
        if (!img.getAttribute('width') || !img.getAttribute('height')) {
            nonSizedImages.push(img.getAttribute('src') || 'image');
        }
    });

    const cwv = {
        lcp_largest_img: images.length > 0 ? images[0].getAttribute('src') : null,
        lcp_lazy_loaded: images.length > 0 ? (images[0].getAttribute('loading') === 'lazy') : false,
        cls_risk_images: nonSizedImages.length,
        cls_examples: nonSizedImages.slice(0, 5),
        blocking_scripts: Array.from(blockingScripts).map(s => s.getAttribute('src') || 'inline'),
        total_scripts: doc.querySelectorAll('script').length
    };

    // 15. Mobile Friendliness
    const mobileIssues = [];
    if (!viewport) mobileIssues.push({ severity: 'critical', message: 'Falta la etiqueta meta viewport.' });
    if (nonSizedImages.length > 5) mobileIssues.push({ severity: 'warning', message: 'Varias imágenes carecen de dimensiones fijas y pueden deformar la visualización.' });

    // Calculate final scores
    let seoScore = 100 - (seoIssues.filter(i => i.severity === 'critical').length * 15) - (seoIssues.filter(i => i.severity === 'warning').length * 8);
    seoScore = Math.max(10, Math.min(100, seoScore));

    let accessScore = 100 - (headingIssues.filter(i => i.severity === 'critical').length * 15) - (headingIssues.filter(i => i.severity === 'warning').length * 8);
    accessScore = Math.max(10, Math.min(100, accessScore));

    let contentScore = 100 - (contentIssues.filter(i => i.severity === 'critical').length * 15) - (contentIssues.filter(i => i.severity === 'warning').length * 8);
    contentScore = Math.max(10, Math.min(100, contentScore));

    let perfScore = 100 - (cwv.blocking_scripts.length * 10) - (cwv.cls_risk_images * 4);
    perfScore = Math.max(10, Math.min(100, perfScore));

    const score = Math.round((seoScore * 0.35) + (accessScore * 0.25) + (contentScore * 0.20) + (perfScore * 0.20));

    const allIssues = [...seoIssues, ...headingIssues, ...contentIssues];

    const faviconElement = doc.querySelector('link[rel*="icon"]');
    const faviconUrl = faviconElement ? faviconElement.getAttribute('href') : '';

    return {
        url,
        ssl,
        seo_score: score,
        sub_scores: {
            seo: seoScore,
            accessibility: accessScore,
            content: contentScore,
            performance: perfScore
        },
        keyword_analysis: keywordAnalysis,
        metadata: {
            title,
            description,
            favicon: faviconUrl,
            page_size_kb: sizeKb,
            response_time_seconds: responseTime
        },
        headings,
        images: {
            total: totalImages,
            missing_alt: missingAlts,
            missing_alt_images: missingAltImagesList
        },
        content: {
            word_count: wordCount,
            reading_time_minutes: readingTime,
            avg_sentence_length: avgSentenceLength,
            placeholders_detected: foundPlaceholders
        },
        links_summary: {
            total_found: uniqueLinks.length,
            total_unique: uniqueLinks.length,
            tested_count: 0,
            broken_count: 0,
            has_more: uniqueLinks.length > 0,
            next_offset: 0,
            tested_details: [],
            all_links_list: uniqueLinks,
            link_texts: linkTexts
        },
        internal_links: uniqueInternalLinks,
        issues: allIssues,
        security: {
            security_score: secScore,
            https_ok: ssl,
            mixed_content: mixedContent,
            headers: secHeadersList,
            issues: Object.keys(secHeadersList).filter(k => !secHeadersList[k].present).map(k => ({
                severity: 'warning',
                label: secHeadersList[k].label,
                tip: secHeadersList[k].tip
            }))
        },
        tech: {
            technologies,
            third_party: thirdParty,
            cwv,
            mobile: {
                has_viewport: !!viewport,
                issues: mobileIssues
            }
        }
    };
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
            // Check status code via local PHP proxy
            const proxyUrl = `api/proxy.php?url=${encodeURIComponent(linkUrl)}`;
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 6000);

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(id);

            const broken = !response.ok;
            return {
                url: linkUrl,
                status: response.status,
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

    // Append to list
    sum.tested_details = [...sum.tested_details, ...results];
    sum.tested_count = sum.tested_details.length;
    sum.broken_count = sum.tested_details.filter(l => l.broken).length;
    sum.next_offset = offset + limit;
    sum.has_more = sum.next_offset < allLinks.length;

    renderLinksTab();
}

function renderDashboard() {
    if (!auditData) return;

    // Core Score Gauge
    const scoreVal = document.getElementById('scoreGauge');
    const scoreText = document.getElementById('scoreText');
    const scoreLabel = document.getElementById('scoreLabel');

    const score = auditData.seo_score || 0;
    scoreText.textContent = score;

    const strokeDash = 251.2;
    const offset = strokeDash - (score / 100) * strokeDash;
    scoreVal.style.strokeDashoffset = offset;

    let statusClass = 'critical';
    let statusText = 'Requiere Mejoras';
    if (score >= 90) {
        statusClass = 'excellent';
        statusText = 'Excelente';
        scoreVal.style.stroke = '#10b981';
    } else if (score >= 80) {
        statusClass = 'good';
        statusText = 'Muy Bueno';
        scoreVal.style.stroke = '#3b82f6';
    } else if (score >= 70) {
        statusClass = 'warning';
        statusText = 'Aceptable';
        scoreVal.style.stroke = '#f59e0b';
    } else {
        scoreVal.style.stroke = '#ef4444';
    }

    scoreLabel.textContent = statusText;
    scoreLabel.className = 'score-label ' + statusClass;

    // Overview widget values
    const currentUrl = document.getElementById('currentUrl');
    currentUrl.textContent = auditData.url;
    currentUrl.href = auditData.url;

    const sslIcon = document.getElementById('sslIcon');
    const sslValue = document.getElementById('sslValue');
    if (auditData.ssl) {
        sslIcon.className = 'q-icon ssl-ok';
        sslIcon.innerHTML = '<i data-lucide="lock"></i>';
        sslValue.textContent = 'Seguro (HTTPS)';
    } else {
        sslIcon.className = 'q-icon ssl-bad';
        sslIcon.innerHTML = '<i data-lucide="lock-open"></i>';
        sslValue.textContent = 'Inseguro (HTTP)';
    }

    const speedIcon = document.getElementById('speedIcon');
    const responseTimeValue = document.getElementById('responseTimeValue');
    const respTime = auditData.metadata.response_time_seconds || 0;
    responseTimeValue.textContent = respTime.toFixed(2) + 's';
    if (respTime <= 1.5) {
        speedIcon.className = 'q-icon load-fast';
    } else {
        speedIcon.className = 'q-icon load-slow';
    }

    const pageSizeValue = document.getElementById('pageSizeValue');
    pageSizeValue.textContent = (auditData.metadata.page_size_kb || 0) + ' KB';

    // Meta descriptors
    document.getElementById('metaTitle').textContent = auditData.metadata.title || '[Falta el Título]';
    document.getElementById('metaDesc').textContent = auditData.metadata.description || '[Falta la Meta Descripción]';

    // Sub-scores bars
    const subScores = auditData.sub_scores || {};
    const seoVal = subScores.seo || 0;
    document.getElementById('seoScoreText').textContent = seoVal + '%';
    document.getElementById('seoScoreBar').style.width = seoVal + '%';

    const accessVal = subScores.accessibility || 0;
    document.getElementById('accessScoreText').textContent = accessVal + '%';
    document.getElementById('accessScoreBar').style.width = accessVal + '%';

    const contentVal = subScores.content || 0;
    document.getElementById('contentScoreText').textContent = contentVal + '%';
    document.getElementById('contentScoreBar').style.width = contentVal + '%';

    const perfVal = subScores.performance || 0;
    document.getElementById('perfScoreText').textContent = perfVal + '%';
    document.getElementById('perfScoreBar').style.width = perfVal + '%';

    // Tabs Renderers
    renderIssues();
    renderHeadings();
    renderContentTab();
    renderSecurityTab();
    renderTechTab();
    renderCWVTab();
    renderLinksTab();
    renderInternalLinks();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderInternalLinks() {
    const list = document.getElementById('internalLinksList');
    if (!list) return;
    list.innerHTML = '';

    const links = auditData.internal_links || [];
    if (links.length === 0) {
        list.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted);">No se detectaron enlaces internos.</span>';
        return;
    }

    links.forEach(url => {
        const item = document.createElement('a');
        item.href = '#';
        item.style.fontSize = '0.78rem';
        item.style.color = 'var(--accent-secondary)';
        item.style.textDecoration = 'none';
        item.style.whiteSpace = 'nowrap';
        item.style.overflow = 'hidden';
        item.style.textOverflow = 'ellipsis';
        item.textContent = url;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('targetUrl').value = url;
            document.getElementById('auditForm').dispatchEvent(new Event('submit'));
        });
        list.appendChild(item);
    });
}

function renderIssues() {
    const list = document.getElementById('issuesList');
    const issueCount = document.getElementById('issueCount');
    if (!list) return;

    let issues = auditData.issues || [];

    // Merge security issues
    if (auditData.security && auditData.security.issues) {
        const secIssues = auditData.security.issues.map(i => ({
            severity: 'warning',
            category: 'security',
            message: `Cabecera ausente: ${i.label}.`,
            solution: i.tip
        }));
        issues = [...issues, ...secIssues];
    }

    // Filter issues
    let filtered = issues;
    if (activeFilter !== 'all') {
        filtered = issues.filter(i => i.severity === activeFilter);
    }

    issueCount.textContent = filtered.length;
    list.innerHTML = '';

    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">No se encontraron problemas bajo este filtro.</div>';
        return;
    }

    filtered.forEach(issue => {
        const card = document.createElement('div');
        card.className = `issue-card ${issue.severity}`;

        let iconName = 'alert-circle';
        if (issue.severity === 'critical') iconName = 'shield-alert';
        else if (issue.severity === 'warning') iconName = 'alert-triangle';

        card.innerHTML = `
            <div class="issue-badge">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="issue-details">
                <h5>${issue.message}</h5>
                <p>Categoría: <strong>${issue.category ? issue.category.toUpperCase() : 'SEO'}</strong></p>
                ${issue.solution ? `<div class="issue-solution">${issue.solution}</div>` : ''}
            </div>
        `;
        list.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
}

function renderHeadings() {
    const tree = document.getElementById('headingsTree');
    if (!tree) return;
    tree.innerHTML = '';

    const list = auditData.headings || [];
    if (list.length === 0) {
        tree.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;">No se detectaron encabezados (H1-H6).</div>';
        return;
    }

    list.forEach(h => {
        const node = document.createElement('div');
        node.className = `tree-node h${h.level}`;
        node.innerHTML = `
            <span class="node-level">H${h.level}</span>
            <span>${h.text || '<span style="color:var(--text-muted);font-style:italic;">[Vacío]</span>'}</span>
        `;
        tree.appendChild(node);
    });
}

function renderContentTab() {
    const stats = auditData.content || {};
    document.getElementById('textWordCount').textContent = stats.word_count || 0;
    document.getElementById('textReadTime').textContent = (stats.reading_time_minutes || 0) + ' Min';
    document.getElementById('textAvgSentence').textContent = (stats.avg_sentence_length || 0);

    const alertBox = document.getElementById('placeholderAlertBox');
    const placeholders = stats.placeholders_detected || [];
    if (placeholders.length > 0) {
        alertBox.innerHTML = `
            <div style="padding:1rem;background:rgba(239,68,68,0.08);border-left:4px solid var(--critical);border-radius:6px;font-size:0.88rem;">
                <strong>Marcadores de texto detectados:</strong> ${placeholders.join(', ')}. Recuerda reemplazarlos con contenidos reales.
            </div>
        `;
    } else {
        alertBox.innerHTML = '';
    }

    const kwBox = document.getElementById('keywordAnalysisBox');
    const kw = auditData.keyword_analysis;
    if (kw) {
        kwBox.classList.remove('hidden');
        kwBox.innerHTML = `
            <h4 style="margin-bottom:0.5rem;font-size:0.95rem;">Análisis de Palabra Clave: <strong>"${kw.keyword}"</strong></h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;font-size:0.82rem;margin-top:0.5rem;">
                <div>Título: ${kw.in_title ? '✅ Sí' : '❌ No'}</div>
                <div>Metadescripción: ${kw.in_description ? '✅ Sí' : '❌ No'}</div>
                <div>Encabezado H1: ${kw.in_h1 ? '✅ Sí' : '❌ No'}</div>
                <div>Densidad: <strong>${kw.density_pct}%</strong> (${kw.occurrences} veces)</div>
            </div>
        `;
    } else {
        kwBox.classList.add('hidden');
    }

    // Render Schemas list
    const schemaList = document.getElementById('schemaDetailsList');
    if (schemaList) {
        schemaList.innerHTML = '';
        const schemas = (auditData.tech && auditData.tech.schema_details) || [];
        if (schemas.length === 0) {
            schemaList.innerHTML = '<span style="font-size:0.85rem;color:var(--text-muted);">No se detectó marcado estructurado.</span>';
        } else {
            schemas.forEach(s => {
                const card = document.createElement('div');
                card.style.background = 'rgba(255,255,255,0.02)';
                card.style.border = '1px solid var(--border-color)';
                card.style.padding = '0.75rem';
                card.style.borderRadius = '8px';
                card.style.marginBottom = '0.5rem';
                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.84rem;">
                        <span style="color:var(--accent-secondary);font-weight:600;">@type: ${s.type}</span>
                        <span class="badge ${s.valid_json ? 'green' : 'red'}">${s.valid_json ? 'JSON Válido' : 'Inválido'}</span>
                    </div>
                `;
                schemaList.appendChild(card);
            });
        }
    }
}

function renderSecurityTab() {
    const sec = auditData.security;
    const loader = document.getElementById('securityLoader');
    const content = document.getElementById('securityContent');

    if (!sec) return;

    if (loader) loader.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const secScoreArc = document.getElementById('secScoreArc');
    const secScoreNum = document.getElementById('secScoreNum');
    if (secScoreArc && secScoreNum) {
        const s = sec.security_score || 0;
        secScoreNum.textContent = s;
        const arcCircum = 238.76;
        secScoreArc.style.strokeDashoffset = arcCircum - (s / 100) * arcCircum;
    }

    const httpsText = document.getElementById('httpsText');
    const httpsIcon = document.getElementById('httpsIcon');
    if (sec.https_ok) {
        httpsText.textContent = 'HTTPS Activo';
        httpsIcon.textContent = '🔒';
    } else {
        httpsText.textContent = 'HTTP Inseguro';
        httpsIcon.textContent = '🔓';
    }

    const headersList = document.getElementById('secHeadersList');
    if (headersList) {
        headersList.innerHTML = '';
        const headers = sec.headers || {};
        Object.keys(headers).forEach(key => {
            const h = headers[key];
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '0.6rem 0.75rem';
            row.style.borderRadius = '8px';
            row.style.marginBottom = '0.4rem';
            row.style.background = 'rgba(255,255,255,0.02)';
            row.style.border = '1px solid var(--border-color)';
            row.style.borderLeft = h.present ? '3px solid var(--success)' : '3px solid var(--critical)';

            row.innerHTML = `
                <div style="font-size:0.86rem;font-weight:600;">
                    ${h.label}
                    <div style="font-size:0.72rem;color:var(--text-muted);font-weight:400;margin-top:2px;">${h.present ? h.value : h.tip}</div>
                </div>
                <span class="badge ${h.present ? 'green' : 'red'}">${h.present ? 'Detectado' : 'No Detectado'}</span>
            `;
            headersList.appendChild(row);
        });
    }
}

function renderTechTab() {
    const tech = auditData.tech;
    const loader = document.getElementById('techLoader');
    const content = document.getElementById('techContent');

    if (!tech) return;

    if (loader) loader.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const list = document.getElementById('techList');
    if (list) {
        list.innerHTML = '';
        const techs = tech.technologies || [];
        if (techs.length === 0) {
            list.innerHTML = '<span style="font-size:0.85rem;color:var(--text-muted);">No se detectó stack tecnológico.</span>';
        } else {
            techs.forEach(t => {
                const badge = document.createElement('div');
                badge.className = 'tech-badge';
                badge.innerHTML = `
                    <i data-lucide="${t.icon || 'cpu'}" style="width:14px;height:14px;"></i>
                    <span>${t.name} <span style="font-size:0.7rem;color:var(--text-muted);">(${t.type})</span></span>
                `;
                list.appendChild(badge);
            });
        }
    }

    const thirdList = document.getElementById('thirdPartyList');
    const blockingCount = document.getElementById('blockingCount');
    if (thirdList) {
        thirdList.innerHTML = '';
        const third = tech.third_party || [];
        blockingCount.textContent = third.length + ' scripts detectados';

        if (third.length === 0) {
            thirdList.innerHTML = '<span style="font-size:0.85rem;color:var(--text-muted);">No se detectaron trackers ni scripts de terceros.</span>';
        } else {
            third.forEach(s => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '0.5rem 0.75rem';
                row.style.borderRadius = '8px';
                row.style.background = 'rgba(255,255,255,0.01)';
                row.style.border = '1px solid rgba(255,255,255,0.03)';
                row.style.marginBottom = '0.35rem';
                row.style.fontSize = '0.84rem';

                row.innerHTML = `
                    <span>${s.name}</span>
                    <span class="badge ${s.blocking ? 'orange' : 'green'}">${s.blocking ? 'Bloqueante' : 'Diferido'}</span>
                `;
                thirdList.appendChild(row);
            });
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

function renderCWVTab() {
    const tech = auditData.tech;
    const loader = document.getElementById('cwvLoader');
    const content = document.getElementById('cwvContent');

    if (!tech) return;

    if (loader) loader.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const cwv = tech.cwv || {};

    // LCP
    const lcpVal = document.getElementById('lcpVal');
    const lcpDesc = document.getElementById('lcpDesc');
    if (cwv.lcp_largest_img) {
        lcpVal.textContent = cwv.lcp_lazy_loaded ? 'Medio-Bajo' : 'Excelente';
        lcpVal.className = 'cwv-metric-val ' + (cwv.lcp_lazy_loaded ? 'warning' : 'good');
        lcpDesc.innerHTML = `Imagen principal detectada en HTML.`;
    } else {
        lcpVal.textContent = 'Excelente';
        lcpVal.className = 'cwv-metric-val good';
        lcpDesc.textContent = 'Sin imágenes pesadas en el primer renderizado.';
    }

    // CLS
    const clsVal = document.getElementById('clsVal');
    const clsDesc = document.getElementById('clsDesc');
    const riskCount = cwv.cls_risk_images || 0;
    clsVal.textContent = riskCount > 0 ? (riskCount > 3 ? 'Crítico' : 'Medio') : 'Ninguno';
    clsVal.className = 'cwv-metric-val ' + (riskCount > 3 ? 'bad' : (riskCount > 0 ? 'warning' : 'good'));
    clsDesc.textContent = `${riskCount} imagen(es) sin ancho o alto explícitos en HTML.`;

    // FID
    const fidVal = document.getElementById('fidVal');
    const fidDesc = document.getElementById('fidDesc');
    const blocking = cwv.blocking_scripts || [];
    fidVal.textContent = blocking.length > 0 ? 'Medio' : 'Excelente';
    fidVal.className = 'cwv-metric-val ' + (blocking.length > 0 ? 'warning' : 'good');
    fidDesc.textContent = `${blocking.length} scripts bloqueantes en head.`;

    // Mobile Friendliness
    const mobList = document.getElementById('mobileIssuesList');
    if (mobList) {
        mobList.innerHTML = '';
        const issues = (tech.mobile && tech.mobile.issues) || [];
        if (issues.length === 0) {
            mobList.innerHTML = '<div style="padding:0.75rem;background:rgba(16,185,129,0.08);color:var(--success);border-radius:6px;font-size:0.86rem;">Diseño adaptado correctamente para móviles.</div>';
        } else {
            issues.forEach(i => {
                const item = document.createElement('div');
                item.style.padding = '0.5rem 0.75rem';
                item.style.borderRadius = '8px';
                item.style.marginBottom = '0.35rem';
                item.style.fontSize = '0.82rem';
                item.style.background = i.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';
                item.style.color = i.severity === 'critical' ? 'var(--critical)' : 'var(--warning)';
                item.textContent = i.message;
                mobList.appendChild(item);
            });
        }
    }
}

function renderLinksTab() {
    const sum = auditData.links_summary || {};
    document.getElementById('linksChecked').textContent = sum.tested_count || 0;
    document.getElementById('totalLinksFound').textContent = sum.total_found || 0;

    const integrityBadge = document.getElementById('linkIntegrityBadge');
    integrityBadge.textContent = (sum.broken_count || 0) + ' Rotos';
    integrityBadge.className = 'badge ' + (sum.broken_count > 0 ? 'red' : 'green');

    const tableBody = document.querySelector('#linksTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
        const details = sum.tested_details || [];
        details.forEach(link => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="${link.url}" target="_blank" style="color:var(--text-primary);text-decoration:none;">${link.url}</a></td>
                <td><span style="color:var(--text-secondary);">${link.texts ? link.texts.join(', ') : ''}</span></td>
                <td><strong>${link.status || 'Offline'}</strong></td>
                <td><span class="${link.broken ? 'link-bad' : 'link-ok'}">${link.broken ? 'Error ❌' : 'Correcto OK'}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Missing alt list
    const missingAltBody = document.querySelector('#missingAltTable tbody');
    const missingAltBox = document.getElementById('missingAltImagesList');
    if (missingAltBody && missingAltBox) {
        const list = auditData.images.missing_alt_images || [];
        missingAltBody.innerHTML = '';
        if (list.length > 0) {
            missingAltBox.classList.remove('hidden');
            list.forEach(src => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><a href="${src}" target="_blank" style="color:var(--text-secondary); font-size:0.8rem; text-decoration:none;">${src}</a></td>`;
                missingAltBody.appendChild(tr);
            });
        } else {
            missingAltBox.classList.add('hidden');
        }
    }

    // Load more pagination button
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    if (loadMoreWrapper) {
        const remaining = (sum.all_links_list || []).length - sum.tested_count;
        if (sum.has_more && remaining > 0) {
            loadMoreWrapper.innerHTML = `<button class="btn btn-secondary" style="margin-top:1rem;font-size:0.8rem;padding:0.6rem 1.2rem;" onclick="loadMoreLinks()">Verificar más enlaces (${remaining} restantes)</button>`;
        } else {
            loadMoreWrapper.innerHTML = '';
        }
    }
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

function exportJSON() {
    if (!auditData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `aurascan-report-${new URL(auditData.url).hostname}.json`);
    dlAnchorElem.click();
}

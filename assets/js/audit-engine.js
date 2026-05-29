// AuraScan Client-Side Audit Engine

function isInternalHost(host1, host2) {
    if (!host1 || !host2) return false;
    const cleanHost1 = host1.split(':')[0].replace(/^www\./i, '').toLowerCase();
    const cleanHost2 = host2.split(':')[0].replace(/^www\./i, '').toLowerCase();
    return cleanHost1 === cleanHost2 || cleanHost1.endsWith('.' + cleanHost2) || cleanHost2.endsWith('.' + cleanHost1);
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
        let href = a.getAttribute('href');
        if (!href) return;
        href = href.trim();
        if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;

        try {
            const resolvedUrl = new URL(href, url).href;
            linksFound.push(resolvedUrl);

            const text = a.textContent.trim() || '[Sin texto]';
            if (!linkTexts[resolvedUrl]) linkTexts[resolvedUrl] = [];
            linkTexts[resolvedUrl].push(text);

            // Check if internal (using fixed hostname verification)
            const linkHostname = new URL(resolvedUrl).hostname;
            if (isInternalHost(linkHostname, parsedTarget.hostname) || href.startsWith('/') || href.startsWith('.') || !href.includes('://')) {
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

    if (techText.includes('cloudflare')) {
        technologies.push({ name: 'Cloudflare', type: 'CDN / WAF', icon: 'shield' });
    }

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
        total_scripts: doc.querySelectorAll('script').length,
        total_stylesheets: doc.querySelectorAll('link[rel="stylesheet"]').length
    };

    // 15. Mobile Friendliness
    const mobileIssues = [];
    if (!viewport) mobileIssues.push({ severity: 'critical', message: 'Falta la etiqueta meta viewport.' });
    if (nonSizedImages.length > 5) mobileIssues.push({ severity: 'warning', message: 'Varias imágenes carecen de dimensiones fijas y pueden deformar la visualización.' });

    // Schema JSON-LD structured data extraction
    const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemaDetails = [];
    schemaScripts.forEach(script => {
        const content = script.textContent.trim();
        if (!content) return;
        try {
            const parsed = JSON.parse(content);
            const getTypes = (obj) => {
                const types = [];
                if (typeof obj === 'object' && obj !== null) {
                    if (obj['@type']) {
                        if (Array.isArray(obj['@type'])) {
                            types.push(...obj['@type']);
                        } else {
                            types.push(obj['@type']);
                        }
                    }
                    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
                        obj['@graph'].forEach(item => {
                            types.push(...getTypes(item));
                        });
                    }
                }
                return types;
            };
            const typesFound = getTypes(parsed);
            if (typesFound.length > 0) {
                typesFound.forEach(t => {
                    schemaDetails.push({
                        type: typeof t === 'string' ? t : JSON.stringify(t),
                        valid_json: true
                    });
                });
            } else {
                schemaDetails.push({
                    type: 'Desconocido',
                    valid_json: true
                });
            }
        } catch (e) {
            schemaDetails.push({
                type: 'Error de Lectura',
                valid_json: false
            });
        }
    });

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
    
    let faviconUrl = '';
    const faviconElement = doc.querySelector('link[rel*="icon"]');
    if (faviconElement) {
        faviconUrl = faviconElement.getAttribute('href');
    } else {
        try {
            faviconUrl = new URL('/favicon.ico', url).href;
        } catch (e) {
            faviconUrl = '';
        }
    }

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
            schema_details: schemaDetails,
            cwv,
            mobile: {
                has_viewport: !!viewport,
                issues: mobileIssues
            }
        }
    };
}

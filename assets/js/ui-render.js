// AuraScan UI Rendering Library

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

    const secVal = (auditData.security && auditData.security.security_score) || 0;
    document.getElementById('securityScoreText').textContent = secVal + '%';
    document.getElementById('securityScoreBar').style.width = secVal + '%';

    // Tabs Renderers
    try { renderIssues(); } catch (e) { console.error("Error in renderIssues:", e); }
    try { renderHeadings(); } catch (e) { console.error("Error in renderHeadings:", e); }
    try { renderContentTab(); } catch (e) { console.error("Error in renderContentTab:", e); }
    try { renderSecurityTab(); } catch (e) { console.error("Error in renderSecurityTab:", e); }
    try { renderTechTab(); } catch (e) { console.error("Error in renderTechTab:", e); }
    try { renderCWVTab(); } catch (e) { console.error("Error in renderCWVTab:", e); }
    try { renderLinksTab(); } catch (e) { console.error("Error in renderLinksTab:", e); }


    // Trigger async subdomain and ports scan
    try { startSubdomainsScan(); } catch (e) { console.error(e); }
    try { startPortsScan(); } catch (e) { console.error(e); }

    if (window.lucide) {
        window.lucide.createIcons();
    }
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

    const clsVal = document.getElementById('clsVal');
    const clsDesc = document.getElementById('clsDesc');
    const riskCount = cwv.cls_risk_images || 0;
    clsVal.textContent = riskCount > 0 ? (riskCount > 3 ? 'Crítico' : 'Medio') : 'Ninguno';
    clsVal.className = 'cwv-metric-val ' + (riskCount > 3 ? 'bad' : (riskCount > 0 ? 'warning' : 'good'));
    clsDesc.textContent = `${riskCount} imagen(es) sin ancho o alto explícitos en HTML.`;

    const fidVal = document.getElementById('fidVal');
    const fidDesc = document.getElementById('fidDesc');
    const blocking = cwv.blocking_scripts || [];
    fidVal.textContent = blocking.length > 0 ? 'Medio' : 'Excelente';
    fidVal.className = 'cwv-metric-val ' + (blocking.length > 0 ? 'warning' : 'good');
    fidDesc.textContent = `${blocking.length} scripts bloqueantes en head.`;

    // Render resources counts
    const totalScriptsCount = document.getElementById('totalScriptsCount');
    if (totalScriptsCount) totalScriptsCount.textContent = cwv.total_scripts || 0;

    const stylesheetsCount = document.getElementById('stylesheetsCount');
    if (stylesheetsCount) stylesheetsCount.textContent = cwv.total_stylesheets || 0;

    const blockingScriptsList = document.getElementById('blockingScriptsList');
    if (blockingScriptsList) {
        blockingScriptsList.innerHTML = '';
        if (blocking.length === 0) {
            blockingScriptsList.innerHTML = '<span style="color:var(--success); font-size:0.78rem; padding:0.25rem; display:block;">¡No hay scripts bloqueantes!</span>';
        } else {
            blocking.forEach(script => {
                const item = document.createElement('div');
                item.style.padding = '0.2rem 0.35rem';
                item.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
                item.style.wordBreak = 'break-all';
                item.style.color = 'var(--text-secondary)';
                item.textContent = script;
                blockingScriptsList.appendChild(item);
            });
        }
    }

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
                <td><a href="${link.url}" target="_blank" style="color:var(--text-primary);text-decoration:none;word-break:break-all;">${link.url}</a></td>
                <td><span style="color:var(--text-secondary);">${link.texts ? link.texts.join(', ') : ''}</span></td>
                <td><strong>${link.status || 'Offline'}</strong></td>
                <td><span class="${link.broken ? 'link-bad' : 'link-ok'}">${link.broken ? 'Error ❌' : 'Correcto OK'}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    const missingAltBody = document.querySelector('#missingAltTable tbody');
    const missingAltBox = document.getElementById('missingAltImagesList');
    if (missingAltBody && missingAltBox) {
        const list = auditData.images.missing_alt_images || [];
        missingAltBody.innerHTML = '';
        const altSummary = document.getElementById('altSummaryText');
        
        if (list.length > 0) {
            if (altSummary) {
                altSummary.textContent = `Se detectaron ${auditData.images.missing_alt} imágenes sin descripción Alt:`;
            }
            missingAltBox.classList.remove('hidden');
            list.forEach(src => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                            <img src="${src}" alt="Previsualización" style="max-width: 120px; max-height: 80px; object-fit: contain; border-radius: 6px; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color);" onerror="this.style.display='none'">
                            <a href="${src}" target="_blank" style="color:var(--text-secondary); font-size:0.8rem; text-decoration:none; word-break:break-all; flex: 1; min-width: 200px;">${src}</a>
                        </div>
                    </td>`;
                missingAltBody.appendChild(tr);
            });
        } else {
            if (altSummary) {
                altSummary.textContent = '¡Todas las imágenes del sitio poseen textos alternativos descriptivos!';
            }
            missingAltBox.classList.add('hidden');
        }
    }

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

function renderSubdomainsData(data) {
    const list = document.getElementById('subdomainsList');
    const loader = document.getElementById('subdomainsLoader');
    if (!list) return;

    if (loader) loader.classList.add('hidden');

    if (!data.subdomains || data.subdomains.length === 0) {
        list.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1.5rem;">No se detectaron otros subdominios comunes activos.</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Subdominio</th>
                <th>Dirección IP</th>
                <th>Estado de Red</th>
                <th style="text-align:right; width: 120px;">Acción</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    data.subdomains.forEach(sub => {
        const tr = document.createElement('tr');
        const isOnline = sub.status === 'Online';
        tr.innerHTML = `
            <td><a href="http://${sub.subdomain}" target="_blank" style="color:var(--accent-secondary);text-decoration:none;font-weight:600;">${sub.subdomain}</a></td>
            <td><span style="font-family:monospace;color:var(--text-primary);">${sub.ip}</span></td>
            <td><span class="badge ${isOnline ? 'green' : 'orange'}">${sub.status}</span></td>
            <td style="text-align:right;"><button class="btn btn-secondary" style="font-size:0.7rem;padding:4px 8px;border-radius:4px;" onclick="triggerPortScanFor('${sub.subdomain}')">Escanear</button></td>
        `;
        tbody.appendChild(tr);
    });

    list.innerHTML = '';
    list.appendChild(table);
}

async function startSubdomainsScan() {
    if (auditData && auditData.subdomains_scan) {
        renderSubdomainsData(auditData.subdomains_scan);
        return;
    }

    const list = document.getElementById('subdomainsList');
    const loader = document.getElementById('subdomainsLoader');
    if (!list) return;

    if (loader) loader.classList.remove('hidden');
    list.innerHTML = '';

    try {
        const parsedUrl = new URL(auditData.url);
        const domain = parsedUrl.hostname;
        const res = await fetch(`api/subdomains.php?domain=${encodeURIComponent(domain)}`);
        if (!res.ok) throw new Error('Error al escanear subdominios');
        const data = await res.json();
        auditData.subdomains_scan = data;
        renderSubdomainsData(data);
    } catch (e) {
        if (loader) loader.classList.add('hidden');
        list.innerHTML = `<div style="color:var(--critical);font-size:0.9rem;text-align:center;padding:1.5rem;">Error al escanear subdominios: ${e.message}</div>`;
    }
}

window.triggerPortScanFor = function(host) {
    switchTab('tab-ports');
    startPortsScan(host);
};

function renderPortsData(data, targetHost) {
    const grid = document.getElementById('portsGrid');
    const loader = document.getElementById('portsLoader');
    const info = document.getElementById('portsHostInfo');
    if (!grid) return;

    if (loader) loader.classList.add('hidden');
    if (info) {
        info.classList.remove('hidden');
        info.innerHTML = `Escaneo finalizado para: <strong style="color:var(--accent-secondary);font-family:monospace;">${targetHost}</strong> (${data.ip || ''})`;
    }

    grid.innerHTML = '';
    const ports = data.ports || [];
    ports.forEach(p => {
        const card = document.createElement('div');
        const isOpen = p.status === 'Open';
        card.style.background = isOpen ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.01)';
        card.style.border = '1px solid ' + (isOpen ? 'rgba(16,185,129,0.2)' : 'var(--border-color)');
        card.style.borderRadius = '10px';
        card.style.padding = '1rem';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.gap = '0.35rem';
        card.style.textAlign = 'center';

        card.innerHTML = `
            <div style="font-size:1.15rem;font-weight:800;color:${isOpen ? 'var(--success)' : 'var(--text-muted)'};">${p.port}</div>
            <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">${p.service}</div>
            <span class="badge ${isOpen ? 'green' : 'red'}" style="font-size:0.65rem;padding:1px 6px;">${isOpen ? 'Abierto' : 'Cerrado'}</span>
        `;
        grid.appendChild(card);
    });
}

async function startPortsScan(customHost) {
    const targetHost = customHost || (auditData && new URL(auditData.url).hostname);

    if (!customHost && auditData && auditData.ports_scan) {
        renderPortsData(auditData.ports_scan, targetHost);
        return;
    }

    const grid = document.getElementById('portsGrid');
    const loader = document.getElementById('portsLoader');
    const info = document.getElementById('portsHostInfo');
    if (!grid) return;

    if (loader) loader.classList.remove('hidden');
    if (info) info.classList.add('hidden');
    grid.innerHTML = '';

    try {
        const res = await fetch(`api/ports.php?domain=${encodeURIComponent(targetHost)}`);
        if (!res.ok) throw new Error('Error al escanear puertos');
        const data = await res.json();

        if (!customHost && auditData) {
            auditData.ports_scan = data;
        }

        renderPortsData(data, targetHost);
    } catch (e) {
        if (loader) loader.classList.add('hidden');
        grid.innerHTML = `<div style="color:var(--critical);font-size:0.9rem;grid-column:1/-1;text-align:center;padding:1.5rem;">Error al escanear puertos: ${e.message}</div>`;
    }
}

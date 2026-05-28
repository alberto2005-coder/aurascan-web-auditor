<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AuraScan - Analizador Técnico de Sitios Web</title>
    <meta name="description" content="AuraScan es una herramienta premium de auditoría web instantánea y 100% estática. Analice SEO técnico, velocidad, Core Web Vitals, seguridad y enlaces directamente desde su navegador.">
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="glow-bg"></div>
    <div class="app-container">
        
        <!-- Header -->
        <header class="header">
            <div class="logo">
                <svg class="logo-icon-svg" viewBox="0 0 24 24">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#8b5cf6" />
                            <stop offset="100%" stop-color="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#logoGradient)"/>
                </svg>
                <div class="logo-text">
                    <h1>Aura<span>Scan</span></h1>
                    <p>Web Auditing Suite</p>
                </div>
            </div>
            <div class="header-actions" style="display: flex; gap: 0.5rem;">
                <button id="themeToggleBtn" class="theme-toggle-btn" aria-label="Cambiar Tema" title="Alternar Modo Oscuro/Claro">
                    <i data-lucide="sun"></i>
                </button>
                <button id="helpToggleBtn" class="theme-toggle-btn" aria-label="Ayuda" title="Guía y FAQ">
                    <i data-lucide="help-circle"></i>
                </button>
            </div>
        </header>

        <!-- Search Bar Section -->
        <section class="audit-search-section">
            <div class="search-card">
                <h2>Analizar Sitio Web</h2>
                <p>Auditoría SEO técnica instantánea ejecutada 100% en tu navegador a través de proxy seguro CORS.</p>
                
                <form id="auditForm" class="search-form">
                    <div class="input-wrapper" style="flex: 2; min-width: 280px;">
                        <i data-lucide="globe" class="input-icon"></i>
                        <input type="text" id="targetUrl" placeholder="ej. https://ejemplo.com" required autocomplete="off">
                    </div>
                    <div class="input-wrapper" style="flex: 1; min-width: 180px;">
                        <i data-lucide="key-round" class="input-icon"></i>
                        <input type="text" id="targetKeyword" placeholder="Palabra Clave (Opcional)" autocomplete="off">
                    </div>
                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <span>Iniciar Auditoría</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </form>
            </div>
        </section>

        <!-- Loading State -->
        <div id="loader" class="loader-container hidden">
            <div class="loader-card">
                <div class="spinner">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>
                <h3 id="loaderTitle">Conectando con el sitio objetivo...</h3>
                <p id="loaderSub">Extrayendo estructura HTML y metadatos mediante túnel CORS seguro.</p>
                <div class="loader-progress-bar">
                    <div class="loader-progress-fill"></div>
                </div>
            </div>
        </div>

        <!-- Dashboard Panel -->
        <main id="dashboard" class="dashboard-grid hidden">
            
            <!-- Sidebar: Overview Gauge & Meta -->
            <div class="db-sidebar">
                
                <div class="glass-card score-card">
                    <h3>Puntuación Global</h3>
                    <div class="gauge-container">
                        <svg viewBox="0 0 100 100" class="gauge">
                            <circle class="gauge-bg" cx="50" cy="50" r="40"></circle>
                            <circle class="gauge-val" id="scoreGauge" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="251.2"></circle>
                        </svg>
                        <div class="gauge-text">
                            <span id="scoreText">0</span><span class="pct">%</span>
                        </div>
                    </div>
                    <div class="score-label" id="scoreLabel">—</div>

                    <hr class="card-divider">

                    <div class="quick-stats">
                        <div class="q-stat">
                            <div class="q-icon" id="sslIcon"><i data-lucide="lock"></i></div>
                            <div class="q-info">
                                <span class="q-label">Seguridad SSL</span>
                                <span class="q-val" id="sslValue">—</span>
                            </div>
                        </div>
                        <div class="q-stat">
                            <div class="q-icon" id="speedIcon"><i data-lucide="zap"></i></div>
                            <div class="q-info">
                                <span class="q-label">Tiempo Respuesta</span>
                                <span class="q-val" id="responseTimeValue">0s</span>
                            </div>
                        </div>
                        <div class="q-stat">
                            <div class="q-icon"><i data-lucide="database"></i></div>
                            <div class="q-info">
                                <span class="q-label">Tamaño Página</span>
                                <span class="q-val" id="pageSizeValue">0 KB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass-card meta-info-card">
                    <h4>Objetivo del Análisis</h4>
                    <div class="target-link">
                        <a href="#" id="currentUrl" class="url-badge" target="_blank">https://ejemplo.com</a>
                    </div>
                    <div class="meta-tag-list">
                        <div class="meta-field">
                            <label>Etiqueta Título</label>
                            <p id="metaTitle">—</p>
                        </div>
                        <div class="meta-field">
                            <label>Meta Descripción</label>
                            <p id="metaDesc">—</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-full" id="exportPdfBtn">
                            <i data-lucide="file-text"></i> Exportar PDF (Imprimir)
                        </button>
                        <button class="btn btn-secondary btn-full" id="exportMdBtn">
                            <i data-lucide="file-down"></i> Descargar Markdown (.md)
                        </button>
                        <button class="btn btn-secondary btn-full" id="exportJsonBtn">
                            <i data-lucide="download"></i> Descargar JSON
                        </button>
                        <button class="btn btn-secondary btn-full" id="exportSitemapBtn">
                            <i data-lucide="network"></i> Descargar Sitemap (.xml)
                        </button>
                        <button class="btn btn-secondary btn-full" id="exportRobotsBtn">
                            <i data-lucide="bot"></i> Descargar Robots (.txt)
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Panel: Tab Control & Content -->
            <div class="db-main">
                
                <!-- Subscores metrics grid -->
                <div class="sub-scores-grid">
                    <div class="glass-card sub-score-card">
                        <span class="sub-score-title">SEO Técnico</span>
                        <div class="sub-score-val" id="seoScoreText">0%</div>
                        <div class="sub-score-bar-bg"><div class="sub-score-bar-fill" id="seoScoreBar"></div></div>
                    </div>
                    <div class="glass-card sub-score-card">
                        <span class="sub-score-title">Accesibilidad</span>
                        <div class="sub-score-val" id="accessScoreText">0%</div>
                        <div class="sub-score-bar-bg"><div class="sub-score-bar-fill" id="accessScoreBar"></div></div>
                    </div>
                    <div class="glass-card sub-score-card">
                        <span class="sub-score-title">Contenido</span>
                        <div class="sub-score-val" id="contentScoreText">0%</div>
                        <div class="sub-score-bar-bg"><div class="sub-score-bar-fill" id="contentScoreBar"></div></div>
                    </div>
                    <div class="glass-card sub-score-card">
                        <span class="sub-score-title">Rendimiento</span>
                        <div class="sub-score-val" id="perfScoreText">0%</div>
                        <div class="sub-score-bar-bg"><div class="sub-score-bar-fill" id="perfScoreBar"></div></div>
                    </div>
                    <div class="glass-card sub-score-card">
                        <span class="sub-score-title">Seguridad</span>
                        <div class="sub-score-val" id="securityScoreText">0%</div>
                        <div class="sub-score-bar-bg"><div class="sub-score-bar-fill" id="securityScoreBar"></div></div>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="tab-navigation">
                    <button class="tab-btn active" data-tab="tab-issues">
                        <i data-lucide="alert-triangle"></i> Problemas (<span id="issueCount">0</span>)
                    </button>
                    <button class="tab-btn" data-tab="tab-headings">
                        <i data-lucide="heading"></i> Encabezados
                    </button>
                    <button class="tab-btn" data-tab="tab-links">
                        <i data-lucide="link"></i> Enlaces e Imágenes
                    </button>
                    <button class="tab-btn" data-tab="tab-content">
                        <i data-lucide="file-text"></i> Contenido &amp; Schema
                    </button>
                    <button class="tab-btn" data-tab="tab-security">
                        <i data-lucide="shield"></i> Seguridad HTTP
                    </button>
                    <button class="tab-btn" data-tab="tab-tech">
                        <i data-lucide="cpu"></i> Tecnología
                    </button>
                    <button class="tab-btn" data-tab="tab-cwv">
                        <i data-lucide="gauge"></i> Core Web Vitals
                    </button>
                    <button class="tab-btn" data-tab="tab-subdomains">
                        <i data-lucide="network"></i> Subdominios
                    </button>
                    <button class="tab-btn" data-tab="tab-ports">
                        <i data-lucide="terminal"></i> Puertos
                    </button>
                </div>

                <!-- Tab Panes -->
                <div class="tab-content-container">
                    
                    <!-- Tab Pane: Issues -->
                    <div class="tab-pane active" id="tab-issues">
                        <div class="filter-bar">
                            <span>Filtrar Problemas:</span>
                            <div class="filter-chips">
                                <button class="chip active" data-filter="all">Todos</button>
                                <button class="chip chip-critical" data-filter="critical">Críticos</button>
                                <button class="chip chip-warning" data-filter="warning">Advertencias</button>
                                <button class="chip chip-info" data-filter="info">Información</button>
                            </div>
                        </div>
                        <div id="issuesList" class="issues-list"></div>
                    </div>

                    <!-- Tab Pane: Headings -->
                    <div class="tab-pane" id="tab-headings">
                        <div class="tab-header-info">
                            <h3>Jerarquía de Encabezados</h3>
                            <p>Estructura lógica de las etiquetas H1-H6 del documento.</p>
                        </div>
                        <div class="headings-tree-container">
                            <div id="headingsTree" class="headings-tree"></div>
                        </div>
                    </div>

                    <!-- Tab Pane: Links & Images -->
                    <div class="tab-pane" id="tab-links">
                        <div class="split-cards-row">
                            <div class="mini-status-card">
                                <div class="mini-status-header">
                                    <h4>Integridad de Enlaces</h4>
                                    <span class="badge" id="linkIntegrityBadge">—</span>
                                </div>
                                <div class="stat-large">
                                    <span id="linksChecked">0</span><span class="stat-small">/ <span id="totalLinksFound">0</span> comprobados</span>
                                </div>
                                <div class="link-scroller-box" style="max-height: 220px;">
                                    <table class="data-table" id="linksTable">
                                        <thead>
                                            <tr>
                                                <th>Destino</th>
                                                <th>Texto Ancla</th>
                                                <th>Estado</th>
                                                <th>Tipo</th>
                                            </tr>
                                        </thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                                <div id="loadMoreWrapper" style="display: flex; justify-content: center;"></div>
                            </div>

                            <div class="mini-status-card">
                                <div class="mini-status-header">
                                    <h4>Imágenes &amp; Textos Alternativos (Alt)</h4>
                                </div>
                                <p class="alt-summary-desc" id="altSummaryText">Analizando descriptores de imagen...</p>
                                <div id="missingAltImagesList" class="link-scroller-box hidden" style="margin-top:1rem; max-height:175px;">
                                    <table class="data-table" id="missingAltTable">
                                        <thead><tr><th>Imágenes sin texto Alt</th></tr></thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Pane: Content -->
                    <div class="tab-pane" id="tab-content">
                        <div class="tab-header-info">
                            <h3>Métricas de Contenido &amp; Estructura</h3>
                            <p>Estadísticas del cuerpo de texto y metadatos estructurados Schema JSON-LD.</p>
                        </div>
                        <div class="content-stats-grid">
                            <div class="content-metric-card">
                                <div class="metric-icon"><i data-lucide="file-text"></i></div>
                                <div class="metric-info">
                                    <span class="metric-val" id="textWordCount">0</span>
                                    <span class="metric-label">Palabras Totales</span>
                                </div>
                            </div>
                            <div class="content-metric-card">
                                <div class="metric-icon"><i data-lucide="clock"></i></div>
                                <div class="metric-info">
                                    <span class="metric-val" id="textReadTime">0 Min</span>
                                    <span class="metric-label">Tiempo Lectura</span>
                                </div>
                            </div>
                            <div class="content-metric-card">
                                <div class="metric-icon"><i data-lucide="align-left"></i></div>
                                <div class="metric-info">
                                    <span class="metric-val" id="textAvgSentence">0</span>
                                    <span class="metric-label">Palabras/Frase</span>
                                </div>
                            </div>
                        </div>
                        <div class="placeholder-alert-box" id="placeholderAlertBox"></div>
                        <div id="keywordAnalysisBox" class="placeholder-alert-box hidden"></div>

                        <div class="glass-card" style="margin-top: 1rem; padding: 1.25rem;">
                            <h4 style="margin-bottom: 0.75rem;"><i data-lucide="code" style="width: 15px; height: 15px; display: inline-block; vertical-align: middle; margin-right: 5px;"></i>Datos Estructurados Detectados</h4>
                            <div id="schemaDetailsList"></div>
                        </div>
                    </div>

                    <!-- Tab Pane: Security -->
                    <div class="tab-pane" id="tab-security">
                        <div class="tab-header-info">
                            <h3>Cabeceras de Seguridad HTTP</h3>
                            <p>Análisis de políticas y directivas HTTP de seguridad activas.</p>
                        </div>
                        <div id="securityLoader" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <p>Escaneando políticas de seguridad...</p>
                        </div>
                        <div id="securityContent" class="hidden">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                                <div class="glass-card" style="padding: 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                    <div class="sec-score-ring">
                                        <svg width="90" height="90" viewBox="0 0 90 90">
                                            <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>
                                            <circle id="secScoreArc" cx="45" cy="45" r="38" fill="none" stroke="var(--success)" stroke-width="6" stroke-dasharray="238.76" stroke-dashoffset="238.76" stroke-linecap="round"/>
                                        </svg>
                                        <div class="sec-score-num" id="secScoreNum">0</div>
                                    </div>
                                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.5rem;">Security Score</div>
                                </div>
                                <div class="glass-card" style="padding: 1rem; text-align: center;" id="httpsCard">
                                    <div style="font-size: 2rem; margin-bottom: 0.25rem;" id="httpsIcon">🔐</div>
                                    <div style="font-weight: 700;" id="httpsText">HTTPS</div>
                                </div>
                            </div>
                            <h4 style="margin-bottom: 0.75rem;">Directivas de Cabecera</h4>
                            <div id="secHeadersList"></div>
                        </div>
                    </div>

                    <!-- Tab Pane: Tech -->
                    <div class="tab-pane" id="tab-tech">
                        <div class="tab-header-info">
                            <h3>Ecosistema Tecnológico</h3>
                            <p>CMS, frameworks y scripts de terceros detectados en el código de origen.</p>
                        </div>
                        <div id="techLoader" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <p>Detectando CMS y Frameworks...</p>
                        </div>
                        <div id="techContent" class="hidden">
                            <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1rem;">
                                <h4 style="margin-bottom: 0.75rem;"><i data-lucide="layers" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 5px;"></i>Frameworks &amp; CMS</h4>
                                <div class="tech-grid" id="techList" style="display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
                            </div>
                            <div class="glass-card" style="padding: 1.25rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                    <h4 style="margin: 0;"><i data-lucide="package" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 5px;"></i>Scripts &amp; Trackers</h4>
                                    <span class="badge" id="blockingCount">—</span>
                                </div>
                                <div id="thirdPartyList"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Pane: CWV -->
                    <div class="tab-pane" id="tab-cwv">
                        <div class="tab-header-info">
                            <h3>Rendimiento Heurístico</h3>
                            <p>Estimaciones de Core Web Vitals basadas en análisis de estructura HTML y recursos.</p>
                        </div>
                        <div id="cwvLoader" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <p>Calculando Core Web Vitals...</p>
                        </div>
                        <div id="cwvContent" class="hidden">
                            <div class="cwv-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
                                <div class="glass-card cwv-card" style="display: flex; flex-direction: column; gap: 0.75rem; border-top: 4px solid var(--accent-primary);">
                                    <div class="cwv-header" style="display: flex; justify-content: space-between; align-items: center;">
                                        <h4 class="cwv-metric-title" style="margin: 0; font-size: 0.88rem; color: var(--text-secondary);">LCP (Largest Contentful Paint)</h4>
                                        <i data-lucide="image" style="width: 18px; height: 18px; color: var(--accent-primary);"></i>
                                    </div>
                                    <div class="cwv-metric-val" id="lcpVal" style="font-size: 1.6rem; font-weight: 800;">—</div>
                                    <div class="cwv-metric-desc" id="lcpDesc" style="font-size: 0.82rem; color: var(--text-muted);">Elemento visual más lento</div>
                                </div>
                                <div class="glass-card cwv-card" style="display: flex; flex-direction: column; gap: 0.75rem; border-top: 4px solid var(--accent-secondary);">
                                    <div class="cwv-header" style="display: flex; justify-content: space-between; align-items: center;">
                                        <h4 class="cwv-metric-title" style="margin: 0; font-size: 0.88rem; color: var(--text-secondary);">CLS (Cumulative Layout Shift)</h4>
                                        <i data-lucide="layout" style="width: 18px; height: 18px; color: var(--accent-secondary);"></i>
                                    </div>
                                    <div class="cwv-metric-val" id="clsVal" style="font-size: 1.6rem; font-weight: 800;">—</div>
                                    <div class="cwv-metric-desc" id="clsDesc" style="font-size: 0.82rem; color: var(--text-muted);">Imágenes sin dimensiones explícitas</div>
                                </div>
                                <div class="glass-card cwv-card" style="display: flex; flex-direction: column; gap: 0.75rem; border-top: 4px solid var(--warning);">
                                    <div class="cwv-header" style="display: flex; justify-content: space-between; align-items: center;">
                                        <h4 class="cwv-metric-title" style="margin: 0; font-size: 0.88rem; color: var(--text-secondary);">FID (First Input Delay)</h4>
                                        <i data-lucide="timer" style="width: 18px; height: 18px; color: var(--warning);"></i>
                                    </div>
                                    <div class="cwv-metric-val" id="fidVal" style="font-size: 1.6rem; font-weight: 800;">—</div>
                                    <div class="cwv-metric-desc" id="fidDesc" style="font-size: 0.82rem; color: var(--text-muted);">Scripts bloqueantes en head</div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                                <div class="glass-card" style="padding: 1.25rem;">
                                    <h4 style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="smartphone" style="width: 16px; height: 16px; color: var(--accent-secondary);"></i>Optimizaciones Móviles</h4>
                                    <div id="mobileIssuesList"></div>
                                </div>
                                <div class="glass-card" style="padding: 1.25rem;">
                                    <h4 style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="code-2" style="width: 16px; height: 16px; color: var(--accent-primary);"></i>Recursos de Bloqueo de Renderizado</h4>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.6rem;">
                                        <div style="display: flex; justify-content: space-between;"><span>Scripts Totales:</span> <strong id="totalScriptsCount" style="color: var(--text-primary);">0</strong></div>
                                        <div style="display: flex; justify-content: space-between;"><span>Hojas de Estilo CSS:</span> <strong id="stylesheetsCount" style="color: var(--text-primary);">0</strong></div>
                                        <div style="font-weight: 600; margin-top: 0.25rem;">Scripts que bloquean en head:</div>
                                        <div id="blockingScriptsList" class="link-scroller-box" style="max-height: 120px; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; font-family: monospace; font-size: 0.76rem; background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 6px;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Pane: Subdomains -->
                    <div class="tab-pane" id="tab-subdomains">
                        <div class="tab-header-info">
                            <h3>Descubrimiento de Subdominios</h3>
                            <p>Análisis de resolución DNS y disponibilidad de subdominios comunes.</p>
                        </div>
                        <div id="subdomainsLoader" class="loader-container hidden">
                            <div class="loader-card" style="padding: 1.5rem; max-width: 300px; box-shadow: none; border-color: var(--border-color);">
                                <div class="spinner" style="width: 35px; height: 35px;">
                                    <div class="double-bounce1"></div>
                                    <div class="double-bounce2"></div>
                                </div>
                                <p style="font-size:0.85rem; margin:0;">Buscando subdominios activos...</p>
                            </div>
                        </div>
                        <div id="subdomainsList" class="link-scroller-box" style="margin-top: 1rem;"></div>
                    </div>

                    <!-- Tab Pane: Ports -->
                    <div class="tab-pane" id="tab-ports">
                        <div class="tab-header-info">
                            <h3>Escáner de Puertos Abiertos</h3>
                            <p>Auditoría de seguridad básica escaneando los puertos y servicios más comunes.</p>
                        </div>
                        <div id="portsLoader" class="loader-container hidden">
                            <div class="loader-card" style="padding: 1.5rem; max-width: 300px; box-shadow: none; border-color: var(--border-color);">
                                <div class="spinner" style="width: 35px; height: 35px;">
                                    <div class="double-bounce1"></div>
                                    <div class="double-bounce2"></div>
                                </div>
                                <p style="font-size:0.85rem; margin:0;">Escaneando puertos de red...</p>
                            </div>
                        </div>
                        <div id="portsHostInfo" style="font-size:0.88rem; color:var(--text-secondary); margin-top:0.5rem;" class="hidden"></div>
                        <div id="portsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem; margin-top: 1rem;"></div>
                    </div>

                </div>
            </div>
        </main>
    </div>

    <!-- Help Overlay Modal (Embedded FAQ) -->
    <div id="helpOverlay" class="help-overlay">
        <div class="help-modal">
            <div class="help-header">
                <h2><i data-lucide="help-circle"></i> Centro de Ayuda AuraScan</h2>
                <button id="helpCloseBtn" class="help-close-btn" aria-label="Cerrar"><i data-lucide="x"></i></button>
            </div>
            <div class="help-body">
                <aside class="help-sidebar">
                    <button class="help-nav-btn active" data-target="help-quickstart">
                        <i data-lucide="rocket" style="width:16px;height:16px;"></i> Inicio Rápido
                    </button>
                    <button class="help-nav-btn" data-target="help-metrics">
                        <i data-lucide="bar-chart-2" style="width:16px;height:16px;"></i> Métricas
                    </button>
                    <button class="help-nav-btn" data-target="help-faq">
                        <i data-lucide="message-square" style="width:16px;height:16px;"></i> FAQs
                    </button>
                </aside>
                <div class="help-content">
                    
                    <div id="help-quickstart" class="help-section active">
                        <h3>Guía de Inicio Rápido</h3>
                        <p>AuraScan analiza al instante la salud técnica de cualquier sitio web en tiempo real, evaluando SEO técnico, estructura web, enlaces, seguridad y rendimiento de forma 100% estática.</p>
                        
                        <div class="help-section-card">
                            <h4><span class="help-step-badge">Paso 1</span> Ingresar una URL</h4>
                            <p style="margin: 0.5rem 0 0 0;">Ingresa el dominio o dirección web a evaluar. Opcionalmente puedes definir una palabra clave objetivo para auditar su presencia y densidad SEO.</p>
                        </div>
                        
                        <div class="help-section-card">
                            <h4><span class="help-step-badge">Paso 2</span> Obtener Puntuaciones</h4>
                            <p style="margin: 0.5rem 0 0 0;">El motor calculará puntuaciones en base a criterios SEO estándar:</p>
                            <ul style="margin: 0.5rem 0 0 1.2rem; font-size: 0.86rem; color: var(--text-secondary); line-height: 1.5;">
                                <li><strong>90-100 (Excelente)</strong>: Optimización y prácticas sobresalientes.</li>
                                <li><strong>80-89 (Muy Bueno)</strong>: Sólida base técnica, detalles menores a pulir.</li>
                                <li><strong>70-79 (Aceptable)</strong>: Errores comunes detectados.</li>
                                <li><strong>0-59 (Crítico)</strong>: Requiere intervención estructural urgente.</li>
                            </ul>
                        </div>
                    </div>

                    <div id="help-metrics" class="help-section">
                        <h3>¿Cómo se calculan las métricas?</h3>
                        <p>Cada módulo evalúa aspectos específicos de la página auditada:</p>
                        
                        <div class="help-section-card">
                            <h4><i data-lucide="search" style="width:16px;height:16px;color:var(--accent-primary);"></i> SEO Técnico</h4>
                            <p style="font-size:0.85rem; margin-top:0.4rem;">Valida la longitud y estructura de las etiquetas title, description, robots noindex, favicon, lenguaje HTML y la presencia de la etiqueta canonical.</p>
                        </div>
                        
                        <div class="help-section-card">
                            <h4><i data-lucide="shield" style="width:16px;height:16px;color:var(--success);"></i> Seguridad HTTP</h4>
                            <p style="font-size:0.85rem; margin-top:0.4rem;">Verifica la implementación del protocolo SSL (HTTPS) y evalúa si el sitio utiliza cabeceras de seguridad activas.</p>
                        </div>
                        
                        <div class="help-section-card">
                            <h4><i data-lucide="gauge" style="width:16px;height:16px;color:var(--warning);"></i> Core Web Vitals Estimados</h4>
                            <p style="font-size:0.85rem; margin-top:0.4rem;">Estima de manera heurística el LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift) y FID en base al bloqueo de scripts y la optimización de recursos.</p>
                        </div>
                    </div>

                    <div id="help-faq" class="help-section">
                        <h3>Preguntas Frecuentes</h3>
                        <div class="faq-accordion">
                            <div class="faq-item">
                                <button class="faq-question">
                                    ¿Los análisis se guardan en una base de datos?
                                    <i data-lucide="chevron-down" class="faq-chevron" style="width:16px;height:16px;"></i>
                                </button>
                                <div class="faq-answer">
                                    <div class="faq-answer-inner">
                                        No. AuraScan calcula y procesa toda la información en tiempo real directamente sobre el navegador sin almacenar información en bases de datos externas.
                                    </div>
                                </div>
                            </div>

                            <div class="faq-item">
                                <button class="faq-question">
                                    ¿Cómo puedo guardar mi reporte técnico?
                                    <i data-lucide="chevron-down" class="faq-chevron" style="width:16px;height:16px;"></i>
                                </button>
                                <div class="faq-answer">
                                    <div class="faq-answer-inner">
                                        Puedes exportar el reporte instantáneamente a formato JSON estructurado, o utilizar la opción "Exportar Informe" para imprimirlo o guardarlo como PDF.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/audit-engine.js"></script>
    <script src="assets/js/ui-render.js"></script>
    <script src="assets/js/main.js"></script>
</body>
</html>

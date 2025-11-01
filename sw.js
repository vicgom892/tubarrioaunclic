// sw.js - Service Worker Mejorado v80-multi-global
// Optimizado para GitHub Pages, Hostinger y Live Server
// Scope global para todas las localidades - Carga consistente

// === CONFIGURACIÓN UNIVERSAL MEJORADA ===
const isGitHubPages = self.location.hostname.includes('github.io');
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const BASE_PATH = isGitHubPages ? '/TU_BARRIO_AUN_CLICK' : '';

const CACHE_VERSION = 'v80-multi-global';

const CONFIG = {
  CACHE_VERSION: CACHE_VERSION,
  CACHE_NAME: `tu-barrio-universal-${CACHE_VERSION}`,
  BASE_PATH: BASE_PATH,
  CACHES: {
    STATIC: 'static',
    ASSETS: 'assets',
    API: 'api',
    DYNAMIC: 'dynamic',
    BUSINESS: 'business',
    PAGES: 'pages'
  },
  LIMITS: {
    assets: 80,
    dynamic: 40,
    api: 25,
    business: 40,
    pages: 20
  },
  TTL: {
    api: 5 * 60 * 1000,
    business: 15 * 60 * 1000,
    dynamic: 10 * 60 * 1000,
    assets: 24 * 60 * 60 * 1000,
    pages: 60 * 60 * 1000
  },
  RETRY: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 4000
  },
  LOCALIDADES: ['castelar', 'moron', 'ituzaingo', 'ciudadela', 'merlo', 'haedo', 'ramos','padua']
};

const STATIC_CACHE = `${CONFIG.CACHES.STATIC}-${CONFIG.CACHE_VERSION}`;
const ASSETS_CACHE = `${CONFIG.CACHES.ASSETS}-${CONFIG.CACHE_VERSION}`;
const API_CACHE = `${CONFIG.CACHES.API}-${CONFIG.CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CONFIG.CACHES.DYNAMIC}-${CONFIG.CACHE_VERSION}`;
const BUSINESS_CACHE = `${CONFIG.CACHES.BUSINESS}-${CONFIG.CACHE_VERSION}`;
const PAGES_CACHE = `${CONFIG.CACHES.PAGES}-${CONFIG.CACHE_VERSION}`;

// === FUNCIONES DE RUTAS UNIVERSALES MEJORADAS ===
function getFullPath(path) {
  if (!path) return BASE_PATH || '/';
  
  if (path.startsWith('/')) {
    return `${BASE_PATH}${path}`;
  }
  return `${BASE_PATH}/${path}`;
}

// 🆕 FUNCIÓN MEJORADA PARA DETECTAR LOCALIDAD
function getAppContext(pathname) {
  const path = pathname || self.location.pathname;
  const analysisPath = CONFIG.BASE_PATH ? path.replace(CONFIG.BASE_PATH, '') : path;
  
  // Detectar localidades de manera más flexible
  for (const localidad of CONFIG.LOCALIDADES) {
    if (analysisPath.includes(`/${localidad}/`) || 
        analysisPath === `/${localidad}` ||
        analysisPath === `/${localidad}/` ||
        analysisPath === `/${localidad}.html` ||
        analysisPath.startsWith(`/${localidad}`)) {
      return localidad;
    }
  }
  
  return 'selector';
}

const APP_CONTEXT = getAppContext();

// === RECURSOS CRÍTICOS MEJORADOS ===
const CORE_RESOURCES = [
  // Páginas principales
  getFullPath('/'),
  getFullPath('/index.html'),
  
  // Manifest y config
  getFullPath('/manifest.json'),
  getFullPath('/robots.txt'),
  
  // CSS Core
  getFullPath('/shared/css/styles.css'),
  getFullPath('/shared/css/fondo.css'),
  getFullPath('/shared/css/negocios.css'),
  
  // JS Core
  getFullPath('/shared/js/main-2.js'),
  getFullPath('/shared/js/install-app.js'),
  getFullPath('/shared/js/form.js'),
  getFullPath('/shared/js/security-config.js'),
  getFullPath('/shared/js/splash.js'),
  getFullPath('/shared/js/config.js'),
  
  // Imágenes esenciales
  getFullPath('/shared/img/icon-192x192.png'),
  getFullPath('/shared/img/icon-512x512.png'),
  getFullPath('/shared/img/icon-abeja-sola.png')
];

// Recursos por localidad
const LOCALIDAD_RESOURCES = {
  castelar: [
    getFullPath('/castelar/index.html'),
    getFullPath('/castelar/data/comercios.json'),
    getFullPath('/castelar/data/carousel.json'),
    getFullPath('/castelar/data/panaderias.json'),
    getFullPath('/castelar/data/pastas.json'),
    getFullPath('/castelar/data/verdulerias.json'),
    getFullPath('/castelar/data/fiambrerias.json'),
    getFullPath('/castelar/data/kioscos.json'),
    getFullPath('/castelar/data/mascotas.json'),
    getFullPath('/castelar/data/barberias.json'),
    getFullPath('/castelar/data/ferreterias.json'),
    getFullPath('/castelar/data/tiendas.json'),
    getFullPath('/castelar/data/veterinarias.json'),
    getFullPath('/castelar/data/carnicerias.json'),
    getFullPath('/castelar/data/profesiones.json'),
    getFullPath('/castelar/data/farmacias.json'),
    getFullPath('/castelar/data/cafeterias.json'),
    getFullPath('/castelar/data/talleres.json'),
    getFullPath('/castelar/data/librerias.json'),
    getFullPath('/castelar/data/mates.json'),
    getFullPath('/castelar/data/florerias.json'),
    getFullPath('/castelar/data/comidas.json'),
    getFullPath('/castelar/data/granja.json'),
    getFullPath('/castelar/data/muebles.json'),
    getFullPath('/castelar/data/uñas.json')
  ],
  moron: [
    getFullPath('/moron/index.html'),
    getFullPath('/moron/data/comercios.json')
  ],
  ituzaingo: [
    getFullPath('/ituzaingo/index.html'),
    getFullPath('/ituzaingo/data/comercios.json')
  ],
  ciudadela: [
    getFullPath('/ciudadela/index.html'),
    getFullPath('/ciudadela/data/comercios.json')
  ],
  merlo: [
    getFullPath('/merlo/index.html'),
    getFullPath('/merlo/data/comercios.json')
  ],
  haedo: [
    getFullPath('/haedo/index.html'),
    getFullPath('/haedo/data/comercios.json')
  ],
  ramos: [
    getFullPath('/ramos/index.html'),
    getFullPath('/ramos/data/comercios.json')
  ],
  padua: [
    getFullPath('/padua/index.html'),
    getFullPath('/padua/data/comercios.json')
  ]
};

// === DETECCIÓN DE TIPOS DE RECURSOS ===
function isStaticAsset(path) {
  return /\.(css|js|xml|woff2?|ttf|eot|txt)$/i.test(path);
}

function isImage(path) {
  return /\.(png|jpe?g|gif|webp|avif|svg|ico|webp)$/i.test(path);
}

function isHTML(path) {
  return path.endsWith('.html') || 
         path.endsWith('/') || 
         path === '' ||
         !path.includes('.') ||
         path.includes(CONFIG.BASE_PATH) && !path.includes('.');
}

function isAPI(path) {
  return path.includes('/data/') || path.includes('/api/');
}

function isBusinessData(path) {
  return path.includes('/comercios') || 
         path.includes('/negocios') || 
         path.includes('/panaderias') ||
         path.includes('/pastas') ||
         path.includes('/verdulerias') ||
         path.includes('/fiambrerias') ||
         path.includes('/kioscos') ||
         path.includes('/mascotas') ||
         path.includes('/barberias') ||
         path.includes('/ferreterias') ||
         path.includes('/tiendas') ||
         path.includes('/veterinarias') ||
         path.includes('/carnicerias') ||
         path.includes('/profesiones') ||
         path.includes('/farmacias') ||
         path.includes('/cafeterias') ||
         path.includes('/talleres') ||
         path.includes('/librerias') ||
         path.includes('/mates') ||
         path.includes('/florerias') ||
         path.includes('/comidas') ||
         path.includes('/granja') ||
         path.includes('/muebles') ||
         path.includes('/uñas');
}

function isCriticalResource(path) {
  return CORE_RESOURCES.includes(path) || 
         (LOCALIDAD_RESOURCES[APP_CONTEXT] && LOCALIDAD_RESOURCES[APP_CONTEXT].includes(path));
}

// Almacén para estado
const cacheState = {
  lastUpdate: Date.now(),
  precacheComplete: false,
  context: APP_CONTEXT,
  environment: isLocalhost ? 'development' : isGitHubPages ? 'github-pages' : 'production'
};

// === INSTALL: Precaché optimizado ===
self.addEventListener('install', (event) => {
  log('info', `🚀 Instalando SW Universal (${APP_CONTEXT}): ${CONFIG.CACHE_VERSION}`);
  log('info', `📍 Entorno: ${cacheState.environment}`);
  log('info', `🛣️  Ruta base: ${CONFIG.BASE_PATH || '(raíz)'}`);
  log('info', `🌍 Scope: Global para todas las localidades`);
  
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        // Determinar recursos según contexto
        let resourcesToCache = [...CORE_RESOURCES];
        
        if (APP_CONTEXT !== 'selector' && LOCALIDAD_RESOURCES[APP_CONTEXT]) {
          resourcesToCache = [...resourcesToCache, ...LOCALIDAD_RESOURCES[APP_CONTEXT]];
        }

        // Precaché esencial (solo recursos críticos)
        const essentialResources = resourcesToCache.filter(res => 
          isCriticalResource(res) && !isImage(res)
        );

        const cache = await caches.open(STATIC_CACHE);
        const results = await precacheResources(cache, essentialResources);
        
        cacheState.precacheComplete = true;
        cacheState.lastUpdate = Date.now();
        
        log('info', `✅ SW Universal instalado - ${results.successful.length} recursos cacheados`);
        
        notifyClients({
          type: 'SW_INSTALLED',
          version: CONFIG.CACHE_VERSION,
          context: APP_CONTEXT,
          environment: cacheState.environment
        });

      } catch (error) {
        log('error', '💥 Error en install:', error);
        cacheState.precacheComplete = false;
      }
    })()
  );
});

// === ACTIVATE: Limpieza inteligente ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      
      // Limpiar cachés viejos
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE, ASSETS_CACHE, API_CACHE, DYNAMIC_CACHE, BUSINESS_CACHE, PAGES_CACHE];
      
      await Promise.all(
        cacheNames
          .filter(name => !currentCaches.includes(name))
          .map(name => {
            log('info', `🗑️ Borrando caché viejo: ${name}`);
            return caches.delete(name);
          })
      );
      
      log('info', `✅ SW Universal activado: ${CONFIG.CACHE_VERSION} (${APP_CONTEXT})`);

      notifyClients({
        type: 'SW_ACTIVATED',
        version: CONFIG.CACHE_VERSION,
        context: APP_CONTEXT,
        message: `¡Nueva versión ${CONFIG.CACHE_VERSION} activa!`
      });
    })()
  );
});

// === FETCH: Estrategias robustas para todos los entornos ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests GET y del mismo origen
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  const pathname = url.pathname;
  
  // 🎯 ESTRATEGIA MEJORADA PARA DETECTAR HTML
  const isHtmlPage = isHTML(pathname) || 
                    request.headers.get('Accept')?.includes('text/html');

  if (isHtmlPage) {
    // Páginas HTML: Estrategia Network First MEJORADA
    event.respondWith(handleHtmlPage(request));
  } else if (isImage(pathname)) {
    // Imágenes: Cache First con fallback
    event.respondWith(handleImageRequest(request));
  } else if (isBusinessData(pathname)) {
    // Datos de negocios: Stale While Revalidate
    event.respondWith(handleBusinessData(request));
  } else if (isAPI(pathname)) {
    // APIs: Network First con cache
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(pathname)) {
    // Assets estáticos: Cache First
    event.respondWith(handleStaticAsset(request));
  } else {
    // Por defecto: Network First
    event.respondWith(handleDefaultRequest(request));
  }
});

// 🆕 MANEJADOR DE PÁGINAS HTML COMPLETAMENTE REESCRITO
async function handleHtmlPage(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  log('debug', `📄 Manejo HTML: ${pathname} | Contexto: ${APP_CONTEXT}`);
  
  // ESTRATEGIA: Network First para HTML SIEMPRE
  try {
    log('debug', `🌐 Intentando network para: ${pathname}`);
    
    const networkResponse = await fetch(request, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (networkResponse.ok) {
      log('info', `✅ HTML fresco desde network: ${pathname}`);
      
      // Cachear para uso offline (pero no bloquear la respuesta)
      cacheResponse(request, networkResponse.clone(), PAGES_CACHE);
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    log('info', `📡 Offline - Buscando en cache: ${pathname}`);
    
    // 1. Buscar en cache exacto
    const cached = await caches.match(request);
    if (cached) {
      log('info', `✅ HTML desde cache exacto: ${pathname}`);
      return cached;
    }
    
    // 2. 🎯 FALLBACK INTELIGENTE MEJORADO
    const fallbackHtml = await findHtmlFallback(pathname);
    if (fallbackHtml) {
      log('info', `🔄 Usando fallback para: ${pathname}`);
      return fallbackHtml;
    }
    
    // 3. Página offline genérica
    log('warn', `❌ Sin cache - Mostrando página offline para: ${pathname}`);
    return createOfflinePage();
  }
}

// 🆕 FUNCIÓN MEJORADA DE FALLBACK
async function findHtmlFallback(pathname) {
  const fallbackMap = {
    // Página principal
    '/': '/index.html',
    '': '/index.html',
    
    // Localidades - mapeo completo y flexible
    '/castelar': '/castelar/index.html',
    '/castelar/': '/castelar/index.html',
    '/moron': '/moron/index.html',
    '/moron/': '/moron/index.html',
    '/ituzaingo': '/ituzaingo/index.html',
    '/ituzaingo/': '/ituzaingo/index.html',
    '/ciudadela': '/ciudadela/index.html',
    '/ciudadela/': '/ciudadela/index.html',
    '/merlo': '/merlo/index.html',
    '/merlo/': '/merlo/index.html',
    '/haedo': '/haedo/index.html',
    '/haedo/': '/haedo/index.html',
    '/ramos': '/ramos/index.html',
    '/ramos/': '/ramos/index.html',
    '/padua': '/padua/index.html',
    '/padua/': '/padua/index.html'
  };
  
  // Normalizar path para búsqueda
  const normalizedPath = CONFIG.BASE_PATH ? pathname.replace(CONFIG.BASE_PATH, '') : pathname;
  
  log('debug', `🔍 Buscando fallback para: ${normalizedPath}`);
  
  // Intentar fallback directo
  const directFallback = fallbackMap[normalizedPath] || fallbackMap[pathname];
  if (directFallback) {
    const fullFallbackPath = getFullPath(directFallback);
    const cached = await caches.match(fullFallbackPath);
    if (cached) {
      log('info', `🎯 Fallback encontrado: ${pathname} -> ${directFallback}`);
      return cached;
    }
  }
  
  // Intentar detectar localidad y usar su index.html
  const detectedLocalidad = getAppContext(pathname);
  if (detectedLocalidad !== 'selector') {
    const localidadIndex = getFullPath(`/${detectedLocalidad}/index.html`);
    const cached = await caches.match(localidadIndex);
    if (cached) {
      log('info', `🏠 Usando index de localidad: ${localidadIndex}`);
      return cached;
    }
  }
  
  // Último intento: index.html principal
  const mainIndex = await caches.match(getFullPath('/index.html'));
  if (mainIndex) {
    log('info', `🏠 Usando index.html principal como fallback universal`);
    return mainIndex;
  }
  
  return null;
}

// 🆕 MANEJADOR DE IMÁGENES ROBUSTO
async function handleImageRequest(request) {
  // Para desarrollo local, manejar favicon.ico
  if (isLocalhost && request.url.includes('favicon.ico')) {
    return new Response('', { status: 404 });
  }
  
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      await cache.put(request, response.clone());
      await limitCacheSize(ASSETS_CACHE, CONFIG.LIMITS.assets);
    }
    return response;
  } catch (error) {
    // Fallback para imágenes
    const fallbackImage = await caches.match(getFullPath('/shared/img/fallback-image.png'));
    return fallbackImage || new Response('', { status: 404 });
  }
}

// 🆕 MANEJADOR DE DATOS DE NEGOCIOS
async function handleBusinessData(request) {
  try {
    // Primero intentar network para datos frescos
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(BUSINESS_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network failed');
  } catch (error) {
    // Fallback a cache
    const cached = await caches.match(request);
    if (cached) {
      log('info', `📊 Datos desde cache: ${getShortUrl(request.url)}`);
      return cached;
    }
    
    // Datos offline básicos
    return new Response(JSON.stringify({ 
      error: 'offline', 
      message: 'Datos no disponibles sin conexión',
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🆕 MANEJADOR DE APIS
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🆕 MANEJADOR DE ASSETS ESTÁTICOS
async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset no disponible', { status: 503 });
  }
}

// 🆕 MANEJADOR POR DEFECTO
async function handleDefaultRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Recurso no disponible', { status: 503 });
  }
}

// === PÁGINA OFFLINE MEJORADA ===
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modo Offline - Tu Barrio a un Clik</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 20px;
                text-align: center;
            }
            .offline-container {
                background: rgba(255,255,255,0.15);
                padding: 40px 30px;
                border-radius: 20px;
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255,255,255,0.2);
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .icon { 
                font-size: 4rem; 
                margin-bottom: 20px;
                animation: pulse 2s infinite;
            }
            h1 { 
                font-size: 2.2rem; 
                margin-bottom: 15px;
                font-weight: 700;
            }
            p {
                font-size: 1.1rem;
                margin-bottom: 25px;
                line-height: 1.6;
                opacity: 0.9;
            }
            .features {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 25px 0;
            }
            .feature {
                background: rgba(255,255,255,0.1);
                padding: 12px 8px;
                border-radius: 10px;
                font-size: 0.85rem;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .btn {
                background: white;
                color: #667eea;
                padding: 14px 35px;
                border: none;
                border-radius: 50px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            .context-info {
                margin-top: 20px;
                font-size: 0.9rem;
                opacity: 0.7;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="icon">📡</div>
            <h1>Estás Offline</h1>
            <p>No hay conexión a internet en este momento.</p>
            
            <div class="features">
                <div class="feature">🏪 Comercios locales</div>
                <div class="feature">🗺️ Mapas guardados</div>
                <div class="feature">📞 Contactos</div>
                <div class="feature">🕒 Horarios</div>
            </div>
            
            <p>Revisa tu conexión y vuelve a intentarlo.</p>
            
            <button class="btn" onclick="location.reload()">Reintentar Conexión</button>
            
            <div class="context-info">
                ${APP_CONTEXT !== 'selector' ? `Localidad: ${APP_CONTEXT}` : 'Selector de localidades'} | v${CONFIG.CACHE_VERSION}
            </div>
        </div>
        
        <script>
            // Script básico para reintentar
            setTimeout(() => {
                if (navigator.onLine) {
                    location.reload();
                }
            }, 5000);
        </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

// === FUNCIONES AUXILIARES MEJORADAS ===

// 🆕 FUNCIÓN AUXILIAR PARA CACHE NO BLOQUEANTE
async function cacheResponse(request, response, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (error) {
    log('warn', '⚠️ Error cacheando respuesta:', error);
  }
}

// Precaché de recursos
async function precacheResources(cache, resources) {
  const successful = [];
  const failed = [];
  
  for (const resource of resources) {
    try {
      const response = await fetch(resource, { 
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        await cache.put(resource, response);
        successful.push(resource);
      } else {
        failed.push({ resource, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      failed.push({ resource, error: error.message });
    }
  }
  
  return { successful, failed };
}

// Limitar tamaño del cache
async function limitCacheSize(cacheName, maxItems) {
  if (maxItems === 0) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const itemsToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(itemsToDelete.map(key => cache.delete(key)));
  }
}

// Obtener URL corta para logs
function getShortUrl(url) {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (CONFIG.BASE_PATH && path.startsWith(CONFIG.BASE_PATH)) {
      path = path.slice(CONFIG.BASE_PATH.length);
    }
    return path.length > 30 ? '...' + path.slice(-27) : path;
  } catch {
    return url.length > 30 ? '...' + url.slice(-27) : url;
  }
}

// Notificar clients
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      try {
        client.postMessage(message);
      } catch (error) {
        // Ignorar errores de mensajes
      }
    });
  });
}

// 🆕 SISTEMA DE LOGGING MEJORADO
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const levels = { 
    info: 'ℹ️', 
    warn: '⚠️', 
    error: '❌',
    debug: '🐛'
  };
  
  // En producción, solo loguear warnings y errors
  if (!isLocalhost && (level === 'info' || level === 'debug')) {
    return;
  }
  
  const emoji = levels[level] || '📝';
  console[level](`[SW ${CONFIG.CACHE_VERSION}] ${timestamp} ${emoji} ${message}`, ...args);
}

// === MESSAGE HANDLER ===
self.addEventListener('message', async (event) => {
  const { data, ports } = event;
  
  log('info', `📨 Mensaje: ${data?.type}`, data);
  
  switch (data?.type) {
    case 'SKIP_WAITING':
      log('info', '⏩ Saltando espera...');
      self.skipWaiting();
      break;
      
    case 'GET_STATUS':
      sendResponse(ports, {
        type: 'SW_STATUS',
        version: CONFIG.CACHE_VERSION,
        context: APP_CONTEXT,
        environment: cacheState.environment,
        precacheComplete: cacheState.precacheComplete
      });
      break;
      
    case 'CLEAR_CACHE':
      await clearAllCaches();
      sendResponse(ports, { type: 'CACHE_CLEARED' });
      break;

    case 'GET_VERSION':
      sendResponse(ports, {
        type: 'VERSION_INFO',
        version: CONFIG.CACHE_VERSION,
        scope: 'global'
      });
      break;
  }
});

function sendResponse(ports, message) {
  if (ports && ports[0]) {
    try {
      ports[0].postMessage(message);
    } catch (error) {
      // Ignorar errores de puerto
    }
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  log('info', '🗑️ Todos los caches limpiados');
}

// === PUSH NOTIFICATIONS BÁSICAS ===
self.addEventListener('push', (event) => {
  const options = {
    body: '¡Nuevas ofertas disponibles en tu barrio!',
    icon: getFullPath('/shared/img/icon-192x192.png'),
    badge: getFullPath('/shared/img/icon-192x192.png'),
    vibrate: [200, 100, 200],
    data: { url: getFullPath('/') }
  };
  
  event.waitUntil(
    self.registration.showNotification('Tu Barrio a un Clik', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// === INICIALIZACIÓN ===
log('info', `🚀 SW Universal cargado - ${APP_CONTEXT}`);
log('info', `📍 Entorno: ${cacheState.environment}`);
log('info', `🛣️  Base: ${CONFIG.BASE_PATH || '(raíz)'}`);
log('info', `🌍 Scope: Global para todas las localidades`);
log('info', `🎯 Estrategia: Network First para HTML`);
log('info', `📦 Recursos globales: ${CORE_RESOURCES.length}`);
log('info', `🏘️  Localidades soportadas: ${CONFIG.LOCALIDADES.join(', ')}`);

// Estado inicial
cacheState.startTime = Date.now();
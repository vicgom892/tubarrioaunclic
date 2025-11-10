// sw.js - Service Worker Final v81-multi (MEJORADO)
// Optimizado para: https://vicgom892.github.io/tubarrioaunclic/
// Compatible con Live Server, GitHub Pages y offline

const isGitHubPages = self.location.hostname === 'vicgom892.github.io';
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const BASE_PATH = isGitHubPages ? '/tubarrioaunclic' : ''; // minúsculas, sin guiones

const CACHE_VERSION = 'v81-multi'; // ¡Versión actualizada!

const CONFIG = {
  CACHE_VERSION,
  CACHE_NAME: `tu-barrio-universal-${CACHE_VERSION}`,
  BASE_PATH,
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
  LOCALIDADES: ['castelar', 'moron', 'ituzaingo', 'ciudadela', 'merlo', 'haedo', 'ramos', 'padua', 'marcos-paz']
};

const STATIC_CACHE = `${CONFIG.CACHES.STATIC}-${CONFIG.CACHE_VERSION}`;
const ASSETS_CACHE = `${CONFIG.CACHES.ASSETS}-${CONFIG.CACHE_VERSION}`;
const API_CACHE = `${CONFIG.CACHES.API}-${CONFIG.CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CONFIG.CACHES.DYNAMIC}-${CONFIG.CACHE_VERSION}`;
const BUSINESS_CACHE = `${CONFIG.CACHES.BUSINESS}-${CONFIG.CACHE_VERSION}`;
const PAGES_CACHE = `${CONFIG.CACHES.PAGES}-${CONFIG.CACHE_VERSION}`;

function getFullPath(path) {
  if (!path) return BASE_PATH || '/';
  if (path.startsWith('/')) return `${BASE_PATH}${path}`;
  return `${BASE_PATH}/${path}`;
}

function getAppContext(pathname) {
  const path = pathname || self.location.pathname;
  const analysisPath = CONFIG.BASE_PATH ? path.replace(CONFIG.BASE_PATH, '') : path;

  for (const localidad of CONFIG.LOCALIDADES) {
    if (analysisPath.includes(`/${localidad}/`) || 
        analysisPath === `/${localidad}` ||
        analysisPath === `/${localidad}/` ||
        analysisPath.includes(`/${localidad}.html`)) {
      return localidad;
    }
  }

  const pathParts = analysisPath.split('/').filter(part => part);
  if (pathParts.length > 0 && CONFIG.LOCALIDADES.includes(pathParts[0])) {
    return pathParts[0];
  }

  return 'selector';
}

const APP_CONTEXT = getAppContext();

const CORE_RESOURCES = [
  getFullPath('/'),
  getFullPath('/index.html'),
  getFullPath('/manifest.json'),
  getFullPath('/robots.txt'),
  getFullPath('/shared/css/styles.css'),
  getFullPath('/shared/css/fondo.css'),
  getFullPath('/shared/css/negocios.css'),
  getFullPath('/shared/js/main-2.js'),
  getFullPath('/shared/js/install-app.js'),
  getFullPath('/shared/js/form.js'),
  getFullPath('/shared/js/security-config.js'),
  getFullPath('/shared/img/icon-192x192.png'),
  getFullPath('/shared/img/icon-512x512.png'),
  getFullPath('/shared/img/icon-abeja-sola.png'),
  getFullPath('/shared/lib/aos/aos.css'),
  getFullPath('/shared/lib/aos/aos.js')
];

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
  ]
  // Agrega otras localidades aquí
};

function isStaticAsset(path) {
  return /\.(css|js|xml|woff2?|ttf|eot|txt)$/i.test(path);
}

function isImage(path) {
  return /\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(path);
}

function isHTML(path) {
  return path.endsWith('.html') || path.endsWith('/') || path === '' || !path.includes('.');
}

function isAPI(path) {
  return path.includes('/data/') || path.includes('/api/');
}

function isBusinessData(path) {
  return /\/(comercios|negocios|panaderias|pastas|verdulerias|fiambrerias|kioscos|mascotas|barberias|ferreterias|tiendas|veterinarias|carnicerias|profesiones|farmacias|cafeterias|talleres|librerias|mates|florerias|comidas|granja|muebles|uñas)/.test(path);
}

function isCriticalResource(path) {
  return CORE_RESOURCES.includes(path) || 
         (LOCALIDAD_RESOURCES[APP_CONTEXT] && LOCALIDAD_RESOURCES[APP_CONTEXT].includes(path));
}

const cacheState = {
  lastUpdate: Date.now(),
  precacheComplete: false,
  context: APP_CONTEXT,
  environment: isLocalhost ? 'development' : isGitHubPages ? 'github-pages' : 'production'
};

// === NUEVA: Stale-While-Revalidate para datos críticos ===
async function handleStaleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, CONFIG.LIMITS.business);
    }
    return networkResponse;
  }).catch(() => {
    return cached || new Response(JSON.stringify({ error: 'offline', message: 'Sin conexión' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  });

  return cached || fetchPromise;
}

// === INSTALL ===
self.addEventListener('install', (event) => {
  log('info', `Instalando SW (${APP_CONTEXT}): ${CACHE_VERSION}`);
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        let resourcesToCache = [...CORE_RESOURCES];
        if (APP_CONTEXT !== 'selector' && LOCALIDAD_RESOURCES[APP_CONTEXT]) {
          resourcesToCache.push(...LOCALIDAD_RESOURCES[APP_CONTEXT]);
        }

        const essentialResources = resourcesToCache.filter(res => 
          isCriticalResource(res) && !isImage(res)
        );

        const cache = await caches.open(STATIC_CACHE);
        await precacheResources(cache, essentialResources);
        
        cacheState.precacheComplete = true;
        cacheState.lastUpdate = Date.now();
        
        log('info', `SW instalado - ${essentialResources.length} recursos`);
        notifyClients({ type: 'SW_INSTALLED', version: CACHE_VERSION, context: APP_CONTEXT });
      } catch (error) {
        log('error', 'Error en install:', error);
      }
    })()
  );
});

// === ACTIVATE ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE, ASSETS_CACHE, API_CACHE, DYNAMIC_CACHE, BUSINESS_CACHE, PAGES_CACHE];
      
      await Promise.all(
        cacheNames
          .filter(name => !currentCaches.includes(name))
          .map(name => caches.delete(name))
      );
      
      log('info', `SW activado: ${CACHE_VERSION} (${APP_CONTEXT})`);
      notifyClients({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
    })()
  );
});

// === FETCH ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  const pathname = url.pathname;
  const isHtmlPage = isHTML(pathname) || request.headers.get('Accept')?.includes('text/html');

  if (isHtmlPage) {
    event.respondWith(handleHtmlPage(request));
  } else if (isImage(pathname)) {
    event.respondWith(handleImageRequest(request));
  } else if (isBusinessData(pathname)) {
    // Stale-While-Revalidate solo para comercios.json (el más crítico)
    if (pathname.includes('comercios.json')) {
      event.respondWith(handleStaleWhileRevalidate(request, BUSINESS_CACHE));
    } else {
      event.respondWith(handleBusinessData(request));
    }
  } else if (isAPI(pathname)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// === MANEJADORES (sin cambios, excepto que ahora usan Stale si aplica) ===
async function handleHtmlPage(request) {
  if (isLocalhost) {
    try { return await fetch(request); } catch { return createOfflinePage(); }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error();
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const fallback = await findHtmlFallback(request.url);
    if (fallback) return fallback;
    
    return createOfflinePage();
  }
}

async function findHtmlFallback(url) {
  const fallbackMap = {
    '/': '/index.html',
    '': '/index.html',
    '/castelar': '/castelar/index.html',
    '/castelar/': '/castelar/index.html',
    '/moron': '/moron/index.html',
    '/moron/': '/moron/index.html',
    '/ituzaingo': '/ituzaingo/index.html',
    '/ituzaingo/': '/ituzaingo/index.html',
    '/marcos-paz': '/marcos-paz/index.html',
    '/marcos-paz/': '/marcos-paz/index.html',
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

  const normalized = CONFIG.BASE_PATH ? url.replace(CONFIG.BASE_PATH, '') : url;
  const cleanPath = new URL(normalized, 'https://dummy.com').pathname;
  const fallbackPath = fallbackMap[cleanPath] || fallbackMap[cleanPath.replace(/\/$/, '')];

  if (fallbackPath) {
    const full = getFullPath(fallbackPath);
    const cached = await caches.match(full);
    if (cached) return cached;
  }

  return await caches.match(getFullPath('/index.html'));
}

async function handleImageRequest(request) {
  if (isLocalhost && request.url.includes('favicon.ico')) {
    return new Response('', { status: 404 });
  }
  
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      await cache.put(request, response.clone());
      await limitCacheSize(ASSETS_CACHE, CONFIG.LIMITS.assets);
    }
    return response;
  } catch {
    const fallback = await caches.match(getFullPath('/shared/img/fallback-image.png'));
    return fallback || new Response('', { status: 404 });
  }
}

async function handleBusinessData(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(BUSINESS_CACHE);
      await cache.put(request, res.clone());
      return res;
    }
    throw new Error();
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', message: 'Sin conexión' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

async function handleApiRequest(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('Recurso no disponible', { status: 503 });
  }
}

async function handleDefaultRequest(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('No disponible', { status: 503 });
  }
}

// === OFFLINE PAGE ===
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modo Offline - Tu Barrio a un Clik</title>
        <style>
            body { font-family: sans-serif; background: #667eea; color: white; text-align: center; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
            h1 { font-size: 2rem; margin-bottom: 20px; }
            .btn { background: white; color: #667eea; border: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Estás Offline</h1>
            <p>No hay conexión a internet.</p>
            <p>Puedes navegar por comercios ya cargados.</p>
            <button class="btn" onclick="location.reload()">Reintentar</button>
            <div style="margin-top:20px; font-size:0.9em; opacity:0.8;">
                Localidad: ${APP_CONTEXT}
            </div>
        </div>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// === UTILIDADES ===
async function precacheResources(cache, resources) {
  for (const url of resources) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) await cache.put(url, res);
    } catch (e) {
      log('warn', `No se pudo cachear: ${url}`);
    }
  }
}

async function limitCacheSize(cacheName, maxItems) {
  if (maxItems <= 0) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

function log(level, message, ...args) {
  if (isLocalhost || level !== 'info') {
    console[level](`[SW ${CACHE_VERSION}] ${message}`, ...args);
  }
}

function notifyClients(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}

// === MESSAGE HANDLER ===
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// === PERIÓDICO SYNC (opcional, activar desde JS) ===
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-offers') {
    event.waitUntil(updateCriticalData());
  }
});

async function updateCriticalData() {
  const cache = await caches.open(BUSINESS_CACHE);
  const urls = LOCALIDAD_RESOURCES[APP_CONTEXT]?.filter(u => u.includes('.json')) || [];
  
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    } catch (e) {
      log('warn', 'Fallo actualización periódica:', url);
    }
  }
  log('info', 'Actualización periódica completada');
}

log('info', `SW cargado - ${APP_CONTEXT} | Base: ${BASE_PATH || '(raíz)'} | v81-multi`);
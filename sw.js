// sw.js - Service Worker Mejorado v60-multi
// Coordinación perfecta con main-2.js - Optimizado para Castelar

// === CONFIGURACIÓN DINÁMICA MEJORADA ===
const isGitHubPages = self.location.hostname.includes('github.io');
const BASE_PATH = isGitHubPages ? '/Zona-Tu-Barrio' : '';

const CACHE_VERSION = 'v60-multi';

const CONFIG = {
  CACHE_VERSION: CACHE_VERSION,
  CACHE_NAME: `tu-barrio-unified-${CACHE_VERSION}`,
  BASE_PATH: BASE_PATH,
  CACHES: {
    STATIC: 'static',
    ASSETS: 'assets',
    API: 'api',
    DYNAMIC: 'dynamic',
    BUSINESS: 'business'
  },
  LIMITS: {
    assets: 100, // Reducido para mejor performance
    dynamic: 50,
    api: 30,
    business: 50
  },
  TTL: {
    api: 2 * 60 * 1000, // 2 minutos para datos API
    business: 10 * 60 * 1000, // 10 minutos para negocios
    dynamic: 5 * 60 * 1000, // 5 minutos para páginas
    assets: 24 * 60 * 60 * 1000 // 24 horas para assets
  },
  RETRY: {
    maxRetries: 2, // Menos reintentos para mejor UX
    baseDelay: 1000,
    maxDelay: 5000
  },
  LOCALIDADES: ['castelar', 'moron', 'ituzaingo', 'ciudadela', 'merlo', 'haedo', 'ramos-mejia']
};

const STATIC_CACHE = `${CONFIG.CACHES.STATIC}-${CONFIG.CACHE_VERSION}`;
const ASSETS_CACHE = `${CONFIG.CACHES.ASSETS}-${CONFIG.CACHE_VERSION}`;
const API_CACHE = `${CONFIG.CACHES.API}-${CONFIG.CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CONFIG.CACHES.DYNAMIC}-${CONFIG.CACHE_VERSION}`;
const BUSINESS_CACHE = `${CONFIG.CACHES.BUSINESS}-${CONFIG.CACHE_VERSION}`;

// === FUNCIONES DE RUTAS DINÁMICAS MEJORADAS ===
function getFullPath(path) {
  // Manejo robusto de rutas para ambos entornos
  if (path.startsWith('/')) {
    return `${CONFIG.BASE_PATH}${path}`;
  }
  return `${CONFIG.BASE_PATH}/${path}`;
}

function getAppContext(pathname) {
  const path = pathname || self.location.pathname;
  
  // Detectar localidades específicamente para Castelar
  for (const localidad of CONFIG.LOCALIDADES) {
    if (path.includes(`/${localidad}/`) || path.includes(`/${localidad}.html`)) {
      return localidad;
    }
  }
  
  // Si está en la raíz de una localidad (ej: /castelar/)
  const pathParts = path.split('/').filter(part => part);
  if (pathParts.length > 0 && CONFIG.LOCALIDADES.includes(pathParts[0])) {
    return pathParts[0];
  }
  
  return 'selector';
}

const APP_CONTEXT = getAppContext();

// === RECURSOS CRÍTICOS POR CONTEXTO ===
const CRITICAL_RESOURCES = [
  // Páginas principales
  getFullPath('/'),
  getFullPath('/index.html'),
  
  // Manifest y config
  getFullPath('/manifest.json'),
  getFullPath('/robots.txt'),
  
  // CSS Crítico
  getFullPath('/shared/css/styles.css'),
  getFullPath('/shared/css/fondo.css'),
  getFullPath('/shared/css/negocios.css'),
  
  // JS Core
  getFullPath('/shared/js/main-2.js'),
  getFullPath('/shared/js/install-app.js'),
  
  // Imágenes esenciales
  getFullPath('/shared/img/icon-192x192.png'),
  getFullPath('/shared/img/icon-512x512.png'),
  getFullPath('/shared/img/icon-abeja-sola.png'),
  getFullPath('/shared/img/fallback-image.png')
];

// Recursos específicos para Castelar
const CASTELAR_RESOURCES = [
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
];

// === FUNCIONES DE DETECCIÓN MEJORADAS ===
function isStaticAsset(path) {
  return /\.(html|css|js|xml|woff2?|ttf|eot|json|txt)$/i.test(path) || 
         path.includes('/manifest.json');
}

function isImage(path) {
  return /\.(png|jpe?g|gif|webp|avif|svg|ico|webp)$/i.test(path);
}

function isAPI(path) {
  return path.includes('/data/') || path.includes('/datos/') || 
         path.includes('/api/') || path.includes('/negocios/');
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

function isLocalidadPage(path) {
  return CONFIG.LOCALIDADES.some(localidad => 
    path.includes(`/${localidad}/`) || 
    path.endsWith(`/${localidad}.html`) ||
    path.endsWith(`/${localidad}/`)
  );
}

function isCriticalResource(path) {
  return CRITICAL_RESOURCES.includes(path) || 
         CASTELAR_RESOURCES.includes(path);
}

// Almacén para timestamps y estado
const cacheTimestamps = {
  api: {},
  business: {},
  dynamic: {},
  assets: {}
};

const cacheState = {
  lastUpdate: Date.now(),
  precacheComplete: false,
  context: APP_CONTEXT
};

// === INSTALL: Precache inteligente por contexto ===
self.addEventListener('install', (event) => {
  log('info', `🚀 Instalando SW Mejorado (${APP_CONTEXT}): ${CONFIG.CACHE_VERSION}`);
  log('info', `📍 Entorno: ${isGitHubPages ? 'GitHub Pages' : 'Netlify'}`);
  log('info', `🛣️  Ruta base: ${CONFIG.BASE_PATH || '(raíz)'}`);
  
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        const cachePromises = [
          caches.open(STATIC_CACHE),
          caches.open(ASSETS_CACHE),
          caches.open(API_CACHE),
          caches.open(BUSINESS_CACHE)
        ];

        const [staticCache, assetsCache, apiCache, businessCache] = await Promise.all(cachePromises);

        // Determinar recursos según contexto
        let resourcesToCache = [...CRITICAL_RESOURCES];
        
        if (APP_CONTEXT === 'castelar') {
          resourcesToCache = [...resourcesToCache, ...CASTELAR_RESOURCES];
        }

        // Clasificar recursos
        const staticResources = resourcesToCache.filter(res => isStaticAsset(res) && !isImage(res));
        const assetResources = resourcesToCache.filter(res => isImage(res));
        const apiResources = resourcesToCache.filter(res => isAPI(res));
        const businessResources = resourcesToCache.filter(res => isBusinessData(res));

        // Precaché en paralelo con prioridades
        const results = await Promise.allSettled([
          precacheWithRetry(staticCache, staticResources, 1), // Alta prioridad
          precacheWithRetry(assetsCache, assetResources, 1),
          precacheWithRetry(apiCache, apiResources, 2), // Media prioridad
          precacheWithRetry(businessCache, businessResources, 2)
        ]);

        // Reportar resultados
        const cacheTypes = ['Estáticos', 'Imágenes', 'APIs', 'Datos Negocios'];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { successful, failed } = result.value;
            log('info', `✅ ${cacheTypes[index]}: ${successful.length} exitosos`);
            if (failed.length > 0) {
              log('warn', `❌ ${cacheTypes[index]} fallados:`, failed.map(f => f.resource));
            }
          } else {
            log('error', `💥 Error en ${cacheTypes[index]}:`, result.reason);
          }
        });

        cacheState.precacheComplete = true;
        cacheState.lastUpdate = Date.now();
        
        log('info', `🎯 SW Mejorado instalado - Contexto: ${APP_CONTEXT}`);
        
        // Notificar al cliente
        notifyClients({
          type: 'SW_INSTALLED',
          version: CONFIG.CACHE_VERSION,
          context: APP_CONTEXT,
          precacheComplete: true
        });

      } catch (error) {
        log('error', '💥 Error crítico en install:', error);
        cacheState.precacheComplete = false;
      }
    })()
  );
});

// === ACTIVATE: Limpieza inteligente ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Tomar control inmediato
      await self.clients.claim();
      
      // Limpiar cachés viejos
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE, ASSETS_CACHE, API_CACHE, DYNAMIC_CACHE, BUSINESS_CACHE];
      
      const deletionPromises = cacheNames
        .filter(name => !currentCaches.includes(name))
        .map(name => {
          log('info', `🗑️ Borrando caché viejo: ${name}`);
          return caches.delete(name);
        });

      await Promise.all(deletionPromises);
      
      // Limpiar expirados
      await clearExpiredCaches();
      
      // Limpiar localStorage viejo si es necesario
      await cleanOldLocalStorage();

      log('info', `✅ SW Mejorado activado: ${CONFIG.CACHE_VERSION} (${APP_CONTEXT})`);

      // Notificar a todas las pestañas
      notifyClients({
        type: 'SW_ACTIVATED',
        version: CONFIG.CACHE_VERSION,
        context: APP_CONTEXT,
        message: `¡Nueva versión ${CONFIG.CACHE_VERSION} activa!`
      });

      // Refrescar datos críticos en background
      if (APP_CONTEXT === 'castelar') {
        backgroundRefreshCastelarData();
      }
    })()
  );
});

// === FETCH: Estrategias inteligentes mejoradas ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests GET y del mismo origen
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  const pathname = url.pathname;
  const context = getAppContext(pathname);

  // Estrategias específicas por tipo de recurso
  if (isCriticalResource(pathname)) {
    // Recursos críticos: Cache First con actualización en background
    event.respondWith(cacheFirstWithUpdate(request));
  } else if (isBusinessData(pathname)) {
    // Datos de negocios: Network First con cache fresco
    event.respondWith(networkFirstWithCache(request, BUSINESS_CACHE, 'business'));
  } else if (isAPI(pathname)) {
    // APIs: Network First con TTL corto
    event.respondWith(networkFirstWithCache(request, API_CACHE, 'api'));
  } else if (isImage(pathname)) {
    // Imágenes: Cache First con limpieza
    event.respondWith(cacheFirstWithCleanup(request));
  } else if (isStaticAsset(pathname)) {
    // Assets estáticos: Cache First
    event.respondWith(cacheFirstWithUpdate(request));
  } else {
    // Por defecto: Network First
    event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE, 'dynamic'));
  }
});

// === MESSAGE: Comunicación bidireccional mejorada ===
self.addEventListener('message', async (event) => {
  const { data, ports } = event;
  const client = event.source;

  log('info', `📨 Mensaje recibido: ${data?.type}`, data);

  switch (data?.type) {
    case 'SKIP_WAITING':
      log('info', '⏩ SKIP_WAITING recibido → Activando');
      self.skipWaiting();
      break;

    case 'CLEAN_CACHE':
      event.waitUntil(clearAllDynamicCaches());
      sendResponse(ports, { type: 'CACHE_CLEANED' });
      break;

    case 'GET_CONTEXT':
      sendResponse(ports, { 
        type: 'APP_CONTEXT', 
        context: APP_CONTEXT,
        version: CONFIG.CACHE_VERSION,
        environment: isGitHubPages ? 'github-pages' : 'netlify',
        basePath: CONFIG.BASE_PATH,
        precacheComplete: cacheState.precacheComplete
      });
      break;

    case 'REFRESH_CONTENT':
      event.waitUntil(refreshLocalidadContent(data.localidad));
      sendResponse(ports, { type: 'CONTENT_REFRESHED' });
      break;

    case 'CACHE_RESOURCE':
      event.waitUntil(cacheSpecificResource(data.url, data.strategy));
      sendResponse(ports, { type: 'CACHE_RESULT', success: true });
      break;

    case 'REFRESH_BUSINESS_DATA':
      event.waitUntil(refreshBusinessData(data.localidad, data.timestamp));
      sendResponse(ports, { type: 'BUSINESS_DATA_REFRESHED' });
      break;

    case 'PAGE_FOCUS':
      log('info', '📱 PAGE_FOCUS - Refrescando datos dinámicos');
      event.waitUntil(refreshDynamicContent());
      break;

    case 'GET_CACHE_STATUS':
      sendResponse(ports, {
        type: 'CACHE_STATUS',
        status: await getCacheStatus(),
        context: APP_CONTEXT
      });
      break;

    default:
      log('warn', `❓ Mensaje no reconocido:`, data);
  }
});

// === PUSH NOTIFICATIONS MEJORADAS ===
self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data?.json() || {};
    if (!data.title) throw new Error('Falta título');
  } catch (error) {
    log('error', 'Error en push:', error);
    data = { 
      title: '¡Novedades en tu barrio!', 
      body: 'Revisa las nuevas ofertas disponibles' 
    };
  }

  const contextName = APP_CONTEXT === 'selector' ? 'tu barrio' : APP_CONTEXT;
  const options = {
    body: data.body || `Nuevas ofertas disponibles en ${contextName}`,
    icon: getFullPath('/shared/img/icon-192x192.png'),
    badge: getFullPath('/shared/img/icon-192x192.png'),
    image: data.image || getFullPath('/shared/img/icon-abeja-sola.png'),
    data: { 
      url: data.url || getFullPath('/'), 
      forceRefresh: true,
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'refresh', title: 'Actualizar' }
    ],
    tag: data.tag || 'general-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || getFullPath('/');
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(async clientsList => {
      // Buscar cliente existente
      let client = clientsList.find(c => c.url.includes(urlToOpen) && 'focus' in c);
      
      if (action === 'refresh') {
        // Acción de refresh
        if (client) {
          client.postMessage({ type: 'FORCE_REFRESH' });
        }
        return;
      }
      
      if (client) {
        // Cliente existe, enfocar
        client.focus();
        client.postMessage({ 
          type: 'NOTIFICATION_CLICKED',
          url: urlToOpen,
          forceRefresh: event.notification.data?.forceRefresh 
        });
      } else {
        // Abrir nueva ventana
        const newClient = await clients.openWindow(urlToOpen);
        if (newClient) {
          setTimeout(() => {
            newClient.postMessage({ 
              type: 'NOTIFICATION_CLICKED',
              forceRefresh: true 
            });
          }, 1000);
        }
      }
    })
  );
});

// === FUNCIONES AUXILIARES MEJORADAS ===

// Precaché con retry inteligente
async function precacheWithRetry(cache, resources, priority = 1) {
  const successful = [], failed = [];
  const maxRetries = Math.max(1, 3 - priority); // Menos reintentos para baja prioridad

  for (const resource of resources) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(resource, { 
          cache: 'no-cache',
          headers: { 
            'Cache-Control': 'no-cache',
            'X-Priority': priority.toString()
          }
        });

        if (response.ok) {
          let finalResponse = response;
          
          // Validar y optimizar JSON
          if (resource.endsWith('.json')) {
            const text = await response.text();
            try {
              JSON.parse(text); // Validar JSON
              finalResponse = new Response(text, { 
                status: response.status,
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Cached': 'true',
                  'X-Cache-Timestamp': Date.now().toString()
                }
              });
            } catch (e) {
              throw new Error('JSON inválido');
            }
          }

          await cache.put(resource, finalResponse.clone());
          successful.push(resource);
          updateCacheTimestamp(resource, getCacheType(resource));
          break;
        } else {
          lastError = new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 500)
          );
        }
      }
    }

    if (lastError) {
      failed.push({ resource, error: lastError.message });
      log('warn', `❌ Precaché fallado: ${getShortUrl(resource)}`, lastError);
    }
  }

  return { successful, failed };
}

// Estrategia: Cache First con actualización en background
async function cacheFirstWithUpdate(request) {
  const url = request.url;
  
  // Intentar desde cache primero
  const cached = await caches.match(request);
  if (cached) {
    log('info', `⚡ Crítico desde caché: ${getShortUrl(url)}`);
    
    // Actualizar en background si es necesario
    updateInBackground(request, getCacheNameForRequest(request));
    
    return cached;
  }

  // Fallback a network
  try {
    const response = await fetchWithRetry(request);
    if (response.ok) {
      const cacheName = getCacheNameForRequest(request);
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      updateCacheTimestamp(url, getCacheType(url));
    }
    return response;
  } catch (error) {
    log('error', 'Cache-first falló:', error);
    return createFallbackResponse(request, 'static');
  }
}

// Estrategia: Network First con cache inteligente
async function networkFirstWithCache(request, cacheName, type) {
  const url = request.url;
  
  // Verificar si el cache es fresco
  const cached = await caches.match(request);
  const isFresh = await isCacheFresh(url, type);
  
  if (cached && isFresh) {
    log('info', `🗃️ ${type} fresco desde caché: ${getShortUrl(url)}`);
    reportCacheHit(type, url);
    return cached;
  }

  try {
    // Intentar network
    const response = await fetchWithRetry(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      updateCacheTimestamp(url, type);
      
      // Limpiar cache si es necesario
      await limitCacheSize(cacheName, CONFIG.LIMITS[type]);
      
      log('info', `🌐 ${type} desde red: ${getShortUrl(url)}`);
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    log('warn', `📡 Network falló para ${type}: ${getShortUrl(url)}`, error);
    
    // Fallback a cache si existe
    if (cached) {
      log('info', `🔄 Fallback a caché: ${getShortUrl(url)}`);
      reportCacheMiss(type, url);
      return cached;
    }
    
    // Último recurso: respuesta de fallback
    return createFallbackResponse(request, type);
  }
}

// Estrategia: Cache First para imágenes con limpieza
async function cacheFirstWithCleanup(request) {
  const cacheName = ASSETS_CACHE;
  const cached = await caches.match(request);
  
  if (cached) {
    log('info', `🖼️ Imagen desde caché: ${getShortUrl(request.url)}`);
    reportCacheHit('assets', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await limitCacheSize(cacheName, CONFIG.LIMITS.assets);
      await cache.put(request, response.clone());
      updateCacheTimestamp(request.url, 'assets');
    }
    return response;
  } catch (error) {
    log('error', `❌ Imagen falló: ${getShortUrl(request.url)}`, error);
    return caches.match(getFullPath('/shared/img/fallback-image.png')) || 
           new Response('', { status: 404 });
  }
}

// Fetch con retry mejorado
async function fetchWithRetry(request, options = {}) {
  const { maxRetries = CONFIG.RETRY.maxRetries } = options;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          ...request.headers
        }
      });

      if (response.ok) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxRetries) {
      const delay = Math.min(
        CONFIG.RETRY.baseDelay * Math.pow(2, attempt),
        CONFIG.RETRY.maxDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Verificar si el cache es fresco
async function isCacheFresh(url, type) {
  const timestamp = cacheTimestamps[type]?.[url];
  if (!timestamp) return false;
  
  const ttl = CONFIG.TTL[type] || 0;
  const isFresh = (Date.now() - timestamp) < ttl;
  
  if (!isFresh) {
    log('info', `🕐 Cache expirado: ${getShortUrl(url)} (${type})`);
  }
  
  return isFresh;
}

// Actualizar timestamp del cache
function updateCacheTimestamp(url, type) {
  if (!cacheTimestamps[type]) cacheTimestamps[type] = {};
  cacheTimestamps[type][url] = Date.now();
}

// Limpiar caches expirados
async function clearExpiredCaches() {
  const now = Date.now();
  const cacheNames = [API_CACHE, BUSINESS_CACHE, DYNAMIC_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const type = cacheName.split('-')[0];
    
    for (const request of keys) {
      const url = request.url;
      const timestamp = cacheTimestamps[type]?.[url];
      
      if (timestamp && (now - timestamp) > CONFIG.TTL[type]) {
        await cache.delete(request);
        delete cacheTimestamps[type]?.[url];
        log('info', `🧹 Expiró caché: ${getShortUrl(url)}`);
      }
    }
  }
}

// Limitar tamaño del cache
async function limitCacheSize(cacheName, maxItems) {
  if (maxItems === 0) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const itemsToKeep = [];
    const itemsToDelete = [];
    
    // Priorizar recursos críticos
    for (const key of keys) {
      if (isCriticalResource(key.url)) {
        itemsToKeep.push(key);
      } else {
        itemsToDelete.push(key);
      }
    }
    
    // Si aún excede el límite, eliminar los más viejos
    if (itemsToKeep.length + itemsToDelete.length > maxItems) {
      const sortedForDeletion = await Promise.all(
        itemsToDelete.map(async key => {
          const response = await cache.match(key);
          const timestamp = response.headers.get('X-Cache-Timestamp') || 
                           cacheTimestamps[cacheName.split('-')[0]]?.[key.url];
          return { key, timestamp: timestamp ? parseInt(timestamp) : 0 };
        })
      );
      
      sortedForDeletion.sort((a, b) => a.timestamp - b.timestamp);
      const excess = sortedForDeletion.slice(0, (itemsToKeep.length + itemsToDelete.length) - maxItems);
      
      await Promise.all(excess.map(({ key }) => cache.delete(key)));
      log('info', `📦 Limitado ${cacheName}: borrados ${excess.length}`);
    }
  }
}

// Crear respuestas de fallback
function createFallbackResponse(request, type) {
  const url = new URL(request.url);
  
  switch (type) {
    case 'document':
      return caches.match(getFullPath('/shared/offline.html')) || 
             new Response(`
               <!DOCTYPE html>
               <html>
                 <head>
                   <title>Modo Offline</title>
                   <style>body{font-family: Arial, sans-serif; text-align: center; padding: 50px;}</style>
                 </head>
                 <body>
                   <h1>🔌 Estás offline</h1>
                   <p>Algunas funciones pueden no estar disponibles.</p>
                   <p>Revisa tu conexión a internet.</p>
                 </body>
               </html>
             `, { 
               status: 503,
               headers: { 'Content-Type': 'text/html' } 
             });
    
    case 'api':
    case 'business':
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'No se pueden cargar los datos en este momento',
        timestamp: Date.now()
      }), { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      });
    
    case 'image':
      return caches.match(getFullPath('/shared/img/fallback-image.png')) || 
             new Response('', { status: 404 });
    
    default:
      return new Response('Recurso no disponible', { status: 503 });
  }
}

// Actualizar en background
async function updateInBackground(request, cacheName) {
  const url = request.url;
  const lastUpdated = cacheTimestamps.assets?.[url];
  
  // Solo actualizar si pasó más de 1 hora
  if (lastUpdated && (Date.now() - lastUpdated) < 60 * 60 * 1000) {
    return;
  }
  
  fetch(request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
      updateCacheTimestamp(url, 'assets');
      log('info', `🔄 Background update: ${getShortUrl(url)}`);
    }
  }).catch(() => {});
}

// Limpiar todos los caches dinámicos
async function clearAllDynamicCaches() {
  const dynamicCaches = [API_CACHE, DYNAMIC_CACHE, BUSINESS_CACHE];
  
  await Promise.all(
    dynamicCaches.map(async (name) => {
      try {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        await Promise.all(keys.map(key => cache.delete(key)));
        
        const type = name.split('-')[0];
        cacheTimestamps[type] = {};
        
        log('info', `🗑️ Limpiados dinámicos: ${name} (${keys.length} items)`);
      } catch (error) {
        log('warn', `No se pudo limpiar ${name}:`, error);
      }
    })
  );
  
  // Notificar a los clientes
  notifyClients({ type: 'CACHE_CLEARED' });
}

// Refrescar contenido de localidad
async function refreshLocalidadContent(localidad) {
  if (!localidad) return;
  
  log('info', `♻️ Refresh contenido para: ${localidad}`);
  
  const pagesToRefresh = [
    getFullPath(`/${localidad}/index.html`),
    getFullPath(`/${localidad}/comunidad.html`),
    getFullPath(`/${localidad}/emprendimientos.html`),
    getFullPath(`/${localidad}/inscripcion.html`),
    getFullPath(`/${localidad}/oficios-profeciones.html`),
    getFullPath(`/${localidad}/offline.html`)
  ];
  
  const refreshPromises = pagesToRefresh.map(async (url) => {
    try {
      const response = await fetch(url + '?t=' + Date.now(), {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(url, response.clone());
        updateCacheTimestamp(url, 'dynamic');
        log('info', `🔄 Refrescado: ${url}`);
      }
    } catch (error) {
      log('warn', `Refresh falló: ${url}`, error.message);
    }
  });
  
  await Promise.allSettled(refreshPromises);
}

// Refrescar datos de Castelar en background
async function backgroundRefreshCastelarData() {
  if (APP_CONTEXT !== 'castelar') return;
  
  log('info', '🔄 Actualización background de datos Castelar');
  
  const dataFiles = [
    'comercios.json', 'carousel.json', 'panaderias.json', 'pastas.json',
    'verdulerias.json', 'fiambrerias.json', 'kioscos.json', 'mascotas.json',
    'barberias.json', 'ferreterias.json', 'tiendas.json', 'veterinarias.json',
    'carnicerias.json', 'profesiones.json', 'farmacias.json', 'cafeterias.json',
    'talleres.json', 'librerias.json', 'mates.json', 'florerias.json',
    'comidas.json', 'granja.json', 'muebles.json', 'uñas.json'
  ];
  
  const refreshPromises = dataFiles.map(async (file) => {
    const url = getFullPath(`/castelar/data/${file}`);
    try {
      const response = await fetch(url + '?bg_refresh=' + Date.now(), {
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const cache = await caches.open(BUSINESS_CACHE);
        await cache.put(url, response.clone());
        updateCacheTimestamp(url, 'business');
      }
    } catch (error) {
      // Silencioso en background
    }
  });
  
  await Promise.allSettled(refreshPromises);
  log('info', '✅ Actualización background completada');
}

// Refrescar datos de negocios específicos
async function refreshBusinessData(localidad, timestamp) {
  if (!localidad) return;
  
  log('info', `🔄 Refresh datos negocios para: ${localidad}`);
  
  const dataUrl = getFullPath(`/${localidad}/data/comercios.json`);
  try {
    const response = await fetch(dataUrl + '?refresh=' + timestamp, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const cache = await caches.open(BUSINESS_CACHE);
      await cache.put(dataUrl, response.clone());
      updateCacheTimestamp(dataUrl, 'business');
      log('info', `✅ Datos negocios actualizados: ${localidad}`);
    }
  } catch (error) {
    log('error', `❌ Error actualizando datos: ${localidad}`, error);
  }
}

// Refrescar contenido dinámico
async function refreshDynamicContent() {
  log('info', '🔄 Refrescando contenido dinámico');
  
  // Refrescar páginas actuales de clientes
  const clients = await self.clients.matchAll();
  const refreshUrls = clients.map(client => new URL(client.url).pathname);
  
  const uniqueUrls = [...new Set(refreshUrls)];
  const refreshPromises = uniqueUrls.map(async (url) => {
    if (url && !url.includes('chrome-extension')) {
      try {
        const response = await fetch(url + '?focus_refresh=' + Date.now(), {
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(url, response.clone());
          updateCacheTimestamp(url, 'dynamic');
        }
      } catch (error) {
        // Silencioso para UX
      }
    }
  });
  
  await Promise.allSettled(refreshPromises);
}

// Cachear recurso específico
async function cacheSpecificResource(url, strategy) {
  try {
    const cacheName = getCacheNameForStrategy(strategy);
    const cache = await caches.open(cacheName);
    const response = await fetch(url, { cache: 'no-cache' });
    
    if (response.ok) {
      await cache.put(url, response);
      updateCacheTimestamp(url, strategy);
      log('info', `✅ Recurso cacheado: ${getShortUrl(url)} (${strategy})`);
      return true;
    }
  } catch (error) {
    log('error', `❌ Error cacheando recurso: ${url}`, error);
  }
  return false;
}

// Obtener estado del cache
async function getCacheStatus() {
  const cacheNames = [STATIC_CACHE, ASSETS_CACHE, API_CACHE, BUSINESS_CACHE, DYNAMIC_CACHE];
  const status = {};
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    } catch (error) {
      status[cacheName] = 0;
    }
  }
  
  return {
    sizes: status,
    timestamps: cacheTimestamps,
    state: cacheState,
    totalItems: Object.values(status).reduce((a, b) => a + b, 0)
  };
}

// Limpiar localStorage viejo (para sincronización)
async function cleanOldLocalStorage() {
  // En un SW no podemos acceder a localStorage directamente
  // Pero podemos notificar a los clientes para que lo hagan
  notifyClients({ type: 'CLEAN_LOCAL_STORAGE' });
}

// === FUNCIONES DE UTILIDAD ===

function getCacheNameForRequest(request) {
  const url = request.url;
  if (isImage(url)) return ASSETS_CACHE;
  if (isAPI(url)) return API_CACHE;
  if (isBusinessData(url)) return BUSINESS_CACHE;
  if (isStaticAsset(url)) return STATIC_CACHE;
  return DYNAMIC_CACHE;
}

function getCacheNameForStrategy(strategy) {
  switch (strategy) {
    case 'static': return STATIC_CACHE;
    case 'assets': return ASSETS_CACHE;
    case 'api': return API_CACHE;
    case 'business': return BUSINESS_CACHE;
    case 'dynamic': return DYNAMIC_CACHE;
    default: return STATIC_CACHE;
  }
}

function getCacheType(url) {
  if (isImage(url)) return 'assets';
  if (isAPI(url)) return 'api';
  if (isBusinessData(url)) return 'business';
  if (isStaticAsset(url)) return 'static';
  return 'dynamic';
}

function getShortUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.length > 30 ? 
      '...' + parsed.pathname.slice(-27) : 
      parsed.pathname;
  } catch {
    return url.length > 30 ? '...' + url.slice(-27) : url;
  }
}

function reportCacheHit(type, url) {
  notifyClients({
    type: 'CACHE_HIT',
    strategy: type,
    url: url
  });
}

function reportCacheMiss(type, url) {
  notifyClients({
    type: 'CACHE_MISS',
    strategy: type,
    url: url
  });
}

function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

function sendResponse(ports, message) {
  if (ports && ports[0]) {
    ports[0].postMessage(message);
  }
}

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const levels = { 
    info: 'ℹ️', 
    warn: '⚠️', 
    error: '❌' 
  };
  
  // En producción, solo loguear warnings y errors
  if (self.location.hostname !== 'localhost' && level === 'info') {
    return;
  }
  
  console[level](`[SW ${CONFIG.CACHE_VERSION}] ${timestamp} ${levels[level]} ${message}`, ...args);
}

// === INICIALIZACIÓN ===
log('info', `🚀 SW Mejorado cargado - Contexto: ${APP_CONTEXT}`);
log('info', `📍 Entorno: ${isGitHubPages ? 'GitHub Pages' : 'Netlify'}`);
log('info', `🛣️  Ruta base: ${CONFIG.BASE_PATH || '(raíz)'}`);
log('info', `🎯 Optimizado para: Castelar y todas las localidades`);
log('info', `📊 Límites: Assets:${CONFIG.LIMITS.assets}, Business:${CONFIG.LIMITS.business}`);

// Inicializar estado
cacheState.startTime = Date.now();
cacheState.version = CONFIG.CACHE_VERSION;
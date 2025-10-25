// main-2.js - Versión Mejorada v65-multi con Estados de Negocios - ERROR FIXED
// CORREGIDO: Error insertBefore en línea 1082 - VERSIÓN CON FUNCIÓN SEGURA
// MANTIENE las tarjetas originales de las secciones y SOLO actualiza la lógica del mapa

document.addEventListener('DOMContentLoaded', function() {
  // --- CONSTANTES GLOBALES ---
  const CACHE_KEY = 'businesses_cache_v4';
  const whatsappNumber = '5491157194796';
  const MAX_ACCURACY = 15;
  const MAX_ATTEMPTS = 10;
  const MAX_TIMEOUT = 30000;
  
  // --- VARIABLES GLOBALES ---
  let deferredPrompt = null;
  window.businesses = [];
  window.map = null;
  window.userMarker = null;
  window.userAccuracyCircle = null;
  window.mapInitialized = false;
  let locationWatchId = null;
  let highAccuracyPosition = null;
  let locationAttempts = 0;
  let setupComplete = false;
  let isMapReady = false;
  let businessListContainer = null;
  let updateBusinessListDebounced;
  let businessIndex = null;

  // --- NUEVA CONFIGURACIÓN MEJORADA ---
  const APP_CONFIG = {
    VERSION: 'v70-multi',
    CACHE_STRATEGIES: {
        STATIC: 'static',
        ASSETS: 'assets', 
        API: 'api',
        BUSINESS: 'business',
        DYNAMIC: 'dynamic'
    },
    OFFLINE_CONFIG: {
        MAX_RETRIES: 3,
        RETRY_DELAY: 2000,
        QUEUE_TIMEOUT: 30000
    }
  };

  // Variable global para compatibilidad con nuevos componentes
  window.appData = {
    comercios: [],
    rubros: [],
    isLoading: true
  };

  // === FUNCIÓN MEJORADA PARA MANEJO SEGURO DEL MODAL ===
function safeModalElementInsertion(newElement, targetId, containerSelector = '#businessModal .modal-body') {
    const container = document.querySelector(containerSelector);
    const targetElement = document.getElementById(targetId);
    
    console.log('🔍 Verificando elementos para inserción:', {
        container: !!container,
        targetElement: !!targetElement,
        newElement: !!newElement,
        targetInContainer: container && targetElement ? container.contains(targetElement) : false,
        containerChildren: container ? container.children.length : 0
    });
    
    if (!container) {
        console.error('💥 Contenedor no encontrado:', containerSelector);
        return false;
    }
    
    if (!newElement) {
        console.error('💥 Nuevo elemento no válido');
        return false;
    }
    
    // 🆕 VERIFICACIÓN MEJORADA: Asegurar que el target esté en el contenedor
    if (targetElement && container.contains(targetElement)) {
        try {
            container.insertBefore(newElement, targetElement);
            console.log('✅ Elemento insertado correctamente antes de:', targetId);
            return true;
        } catch (error) {
            console.error('💥 Error en insertBefore:', error);
            // Fallback mejorado
            return insertWithFallback(newElement, targetElement, container);
        }
    } else {
        // 🆕 FALLBACK MÁS ROBUSTO
        console.warn('⚠️ Target no disponible o no está en el contenedor, usando fallback mejorado');
        return insertWithFallback(newElement, targetElement, container);
    }
}

// 🆕 FUNCIÓN AUXILIAR MEJORADA PARA FALLBACKS
function insertWithFallback(newElement, targetElement, container) {
    const fallbackSelectors = [
        '#modalAddress',
        '#modalName', 
        '#modalHours',
        '#modalPhone',
        '.modal-body h5',
        '.modal-body p',
        '.modal-body div'
    ];
    
    // Intentar encontrar un elemento de referencia válido
    for (const selector of fallbackSelectors) {
        const referenceElement = document.querySelector(selector);
        if (referenceElement && container.contains(referenceElement)) {
            try {
                container.insertBefore(newElement, referenceElement);
                console.log('✅ Elemento insertado usando fallback antes de:', selector);
                return true;
            } catch (error) {
                console.warn(`⚠️ Fallback falló para ${selector}:`, error);
                continue;
            }
        }
    }
    
    // 🆕 ÚLTIMO RECURSO: Insertar después del título o al principio
    try {
        const modalTitle = container.querySelector('#modalName') || 
                          container.querySelector('h5') || 
                          container.querySelector('h6');
        
        if (modalTitle && modalTitle.nextElementSibling) {
            container.insertBefore(newElement, modalTitle.nextElementSibling);
            console.log('✅ Elemento insertado después del título');
        } else {
            container.insertBefore(newElement, container.firstChild);
            console.log('✅ Elemento insertado al inicio del contenedor');
        }
        return true;
    } catch (finalError) {
        console.error('💥 Todos los fallbacks fallaron, usando append:', finalError);
        container.appendChild(newElement);
        return true;
    }
}

// === MODAL DETALLADO DEL NEGOCIO - SIN INSERTBEFORE ===
document.addEventListener('click', function(e) {
    const image = e.target.closest('.clickable-image');
    if (!image) return;
    
    const negocio = JSON.parse(image.dataset.business);
    const isOpen = isBusinessOpen(negocio.horarioData || negocio.horario);
    
    console.log('🔄 Abriendo modal para:', negocio.nombre);

    // 1. ACTUALIZAR CONTENIDO BÁSICO DEL MODAL
    const modalImage = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalAddress = document.getElementById('modalAddress');
    const modalHours = document.getElementById('modalHours');
    const modalPhone = document.getElementById('modalPhone');
    
    if (modalImage) modalImage.src = negocio.imagen;
    if (modalImage) modalImage.alt = negocio.nombre;
    if (modalName) modalName.textContent = negocio.nombre;
    if (modalAddress) modalAddress.textContent = negocio.direccion || 'No disponible';
    if (modalHours) modalHours.textContent = negocio.horario;
    if (modalPhone) modalPhone.textContent = negocio.telefono;

    // 2. 🎯 SOLUCIÓN DEFINITIVA: USAR APPENDCHILD EN LUGAR DE INSERTBEFORE
    let statusElement = document.getElementById('modalStatus');
    
    if (!statusElement) {
        // Crear elemento de estado
        statusElement = document.createElement('div');
        statusElement.id = 'modalStatus';
        statusElement.className = 'mb-3 text-center';
        
        // 🚫 NO USAR INSERTBEFORE - USAR APPROACH DIFERENTE
        const modalBody = document.querySelector('#businessModal .modal-body');
        if (modalBody) {
            // Buscar el elemento después del cual queremos insertar
            const referenceElement = document.getElementById('modalName');
            if (referenceElement && referenceElement.nextSibling) {
                // Insertar después del nombre usando approach seguro
                modalBody.insertBefore(statusElement, referenceElement.nextSibling);
            } else if (referenceElement) {
                // Si no hay nextSibling, agregar al final del body
                modalBody.appendChild(statusElement);
            } else {
                // Fallback: agregar al inicio
                modalBody.insertBefore(statusElement, modalBody.firstChild);
            }
            console.log('✅ Elemento de estado creado exitosamente');
        }
    }
    
    // 3. ACTUALIZAR CONTENIDO DEL ESTADO
    if (statusElement) {
        statusElement.innerHTML = isOpen ? 
            '<span class="badge bg-success p-2 fs-6"><i class="fas fa-door-open me-2"></i> ABIERTO AHORA</span>' : 
            '<span class="badge bg-danger p-2 fs-6"><i class="fas fa-door-closed me-2"></i> CERRADO</span>';
    }

    // 4. ACTUALIZAR BOTONES
    updateModalButtons(negocio, isOpen);
    
    // 5. ACTUALIZAR TÍTULO DEL MODAL
    const modalLabel = document.getElementById('businessModalLabel');
    if (modalLabel) modalLabel.textContent = negocio.nombre;
    
    console.log('✅ Modal configurado correctamente');
});

// FUNCIÓN PARA ACTUALIZAR BOTONES (SEGURA)
function updateModalButtons(negocio, isOpen) {
    // WhatsApp
    const modalWhatsapp = document.getElementById('modalWhatsapp');
    if (modalWhatsapp) {
        modalWhatsapp.href = `https://wa.me/${negocio.whatsapp}?text=Hola%20${encodeURIComponent(negocio.nombre)}%20desde%20BarrioClik`;
        modalWhatsapp.classList.toggle('disabled', !isOpen);
        modalWhatsapp.style.opacity = isOpen ? '1' : '0.5';
    }
    
    // Website
    const modalWebsite = document.getElementById('modalWebsite');
    if (modalWebsite) {
        modalWebsite.href = negocio.pagina || '#';
        modalWebsite.style.display = negocio.pagina ? 'inline-block' : 'none';
    }
    
    // Mapa
    const modalMap = document.getElementById('modalMap');
    if (modalMap) {
        modalMap.href = `https://maps.google.com/?q=${negocio.latitud},${negocio.longitud}`;
        modalMap.style.display = (negocio.latitud && negocio.longitud) ? 'inline-block' : 'none';
    }
    
    // Promoción
    const modalPromo = document.getElementById('modalPromo');
    if (modalPromo) {
        modalPromo.style.display = negocio.promo ? 'inline-block' : 'none';
        if (negocio.promo) modalPromo.textContent = negocio.promo;
    }
}

// LIMPIAR MODAL AL CERRAR
document.getElementById('businessModal')?.addEventListener('hidden.bs.modal', function () {
    const img = document.getElementById('modalImage');
    if (img) img.src = '';
    console.log('🧹 Modal limpiado');
});
  // === FUNCIONES DE UTILIDAD PARA MANEJO SEGURO DEL DOM ===
  const DOMUtils = {
    // Función segura para insertar elementos
    safeInsertBefore: function(newNode, referenceNode) {
        if (!newNode || !referenceNode) {
            console.warn('❌ Nodes no válidos para insertBefore');
            return false;
        }
        
        if (!referenceNode.parentNode) {
            console.warn('❌ referenceNode no tiene parentNode');
            return false;
        }
        
        try {
            referenceNode.parentNode.insertBefore(newNode, referenceNode);
            return true;
        } catch (error) {
            console.error('💥 Error en insertBefore:', error);
            return false;
        }
    },
    
    // Función alternativa segura para append
    safeAppend: function(parent, child) {
        if (!parent || !child) {
            console.warn('❌ Parent o child no válidos');
            return false;
        }
        
        try {
            parent.appendChild(child);
            return true;
        } catch (error) {
            console.error('💥 Error en appendChild:', error);
            return false;
        }
    },
    
    // Verificar si un elemento existe en el DOM
    isInDOM: function(element) {
        return element && document.body.contains(element);
    }
  };

  // --- NUEVOS COMPONENTES MEJORADOS ---
  
  // 1. CACHE MANAGER MEJORADO
  class CacheManager {
    constructor() {
        this.strategies = APP_CONFIG.CACHE_STRATEGIES;
        this.isSWReady = false;
        this.init();
    }
    
    init() {
        this.setupSWListeners();
        setTimeout(() => this.checkSWCompatibility(), 1000);
    }
    
    setupSWListeners() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { data } = event;
                this.handleSWMessage(data);
            });
        }
    }
    
    async checkSWCompatibility() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.isSWReady = true;
                console.log('✅ SW listo para cache avanzado');
            } catch (error) {
                console.warn('❌ SW no disponible, continuando sin cache avanzado');
                this.isSWReady = false;
            }
        }
    }
    
    handleSWMessage(data) {
        switch (data.type) {
            case 'SW_UPDATED':
                console.log('🔄 SW actualizado:', data.message);
                break;
            case 'FORCE_REFRESH':
                console.log('🔄 Refresh forzado por SW');
                location.reload();
                break;
        }
    }
  }

  // 2. OFFLINE QUEUE MEJORADO
  class OfflineQueue {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.isProcessing = false;
        this.init();
    }
    
    init() {
        this.setupConnectivityListeners();
        this.loadQueue();
        this.updateUI();
        
        if (this.isOnline) {
            setTimeout(() => this.processQueue(), 2000);
        }
    }
    
    setupConnectivityListeners() {
        window.addEventListener('online', () => {
            console.log('✅ Conexión restaurada');
            this.isOnline = true;
            this.updateUI();
            this.processQueue();
        });
        
        window.addEventListener('offline', () => {
            console.warn('📡 Sin conexión - Modo offline activado');
            this.isOnline = false;
            this.updateUI();
        });
    }
    
    addAction(action, data, priority = 'normal') {
        const queueItem = {
            id: this.generateId(),
            action: action,
            data: data,
            priority: priority,
            timestamp: Date.now(),
            retries: 0,
            status: 'pending'
        };
        
        if (priority === 'high') {
            this.queue.unshift(queueItem);
        } else {
            this.queue.push(queueItem);
        }
        
        this.saveQueue();
        this.updateUI();
        
        if (this.isOnline && !this.isProcessing) {
            setTimeout(() => this.processQueue(), 1000);
        }
        
        return queueItem.id;
    }
    
    async processQueue() {
        if (!this.isOnline || this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        console.log(`🔄 Procesando cola offline: ${this.queue.length} acciones`);
        
        const successful = [];
        const failed = [];
        
        for (const item of [...this.queue]) {
            if (item.status === 'pending' || item.status === 'failed') {
                try {
                    await this.executeAction(item);
                    item.status = 'completed';
                    successful.push(item);
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    item.retries++;
                    item.lastError = error.message;
                    
                    if (item.retries >= APP_CONFIG.OFFLINE_CONFIG.MAX_RETRIES) {
                        item.status = 'permanent_failure';
                        failed.push(item);
                    } else {
                        item.status = 'failed';
                    }
                }
            }
        }
        
        this.queue = this.queue.filter(item => 
            item.status === 'pending' || item.status === 'failed'
        );
        
        this.saveQueue();
        this.isProcessing = false;
        
        console.log(`✅ Cola procesada: ${successful.length} exitosos, ${failed.length} fallados`);
        
        if (successful.length > 0) {
            this.showNotification(`${successful.length} acciones sincronizadas`, 'success');
        }
    }
    
    async executeAction(item) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout'));
            }, APP_CONFIG.OFFLINE_CONFIG.QUEUE_TIMEOUT);
            
            // Simular ejecución - en producción conectar con APIs reales
            setTimeout(() => {
                clearTimeout(timeoutId);
                console.log(`✅ Acción ejecutada: ${item.action}`, item.data);
                resolve();
            }, 500);
        });
    }
    
    updateUI() {
        let indicator = document.getElementById('offline-indicator');
        
        if (!indicator) {
            indicator = this.createOfflineIndicator();
        }
        
        const queueSize = this.queue.filter(item => 
            item.status === 'pending' || item.status === 'failed'
        ).length;
        
        if (!this.isOnline || queueSize > 0) {
            indicator.className = 'offline-indicator visible';
            indicator.innerHTML = this.isOnline ? 
                `🔄 Sincronizando... (${queueSize})` : 
                `📡 Modo offline - Pendientes: ${queueSize}`;
        } else {
            indicator.className = 'offline-indicator hidden';
        }
    }
    
    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            background: #ff6b6b;
            color: white;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(indicator);
        return indicator;
    }
    
    generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    saveQueue() {
        try {
            localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
        } catch (error) {
            console.error('❌ Error guardando cola:', error);
        }
    }
    
    loadQueue() {
        try {
            const saved = localStorage.getItem('offlineQueue');
            if (saved) {
                this.queue = JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Error cargando cola:', error);
            this.queue = [];
        }
    }
  }

  // 3. PERFORMANCE MONITOR MEJORADO
 class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.cacheStats = {};
        this.init();
    }
    
    init() {
        this.trackCoreWebVitals();
        this.trackCacheEfficiency();
        this.reportToAnalytics();
    }
    
    trackCoreWebVitals() {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
            console.log('📊 LCP:', this.metrics.LCP);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.metrics.FID = entry.processingStart - entry.startTime;
                console.log('📊 FID:', this.metrics.FID);
            });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.metrics.CLS = clsValue;
            console.log('📊 CLS:', this.metrics.CLS);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
    
    trackCacheEfficiency() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { data } = event;
                
                if (data.type === 'CACHE_HIT' || data.type === 'CACHE_MISS') {
                    this.recordCacheEvent(data);
                }
            });
        }
    }
    
    recordCacheEvent(data) {
        const { type, strategy, url } = data;
        const cacheKey = `cache_${strategy}_${type === 'CACHE_HIT' ? 'hits' : 'misses'}`;
        
        this.cacheStats[cacheKey] = (this.cacheStats[cacheKey] || 0) + 1;
        
        console.log(`🗃️ Cache ${type.split('_')[1]}: ${strategy} - ${this.getShortUrl(url)}`);
    }
    
    getShortUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.pathname.length > 30 ? 
                '...' + parsed.pathname.slice(-27) : 
                parsed.pathname;
        } catch {
            return url.length > 30 ? '...' + url.slice(-27) : url;
        }
    }
    
    getCacheEfficiency(strategy) {
        const hits = this.cacheStats[`cache_${strategy}_hits`] || 0;
        const misses = this.cacheStats[`cache_${strategy}_misses`] || 0;
        const total = hits + misses;
        
        return total > 0 ? Math.round((hits / total) * 100) : 0;
    }
    
    getOverallCacheEfficiency() {
        const strategies = ['static', 'assets', 'api', 'business', 'dynamic'];
        const efficiencies = strategies.map(strategy => this.getCacheEfficiency(strategy));
        const validEfficiencies = efficiencies.filter(eff => !isNaN(eff));
        
        return validEfficiencies.length > 0 ? 
            Math.round(validEfficiencies.reduce((a, b) => a + b) / validEfficiencies.length) : 0;
    }
    
    reportToAnalytics() {
        // Reportar métricas cada 30 segundos
        setInterval(() => {
            const overallEfficiency = this.getOverallCacheEfficiency();
            
            console.group('📈 Métricas de Performance');
            console.log('🏷️ LCP:', this.metrics.LCP);
            console.log('⚡ FID:', this.metrics.FID);
            console.log('🎯 CLS:', this.metrics.CLS);
            console.log('🗃️ Eficiencia Cache:', overallEfficiency + '%');
            console.groupEnd();
            
        }, 30000);
    }
}

  // --- INICIALIZACIÓN DE NUEVOS COMPONENTES ---
  function initializeEnhancedComponents() {
    window.cacheManager = new CacheManager();
    window.offlineQueue = new OfflineQueue();
    window.perfMonitor = new PerformanceMonitor();
    console.log('✅ Componentes mejorados inicializados');
  }

  // --- CONFIGURACIÓN DE PRODUCCIÓN (EXISTENTE) ---
  const APP_VERSION = 'v65-multi';
  
  // --- CONFIGURACIÓN DINÁMICA DE RUTAS (EXISTENTE) ---
  const isGitHubPages = window.location.hostname.includes('github.io');
  const BASE_PATH = isGitHubPages ? '/Zona-Tu-Barrio' : '';
  const SW_PATH = `${BASE_PATH}/sw.js`;
  const SCOPE_PATH = `${BASE_PATH}/`;
  
  // --- SERVICE WORKER EN PRODUCCIÓN (EXISTENTE) ---
  if ('serviceWorker' in navigator) {
    const currentPath = window.location.pathname;
    const isLocalidad = currentPath.includes('/castelar/') || 
                       currentPath.includes('/moron/') || 
                       currentPath.includes('/ituzaingo/') ||
                       currentPath.includes('/ciudadela/') ||
                       currentPath.includes('/merlo/') ||
                       currentPath.includes('/haedo/') ||
                       currentPath.includes('/ramos-mejia/') ||
                       (currentPath.split('/').filter(Boolean).length > 1 && 
                        !currentPath.endsWith('/index.html'));
    
    if (isLocalidad) {
      navigator.serviceWorker.register(`${SW_PATH}?v=${APP_VERSION}`, {
        scope: SCOPE_PATH, 
        updateViaCache: 'none'
      })
      .then(registration => {
        console.log('✅ SW registrado:', APP_VERSION);
        console.log('📍 Entorno:', isGitHubPages ? 'GitHub Pages' : 'Netlify');
        console.log('🛣️  Ruta base:', BASE_PATH || '(raíz)');

        const checkForUpdates = () => {
          if (registration.waiting) {
            showUpdateModal(registration);
          }
        };

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                checkForUpdates();
              }
            });
          }
        });

        checkForUpdates();
        setInterval(() => registration.update(), 10 * 60 * 1000);

      }).catch(err => {
        console.error('❌ Error crítico en SW:', err);
      });
    } else {
      console.log('🏠 En raíz - No se registra SW para selector');
      console.log('📍 Entorno:', isGitHubPages ? 'GitHub Pages' : 'Netlify');
    }
  }

  // --- GESTIÓN DEL MODAL DE ACTUALIZACIÓN (EXISTENTE) ---
  function showUpdateModal(registration) {
    const modalShownKey = `update_modal_shown_${APP_VERSION}`;
    if (sessionStorage.getItem(modalShownKey)) {
      return;
    }

    const modal = document.getElementById('update-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    document.getElementById('update-now')?.addEventListener('click', function handler() {
      modal.style.display = 'none';
      sessionStorage.setItem(modalShownKey, 'true');
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      setTimeout(() => window.location.reload(), 1000);
      
      this.removeEventListener('click', handler);
    }, { once: true });

    document.getElementById('update-later')?.addEventListener('click', function handler() {
      modal.style.display = 'none';
      this.removeEventListener('click', handler);
    }, { once: true });

    modal.addEventListener('click', function handler(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        this.removeEventListener('click', handler);
      }
    }, { once: true });
  }

  // --- NUEVA INTEGRACIÓN CON SW PARA REFRESCOS CONTINUOS (MEJORADA) ---
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SW_UPDATED') {
        console.log('¡Nueva versión detectada!', event.data.message);
        if (event.data.forceRefresh) {
          window.location.reload();
        }
      } else if (event.data.type === 'CONTENT_REFRESHED') {
        console.log('Contenido refrescado exitosamente');
        // Recargar negocios si es necesario
        if (window.businesses.length === 0) {
          loadBusinessesFromCache();
        }
      } else if (event.data.type === 'FORCE_REFRESH') {
        console.log('Refresh forzado por push notification');
        window.location.reload();
      }
    });

    function sendPageFocus() {
      navigator.serviceWorker.controller.postMessage({ type: 'PAGE_FOCUS' });
      console.log('📱 PAGE_FOCUS enviado al SW - Refrescando datos frescos');
    }

    sendPageFocus();
    window.addEventListener('focus', sendPageFocus);
  }

  // --- FUNCIONES EXISTENTES (MANTENIDAS) ---

  // Capturar el evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ Evento beforeinstallprompt capturado. PWA listo para instalarse.');
    const installButtonDesktop = document.getElementById('botonInstalar');
    const installButtonMobile = document.getElementById('botonInstalarMobile');
    if (installButtonDesktop) {
      installButtonDesktop.style.display = 'inline-block';
      installButtonDesktop.textContent = 'Instalar App';
      installButtonDesktop.disabled = false;
    }
    if (installButtonMobile) {
      installButtonMobile.style.display = 'inline-block';
      installButtonMobile.textContent = 'Instalar App';
      installButtonMobile.disabled = false;
    }
  });

  // === SUSTITUIR ALERT POR TOAST SUAVE ===
  function mostrarToast(mensaje, tipo = 'info') {
    if (document.getElementById('toastConsumidor')) {
      return;
    }
    const toast = document.createElement('div');
    toast.id = 'toastConsumidor';
    toast.className = `
      fixed top-6 left-1/2 transform -translate-x-1/2
      bg-gradient-to-r from-blue-500 to-blue-700 text-white
      px-6 py-3 rounded-full shadow-lg
      text-sm font-medium z-50
      opacity-0 translate-y-[-20px]
      transition-all duration-300
      flex items-center gap-2
      max-w-xs
    `;
    toast.innerHTML = `
      <i class="fas fa-user-check"></i>
      <span>${mensaje}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('opacity-0', 'translate-y-[-20px]');
      toast.classList.add('opacity-100', 'translate-y-0');
    }, 100);
    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-[-20px]');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // === Cuando el usuario elige "Consumidor" ===
  document.getElementById('btnSoyConsumidor')?.addEventListener('click', () => {
    const modalSeleccion = bootstrap.Modal.getInstance(document.getElementById('modalSeleccion'));
    if (modalSeleccion) {
      modalSeleccion.hide();
    }
    mostrarToast('¡Bienvenido! Explora los comercios de Castelar.');
    setTimeout(() => {
      const btnNotificacion = document.getElementById('btnNotificacion');
      if (btnNotificacion) {
        btnNotificacion.click();
      }
    }, 500);
  });

  // Función para instalar la app
  function installApp() {
    if (!deferredPrompt) {
      console.warn('❌ No hay evento deferredPrompt. La PWA no se puede instalar ahora.');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ El usuario aceptó instalar la app');
        const installButtonDesktop = document.getElementById('botonInstalar');
        const installButtonMobile = document.getElementById('botonInstalarMobile');
        if (installButtonDesktop) installButtonDesktop.style.display = 'none';
        if (installButtonMobile) installButtonMobile.style.display = 'none';
        deferredPrompt = null;
      } else {
        console.log('❌ El usuario rechazó la instalación');
      }
    });
  }

  // Asignar eventos a los botones de instalación
  document.addEventListener('DOMContentLoaded', () => {
    const installButtonDesktop = document.getElementById('botonInstalar');
    const installButtonMobile = document.getElementById('botonInstalarMobile');
    if (installButtonDesktop) {
      installButtonDesktop.addEventListener('click', installApp);
    }
    if (installButtonMobile) {
      installButtonMobile.addEventListener('click', installApp);
    }
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      if (installButtonDesktop) installButtonDesktop.style.display = 'none';
      if (installButtonMobile) installButtonMobile.style.display = 'none';
    }
  });

  // --- FUNCIONES PRINCIPALES EXISTENTES (MANTENIDAS) ---

  function isBusinessOpen(hoursString) {
    if (!hoursString) return true;
    
    try {
        const normalized = hoursString.trim().toLowerCase();
        
        // Casos especiales
        if (normalized.includes('24 horas') || normalized.includes('24h') || normalized.includes('siempre abierto')) {
            return true;
        }
        if (normalized.includes('cerrado') || normalized.includes('cerrada') || normalized.includes('no abre')) {
            return false;
        }
        
        // Para múltiples rangos separados por coma
        if (hoursString.includes(',')) {
            const timeRanges = hoursString.split(',');
            for (const range of timeRanges) {
                if (checkSingleTimeRange(range.trim())) return true;
            }
            return false;
        }
        
        return checkSingleTimeRange(hoursString);
    } catch (error) {
        console.error("Error en isBusinessOpen:", error, "Horario:", hoursString);
        return true; // Por defecto asumimos abierto si hay error
    }
  }

  function checkSingleTimeRange(timeRange) {
    const now = new Date();
    const options = { timeZone: "America/Argentina/Buenos_Aires" };
    const currentDay = now.toLocaleString("en-US", { ...options, weekday: "short" }).toLowerCase().slice(0, 3);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours + currentMinutes / 60;
    const dayMap = {
      'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0,
      'lun': 1, 'mar': 2, 'mie': 3, 'jue': 4, 'vie': 5, 'sab': 6, 'dom': 0
    };
    const match = timeRange.toLowerCase().match(/(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)-(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (match) {
      const [, startDayStr, endDayStr, startStr, endStr] = match;
      const startDay = dayMap[startDayStr];
      const endDay = dayMap[endDayStr];
      const [startHour, startMinute] = startStr.split(":").map(Number);
      const [endHour, endMinute] = endStr.split(":").map(Number);
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        console.warn(`Horario inválido: ${timeRange}`);
        return false;
      }
      const start = startHour + startMinute / 60;
      const end = endHour + endMinute / 60;
      const isOvernight = end < start;
      const currentDayNum = dayMap[currentDay];
      let isDayInRange;
      if (startDay <= endDay) {
        isDayInRange = currentDayNum >= startDay && currentDayNum <= endDay;
      } else {
        isDayInRange = currentDayNum >= startDay || currentDayNum <= endDay;
      }
      if (isOvernight) {
        return isDayInRange && (currentTime >= start || currentTime <= end);
      } else {
        return isDayInRange && currentTime >= start && currentTime <= end;
      }
    }
    const dayMatch = timeRange.toLowerCase().match(/^(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)\b/);
    if (dayMatch) {
      const day = dayMatch[0];
      const timePart = timeRange.replace(day, '').trim();
      const startDay = dayMap[day];
      const currentDayNum = dayMap[currentDay];
      if (startDay !== currentDayNum) return false;
      const timeMatch = timePart.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (!timeMatch) return false;
      const [startStr, endStr] = [timeMatch[1], timeMatch[2]];
      const [startHour, startMinute] = startStr.split(":").map(Number);
      const [endHour, endMinute] = endStr.split(":").map(Number);
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        return false;
      }
      const start = startHour + startMinute / 60;
      const end = endHour + endMinute / 60;
      const isOvernight = end < start;
      if (isOvernight) {
        return currentTime >= start || currentTime <= end;
      } else {
        return currentTime >= start && currentTime <= end;
      }
    }
    const timeOnlyMatch = timeRange.toLowerCase().match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (timeOnlyMatch) {
      const [startStr, endStr] = [timeOnlyMatch[1], timeOnlyMatch[2]];
      const [startHour, startMinute] = startStr.split(":").map(Number);
      const [endHour, endMinute] = endStr.split(":").map(Number);
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        return false;
      }
      const start = startHour + startMinute / 60;
      const end = endHour + endMinute / 60;
      const isOvernight = end < start;
      if (isOvernight) {
        return currentTime >= start || currentTime <= end;
      } else {
        return currentTime >= start && currentTime <= end;
      }
    }
    console.warn(`Formato no reconocido: ${timeRange}`);
    return true;
  }

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, '');
  }

  // --- CACHÉ PARA NEGOCIOS (MEJORADO) ---
  function loadBusinessesFromCache() {
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (!parsed.data || !Array.isArray(parsed.data)) {
            console.warn("Caché corrupto detectado. Limpiando...");
            localStorage.removeItem(CACHE_KEY);
            return false;
          }
        } catch (e) {
          console.warn("Caché JSON inválido. Limpiando...");
          localStorage.removeItem(CACHE_KEY);
          return false;
        }
      }
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (data && Array.isArray(data) && Date.now() - timestamp < CACHE_EXPIRY) {
          console.log(`✅ Negocios cargados desde caché (${data.length} negocios)`);
          window.businesses = data;
          window.appData.comercios = data; // Para compatibilidad
          window.appData.isLoading = false;
          createBusinessIndex(data);
          return true;
        }
      }
    } catch (error) {
      console.error('Error al cargar desde caché:', error);
    }
    return false;
  }

  function saveBusinessesToCache(businesses) {
    try {
      const cacheData = {
        businesses,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('No se pudo guardar en caché:', e);
    }
  }

  // --- CARGA DINÁMICA DE NEGOCIOS POR RUBRO (MEJORADA) ---
  const secciones = {
    panaderias: 'panaderias.json',
    pastas: 'pastas.json',
    verdulerias: 'verdulerias.json',
    fiambrerias: 'fiambrerias.json',
    kioscos: 'kioscos.json',
    mascotas: 'mascotas.json',
    barberias: 'barberias.json',
    ferreterias: 'ferreterias.json',
    ropa: 'tiendas.json',
    veterinarias: 'veterinarias.json',
    carnicerias: 'carnicerias.json',
    profesiones: 'profesiones.json',
    farmacias: 'farmacias.json',
    cafeterias: 'cafeterias.json',
    talleres: 'talleres.json',
    librerias: 'librerias.json',
    mates: 'mates.json',
    florerias: 'florerias.json',
    comida: 'comidas.json',
    granjas: 'granja.json',
    muebles: 'muebles.json',
    uñas: 'uñas.json'
  };
  let loadedSections = 0;
  const totalSections = Object.keys(secciones).length;

  // 🆕 FUNCIÓN ORIGINAL PARA CREAR TARJETAS (MANTIENE TUS TARJETAS ACTUALES) - VERSIÓN CORREGIDA
  function crearTarjetaNegocio(negocio) {
    const isOpen = isBusinessOpen(negocio.horarioData || negocio.horario);
    const closedClass = isOpen ? '' : 'business-closed';
    const closedBadge = isOpen ? '' : '<span class="closed-badge">🔴 CERRADO</span>';
    
    return `
      <div class="col-4 col-md-3">
        <div class="card card-small h-100 shadow-sm business-card ${closedClass}" data-aos="fade-up">
          <div class="position-relative">
            <img 
              src="${negocio.imagen}" 
              alt="${negocio.nombre}" 
              loading="lazy" 
              class="card-img-top clickable-image"
              data-bs-toggle="modal"
              data-bs-target="#businessModal"
              data-business='${JSON.stringify(negocio).replace(/'/g, "&#x27;")}'
            />
            ${closedBadge}
          </div>
          <div class="card-body text-center py-2">
            <h5 class="card-title mb-0">${negocio.nombre}</h5>
            <small class="text-muted">
              ${isOpen ? 
                '<span class="text-success">🟢 Abierto ahora</span>' : 
                '<span class="text-danger">🔴 Cerrado</span>'
              }
            </small>
          </div>
        </div>
      </div>
    `;
  }

  // === FUNCIÓN SEGURA PARA CARGAR MÁS TARJETAS - CORREGIDA ===
  function setupLoadMoreButton(loadMoreBtn, negocios, contenedor, rubro) {
    if (!loadMoreBtn) return;
    
    loadMoreBtn.style.cursor = 'pointer';
    loadMoreBtn.classList.remove('disabled');
    loadMoreBtn.style.display = 'inline-block';
    
    loadMoreBtn.dataset.currentIndex = '6';
    loadMoreBtn.dataset.isLoading = 'false';
    
    // 🆕 REMOVER EVENT LISTENERS EXISTENTES PARA EVITAR DUPLICADOS
    const newLoadMoreBtn = loadMoreBtn.cloneNode(true);
    loadMoreBtn.parentNode.replaceChild(newLoadMoreBtn, loadMoreBtn);
    
    newLoadMoreBtn.addEventListener('click', function loadMoreHandler() {
        if (this.dataset.isLoading === 'true' || 
            parseInt(this.dataset.currentIndex) >= negocios.length) {
            return;
        }
        
        this.dataset.isLoading = 'true';
        this.disabled = true;
        this.innerHTML = `
            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            Cargando...
        `;
        
        setTimeout(() => {
            const currentIndex = parseInt(this.dataset.currentIndex);
            const nextIndex = currentIndex + 6;
            const nextBatch = negocios.slice(currentIndex, nextIndex);
            
            if (nextBatch.length > 0) {
                const newCardsHTML = nextBatch.map(negocio => crearTarjetaNegocio(negocio)).join('');
                
                // 🆕 USAR MÉTODO SEGURO PARA INSERTAR
                if (!DOMUtils.safeAppend(contenedor, document.createRange().createContextualFragment(newCardsHTML))) {
                    // Fallback seguro
                    contenedor.insertAdjacentHTML('beforeend', newCardsHTML);
                }
                
                this.dataset.currentIndex = nextIndex;
                
                const buttonText = `Cargar más ${rubro.slice(0, -1)}${rubro.endsWith('s') ? 'as' : 's'}`;
                this.innerHTML = buttonText;
                this.disabled = false;
                
                if (nextIndex >= negocios.length) {
                    this.style.display = 'none';
                }
            }
            
            this.dataset.isLoading = 'false';
        }, 300);
    });
    
    newLoadMoreBtn.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#0d6efd';
        this.style.color = 'white';
    });
    
    newLoadMoreBtn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
        this.style.color = '';
    });
    
    if (negocios.length <= 6) {
        newLoadMoreBtn.style.display = 'none';
    }
    
    return newLoadMoreBtn;
  }

  async function cargarSeccion(rubro) {
    const url = `./data/${secciones[rubro]}`;
    let contenedor = null;
    let intentos = 0;
    const maxIntentos = 20;
    
    while (!contenedor && intentos < maxIntentos) {
      contenedor = document.querySelector(`#${rubro} .row`);
      if (!contenedor) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
      }
    }
    
    if (!contenedor) {
      console.error(`❌ No se encontró el contenedor para ${rubro} después de ${maxIntentos * 100}ms`);
      loadedSections++;
      checkInitialization();
      return;
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const negocios = await response.json();
      
      // Almacenar en el formato que espera el mapa
      negocios.forEach(negocio => {
        window.businesses.push({
          name: negocio.nombre,
          category: rubro,
          hours: negocio.horarioData || negocio.horario,
          address: negocio.direccion || "",
          image: negocio.imagen,
          url: negocio.pagina,
          latitude: negocio.latitud || negocio.latitude || negocio.lat || null,
          longitude: negocio.longitud || negocio.longitude || negocio.lng || null,
          telefono: negocio.telefono,
          whatsapp: negocio.whatsapp
        });
      });

      // Actualizar datos globales para compatibilidad
      window.appData.comercios = window.appData.comercios.concat(negocios);

      const limit = 6;
      const initialNegocios = negocios.slice(0, limit);
      
      let cardsHTML = initialNegocios.map(negocio => crearTarjetaNegocio(negocio)).join('');
      
      requestAnimationFrame(() => {
        contenedor.innerHTML = cardsHTML;
        
        // Configurar botón "Cargar más" - VERSIÓN CORREGIDA
        const rubroToSpanish = {
          'panaderias': 'Panadería',
          'pastas': 'Pastas',
          'verdulerias': 'Verdulería',
          'fiambrerias': 'Fiambrería',
          'kioscos': 'Kioscos',
          'mascotas': 'Mascotas',
          'barberias': 'Barbería',
          'ferreterias': 'Ferretería',
          'ropa': 'Ropa',
          'veterinarias': 'Veterinaria',
          'carnicerias': 'Carnicería',
          'profesiones': 'Profesiones',
          'farmacias': 'Farmacia',
          'cafeterias': 'Cafetería',
          'talleres': 'Talleres',
          'librerias': 'Librerías',
          'mates': 'Mates',
          'florerias': 'Florería',
          'comidas': 'Comida',
          'granjas': 'Granjas',
          'muebles': 'Muebles',
          'uñas': 'Uñas'
        };
        
        let loadMoreBtn = document.querySelector(`[data-category="${rubroToSpanish[rubro] || rubro.charAt(0).toUpperCase() + rubro.slice(1)}"]`);
        
        if (!loadMoreBtn) {
          loadMoreBtn = document.querySelector(`#loadMore${rubro.charAt(0).toUpperCase() + rubro.slice(1)}`);
        }
        
        if (!loadMoreBtn) {
          const section = document.getElementById(rubro);
          if (section) {
            loadMoreBtn = section.querySelector('.load-more-btn');
          }
        }
        
        // 🆕 USAR LA NUEVA FUNCIÓN SEGURA
        if (loadMoreBtn) {
          setupLoadMoreButton(loadMoreBtn, negocios, contenedor, rubro);
        } else {
          console.warn(`❌ No se encontró botón de carga para ${rubro}`);
        }
        
        if (contenedor.children.length === 0) {
          console.warn(`⚠️ Renderizado fallido en ${rubro}. Forzando reflow...`);
          contenedor.style.display = 'none';
          contenedor.offsetHeight;
          contenedor.style.display = '';
          contenedor.innerHTML = cardsHTML;
        }
        
        contenedor.offsetHeight;
        loadedSections++;
        checkInitialization();
      }); 
    } catch (err) {
      console.error(`Error cargando ${rubro}:`, err);
      contenedor.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar negocios.</p></div>';
      loadedSections++;
      checkInitialization();
    }
  }

  // === MODAL DETALLADO DEL NEGOCIO MEJORADO CON ESTADO - VERSIÓN CORREGIDA ===
  document.addEventListener('click', function(e) {
    const image = e.target.closest('.clickable-image');
    if (!image) return;
    
    const negocio = JSON.parse(image.dataset.business);
    const isOpen = isBusinessOpen(negocio.horarioData || negocio.horario);
    
    const modal = document.getElementById('businessModal');
    
    document.getElementById('modalImage').src = negocio.imagen;
    document.getElementById('modalImage').alt = negocio.nombre;
    document.getElementById('modalName').textContent = negocio.nombre;
    document.getElementById('modalAddress').textContent = negocio.direccion || 'No disponible';
    document.getElementById('modalHours').textContent = negocio.horario;
    document.getElementById('modalPhone').textContent = negocio.telefono;
    
    // 🆕 Agregar indicador de estado en el modal - VERSIÓN CORREGIDA
    const statusElement = document.getElementById('modalStatus') || (() => {
        const statusEl = document.createElement('div');
        statusEl.id = 'modalStatus';
        statusEl.className = 'mb-2';
        
        // 🛠️ USAR LA NUEVA FUNCIÓN SEGURA EN LUGAR DE insertBefore
        const success = safeModalElementInsertion(statusEl, 'modalAddress');
        
        if (!success) {
            console.error('💥 No se pudo insertar statusElement');
        }
        
        return statusEl;
    })();
    
    statusElement.innerHTML = isOpen ? 
        '<span class="badge bg-success">🟢 ABIERTO AHORA</span>' : 
        '<span class="badge bg-danger">🔴 CERRADO</span>';
    
    // 🆕 Actualizar botones según estado
    const modalWhatsapp = document.getElementById('modalWhatsapp');
    modalWhatsapp.href = `https://wa.me/${negocio.whatsapp}?text=Hola%20desde%20BarrioClik`;
    modalWhatsapp.classList.toggle('disabled', !isOpen);
    modalWhatsapp.style.opacity = isOpen ? '1' : '0.6';
    
    const modalWebsite = document.getElementById('modalWebsite');
    modalWebsite.href = negocio.pagina;
    modalWebsite.setAttribute('data-analytics', 'web');
    modalWebsite.setAttribute('data-negocio', negocio.nombre);

    const modalMap = document.getElementById('modalMap');
    modalMap.href = `https://maps.google.com/?daddr=${negocio.latitud},${negocio.longitud}`;
    modalMap.setAttribute('data-analytics', 'ubicacion');
    modalMap.setAttribute('data-negocio', negocio.nombre);

    const modalPromo = document.getElementById('modalPromo');
    if (modalPromo && negocio.promo) {
      modalPromo.style.display = 'inline-block';
      modalPromo.setAttribute('data-analytics', 'promocion');
      modalPromo.setAttribute('data-negocio', negocio.nombre);
      modalPromo.setAttribute('data-promo', negocio.promo);
      modalPromo.textContent = negocio.promo;
    } else if(modalPromo) {
      modalPromo.style.display = 'none';
    }

    document.getElementById('businessModalLabel').textContent = negocio.nombre;
  });

  document.getElementById('businessModal')?.addEventListener('hidden.bs.modal', function () {
    const img = document.getElementById('modalImage');
    if (img) img.src = '';
  });

  // 🆕 FUNCIÓN PARA ACTUALIZAR ESTADOS EN TIEMPO REAL
  function updateBusinessStatus() {
    console.log('🔄 Actualizando estados de negocios...');
    
    document.querySelectorAll('.business-card').forEach(card => {
        const img = card.querySelector('.clickable-image');
        if (!img) return;
        
        try {
            const negocio = JSON.parse(img.dataset.business);
            const isOpen = isBusinessOpen(negocio.horarioData || negocio.horario);
            
            // Actualizar clase principal - SOLO para deshabilitar interacción
            card.classList.toggle('business-closed', !isOpen);
            
            // Actualizar badge
            let badge = card.querySelector('.closed-badge');
            if (!isOpen && !badge) {
                badge = document.createElement('span');
                badge.className = 'closed-badge';
                badge.textContent = '🔴 CERRADO';
                card.querySelector('.position-relative').appendChild(badge);
            } else if (isOpen && badge) {
                badge.remove();
            }
            
            // Actualizar indicador de estado (texto)
            const statusIndicator = card.querySelector('.text-muted small');
            if (statusIndicator) {
                statusIndicator.innerHTML = isOpen ? 
                    '<span class="text-success">🟢 Abierto ahora</span>' : 
                    '<span class="text-danger">🔴 Cerrado</span>';
            }
            
        } catch (error) {
            console.error('Error actualizando estado del negocio:', error);
        }
    });
  }

  // Función para actualizar el estado de los rubros en la barra
  function updateRubrosBarStatus() {
    console.log('🔄 Actualizando estados de rubros en la barra...');
    
    // Mapeo de rubros de la barra a las secciones
    const rubroMapping = {
        'panaderia': 'panaderias',
        'pastas': 'pastas',
        'verduleria': 'verdulerias',
        'fiambreria': 'fiambrerias',
        'cafeteria': 'cafeterias',
        'carniceria': 'carnicerias',
        'comida-rapida': 'comida',
        'granja': 'granjas',
        'kiosco': 'kioscos',
        'mascotas': 'mascotas',
        'barberia': 'barberias',
        'ferreteria': 'ferreterias',
        'farmacia': 'farmacias',
        'floreria': 'florerias',
        'taller': 'talleres',
        'veterinaria': 'veterinarias',
        'muebles': 'muebles',
        'uñas': 'uñas',
        'libreria': 'librerias',
        'ropa': 'ropa',
        'mates': 'mates'
    };
    
    // Contar negocios abiertos por rubro
    const rubroStats = {};
    
    Object.keys(rubroMapping).forEach(rubroKey => {
        const seccion = rubroMapping[rubroKey];
        const negociosEnRubro = window.businesses.filter(b => 
            b.category === seccion || 
            (b.category && b.category.includes(seccion.replace('ias', 'ia').replace('s', '')))
        );
        
        const abiertos = negociosEnRubro.filter(b => isBusinessOpen(b.hours));
        rubroStats[rubroKey] = {
            total: negociosEnRubro.length,
            abiertos: abiertos.length,
            porcentaje: negociosEnRubro.length > 0 ? (abiertos.length / negociosEnRubro.length) * 100 : 0
        };
    });
    
    // Actualizar botones de la barra
    document.querySelectorAll('.rubro-btn[data-rubro]').forEach(btn => {
        const rubroKey = btn.getAttribute('data-rubro');
        
        // Excluir botones especiales
        if (['todos', 'mapa', 'contacto', 'profesion'].includes(rubroKey)) {
            return;
        }
        
        const stats = rubroStats[rubroKey];
        
        if (stats && stats.total > 0) {
            const tieneAbiertos = stats.abiertos > 0;
            const porcentajeAbiertos = stats.porcentaje;
            
            // Actualizar clases
            btn.classList.toggle('open', tieneAbiertos);
            btn.classList.toggle('closed', !tieneAbiertos);
            
            // Actualizar indicadores
            let openIndicator = btn.querySelector('.open-indicator');
            let closedIndicator = btn.querySelector('.closed-indicator');
            let closedText = btn.querySelector('.closed-text');
            
            if (tieneAbiertos) {
                // Remover indicadores de cerrado
                if (closedIndicator) closedIndicator.remove();
                if (closedText) closedText.remove();
                
                // Agregar o mantener indicador de abierto
                if (!openIndicator) {
                    openIndicator = document.createElement('div');
                    openIndicator.className = 'open-indicator';
                    btn.appendChild(openIndicator);
                }
                
                // Actualizar tooltip con información
                btn.title = `${stats.abiertos}/${stats.total} abiertos (${Math.round(porcentajeAbiertos)}%)`;
                
            } else {
                // Remover indicadores de abierto
                if (openIndicator) openIndicator.remove();
                
                // En la parte donde creas los indicadores, cambia a:
                if (!closedIndicator) {
                    closedIndicator = document.createElement('div');
                    closedIndicator.className = 'closed-indicator';
                    closedIndicator.style.cssText = `
                        position: absolute !important;
                        top: 6px !important;
                        right: 6px !important;
                        width: 16px !important;
                        height: 16px !important;
                        background: #ff0000 !important;
                        border: 3px solid white !important;
                        border-radius: 50% !important;
                        box-shadow: 0 0 15px #ff0000 !important;
                        z-index: 100 !important;
                    `;
                    btn.appendChild(closedIndicator);
                }

                if (!closedText) {
                    closedText = document.createElement('span');
                    closedText.className = 'closed-text';
                    closedText.textContent = 'CERRADO';
                    closedText.style.cssText = `
                        display: block !important;
                        font-size: 11px !important;
                        color: #ff0000 !important;
                        margin-top: 4px !important;
                        font-weight: 900 !important;
                        z-index: 100 !important;
                        background: rgba(255, 255, 255, 0.9) !important;
                        padding: 2px 6px !important;
                        border-radius: 4px !important;
                        border: 1px solid #ff0000 !important;
                    `;
                    
                    // Insertar después del ícono
                    const icono = btn.querySelector('i');
                    if (icono) {
                        btn.insertBefore(closedText, icono.nextSibling);
                    } else {
                        btn.appendChild(closedText);
                    }
                }
                
                btn.title = `Todos cerrados (0/${stats.total})`;
            }
            
        } else {
            // No hay negocios en este rubro
            btn.classList.remove('open', 'closed');
            btn.title = 'Sin negocios registrados';
            
            // Limpiar indicadores
            btn.querySelectorAll('.open-indicator, .closed-indicator, .closed-text').forEach(el => el.remove());
        }
    });
    
    console.log('✅ Estados de rubros actualizados');
  }

  // --- INICIALIZACIÓN DE FUNCIONALIDADES (MEJORADA) ---
  function checkInitialization() {
    if (loadedSections === totalSections) {
      console.log(`✅ Todos los negocios cargados: ${window.businesses.length}`);
      saveBusinessesToCache(window.businesses);
      window.appData.isLoading = false;
      
      // Inicializar componentes mejorados
      initializeEnhancedComponents();
      
      // Inicializar características existentes
      initializeFeatures();
      initMapLogic();
      setupLocationButton();
      
      // 🆕 Actualizar estados de negocios y rubros
      setTimeout(() => {
        updateBusinessStatus();
        updateRubrosBarStatus();
      }, 1000);
    }
  }

  function initializeFeatures() {
    if (window.businesses.length === 0) {
      if (loadBusinessesFromCache() && window.businesses.length > 0) {
        console.log("✅ Negocios cargados desde caché");
        initializeFeatures();
        initMapLogic();
        setupLocationButton();
        return;
      }
      return;
    }
    
    // --- CREAR ÍNDICE DE BÚSQUEDA ---
    createBusinessIndex(window.businesses);
    
    // --- BÚSQUEDA MEJORADA (COMPATIBLE) ---
    window.searchBusinesses = function() {
      const searchInput = document.getElementById("searchInput");
      const modalBody = document.getElementById("searchModalBody");
      const loading = document.querySelector(".loading-overlay");
      if (!searchInput || !modalBody || !loading) return;

      const bootstrapModal = new bootstrap.Modal(document.getElementById("searchModal"));
      const query = searchInput.value.trim();
      if (!query) {
        modalBody.innerHTML = "<p>Ingresa un término de búsqueda.</p>";
        bootstrapModal.show();
        return;
      }

      loading.style.display = "flex";

      // Palabras clave para oficios y emprendimientos
      const OFICIOS_KEYWORDS = [
        'albañil', 'albañiles', 'electricista', 'electricistas', 'plomero', 'plomeros',
        'fontanero', 'fontaneros', 'cerrajero', 'cerrajeros', 'herrero', 'herreros',
        'jardinero', 'jardineros', 'limpieza', 'mecánico', 'mecánicos', 'pintor',
        'pintores', 'transporte', 'flete', 'delivery local'
      ];
      const EMPRENDIMIENTOS_KEYWORDS = [
        'artesanía', 'artesanal', 'moda', 'tecnología', 'belleza', 'educación',
        'hogar', 'mascotas', 'gastronomía', 'comida casera', 'catering', 'pastelería',
        'manualidades', 'cursos', 'talleres', 'decoración', 'ropa artesanal'
      ];

      function normalizeText(str) {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
      }

      const normalizedQuery = normalizeText(query);

      // Detectar OFICIOS
      const isOficios = OFICIOS_KEYWORDS.some(kw => normalizeText(kw).includes(normalizedQuery));
      if (isOficios) {
        loading.style.display = "none";
        modalBody.innerHTML = `
          <div class="text-center p-4">
            <i class="fas fa-hard-hat fa-2x text-primary mb-3"></i>
            <h5>¿Buscás un oficio?</h5>
            <p class="text-muted">Albañiles, electricistas, plomeros y más.</p>
            <a href="oficios.html" class="btn btn-primary">Ver oficios disponibles</a>
          </div>
        `;
        bootstrapModal.show();
        return;
      }

      // Detectar EMPRENDIMIENTOS
      const isEmprendimientos = EMPRENDIMIENTOS_KEYWORDS.some(kw => normalizeText(kw).includes(normalizedQuery));
      if (isEmprendimientos) {
        loading.style.display = "none";
        modalBody.innerHTML = `
          <div class="text-center p-4">
            <i class="fas fa-lightbulb fa-2x text-warning mb-3"></i>
            <h5>¿Buscás emprendimientos?</h5>
            <p class="text-muted">Gastronomía, artesanía, moda y más.</p>
            <a href="emprendimientos.html" class="btn btn-warning">Explorar emprendimientos</a>
          </div>
        `;
        bootstrapModal.show();
        return;
      }

      // Búsqueda normal en comercios
      const results = window.businesses.filter(business => {
        const nameMatch = business.name && normalizeText(business.name).includes(normalizedQuery);
        const categoryMatch = business.category && normalizeText(business.category).includes(normalizedQuery);
        const addressMatch = business.address && normalizeText(business.address).includes(normalizedQuery);
        return nameMatch || categoryMatch || addressMatch;
      });

      const openResults = results.filter(b => isBusinessOpen(b.hours));
      loading.style.display = "none";

      if (openResults.length > 0) {
        modalBody.innerHTML = openResults.map(business => `
          <div class="result-card animate-fade-in-up">
            <img src="${business.image || 'https://placehold.co/300x200/cccccc/666666?text=Sin+imagen'}" 
                 alt="${business.name}" 
                 class="result-card-img w-100">
            <div class="result-card-body">
              <h5 class="result-card-title">${business.name}</h5>
              <div class="result-card-category">
                <i class="fas fa-tag"></i> ${business.category}
              </div>
              <p class="result-card-info">
                <i class="fas fa-map-marker-alt"></i> ${business.address || 'Dirección no disponible'}
              </p>
              <p class="result-card-hours">
                <i class="fas fa-clock"></i> ${business.hours}
                <span class="badge ${isBusinessOpen(business.hours) ? 'bg-success' : 'bg-danger'} ms-2">
                  ${isBusinessOpen(business.hours) ? 'Abierto' : 'Cerrado'}
                </span>
              </p>
              <div class="result-card-buttons">
                <button class="result-btn btn-whatsapp" 
                        onclick="openWhatsApp('${business.whatsapp || '5491157194796'}')">
                  <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="result-btn btn-website"
                        onclick="openWebsite('${business.url || '#'}')">
                  <i class="fas fa-globe"></i> Web
                </button>
                <button class="result-btn btn-location"
                        onclick="openMap(${business.latitude}, ${business.longitude})">
                  <i class="fas fa-map-marker-alt"></i> Ubicación
                </button>
                <button class="result-btn btn-contact"
                        onclick="callPhone('${business.telefono || ''}')">
                  <i class="fas fa-phone"></i> Llamar
                </button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        modalBody.innerHTML = `
          <div class="text-center text-muted py-4">
            <i class="fas fa-search fa-2x mb-3" style="color: #dc3545;"></i>
            <p class="mb-0">No se encontraron negocios abiertos con ese criterio.</p>
          </div>
        `;
      }
      bootstrapModal.show();
    };

    // Funciones globales para botones del modal
    window.openWhatsApp = function (whatsapp) {
      window.open(`https://wa.me/${whatsapp}?text=Hola%20desde%20Tu%20Barrio%20a%20un%20Clik`, '_blank');
    };
    window.openWebsite = function (url) {
      if (url && url !== '#') window.open(url, '_blank');
    };
    window.openMap = function (lat, lng) {
      if (lat && lng) window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    };
    window.callPhone = function (phone) {
      if (phone) window.open(`tel:${phone}`);
    };
    
    const searchButton = document.querySelector('button[onclick="searchBusinesses()"]');
    if (searchButton) {
      searchButton.addEventListener("click", window.searchBusinesses);
    }

    // --- CARRUSEL (EXISTENTE) ---
    const carouselContainer = document.getElementById("carouselContainer");
    if (carouselContainer) {
      carouselContainer.innerHTML = '<div class="text-center py-3 text-dark">Cargando negocios destacados...</div>';
      
      fetch("./data/carousel.json")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(carouselItems => {
          if (!carouselItems || carouselItems.length === 0) {
            throw new Error("No se encontraron items para el carrusel");
          }
          
          carouselContainer.innerHTML = '';
          
          carouselItems.forEach(item => {
            const card = document.createElement("div");
            card.className = "carousel-card";
            card.innerHTML = `
              <a href="${item.url || '#'}" class="text-decoration-none">
                <img src="${item.image || 'img/placeholder.webp'}" 
                     alt="${item.name || 'Negocio'}" 
                     loading="lazy"
                     class="w-100 h-100 object-fit-cover"
                     style="height: 100px; object-fit: cover;">
                <p class="mt-2 mb-0 text-center fw-bold" style="font-size: 0.85rem; color: #333;">
                  ${item.name || 'Sin nombre'}
                </p>
              </a>
            `;
            carouselContainer.appendChild(card);
          });
          
          const originalItems = carouselItems.length;
          for (let i = 0; i < originalItems; i++) {
            const item = carouselItems[i];
            const card = document.createElement("div");
            card.className = "carousel-card";
            card.innerHTML = `
              <a href="${item.url || '#'}" class="text-decoration-none">
                <img src="${item.image || 'img/placeholder.webp'}" 
                     alt="${item.name || 'Negocio'}" 
                     loading="lazy"
                     class="w-100 h-100 object-fit-cover"
                     style="height: 100px; object-fit: cover;">
                <p class="mt-2 mb-0 text-center fw-bold" style="font-size: 0.85rem; color: #333;">
                  ${item.name || 'Sin nombre'}
                </p>
              </a>
            `;
            carouselContainer.appendChild(card);
          }
          
          console.log(`✅ Carrusel cargado con ${carouselItems.length} negocios`);
          carouselContainer.offsetHeight;
        })
        .catch(err => {
          console.error("Error cargando carrusel:", err);
          carouselContainer.innerHTML = '<p class="text-center text-danger py-3">Error al cargar negocios destacados.</p>';
        });
    }

    // Función para scroll del carrusel
    window.scrollCarousel = function(offset) {
      const container = document.querySelector(".carousel-container");
      if (!container) return;
      
      const newPos = container.scrollLeft + offset;
      container.scrollTo({ left: newPos, behavior: "smooth" });
      
      const maxScroll = container.scrollWidth / 2;
      if (newPos >= maxScroll) {
        setTimeout(() => container.scrollTo({ left: 0, behavior: 'auto' }), 500);
      } else if (newPos <= 0) {
        setTimeout(() => container.scrollTo({ left: maxScroll, behavior: 'auto' }), 500);
      }
    };

    // --- PROMOCIONES (EXISTENTE) ---
    const offerContainer = document.getElementById("offerContainer");
    if (offerContainer) {
      fetch("./datos/promociones.json")
        .then(res => res.json())
        .then(promos => {
          offerContainer.innerHTML = '';
          promos.forEach(promo => {
            const card = document.createElement("div");
            card.className = "offer-card";
            card.innerHTML = `
              <div class="offer-image">
                <img src="${promo.logo}" alt="${promo.name}">
                ${promo.discount ? `<span class="offer-discount">${promo.discount}</span>` : ''}
              </div>
              <div class="offer-info">
                <h3>${promo.name}</h3>
                <div class="price">
                  ${promo.originalPrice ? `<span class="original-price">${promo.originalPrice}</span>` : ''}
                  <span class="discounted-price">${promo.discountedPrice}</span>
                </div>
                <a href="${promo.url.trim()}" class="menu-link" target="_blank">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 20.897a.89.89 0 0 1-.902-.895.9.9 0 0 1 .262-.635l7.37-7.37-7.37-7.36A.9.9 0 0 1 9 3.104c.24 0 .47.094.64.263l8 8a.9.9 0 0 1 0 1.27l-8 8a.89.89 0 0 1-.64.26Z"/>
                  </svg>
                  Ver oferta
                </a>
              </div>
            `;
            offerContainer.appendChild(card);
          });
          offerContainer.offsetHeight;
        })
        .catch(err => {
          console.error("Error cargando promociones:", err);
          offerContainer.innerHTML = '<p class="text-center text-danger">Error al cargar promociones.</p>';
        });
    }
    
    window.scrollOffers = function(offset) {
      const container = document.querySelector(".offer-container");
      if (container) {
        container.scrollLeft += offset;
      }
    };
    
    // --- BOTONES WHATSAPP (EXISTENTE) ---
    function checkWhatsAppButtons() {
      document.querySelectorAll(".btn-whatsapp[data-hours]").forEach(btn => {
        const hours = btn.getAttribute("data-hours");
        const isOpen = isBusinessOpen(hours);
        btn.classList.toggle("disabled", !isOpen);
        btn.style.pointerEvents = isOpen ? "auto" : "none";
        btn.style.opacity = isOpen ? "1" : "0.5";
        btn.innerHTML = `<i class="fab fa-whatsapp me-1"></i> ${isOpen ? "Contactar por WhatsApp" : "Negocio Cerrado"}`;
      });
    }
    
    checkWhatsAppButtons();
    setInterval(checkWhatsAppButtons, 60000);
    
    // --- PWA INSTALL (EXISTENTE) ---
    const installButtons = document.querySelectorAll('[id^="botonInstalar"]');
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredPrompt = e;
      installButtons.forEach(btn => btn.style.display = "inline-block");
    });
    
    installButtons.forEach(button => {
      button.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
        }
      });
    });
    
    // --- MENÚ MÓVIL (EXISTENTE) ---
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const mobileMenuModal = document.getElementById("mobileMenuModal");
    const mobileMenuClose = document.getElementById("mobileMenuClose");
    if (mobileMenuToggle && mobileMenuModal) {
      mobileMenuToggle.addEventListener("click", () => {
        const modal = new bootstrap.Modal(mobileMenuModal);
        modal.show();
      });
    }
    if (mobileMenuClose && mobileMenuModal) {
      mobileMenuClose.addEventListener("click", () => {
        const modal = bootstrap.Modal.getInstance(mobileMenuModal);
        if (modal) modal.hide();
      });
    }
    
    // --- Volver arriba (EXISTENTE) ---
    const backToTop = document.getElementById("backToTop");
    if (backToTop) {
      window.addEventListener("scroll", () => {
        backToTop.classList.toggle("d-none", window.scrollY <= 300);
      }, { passive: true });
      backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Refrescar animaciones AOS
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  // --- ÍNDICE DE BÚSQUEDA (EXISTENTE) ---
  function createBusinessIndex(businesses) {
    const index = {
      byCategory: {},
      byName: {},
      byLocation: [],
      totalItems: businesses.length
    };
    
    businesses.forEach(business => {
      const category = business.category || 'Otros';
      if (!index.byCategory[category]) {
        index.byCategory[category] = [];
      }
      index.byCategory[category].push(business);
      
      const nameKey = normalizeText(business.name);
      if (!index.byName[nameKey]) {
        index.byName[nameKey] = [];
      }
      index.byName[nameKey].push(business);
      
      if (business.latitude && business.longitude) {
        index.byLocation.push({
          business,
          lat: business.latitude,
          lng: business.longitude
        });
      }
    });
    
    businessIndex = index;
    console.log(`✅ Índice de búsqueda creado con ${index.totalItems} elementos`);
  }

  // --- FUNCIONES DE MAPA (EXISTENTES) ---
  function initMapLogic() {
    if (!isLeafletAvailable()) {
      console.log("Leaflet no está disponible. Programando verificación...");
      setTimeout(checkLeafletAndInit, 300);
      return;
    }
    setupMap();
  }

  function isLeafletAvailable() {
    return typeof L !== 'undefined' && L && L.map && L.marker;
  }

  function checkLeafletAndInit() {
    if (typeof window.leafletCheckAttempts === 'undefined') {
      window.leafletCheckAttempts = 0;
      window.MAX_LEAFLET_CHECK_ATTEMPTS = 10;
    }
    window.leafletCheckAttempts++;
    if (isLeafletAvailable()) {
      console.log("✅ Leaflet se ha cargado correctamente después de", window.leafletCheckAttempts, "intentos");
      setupMap();
      return;
    }
    if (window.leafletCheckAttempts < window.MAX_LEAFLET_CHECK_ATTEMPTS) {
      console.log(`⏳ Esperando a que Leaflet se cargue... (intento ${window.leafletCheckAttempts}/${window.MAX_LEAFLET_CHECK_ATTEMPTS})`);
      setTimeout(checkLeafletAndInit, 300);
    } else {
      console.error("❌ Error crítico: Leaflet no se cargó después de", window.MAX_LEAFLET_CHECK_ATTEMPTS, "intentos");
    }
  }

  function setupMap() {
    if (setupComplete) {
      console.log("La configuración del mapa ya se completó");
      return;
    }
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.log("No se encontró el contenedor del mapa. Esperando...");
      setTimeout(setupMap, 300);
      return;
    }
    
    const businessList = document.getElementById('businessList');
    if (!businessList) {
      console.log("No se encontró el contenedor de lista de negocios. Esperando...");
      setTimeout(setupMap, 300);
      return;
    }
    
    businessListContainer = document.getElementById('businessListContainer') || 
                           document.querySelector('.business-list-container');
                           
    if (window.businesses.length === 0) {
      console.log("Negocios no cargados aún. Esperando...");
      setTimeout(setupMap, 500);
      return;
    }
    
    updateBusinessListDebounced = debounce(function() {
      if (window.businesses && window.map && isMapReady) {
        updateBusinessList(window.businesses);
      }
    }, 500, true);
    
    initMap();
    setupComplete = true;
  }

  function initMap() {
    if (window.mapInitialized) {
        console.log("El mapa ya ha sido inicializado, omitiendo inicialización");
        return;
    }
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error("No se encontró el contenedor del mapa");
        setTimeout(initMap, 500);
        return;
    }
    
    if (!isLeafletAvailable()) {
        console.error("Leaflet no está disponible al intentar inicializar el mapa");
        setTimeout(checkLeafletAndInit, 300);
        return;
    }
    
    try {
        if (window.map && window.map.remove) {
            window.map.remove();
        }
        
        // 🆕 CONFIGURACIÓN MEJORADA DEL MAPA
        window.map = L.map('map', {
            center: [-34.652, -58.643],
            zoom: 13,
            scrollWheelZoom: true, // Cambiado a true para mejor UX
            touchZoom: true,
            dragging: true,
            zoomControl: true,
            trackResize: true,
            fadeAnimation: true,
            markerZoomAnimation: true
        });
        
        // 🆕 CAPA DEL MAPA MEJORADA
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            detectRetina: true
        }).addTo(window.map);
        
        // 🆕 INICIALIZAR COMPONENTES DEL NUEVO MAPA
        window.mapInitialized = true;
        isMapReady = true;
        
        console.log("✅ Mapa base inicializado correctamente");
        
        // 🆕 Inicializar la nueva interfaz después de un breve delay
        setTimeout(() => {
            initNewMapInterface();
            window.map.invalidateSize();
        }, 500);
        
    } catch (e) {
        console.error("Error al inicializar el mapa:", e);
        setTimeout(initMap, 500);
    }
}

 function addMapMarkers() {
    if (!isLeafletAvailable()) {
        console.warn("Leaflet no está disponible. Programando reintento...");
        setTimeout(checkLeafletAndInit, 300);
        return;
    }
    
    if (!window.map || typeof window.map.addLayer !== 'function') {
        console.warn("El mapa no está inicializado correctamente. Programando reintento...");
        setTimeout(initMap, 300);
        return;
    }
    
    if (window.businesses.length === 0) {
        console.log("No hay negocios disponibles para mostrar en el mapa");
        return;
    }
    
    // 🆕 DELEGAR A LA NUEVA IMPLEMENTACIÓN
    initNewMapInterface();
}

  function createBusinessMarker(business) {
    const marker = L.marker([business.latitude, business.longitude], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-dot ${isBusinessOpen(business.hours) ? 'open' : 'closed'}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      }),
      businessData: business
    });
    
    marker.on('popupopen', function() {
      const business = this.businessData;
      const popupContent = `
        <div class="custom-popup">
          <h6 class="mb-1">${business.name}</h6>
          <p class="text-muted mb-1" style="font-size: 0.85rem;">${business.category || 'Sin categoría'}</p>
          <div class="d-flex gap-2 mt-2">
            <a href="${business.url || '#'}" target="_blank" class="btn btn-sm btn-primary" style="font-size: 0.8rem;">Ver más</a>
            <a href="https://wa.me/${business.whatsapp}" target="_blank" class="btn btn-sm btn-success" style="font-size: 0.8rem;">Chat</a>
          </div>
        </div>
      `;
      this.setPopupContent(popupContent);
    });
    
    return marker;
  }

  function setupLocationButton() {
    const locateMeButton = document.getElementById('locateMe');
    if (!locateMeButton) return;
    
    locateMeButton.addEventListener('click', () => {
        if (!window.map) {
            showBusinessNotification('El mapa aún no está listo. Espera unos segundos.');
            return;
        }
        
        const originalText = locateMeButton.innerHTML;
        locateMeButton.disabled = true;
        locateMeButton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            Obteniendo ubicación...
        `;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const accuracyMeters = Math.round(accuracy);
                    
                    // 🆕 Limpiar marcadores anteriores
                    if (window.userMarker) window.map.removeLayer(window.userMarker);
                    if (window.userAccuracyCircle) window.map.removeLayer(window.userAccuracyCircle);
                    
                    // 🆕 Crear marcador de usuario
                    window.userMarker = L.marker([latitude, longitude], {
                        icon: L.divIcon({
                            className: 'user-location-marker',
                            html: `<div class="user-location-ring"></div><div class="user-location-dot"></div>`,
                            iconSize: [40, 40],
                            iconAnchor: [20, 20]
                        })
                    }).addTo(window.map);
                    
                    window.userAccuracyCircle = L.circle([latitude, longitude], {
                        radius: accuracy,
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.15,
                        weight: 1
                    }).addTo(window.map);
                    
                    // 🆕 Centrar mapa y actualizar lista (SIN MODAL)
                    window.map.setView([latitude, longitude], 14);
                    updateBusinessList(window.businesses);
                    
                    // 🆕 Notificación sutil
                    showBusinessNotification(`Ubicación detectada (precisión: ${accuracyMeters}m)`);
                    
                    locateMeButton.innerHTML = `
                        <i class="fas fa-location-dot me-1"></i>
                        Mi ubicación
                    `;
                    locateMeButton.disabled = false;
                },
                (error) => {
                    console.error("Error de geolocalización:", error);
                    let message = "No se pudo obtener tu ubicación. ";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message += "Permiso denegado.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message += "Ubicación no disponible.";
                            break;
                        case error.TIMEOUT:
                            message += "Tiempo de espera agotado.";
                            break;
                        default:
                            message += "Error desconocido.";
                    }
                    showBusinessNotification(message);
                    locateMeButton.innerHTML = originalText;
                    locateMeButton.disabled = false;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            showBusinessNotification("Tu navegador no soporta geolocalización.");
            locateMeButton.disabled = false;
        }
    });
}

// 🆕 FUNCIÓN ACTUALIZADA - Sin modal, solo actualiza la lista visible
function updateBusinessList(businesses) {
    const businessList = document.getElementById('businessList');
    const businessListContainer = document.getElementById('businessListContainer');
    
    if (!businessList || !businessListContainer) {
        console.log("⏳ Esperando elementos de lista de negocios...");
        return; // 🆕 No reintentar si no existen
    }
    
    if (!window.userMarker) {
        businessList.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-3">
                    <i class="fas fa-location-dot fa-2x mb-2"></i>
                    <p>Haz clic en "Mostrar mi ubicación" para ver los comercios cercanos.</p>
                </div>
            </div>
        `;
        businessListContainer.style.display = 'block';
        return;
    }
    
    try {
        const userLatLng = window.userMarker.getLatLng();
        
        const nearbyBusinesses = businesses
            .filter(business => business.latitude && business.longitude)
            .map(business => {
                const distance = window.map.distance(userLatLng, L.latLng(business.latitude, business.longitude)) / 1000;
                return { ...business, distance };
            })
            .filter(business => isBusinessOpen(business.hours) && business.distance <= 5) // 🆕 Reducido a 5km
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 6); // 🆕 Limitar a 6 resultados máximo
        
        console.log(`📍 ${nearbyBusinesses.length} negocios cercanos encontrados`);
        
        if (nearbyBusinesses.length > 0) {
            businessList.innerHTML = nearbyBusinesses.map(business => `
                <div class="col-12 col-md-6 col-lg-4 mb-3">
                    <div class="business-item border rounded p-3 bg-white shadow-sm h-100" 
                         onclick="focusOnBusiness(${business.latitude}, ${business.longitude}, '${business.name.replace(/'/g, "\\'")}')"
                         style="cursor: pointer; transition: all 0.3s ease;">
                        <h6 class="mb-2 text-primary">${business.name}</h6>
                        <p class="text-muted mb-2" style="font-size: 0.85rem;">
                            <i class="fas fa-tag me-1"></i>${getCategoryName(business.category) || 'Sin categoría'}
                        </p>
                        <p class="text-muted mb-2" style="font-size: 0.85rem;">
                            <i class="fas fa-map-marker-alt me-1"></i>${business.address || 'Dirección no disponible'}
                        </p>
                        <p class="mb-3" style="font-size: 0.85rem;">
                            <span class="badge bg-success me-2">
                                <i class="fas fa-walking me-1"></i>${business.distance.toFixed(1)} km
                            </span>
                            <span class="badge bg-info">Abierto</span>
                        </p>
                        <div class="d-flex gap-2 mt-auto">
                            <a href="https://wa.me/${business.whatsapp}" 
                               target="_blank" 
                               class="btn btn-sm btn-success flex-grow-1"
                               onclick="event.stopPropagation()">
                                <i class="fab fa-whatsapp me-1"></i>Chat
                            </a>
                            <button class="btn btn-sm btn-outline-primary"
                                    onclick="event.stopPropagation(); showDirections(${business.latitude}, ${business.longitude})">
                                <i class="fas fa-route me-1"></i>Ruta
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            businessList.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-store-slash fa-2x mb-2"></i>
                        <p>No hay comercios abiertos dentro de 5 km.</p>
                        <small class="text-muted">Intenta ampliar el área de búsqueda.</small>
                    </div>
                </div>
            `;
        }
        
        businessListContainer.style.display = 'block';
        
    } catch (e) {
        console.error("Error al actualizar la lista de negocios:", e);
        businessList.innerHTML = `
            <div class="col-12">
                <div class="text-center text-danger py-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los comercios cercanos.
                </div>
            </div>
        `;
        businessListContainer.style.display = 'block';
    }
}

// 🆕 FUNCIONES AUXILIARES PARA LA LISTA
function focusOnBusiness(lat, lng, businessName) {
    if (!window.map) return;
    
    // Centrar el mapa en el negocio
    window.map.setView([lat, lng], 16);
    
    // 🆕 Mostrar notificación sutil en lugar de modal
    showBusinessNotification(businessName);
    
    console.log(`🎯 Centrado en: ${businessName}`);
}

function showDirections(lat, lng) {
    // 🆕 Abrir Google Maps en nueva pestaña
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// 🆕 FUNCIÓN PARA NOTIFICACIÓN SUTIL
function showBusinessNotification(businessName) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'business-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-map-marker-alt text-primary me-2"></i>
            <span>Centrado en: <strong>${businessName}</strong></span>
        </div>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        border-left: 4px solid #3498db;
        font-size: 14px;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.parentNode.removeChild(notification), 300);
        }
    }, 3000);
}

  // --- FUNCIONES AUXILIARES (EXISTENTES) ---
  function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const context = this;
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function ensureMapIsVisible() {
    if (window.map && window.mapInitialized) {
      window.map.invalidateSize();
      const mapContainer = document.getElementById('map');
      if (mapContainer && mapContainer.offsetParent === null) {
        console.log("El mapa está en un contenedor oculto. Monitoreando visibilidad...");
        const observer = new MutationObserver((mutations) => {
          if (mapContainer.offsetParent !== null) {
            observer.disconnect();
            console.log("El contenedor del mapa ahora es visible. Actualizando tamaño...");
            setTimeout(() => {
              window.map.invalidateSize();
              addMapMarkers();
            }, 300);
          }
        });
        observer.observe(mapContainer.parentElement, {
          attributes: true,
          childList: true,
          subtree: true
        });
      }
    }
  }

  // Analytics (EXISTENTE)
  document.addEventListener("DOMContentLoaded", () => {
    const trackableElements = document.querySelectorAll("[data-analytics]");
    trackableElements.forEach(el => {
      el.addEventListener("click", () => {
        const tipo = el.dataset.analytics;
        const negocio = el.dataset.negocio || "Sin nombre";
        const promo = el.dataset.promo || "";
        const extra = el.dataset.extra || "";
        const eventName = `click_${tipo}`;
        const params = {
          negocio: negocio,
          promo: promo,
          extra: extra
        };
        if (typeof gtag === "function") {
          gtag("event", eventName, params);
          console.log(`Evento enviado a GA4: ${eventName}`, params);
        } else {
          console.warn("gtag no está definido, revisa la integración de GA4.");
        }
      });
    });
  });

  function fixAriaHiddenIssue() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
      searchModal.setAttribute('aria-hidden', 'false');
      searchModal.addEventListener('show.bs.modal', function() {
        this.setAttribute('aria-hidden', 'false');
      });
      searchModal.addEventListener('hidden.bs.modal', function() {
        this.setAttribute('aria-hidden', 'true');
      });
      if (searchModal.style.display === 'block' || searchModal.classList.contains('show')) {
        searchModal.setAttribute('aria-hidden', 'false');
      }
    }
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
      if (modal.style.display === 'block' || modal.classList.contains('show')) {
        modal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  // --- MODAL DE BIENVENIDA (EXISTENTE) ---
  function showWelcomeModal() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      const modal = document.getElementById('welcomeModal');
      if (modal) {
        modal.classList.add('active');
        const closeBtn = document.getElementById('welcomeCloseBtn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            localStorage.setItem('hasSeenWelcome', 'true');
          });
        }
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
            localStorage.setItem('hasSeenWelcome', 'true');
          }
        });
      }
    }
  }

  setTimeout(showWelcomeModal, 1500);

  // 🆕 INICIALIZAR ACTUALIZACIÓN PERIÓDICA DE ESTADOS
  setInterval(() => {
      updateBusinessStatus();
      updateRubrosBarStatus();
  }, 60000); // Actualizar cada minuto

  window.addEventListener('focus', () => {
      updateBusinessStatus();
      updateRubrosBarStatus();
  });

  // --- INICIALIZACIÓN FINAL MEJORADA ---
  console.log('🚀 Inicializando app con mejoras...');
  
  // Inicializar componentes mejorados inmediatamente
  initializeEnhancedComponents();
  
  // Cargar negocios (prioridad alta)
  if (loadBusinessesFromCache() && window.businesses.length > 0) {
    console.log("✅ Negocios cargados desde caché");
    initializeFeatures();
    initMapLogic();
    setupLocationButton();
  } else {
    // Cargar todas las secciones en paralelo
    Object.keys(secciones).forEach(rubro => {
      cargarSeccion(rubro);
    });
  }

  // Event listeners para el mapa
  window.addEventListener('resize', () => {
    setTimeout(ensureMapIsVisible, 100);
  });
  
  document.addEventListener('shown.bs.tab', ensureMapIsVisible);
  document.addEventListener('shown.bs.modal', ensureMapIsVisible);
  
  fixAriaHiddenIssue();

  // --- EXPORTAR FUNCIONES GLOBALES (EXISTENTES) ---
  window.setupLocationButton = setupLocationButton;
  window.updateBusinessList = updateBusinessList;
  window.isBusinessOpen = isBusinessOpen;
  window.updateBusinessStatus = updateBusinessStatus;
  window.updateRubrosBarStatus = updateRubrosBarStatus;
  
  // Exportar nuevas funciones para compatibilidad
  window.getComercios = () => window.appData.comercios;
  window.getRubros = () => window.appData.rubros;
  window.isAppLoading = () => window.appData.isLoading;
  
  // 🆕 FUNCIONES PARA LA NUEVA INTERFAZ DE MAPA CON TARJETAS - VERSIÓN CORREGIDA

// Función para crear tarjetas de negocios para el mapa - VERSIÓN CON BOTONES COMPLETOS
function crearTarjetaMapaNegocio(business) {
    const isOpen = isBusinessOpen(business.hours);
    const closedClass = isOpen ? '' : 'business-closed';
    
    // Determinar la categoría para el badge
    const categoryClass = getCategoryClass(business.category);
    const categoryName = getCategoryName(business.category);
    
    // Verificar si tiene website
    const hasWebsite = business.url && business.url !== '#' && business.url !== '';
    
    return `
        <div class="map-business-card ${closedClass}" 
             data-business-id="${business.name.replace(/\s+/g, '-').toLowerCase()}" 
             data-category="${business.category}">
            <div class="category-badge ${categoryClass}">${categoryName}</div>
            <h3>${business.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${business.address || 'Dirección no disponible'}</p>
            <p><i class="fas fa-phone"></i> ${business.telefono || 'Teléfono no disponible'}</p>
            <div class="hours">
                <p class="hours-title">Horarios:</p>
                <p>${business.hours || 'No especificado'}</p>
            </div>
            <div class="card-buttons">
                <a href="https://wa.me/${business.whatsapp || whatsappNumber}" 
                   target="_blank" 
                   class="btn-whatsapp ${!isOpen ? 'disabled' : ''}">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <!-- 🆕 BOTÓN WEB -->
                ${hasWebsite ? `
                <a href="${business.url}" 
                   target="_blank" 
                   class="btn-web"
                   data-analytics="web"
                   data-negocio="${business.name}">
                    <i class="fas fa-globe"></i> Web
                </a>
                ` : ''}
                <!-- 🆕 BOTÓN CÓMO LLEGAR -->
                <button class="btn-directions how-to-get-btn" 
                        data-lat="${business.latitude}" 
                        data-lng="${business.longitude}" 
                        data-name="${business.name}"
                        ${!business.latitude || !business.longitude ? 'disabled' : ''}>
                    <i class="fas fa-directions"></i> Cómo Llegar
                </button>
            </div>
        </div>
    `;
}

// 🆕 FUNCIONES PARA EL BOTÓN "CÓMO LLEGAR"

// Función para abrir Google Maps con direcciones
function openGoogleMapsDirections(lat, lng, businessName) {
    if (!lat || !lng) {
        showBusinessNotification('Ubicación no disponible para este negocio');
        return;
    }

    // Codificar el nombre del negocio para la URL
    const encodedName = encodeURIComponent(businessName);
    
    // Primero intentamos obtener la ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // URL de Google Maps con direcciones desde la ubicación actual
                const mapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${lat},${lng}/@${userLat},${userLng},15z`;
                
                window.open(mapsUrl, '_blank');
                
                // 🆕 Track analytics
                trackButtonClick('directions', businessName);
            },
            function(error) {
                // Si no se puede obtener la ubicación, abrir solo la ubicación del negocio
                console.error('Error obteniendo ubicación:', error);
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=15`;
                window.open(mapsUrl, '_blank');
                trackButtonClick('directions', businessName);
            }
        );
    } else {
        // Navegador no soporta geolocalización
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=15`;
        window.open(mapsUrl, '_blank');
        trackButtonClick('directions', businessName);
    }
}

// 🆕 Función para trackear clicks en botones
function trackButtonClick(action, businessName) {
    if (typeof gtag === "function") {
        gtag("event", `click_${action}`, {
            negocio: businessName,
            location: 'map_cards'
        });
    }
    console.log(`📊 Botón ${action} clickeado para: ${businessName}`);
}

// 🆕 Función para manejar el clic en el botón "Cómo Llegar"
function setupDirectionsButtons() {
    // Usar delegación de eventos para manejar clics en los botones
    document.addEventListener('click', function(e) {
        // Manejar botón "Cómo Llegar"
        if (e.target.classList.contains('how-to-get-btn') || 
            e.target.closest('.how-to-get-btn')) {
            
            const button = e.target.classList.contains('how-to-get-btn') ? 
                           e.target : e.target.closest('.how-to-get-btn');
            
            if (button.disabled) return;
            
            const lat = button.getAttribute('data-lat');
            const lng = button.getAttribute('data-lng');
            const name = button.getAttribute('data-name');
            
            // Redireccionar a Google Maps
            openGoogleMapsDirections(lat, lng, name);
            
            // Prevenir propagación del evento
            e.stopPropagation();
        }
        
        // 🆕 Manejar botones de analytics (Web)
        if (e.target.closest('[data-analytics]')) {
            const element = e.target.closest('[data-analytics]');
            const action = element.getAttribute('data-analytics');
            const businessName = element.getAttribute('data-negocio') || 'Desconocido';
            
            trackButtonClick(action, businessName);
        }
    });
}

// 🆕 Función para actualizar botones en las tarjetas
function updateCardButtons() {
    const cardsContainer = document.getElementById('cards-container');
    if (!cardsContainer) return;
    
    // Actualizar botones de direcciones
    const directionButtons = cardsContainer.querySelectorAll('.how-to-get-btn');
    directionButtons.forEach(button => {
        const lat = button.getAttribute('data-lat');
        const lng = button.getAttribute('data-lng');
        
        // Deshabilitar botón si no hay coordenadas
        if (!lat || !lng || lat === 'null' || lng === 'null') {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.title = 'Ubicación no disponible';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.title = 'Abrir en Google Maps';
        }
    });
    
    // 🆕 Actualizar botones de WhatsApp según horario
    const whatsappButtons = cardsContainer.querySelectorAll('.btn-whatsapp');
    whatsappButtons.forEach(button => {
        const isOpen = !button.classList.contains('disabled');
        button.title = isOpen ? 'Contactar por WhatsApp' : 'Negocio cerrado';
    });
    
    // 🆕 Actualizar botones Web
    const webButtons = cardsContainer.querySelectorAll('.btn-web');
    webButtons.forEach(button => {
        button.title = 'Visitar sitio web';
    });
}

// Función para obtener clase de categoría
function getCategoryClass(category) {
    const categoryMap = {
        'panaderias': 'supermarket',
        'verdulerias': 'grocery', 
        'farmacias': 'pharmacy',
        'ropa': 'clothing',
        'carnicerias': 'supermarket',
        'kioscos': 'electronics',
        'cafeterias': 'electronics',
        'fiambrerias': 'supermarket',
        'mascotas': 'electronics',
        'barberias': 'electronics',
        'ferreterias': 'electronics',
        'veterinarias': 'pharmacy',
        'pastas': 'supermarket',
        'talleres': 'electronics',
        'librerias': 'electronics',
        'mates': 'electronics',
        'florerias': 'electronics',
        'comida': 'electronics',
        'granjas': 'grocery',
        'muebles': 'electronics',
        'uñas': 'electronics'
    };
    return categoryMap[category] || 'electronics';
}

// Función para obtener nombre de categoría
function getCategoryName(category) {
    const nameMap = {
        'panaderias': 'Panadería',
        'verdulerias': 'Verdulería',
        'farmacias': 'Farmacia', 
        'ropa': 'Ropa',
        'carnicerias': 'Carnicería',
        'kioscos': 'Kiosco',
        'cafeterias': 'Cafetería',
        'fiambrerias': 'Fiambrería',
        'mascotas': 'Mascotas',
        'barberias': 'Barbería',
        'ferreterias': 'Ferretería',
        'veterinarias': 'Veterinaria',
        'pastas': 'Pastas',
        'talleres': 'Taller',
        'librerias': 'Librería',
        'mates': 'Mates',
        'florerias': 'Florería',
        'comida': 'Comida',
        'granjas': 'Granja',
        'muebles': 'Muebles',
        'uñas': 'Uñas'
    };
    return nameMap[category] || 'Otros';
}

// Función para crear icono personalizado según categoría - VERSIÓN CORREGIDA
function createCustomIcon(category) {
    const categoryColors = {
        supermarket: '#3498db',
        clothing: '#e74c3c',
        grocery: '#2ecc71', 
        pharmacy: '#9b59b6',
        electronics: '#f39c12'
    };
    
    const color = categoryColors[getCategoryClass(category)] || '#f39c12';
    
    return L.divIcon({
        className: 'custom-marker', // 🆕 Cambiado a custom-marker
        html: `<div class="marker-dot" style="background-color: ${color};"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

// Función para actualizar las tarjetas del mapa - VERSIÓN MEJORADA
function updateMapCards(businesses) {
    const cardsContainer = document.getElementById('cards-container');
    if (!cardsContainer) {
        console.log('⏳ Esperando contenedor de tarjetas...');
        setTimeout(() => updateMapCards(businesses), 500);
        return;
    }
    
    const businessesWithCoords = businesses.filter(business => 
        business.latitude && business.longitude
    );
    
    if (businessesWithCoords.length === 0) {
        cardsContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-store-slash fa-2x mb-3"></i>
                <p>No hay negocios con ubicación disponible.</p>
            </div>
        `;
        return;
    }
    
    const cardsHTML = businessesWithCoords.map(business => 
        crearTarjetaMapaNegocio(business)
    ).join('');
    
    cardsContainer.innerHTML = cardsHTML;
    
    // 🆕 Actualizar estado de todos los botones
    updateCardButtons();
    
    // Agregar event listeners a las tarjetas
    cardsContainer.querySelectorAll('.map-business-card').forEach(card => {
        card.addEventListener('click', function() {
            const businessId = this.getAttribute('data-business-id');
            highlightMapCard(businessId);
            
            // Centrar mapa en el negocio
            const business = businesses.find(b => 
                b.name.replace(/\s+/g, '-').toLowerCase() === businessId
            );
            if (business && business.latitude && business.longitude) {
                window.map.setView([business.latitude, business.longitude], 16);
            }
        });
    });
    
    console.log(`✅ ${businessesWithCoords.length} tarjetas de mapa actualizadas`);
}

// Función para resaltar tarjeta en el mapa
function highlightMapCard(businessId) {
    // Quitar clase activa de todas las tarjetas
    document.querySelectorAll('.map-business-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Añadir clase activa a la tarjeta seleccionada
    const card = document.querySelector(`[data-business-id="${businessId}"]`);
    if (card) {
        card.classList.add('active');
        
        // Desplazar horizontalmente para mostrar la tarjeta
        card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}

// Inicializar filtros del mapa - VERSIÓN MEJORADA
function initMapFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (filterButtons.length === 0) {
        console.log('⏳ Esperando botones de filtro...');
        setTimeout(initMapFilters, 500);
        return;
    }
    
    filterButtons.forEach(btn => {
        // 🆕 Remover event listeners existentes para evitar duplicados
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // 🆕 Volver a obtener los botones después del clone
    const refreshedButtons = document.querySelectorAll('.filter-btn');
    
    refreshedButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('🎯 Filtro clickeado:', this.getAttribute('data-category'));
            
            // Quitar clase activa de todos los botones
            refreshedButtons.forEach(b => {
                b.classList.remove('active');
            });
            
            // Añadir clase activa al botón clickeado
            this.classList.add('active');
            
            // Filtrar negocios
            const category = this.getAttribute('data-category');
            filterMapBusinesses(category);
        });
    });
    
    console.log('✅ Filtros de mapa inicializados correctamente');
}

// Función para filtrar negocios en el mapa - VERSIÓN MEJORADA
function filterMapBusinesses(category) {
    console.log(`🔍 Aplicando filtro: ${category}`);
    
    let filteredBusinesses;
    
    if (category === 'all') {
        filteredBusinesses = window.businesses;
    } else {
        filteredBusinesses = window.businesses.filter(business => {
            // 🆕 Búsqueda más flexible por categoría
            return business.category === category || 
                   (business.category && business.category.includes(category));
        });
    }
    
    console.log(`📊 Resultados del filtro: ${filteredBusinesses.length} negocios`);
    
    // Actualizar marcadores en el mapa
    updateMapMarkers(filteredBusinesses);
    
    // Actualizar tarjetas
    updateMapCards(filteredBusinesses);
}

// Función para actualizar marcadores del mapa
function updateMapMarkers(businesses) {
    if (!window.map) {
        console.log('⏳ Esperando mapa...');
        setTimeout(() => updateMapMarkers(businesses), 500);
        return;
    }
    
    // Limpiar marcadores existentes
    if (window.businessMarkers) {
        window.map.removeLayer(window.businessMarkers);
    }
    
    window.businessMarkers = L.featureGroup();
    
    const businessesWithCoords = businesses.filter(business => 
        business.latitude && business.longitude
    );
    
    const markers = businessesWithCoords.map(business => {
        const isOpen = isBusinessOpen(business.hours);
        
        const marker = L.marker([business.latitude, business.longitude], {
            icon: createCustomIcon(business.category)
        });
        
        // En la función updateMapMarkers, actualiza el popupContent:
        const popupContent = `
            <div class="custom-popup">
                <h6>${business.name}</h6>
                <p><i class="fas fa-map-marker-alt"></i> ${business.address || 'Dirección no disponible'}</p>
                <p><i class="fas fa-clock"></i> ${business.hours || 'Horario no disponible'}</p>
                <p><i class="fas fa-phone"></i> ${business.telefono || 'Teléfono no disponible'}</p>
                <div class="d-flex gap-2 mt-2 flex-wrap">
                    <a href="https://wa.me/${business.whatsapp}" 
                       target="_blank" 
                       class="btn btn-sm btn-success"
                       data-analytics="whatsapp"
                       data-negocio="${business.name}">
                        <i class="fab fa-whatsapp me-1"></i>WhatsApp
                    </a>
                    <!-- 🆕 BOTÓN WEB EN POPUP -->
                    ${business.url && business.url !== '#' ? `
                    <a href="${business.url}" 
                       target="_blank" 
                       class="btn btn-sm btn-info"
                       data-analytics="web"
                       data-negocio="${business.name}">
                        <i class="fas fa-globe me-1"></i>Web
                    </a>
                    ` : ''}
                    <!-- 🆕 BOTÓN CÓMO LLEGAR EN POPUP -->
                    <button class="btn btn-sm btn-primary how-to-get-btn"
                            data-lat="${business.latitude}" 
                            data-lng="${business.longitude}" 
                            data-name="${business.name}"
                            onclick="event.stopPropagation(); openGoogleMapsDirections(${business.latitude}, ${business.longitude}, '${business.name.replace(/'/g, "\\'")}')"
                            ${!business.latitude || !business.longitude ? 'disabled' : ''}>
                        <i class="fas fa-directions me-1"></i>Cómo Llegar
                    </button>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
        
        marker.on('click', function() {
            const businessId = business.name.replace(/\s+/g, '-').toLowerCase();
            highlightMapCard(businessId);
        });
        
        return marker;
    });
    
    // 🆕 USAR CLUSTERING MEJORADO
    const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            return L.divIcon({
                html: `<div class="marker-cluster">${count}</div>`,
                className: 'marker-cluster',
                iconSize: [40, 40]
            });
        }
    });
    
    clusterGroup.addLayers(markers);
    window.businessMarkers.addLayer(clusterGroup);
    window.businessMarkers.addTo(window.map);
    
    // Ajustar vista del mapa si hay marcadores
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        window.map.fitBounds(group.getBounds().pad(0.1));
    }
    
    console.log(`✅ ${markers.length} marcadores actualizados en el mapa`);
}

// Agregar leyenda al mapa - VERSIÓN SIN DUPLICADOS
function addMapLegend() {
    if (!window.map) return;
    
    // 🆕 Limpiar leyenda existente antes de agregar una nueva
    if (window.mapLegend) {
        window.map.removeControl(window.mapLegend);
    }
    
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'legend');
        let html = '<h4>Tipos de Negocios</h4>';
        
        const categories = [
            { class: 'supermarket', name: 'Alimentos' },
            { class: 'clothing', name: 'Ropa' },
            { class: 'grocery', name: 'Verdulerías' },
            { class: 'pharmacy', name: 'Farmacias' },
            { class: 'electronics', name: 'Otros' }
        ];
        
        const colors = {
            supermarket: '#3498db',
            clothing: '#e74c3c', 
            grocery: '#2ecc71',
            pharmacy: '#9b59b6',
            electronics: '#f39c12'
        };
        
        categories.forEach(cat => {
            const color = colors[cat.class];
            html += `
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <div style="width: 18px; height: 18px; background: ${color}; border-radius: 50%; margin-right: 8px; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>
                    <span style="font-size: 12px;">${cat.name}</span>
                </div>
            `;
        });
        
        div.innerHTML = html;
        return div;
    };
    
    legend.addTo(window.map);
    window.mapLegend = legend; // 🆕 Guardar referencia para evitar duplicados
    console.log('✅ Leyenda del mapa agregada (sin duplicados)');
}

// Inicializar la nueva interfaz del mapa - VERSIÓN ACTUALIZADA
function initNewMapInterface() {
    console.log('🔄 Iniciando nueva interfaz de mapa...');
    
    if (!window.map) {
        console.log('⏳ Esperando inicialización del mapa...');
        setTimeout(initNewMapInterface, 500);
        return;
    }
    
    if (!window.businesses || window.businesses.length === 0) {
        console.log('⏳ Esperando datos de negocios...');
        setTimeout(initNewMapInterface, 500);
        return;
    }
    
    console.log('🎯 Inicializando componentes del nuevo mapa...');
    
    // 🆕 Forzar redimensionamiento del mapa
    setTimeout(() => {
        window.map.invalidateSize(true);
    }, 100);
    
    // Inicializar componentes en secuencia con delays
    setTimeout(() => initMapFilters(), 200);
    setTimeout(() => updateMapMarkers(window.businesses), 400);
    setTimeout(() => updateMapCards(window.businesses), 600);
    setTimeout(() => addMapLegend(), 800);
    setTimeout(() => setupLocationButton(), 1000);
    setTimeout(() => setupDirectionsButtons(), 1200); // 🆕 Configurar botones de direcciones
    
    console.log('✅ Inicialización del nuevo mapa programada');
}

// Llamar a la inicialización después de que todo esté cargado
setTimeout(() => {
    if (window.businesses.length > 0) {
        initNewMapInterface();
    }
}, 3000);

// 🆕 FUNCIÓN SEGURA PARA WHATSAPP - Añadir al main-2.js
function openWhatsAppSecure(phone, message = '') {
    // Verificar seguridad primero
    if (!window.appSecurity) {
        console.warn('⚠️ Seguridad no disponible, usando método alternativo');
        openWhatsAppFallback(phone, message);
        return;
    }

    // Validar y sanitizar el número
    const safePhone = window.appSecurity.validatePhoneNumber(phone);
    
    if (!safePhone) {
        console.error('🔒 No se pudo validar el número de WhatsApp:', phone);
        alert('El número de WhatsApp no es válido.');
        return;
    }

    // Codificar mensaje de forma segura
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${safePhone}${message ? `?text=${encodedMessage}` : ''}`;
    
    // Abrir de forma segura
    window.appSecurity.openExternalLink(whatsappUrl);
    
    // Log de seguridad
    window.appSecurity.logSecurityEvent('whatsapp_opened', {
        phone: safePhone,
        messageLength: message.length
    });
}

// 🆕 Función de respaldo por si falla la seguridad
function openWhatsAppFallback(phone, message = '') {
    try {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phone}${message ? `?text=${encodedMessage}` : ''}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('❌ Error abriendo WhatsApp:', error);
        alert('Error al abrir WhatsApp. Por favor, intenta manualmente.');
    }
}

  console.log('✅ main-2.js mejorado completamente cargado con estados de negocios - ERROR FIXED');
});
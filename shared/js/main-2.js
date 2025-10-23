// main-2.js - Versión Mejorada v60-multi con Estados de Negocios
// Incluye funcionalidad para mostrar negocios cerrados en gris/blur

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
    VERSION: 'v60-multi',
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
  const APP_VERSION = 'v60-multi';
  
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

  // 🆕 FUNCIÓN MEJORADA PARA CREAR TARJETAS CON ESTADO
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
        
        // Configurar botón "Cargar más" - MANTENIENDO TU LÓGICA EXISTENTE
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
        
        if (loadMoreBtn) {
          loadMoreBtn.style.cursor = 'pointer';
          loadMoreBtn.classList.remove('disabled');
          loadMoreBtn.style.display = 'inline-block';
          
          loadMoreBtn.dataset.currentIndex = limit;
          loadMoreBtn.dataset.isLoading = 'false';
          
          const loadMoreBusinesses = function() {
            if (loadMoreBtn.dataset.isLoading === 'true' || 
                parseInt(loadMoreBtn.dataset.currentIndex) >= negocios.length) {
              return;
            }
            
            loadMoreBtn.dataset.isLoading = 'true';
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = `
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Cargando...
            `;
            
            setTimeout(() => {
              const currentIndex = parseInt(loadMoreBtn.dataset.currentIndex);
              const nextIndex = currentIndex + 6;
              const nextBatch = negocios.slice(currentIndex, nextIndex);
              
              if (nextBatch.length > 0) {
                const newCardsHTML = nextBatch.map(negocio => crearTarjetaNegocio(negocio)).join('');
                contenedor.insertAdjacentHTML('beforeend', newCardsHTML);
                loadMoreBtn.dataset.currentIndex = nextIndex;
                
                const buttonText = `Cargar más ${rubro.slice(0, -1)}${rubro.endsWith('s') ? 'as' : 's'}`;
                loadMoreBtn.innerHTML = buttonText;
                loadMoreBtn.disabled = false;
                
                if (nextIndex >= negocios.length) {
                  loadMoreBtn.style.display = 'none';
                }
              }
              
              loadMoreBtn.dataset.isLoading = 'false';
            }, 300);
          };
          
          loadMoreBtn.addEventListener('click', loadMoreBusinesses);
          
          loadMoreBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#0d6efd';
            this.style.color = 'white';
          });
          
          loadMoreBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
            this.style.color = '';
          });
          
          if (negocios.length <= limit) {
            loadMoreBtn.style.display = 'none';
          }
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

  // === MODAL DETALLADO DEL NEGOCIO MEJORADO CON ESTADO ===
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
    
    // 🆕 Agregar indicador de estado en el modal
    const statusElement = document.getElementById('modalStatus') || (() => {
        const statusEl = document.createElement('div');
        statusEl.id = 'modalStatus';
        statusEl.className = 'mb-2';
        document.querySelector('#businessModal .modal-body').insertBefore(statusEl, document.getElementById('modalAddress'));
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
                
                // Agregar o mantener indicadores de cerrado
                if (!closedIndicator) {
                    closedIndicator = document.createElement('div');
                    closedIndicator.className = 'closed-indicator';
                    btn.appendChild(closedIndicator);
                }
                
                if (!closedText) {
                    closedText = document.createElement('span');
                    closedText.className = 'closed-text';
                    closedText.textContent = 'CERRADO';
                    // Insertar después del texto principal
                    const textNode = btn.querySelector('span:not(.closed-text)') || btn.lastChild;
                    if (textNode) {
                        btn.insertBefore(closedText, textNode.nextSibling);
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
      
      window.map = L.map('map', {
        center: [-34.652, -58.643],
        zoom: 13,
        scrollWheelZoom: false,
        touchZoom: true,
        dragging: true,
        zoomControl: true,
        trackResize: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        bounceAtZoomLimits: false,
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: 1500,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        trackResize: true,
        preferCanvas: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        detectRetina: true,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 5,
        maxNativeZoom: 18,
        maxZoom: 19,
        loadingClass: 'loading',
        unloadInvisibleTiles: true,
        reuseTiles: true
      }).addTo(window.map);
      
      window.map.on('click', function() {
        if (!window.map.scrollWheelZoom.enabled()) {
          window.map.scrollWheelZoom.enable();
          const zoomHint = document.getElementById('mapZoomHint');
          if (zoomHint && zoomHint.parentNode) {
            zoomHint.parentNode.removeChild(zoomHint);
          }
        }
      });
      
      const zoomHint = document.createElement('div');
      zoomHint.id = 'mapZoomHint';
      zoomHint.className = 'map-zoom-hint';
      zoomHint.innerHTML = `
        <div class="hint-content">
          <i class="fas fa-mouse-pointer me-2"></i>
          <span>Haz clic en el mapa para activar el zoom con la rueda</span>
        </div>
      `;
      mapContainer.appendChild(zoomHint);
      
      window.map.on('zoomstart', function() {
        mapContainer.classList.add('map-loading');
        clearTimeout(window.mapZoomTimeout);
      });
      
      window.map.on('zoomend', function() {
        window.mapZoomTimeout = setTimeout(() => {
          mapContainer.classList.remove('map-loading');
          if (window.businesses && isMapReady) {
            updateBusinessListDebounced();
          }
        }, 150);
      });
      
      window.map.on('movestart', function() {
        mapContainer.classList.add('map-loading');
      });
      
      window.map.on('moveend', function() {
        setTimeout(() => {
          mapContainer.classList.remove('map-loading');
          if (window.businesses && isMapReady) {
            updateBusinessListDebounced();
          }
        }, 75);
      });
      
      window.mapInitialized = true;
      isMapReady = true;
      
      setTimeout(() => {
        window.map.invalidateSize();
        console.log("Tamaño del mapa actualizado");
        addMapMarkers();
      }, 100);
      
      console.log("✅ Mapa inicializado correctamente");
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
    
    try {
      if (window.businessMarkers) {
        window.map.removeLayer(window.businessMarkers);
      }
      
      window.businessMarkers = L.featureGroup();
      const markers = [];
      
      window.businesses.forEach(business => {
        if (business.latitude && business.longitude && isBusinessOpen(business.hours)) {
          const marker = createBusinessMarker(business);
          markers.push(marker);
        }
      });
      
      console.log(`✅ ${markers.length} pines agregados al mapa`);
      
      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
        iconCreateFunction: function(cluster) {
          return L.divIcon({
            html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
            className: 'marker-cluster',
            iconSize: [40, 40]
          });
        }
      }).addLayers(markers);
      
      window.businessMarkers.addLayer(clusterGroup);
      window.businessMarkers.addTo(window.map);
    } catch (e) {
      console.error("Error al agregar marcadores al mapa:", e);
    }
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

  // --- UBICACIÓN DEL USUARIO (EXISTENTE) ---
  function setupLocationButton() {
    const locateMeButton = document.getElementById('locateMe');
    if (!locateMeButton) {
      console.log("Botón 'Mostrar mi ubicación' no encontrado. Esperando...");
      setTimeout(setupLocationButton, 300);
      return;
    }
    
    locateMeButton.addEventListener('click', () => {
      console.log("Botón 'Mostrar mi ubicación' clicado");
      
      if (!window.map || typeof window.map.addLayer !== 'function') {
        alert('El mapa aún no está listo. Por favor, espera unos segundos e intenta nuevamente.');
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
            console.log(`📍 Ubicación obtenida: ${latitude}, ${longitude} (precisión: ${accuracyMeters}m)`);
            
            if (window.userMarker) window.map.removeLayer(window.userMarker);
            if (window.userAccuracyCircle) window.map.removeLayer(window.userAccuracyCircle);
            
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
            
            window.map.setView([latitude, longitude], 14);
            updateBusinessList(window.businesses);
            
            locateMeButton.innerHTML = `
              <i class="fas fa-location-dot me-1"></i>
              Mi ubicación (${accuracyMeters}m)
            `;
            locateMeButton.disabled = false;
          },
          (error) => {
            console.error("Error de geolocalización:", error);
            let message = "No se pudo obtener tu ubicación: ";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message += "permiso denegado.";
                break;
              case error.POSITION_UNAVAILABLE:
                message += "ubicación no disponible.";
                break;
              case error.TIMEOUT:
                message += "tiempo de espera agotado.";
                break;
              default:
                message += "error desconocido.";
            }
            alert(message);
            locateMeButton.innerHTML = `
              <i class="fas fa-location-dot me-1"></i>
              Mostrar mi ubicación
            `;
            locateMeButton.disabled = false;
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        alert("Tu navegador no soporta geolocalización.");
        locateMeButton.disabled = false;
      }
    });
  }

  // --- ACTUALIZAR LISTA DE COMERCIOS CERCANOS (EXISTENTE) ---
  function updateBusinessList(businesses) {
    const businessList = document.getElementById('businessList');
    const businessListContainer = document.getElementById('businessListContainer') || 
                                 document.querySelector('.business-list-container');
    if (!businessList) {
      console.error("❌ No se encontró el elemento #businessList");
      return;
    }
    
    if (!window.userMarker) {
      businessList.innerHTML = `
        <div class="text-center text-muted py-3">
          <p>Por favor, haz clic en "Mostrar mi ubicación" para ver los comercios cercanos.</p>
        </div>
      `;
      if (businessListContainer) {
        businessListContainer.style.display = 'block';
      }
      return;
    }
    
    try {
      const userLatLng = window.userMarker.getLatLng();
      
      const openBusinesses = businesses
        .filter(business => business.latitude && business.longitude)
        .map(business => {
          const distance = window.map.distance(userLatLng, L.latLng(business.latitude, business.longitude)) / 1000;
          return { ...business, distance };
        })
        .filter(business => isBusinessOpen(business.hours) && business.distance <= 10)
        .sort((a, b) => a.distance - b.distance);
      
      console.log(`✅ ${openBusinesses.length} negocios abiertos encontrados dentro de 10 km`);
      
      if (openBusinesses.length > 0) {
        businessList.innerHTML = openBusinesses.map(business => `
          <div class="col-12 col-md-6 col-lg-4 mb-2">
            <div class="border rounded p-3 bg-white shadow-sm">
              <h6 class="mb-1">${business.name}</h6>
              <p class="text-muted mb-1" style="font-size: 0.85rem;">${business.category || 'Sin categoría'}</p>
              <p class="text-muted mb-2" style="font-size: 0.85rem;">${business.address || 'Dirección no disponible'}</p>
              <p class="mb-2" style="font-size: 0.85rem;">
                <span class="badge bg-success">Abierto</span>
                <span class="ms-2">${business.distance.toFixed(2)} km</span>
              </p>
              <div class="d-flex gap-2">
                <a href="https://maps.google.com/?daddr=${business.latitude},${business.longitude}" 
                   target="_blank" 
                   class="btn btn-sm btn-outline-primary flex-grow-1">
                  <i class="fas fa-directions me-1"></i>Ruta
                </a>
                <a href="https://wa.me/${business.whatsapp}" 
                   target="_blank" 
                   class="btn btn-sm btn-outline-success flex-grow-1">
                  <i class="fab fa-whatsapp me-1"></i>Chat
                </a>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        businessList.innerHTML = `
          <div class="col-12">
            <p class="text-center text-muted py-3">No hay comercios abiertos cerca de ti.</p>
          </div>
        `;
      }
      
      if (businessListContainer) {
        businessListContainer.style.display = 'block';
      } else {
        console.warn("⚠️ No se encontró el contenedor de la lista de negocios");
      }
    } catch (e) {
      console.error("Error al actualizar la lista de negocios:", e);
      businessList.innerHTML = `
        <div class="col-12">
          <p class="text-center text-danger">Error al cargar los comercios.</p>
        </div>
      `;
      if (businessListContainer) {
        businessListContainer.style.display = 'block';
      }
    }
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
  window.updateBusinessStatus = updateBusinessStatus; // 🆕 Exportar nueva función
  window.updateRubrosBarStatus = updateRubrosBarStatus; // ← AGREGAR ESTA LÍNEA
  
  // Exportar nuevas funciones para compatibilidad
  window.getComercios = () => window.appData.comercios;
  window.getRubros = () => window.appData.rubros;
  window.isAppLoading = () => window.appData.isLoading;
  
  console.log('✅ main-2.js mejorado completamente cargado con estados de negocios');
});
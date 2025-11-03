// CONFIGURACIÓN DE SEGURIDAD CORREGIDA - Tu Barrio a un Clik
// ✅ Optimizada para: https://vicgom892.github.io/tubarrioaunclic/
class SecurityConfig {
    constructor() {
        console.log('🔒 Inicializando sistema de seguridad...');
        this.init();
    }

    init() {
        this.setSecurityHeaders();
        this.setupErrorHandling();
        this.validateEnvironment();
        this.preventClickjacking();
        this.setupNavigationGuard();
        this.validateSecuritySetup();
        this.setupServiceWorkerSecurity();
    }

    setSecurityHeaders() {
        try {
            const cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = "Content-Security-Policy";
            cspMeta.content = this.generateCSP();
            document.head.appendChild(cspMeta);
            console.log('✅ CSP configurado correctamente');
        } catch (error) {
            console.warn('⚠️ Error configurando CSP:', error);
        }

        const securityHeaders = [
            { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
            { httpEquiv: "Referrer-Policy", content: "strict-origin-when-cross-origin" },
            { name: "referrer", content: "strict-origin-when-cross-origin" }
        ];

        securityHeaders.forEach(header => {
            try {
                const meta = document.createElement('meta');
                Object.keys(header).forEach(key => {
                    meta[key] = header[key];
                });
                document.head.appendChild(meta);
            } catch (error) {
                console.warn('⚠️ Error configurando header:', header, error);
            }
        });
        console.log('✅ Headers de seguridad aplicados');
    }

    generateCSP() {
    const isLocal = window.location.hostname.includes('localhost') || 
                   window.location.hostname.includes('127.0.0.1');
    
    const self = "'self'";
    const githubDomain = "https://vicgom892.github.io";

    // En local, permitir más fuentes para desarrollo
    const imgSources = isLocal 
        ? `${self} blob: data: http: https:` 
        : `${self} blob: data: https:`;

    const connectSources = isLocal
        ? `${self} ${githubDomain} http: https:`
        : `${self} ${githubDomain} https://api.whatsapp.com https://www.google-analytics.com https://stats.g.doubleclick.net https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com`;

    return [
        `default-src ${self} ${isLocal ? 'http: https:' : githubDomain};`,
        `script-src ${self} 'unsafe-inline' 'unsafe-eval' ${isLocal ? 'http: https:' : githubDomain + ' https://cdn.jsdelivr.net https://unpkg.com https://www.googletagmanager.com https://code.jquery.com https://cdnjs.cloudflare.com'};`,
        `style-src ${self} 'unsafe-inline' ${isLocal ? 'http: https:' : githubDomain + ' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com https://cdnjs.cloudflare.com'};`,
        `font-src ${self}  ${isLocal ? 'http: https: data:' : githubDomain + ' https://fonts.gstatic.com https://cdnjs.cloudflare.com'};`,
        `img-src ${imgSources};`, // ✅ Ahora incluye data: y http: en local
        `connect-src ${connectSources};`,
        `worker-src ${self} blob:;`,
        `frame-src ${self} ${isLocal ? 'http: https:' : githubDomain};`,
        `object-src 'none';`,
        `base-uri ${self};`,
        `form-action ${self} ${isLocal ? 'http: https:' : githubDomain + ' https://api.whatsapp.com https://wa.me'};`
    ].join(' ');
}

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            if (e.message.includes('Content Security Policy')) {
                if (window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('127.0.0.1')) {
                    return;
                }
            }
            console.error('🔒 Error detectado:', e.message);
            this.logSecurityEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                localidad: this.getCurrentLocation()
            });
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('🔒 Promesa rechazada:', e.reason);
            this.logSecurityEvent('unhandled_promise_rejection', {
                reason: e.reason?.toString() || 'Unknown error',
                localidad: this.getCurrentLocation()
            });
        });

        console.log('✅ Sistema de monitoreo de errores activado');
    }

    validateEnvironment() {
        const isGitHubPages = window.location.hostname === 'vicgom892.github.io';
        const isLocal = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('127.0.0.1');

        // En GitHub Pages, HTTPS es obligatorio y automático
        if (window.location.protocol !== 'https:' && isGitHubPages) {
            console.warn('⚠️ GitHub Pages requiere HTTPS');
        }

        console.log(`✅ Entorno validado: ${isGitHubPages ? 'GitHub Pages' : isLocal ? 'Local' : 'Otro'} - Localidad: ${this.getCurrentLocation()}`);
    }

    preventClickjacking() {
        if (window !== window.top) {
            console.warn('⚠️ Posible intento de clickjacking detectado');
            this.logSecurityEvent('clickjacking_attempt', {
                current_url: window.location.href,
                localidad: this.getCurrentLocation()
            });
        }
        console.log('✅ Protección contra clickjacking activada');
    }

    setupNavigationGuard() {
        window.addEventListener('beforeunload', (e) => {
            const shouldWarn = document.querySelector('form.dirty');
            if (shouldWarn) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
                return e.returnValue;
            }
        });
        console.log('✅ Guardia de navegación configurado');
    }

    setupServiceWorkerSecurity() {
        if ('serviceWorker' in navigator) {
            const isLocal = window.location.hostname.includes('localhost') || 
                           window.location.hostname.includes('127.0.0.1');
            
            if (isLocal) {
                console.log('🔧 Entorno local: Service Worker permitido para desarrollo');
                return;
            }

            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    const swUrl = registration.active?.scriptURL || '';
                    const allowedOrigin = 'https://vicgom892.github.io';
                    
                    if (!swUrl.startsWith(allowedOrigin)) {
                        console.warn('🔒 Service Worker no autorizado detectado:', swUrl);
                        this.logSecurityEvent('unauthorized_sw', { swUrl });
                    }
                });
            });
        }
    }

    validateSecuritySetup() {
        const isLocal = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('127.0.0.1');
        
        if (!isLocal) {
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                if (script.src.startsWith('http:') && !script.src.includes('localhost')) {
                    console.warn('⚠️ Contenido mixto detectado:', script.src);
                    this.logSecurityEvent('mixed_content_warning', { 
                        src: script.src,
                        type: 'script',
                        localidad: this.getCurrentLocation()
                    });
                }
            });
        }

        console.log('✅ Configuración de seguridad validada para', this.getCurrentLocation());
    }

    getCurrentLocation() {
        const path = window.location.pathname;
        if (path.includes('/castelar/')) return 'castelar';
        if (path.includes('/ituzaingo/')) return 'ituzaingo';
        if (path.includes('/moron/')) return 'moron';
        if (path.includes('/ciudadela/')) return 'ciudadela';
        if (path.includes('/merlo/')) return 'merlo';
        if (path.includes('/haedo/')) return 'haedo';
        if (path.includes('/ramos-mejia/')) return 'ramos-mejia';
        if (path.includes('/marcos-paz/')) return 'marcos-paz';
        if (path.includes('/padua/')) return 'padua';
        return 'raiz';
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    validatePhoneNumber(phone) {
        if (!phone || typeof phone !== 'string') return null;
        const sanitized = phone.replace(/[^\d+]/g, '');
        const phoneRegex = /^(\+?54|0)?9?11?[0-9]{8}$/;
        if (!phoneRegex.test(sanitized)) {
            console.warn('🔒 Número de teléfono inválido:', phone);
            this.logSecurityEvent('invalid_phone_number', { 
                provided_number: phone,
                localidad: this.getCurrentLocation()
            });
            return null;
        }
        return sanitized;
    }

    openExternalLink(url, target = '_blank') {
        if (!url || typeof url !== 'string') {
            console.error('🔒 URL no proporcionada para enlace externo');
            return;
        }
        
        try {
            const parsedUrl = new URL(url);
            const allowedProtocols = ['https:', 'http:', 'mailto:', 'tel:'];
            if (!allowedProtocols.includes(parsedUrl.protocol)) {
                console.error('🔒 Protocolo no permitido:', parsedUrl.protocol);
                this.logSecurityEvent('disallowed_protocol', { 
                    protocol: parsedUrl.protocol,
                    url: url,
                    localidad: this.getCurrentLocation()
                });
                return;
            }
            
            window.open(parsedUrl.toString(), target, 'noopener,noreferrer');
            this.logSecurityEvent('external_link_opened', { 
                url: parsedUrl.hostname,
                target: target,
                localidad: this.getCurrentLocation()
            });
            
        } catch (error) {
            console.error('🔒 URL inválida:', url, error);
            this.logSecurityEvent('invalid_url', { 
                attempted_url: url,
                error: error.message,
                localidad: this.getCurrentLocation()
            });
        }
    }

    logSecurityEvent(event, details) {
        const timestamp = new Date().toISOString();
        console.log(`🔒 [${timestamp}] [${details.localidad || this.getCurrentLocation()}] ${event}`, details);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'security_issue', {
                'event_category': 'security',
                'event_label': event,
                'custom_map': {
                    ...details,
                    localidad: details.localidad || this.getCurrentLocation()
                }
            });
        }
    }

    getSecurityStatus() {
        return {
            domain: window.location.hostname,
            localidad: this.getCurrentLocation(),
            csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
            https: window.location.protocol === 'https:',
            environment: this.getEnvironmentStatus(),
            timestamp: new Date().toISOString()
        };
    }

    getEnvironmentStatus() {
        const hostname = window.location.hostname;
        if (hostname === 'vicgom892.github.io') {
            return 'github-pages';
        } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            return 'development';
        } else {
            return 'unknown';
        }
    }
}

// Inicialización
console.log('🏠 Tu Barrio a un Clik - Cargando seguridad...');

try {
    if (!window.appSecurity) {
        const appSecurity = new SecurityConfig();
        window.appSecurity = appSecurity;
        console.log('🎉 Sistema de seguridad inicializado correctamente');
        console.log('🔍 Estado de seguridad:', appSecurity.getSecurityStatus());
    } else {
        console.log('⚠️ Sistema de seguridad ya estaba inicializado');
    }
} catch (error) {
    console.error('❌ Error crítico inicializando seguridad:', error);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityConfig;
}
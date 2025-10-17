// shared/js/path-resolver.js - VERSIÓN CORREGIDA
class PathResolver {
    constructor() {
        this.init();
    }

    init() {
        this.detectEnvironment();
        this.correctPaths();
        this.correctAjaxPaths();
        console.log('✅ PathResolver activado para:', this.getCurrentLocalidad());
    }

    detectEnvironment() {
        this.isGitHubPages = window.location.hostname.includes('github.io');
        this.currentPath = window.location.pathname;
    }

    getCurrentLocalidad() {
        const path = window.location.pathname;
        if (path.includes('/castelar')) return 'castelar';
        if (path.includes('/ituzaingo')) return 'ituzaingo';
        if (path.includes('/moron')) return 'moron';
        if (path.includes('/ciudadela')) return 'ciudadela';
        if (path.includes('/merlo')) return 'merlo';
        if (path.includes('/haedo')) return 'haedo';
        if (path.includes('/ramos-mejia')) return 'ramos-mejia';
        return 'gral';
    }

    resolvePath(originalPath) {
        if (!originalPath) return originalPath;

        // URLs absolutas no se modifican
        if (originalPath.startsWith('http') || originalPath.startsWith('//') || originalPath.startsWith('/')) {
            return originalPath;
        }

        // GitHub Pages - corregir rutas
        if (this.isGitHubPages) {
            if (originalPath.startsWith('../../shared/')) {
                return '/shared/' + originalPath.split('../../shared/')[1];
            }
            if (originalPath.startsWith('../shared/')) {
                return '/shared/' + originalPath.split('../shared/')[1];
            }
        }

        // Hostinger/Netlify - mantener rutas actuales
        return originalPath;
    }

    correctPaths() {
        // Solo corregir elementos existentes al cargar
        const elements = document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]');
        
        elements.forEach(element => {
            const attr = element.href ? 'href' : 'src';
            const originalValue = element.getAttribute(attr);
            
            if (originalValue && !originalValue.startsWith('http') && !originalValue.startsWith('data:')) {
                const correctedValue = this.resolvePath(originalValue);
                if (correctedValue !== originalValue) {
                    element.setAttribute(attr, correctedValue);
                }
            }
        });
    }

    correctAjaxPaths() {
        // Interceptar fetch de forma SEGURA
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            // Solo procesar si es una string y no es una URL absoluta
            if (typeof args[0] === 'string' && !args[0].startsWith('http') && !args[0].startsWith('//')) {
                try {
                    // Crear una nueva instancia del resolver para esta llamada
                    const resolver = new PathResolver();
                    const correctedUrl = resolver.resolvePath(args[0]);
                    
                    if (correctedUrl !== args[0]) {
                        console.log('PathResolver: Fetch corregido', args[0], '→', correctedUrl);
                        // Crear nuevos arguments para evitar problemas de invocación
                        const newArgs = [correctedUrl, ...args.slice(1)];
                        return originalFetch.apply(this, newArgs);
                    }
                } catch (error) {
                    console.warn('PathResolver: Error corrigiendo fetch, usando original', error);
                }
            }
            
            // Llamada normal sin modificaciones
            return originalFetch.apply(this, args);
        };

        // Interceptar XMLHttpRequest de forma SEGURA
        if (window.XMLHttpRequest) {
            const originalOpen = XMLHttpRequest.prototype.open;
            
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('//')) {
                    try {
                        const resolver = new PathResolver();
                        const correctedUrl = resolver.resolvePath(url);
                        
                        if (correctedUrl !== url) {
                            console.log('PathResolver: XHR corregido', url, '→', correctedUrl);
                            return originalOpen.call(this, method, correctedUrl, ...rest);
                        }
                    } catch (error) {
                        console.warn('PathResolver: Error corrigiendo XHR, usando original', error);
                    }
                }
                return originalOpen.call(this, method, url, ...rest);
            };
        }
    }
}

// Inicialización automática mejorada
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño delay para asegurar que todos los elementos estén en el DOM
    setTimeout(() => {
        try {
            new PathResolver();
        } catch (error) {
            console.error('Error inicializando PathResolver:', error);
        }
    }, 100);
});
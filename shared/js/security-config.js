// CONFIGURACIÓN DE SEGURIDAD SIMPLIFICADA - Tu Barrio a un Clik
class SecurityConfig {
    constructor() {
        console.log('🔒 Inicializando sistema de seguridad...');
        this.init();
    }

    init() {
        this.setSecurityHeaders();
        this.setupErrorHandling();
        this.validateEnvironment();
    }

    setSecurityHeaders() {
        // CSP OPTIMIZADO - VERSIÓN FINAL
        try {
            const cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = "Content-Security-Policy";
            cspMeta.content = this.generateCSP();
            document.head.appendChild(cspMeta);
            console.log('✅ CSP configurado correctamente');
        } catch (error) {
            console.warn('⚠️ Error configurando CSP:', error);
        }

        // Headers que funcionan con meta tags
        const securityHeaders = [
            { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
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
    // VERSIÓN MÁXIMA COMPATIBILIDAD - PERMITE TODAS LAS FUENTES HTTPS
    return `default-src 'self' https://tubarrioaunclik.github.io;
           script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://www.googletagmanager.com https://code.jquery.com;
           style-src 'self' 'unsafe-inline' https:;
           font-src 'self' data: https:;
           img-src 'self' data: https: blob:;
           connect-src 'self' https://api.whatsapp.com https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com;
           frame-src 'none';
           object-src 'none';
           base-uri 'self';
           form-action 'self' https://api.whatsapp.com;`;
}
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('🔒 Error detectado:', e.message);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('🔒 Promesa rechazada:', e.reason);
        });

        console.log('✅ Sistema de monitoreo de errores activado');
    }

    validateEnvironment() {
        if (window.location.protocol !== 'https:' && 
            !window.location.hostname.includes('localhost')) {
            console.warn('⚠️  Para máxima seguridad, usa HTTPS en producción');
        }
        console.log('✅ Entorno validado');
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
            return null;
        }
        return sanitized;
    }

    openExternalLink(url, target = '_blank') {
        if (!url || typeof url !== 'string') return;
        try {
            const parsedUrl = new URL(url);
            window.open(parsedUrl.toString(), target, 'noopener,noreferrer');
        } catch (error) {
            console.error('🔒 URL inválida:', url, error);
        }
    }

    logSecurityEvent(event, details) {
        console.log(`🔒 Security Event: ${event}`, details);
        if (typeof gtag !== 'undefined') {
            gtag('event', 'security_issue', {
                'event_category': 'security',
                'event_label': event,
                'custom_map': details
            });
        }
    }
}

// Inicializar seguridad
console.log('🏠 Tu Barrio a un Clik - Cargando seguridad...');
const appSecurity = new SecurityConfig();
window.appSecurity = appSecurity;
console.log('🎉 Sistema de seguridad inicializado correctamente');
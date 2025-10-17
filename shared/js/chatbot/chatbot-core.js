// shared/js/chatbot/chatbot-core.js - VERSIÓN CORREGIDA PARA GITHUB PAGES
class TuBarrioChatbot {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.synthesis = null;
        this.userLocation = null;
        this.conversationHistory = [];
        this.currentLocalidad = this.detectLocalidad();
        this.isInitialized = false;
        
        // NUEVO: Control de resultados paginados
        this.currentSearchResults = [];
        this.currentSearchType = '';
        this.currentSearchOffset = 0;
        this.resultsPerPage = 8;
        
        // Sistemas
        this.intelligenceSystem = null;
        this.dataManager = null;
        
        // Control de voz
        this.isSpeaking = false;
        this.currentUtterance = null;
        
        // Estadísticas
        this.stats = {
            businessesLoaded: 0,
            categoriesLoaded: 0,
            interactions: 0,
            successfulSearches: 0
        };
        
        // Preferencias
        this.userPreferences = {
            voiceResponses: false,
            favoriteCategories: []
        };
        
        this.init();
    }

    // === NUEVA FUNCIÓN PARA RUTAS CORRECTAS EN GITHUB PAGES ===
    getCorrectUrl(path) {
        const isGitHubPages = window.location.hostname.includes('github.io');
        const basePath = isGitHubPages ? '/tubarrioaunclic' : '';
        // Asegurar que la ruta no tenga dobles barras
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${basePath}${cleanPath}`;
    }

    async init() {
        try {
            await Promise.all([
                this.loadIntelligenceSystem(),
                this.loadDataManager(),
                this.setupSpeechSystems()
            ]);

            this.setupUI();
            this.loadUserPreferences();
            this.isInitialized = true;
            
            console.log('✅ ChatBot Tu Barrio inicializado para:', this.currentLocalidad);
        } catch (error) {
            console.error('❌ Error inicializando chatbot:', error);
        }
    }

    // === DETECCIÓN DE LOCALIDAD ===
    detectLocalidad() {
        const path = window.location.pathname;
        const localidades = [
            'castelar', 'ituzaingo', 'moron', 'ciudadela', 
            'merlo', 'haedo', 'ramos-mejia'
        ];
        
        for (const localidad of localidades) {
            if (path.includes(`/${localidad}/`) || path.includes(`/${localidad}.html`)) {
                return localidad;
            }
        }
        
        return localidades[0];
    }

    // === CARGA DE SISTEMAS ===
    async loadIntelligenceSystem() {
        if (typeof ChatbotIntelligence !== 'undefined') {
            this.intelligenceSystem = new ChatbotIntelligence();
        } else {
            this.intelligenceSystem = {
                processInput: (input) => Promise.resolve({ 
                    text: this.basicIntelligence(input), 
                    confidence: 0.5 
                }),
                learnFromInteraction: () => {},
                getSuggestions: (input) => []
            };
        }
    }

    async loadDataManager() {
        this.dataManager = {
            loadBusinessData: async () => await this.loadAllBusinessFiles(),
            loadOfertas: async () => await this.loadLocalOfertas(),
            loadOficios: async () => await this.loadLocalOficios(),
            loadEmprendimientos: async () => await this.loadLocalEmprendimientos()
        };
    }

    // === CARGA MEJORADA DE OFICIOS ===
    async loadAllBusinessFiles() {
        const businessFiles = [
            'comercios.json', 'barberias.json', 'cafeterias.json', 'carnicerias.json',
            'comida.json', 'farmacias.json', 'ferreterias.json', 'fiambrerias.json',
            'granjas.json', 'kioscos.json', 'librerias.json', 'mascotas.json',
            'muebles.json', 'panaderias.json', 'pastas.json', 'talleres.json',
            'tiendas.json', 'uñas.json', 'verdulerias.json', 'veterinarias.json'
        ];

        const oficiosFiles = [
            'albañiles.json', 'cerrajeros.json', 'electricistas.json', 'herreros.json',
            'jardineros.json', 'limpieza.json', 'mecanicos.json', 'pintores.json',
            'plomeros.json', 'transporte.json'
        ];

        let allBusinesses = [];
        let loadedFiles = 0;

        console.log(`📂 Cargando negocios para ${this.currentLocalidad}...`);

        // ESTRATEGIA 1: Usar window.businesses si ya está cargado
        if (window.businesses && Array.isArray(window.businesses) && window.businesses.length > 0) {
            console.log(`✅ Usando ${window.businesses.length} negocios desde window.businesses`);
            this.stats.businessesLoaded = window.businesses.length;
            return window.businesses;
        }

        // ESTRATEGIA 2: Cargar desde archivos individuales
        const loadPromises = businessFiles.map(async (file) => {
            try {
                const response = await fetch(this.getCorrectUrl(`/${this.currentLocalidad}/data/${file}`));
                if (response.ok) {
                    const data = await response.json();
                    const categoria = file.replace('.json', '');
                    const businessesWithCategory = Array.isArray(data) ? 
                        data.map(business => this.normalizeBusinessData(business, categoria)) : [];
                    
                    allBusinesses = allBusinesses.concat(businessesWithCategory);
                    loadedFiles++;
                    console.log(`✅ ${file}: ${businessesWithCategory.length} negocios`);
                }
            } catch (error) {
                console.log(`❌ No se pudo cargar: ${file}`);
            }
        });

        // Cargar oficios
        const oficiosPromises = oficiosFiles.map(async (file) => {
            try {
                const possiblePaths = [
                    `/${this.currentLocalidad}/data/oficios/${file}`,
                    `/${this.currentLocalidad}/datos/oficios/${file}`,
                    `/data/oficios/${file}`,
                    `/datos/oficios/${file}`
                ];

                let response = null;
                for (const path of possiblePaths) {
                    try {
                        response = await fetch(this.getCorrectUrl(path));
                        if (response.ok) break;
                    } catch (e) {
                        continue;
                    }
                }

                if (response && response.ok) {
                    const data = await response.json();
                    const oficio = file.replace('.json', '').replace('s', '');
                    const oficiosWithCategory = Array.isArray(data) ? 
                        data.map(business => this.normalizeOficioData(business, oficio)) : [];
                    
                    allBusinesses = allBusinesses.concat(oficiosWithCategory);
                    loadedFiles++;
                    console.log(`✅ oficios/${file}: ${oficiosWithCategory.length} profesionales`);
                }
            } catch (error) {
                console.log(`❌ No se pudo cargar oficios/${file}`);
            }
        });

        await Promise.all([...loadPromises, ...oficiosPromises]);
        
        this.stats.businessesLoaded = allBusinesses.length;
        this.stats.categoriesLoaded = loadedFiles;
        
        console.log(`📊 Cargados ${allBusinesses.length} negocios de ${loadedFiles} categorías`);
        return allBusinesses;
    }

    // Normalizar datos de oficios específicamente
    normalizeOficioData(oficio, tipo) {
        return {
            ...oficio,
            categoria: oficio.categoria || tipo,
            tipo: 'oficio',
            localidad: this.currentLocalidad,
            name: oficio.nombre || oficio.profesion || oficio.name,
            category: oficio.categoria || tipo,
            hours: oficio.horarioData || oficio.horario || 'Consultar horarios',
            address: oficio.direccion || oficio.zona || oficio.address,
            image: oficio.imagen || oficio.image || 'img/oficios-placeholder.jpg',
            url: oficio.pagina || oficio.url,
            tarjetaUrl: oficio.tarjetaUrl || oficio.tarjeta || this.generateTarjetaUrl(oficio),
            latitude: oficio.latitud || oficio.latitude || oficio.lat,
            longitude: oficio.longitud || oficio.longitude || oficio.lng,
            telefono: oficio.telefono || oficio.phone,
            whatsapp: oficio.whatsapp,
            profesion: oficio.profesion || tipo,
            servicio: oficio.servicio || oficio.especialidad,
            experiencia: oficio.experiencia
        };
    }

    normalizeBusinessData(business, categoria, tipo = 'negocio') {
        return {
            ...business,
            categoria: business.categoria || categoria,
            tipo: tipo,
            localidad: this.currentLocalidad,
            name: business.nombre || business.name,
            category: business.categoria || categoria,
            hours: business.horarioData || business.horario,
            address: business.direccion || business.address,
            image: business.imagen || business.image,
            url: business.pagina || business.url,
            tarjetaUrl: business.tarjetaUrl || business.tarjeta || this.generateTarjetaUrl(business),
            latitude: business.latitud || business.latitude || business.lat,
            longitude: business.longitud || business.longitude || business.lng,
            telefono: business.telefono || business.phone,
            whatsapp: business.whatsapp
        };
    }

    // === GENERAR URLS PARA TARJETAS Y WEBS ===
    generateTarjetaUrl(business) {
        const nombre = business.nombre || business.name || '';
        const categoria = business.categoria || business.category || '';
        
        if (!nombre) return null;
        
        const nombreUrl = nombre
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
            
        return this.getCorrectUrl(`/${this.currentLocalidad}/tarjeta.html?negocio=${nombreUrl}&categoria=${categoria}`);
    }

    generateWebUrl(business) {
        if (business.url) {
            return business.url.startsWith('http') ? business.url : `https://${business.url}`;
        }
        return null;
    }

    // === CARGA MEJORADA DE OFERTAS ===
    async loadLocalOfertas() {
        try {
            console.log(`🎯 Buscando ofertas para: ${this.currentLocalidad}`);
            
            const ofertaFiles = [
                'oferta-panaderia.json', 'oferta-carniceria.json', 'oferta-verduleria.json',
                'oferta-farmacia.json', 'oferta-supermercado.json', 'oferta-restaurante.json',
                'oferta-barberia.json', 'oferta-ferreteria.json', 'oferta-fiambreria.json',
                'oferta-kiosco.json', 'oferta-pastas.json', 'oferta-tienda.json',
                'oferta-veterinaria.json'
            ];

            let allOfertas = [];
            let loadedFiles = 0;
            let successfulFiles = 0;

            console.log(`📂 Buscando ${ofertaFiles.length} archivos...`);

            const loadPromises = ofertaFiles.map(async (file) => {
                try {
                    const possiblePaths = [
                        `/${this.currentLocalidad}/ofertas/${file}`,
                        `/ofertas/${file}`,
                        `/${this.currentLocalidad}/datos/${file}`,
                        `/datos/${file}`,
                        `/${this.currentLocalidad}/data/${file}`,
                        `/data/${file}`
                    ];

                    let response = null;
                    let successfulPath = null;
                    
                    for (const path of possiblePaths) {
                        try {
                            console.log(`🔍 Intentando cargar: ${path}`);
                            response = await fetch(this.getCorrectUrl(path));
                            if (response.ok) {
                                successfulPath = path;
                                console.log(`✅ Encontrado en: ${path}`);
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (response && response.ok) {
                        const data = await response.json();
                        console.log(`📄 ${file} cargado desde: ${successfulPath}`);
                        
                        let ofertasArray = [];
                        
                        if (Array.isArray(data)) {
                            ofertasArray = data;
                        } else if (data.ofertas && Array.isArray(data.ofertas)) {
                            ofertasArray = data.ofertas;
                        } else if (data.ofertas && typeof data.ofertas === 'object') {
                            ofertasArray = [data.ofertas];
                        } else {
                            ofertasArray = [data];
                        }
                        
                        if (ofertasArray.length > 0) {
                            const ofertasWithCategory = ofertasArray.map(oferta => 
                                this.normalizeOfertaData(oferta, file)
                            );
                            allOfertas = allOfertas.concat(ofertasWithCategory);
                            successfulFiles++;
                            console.log(`✅ ${file}: ${ofertasWithCategory.length} ofertas válidas`);
                        }
                        
                        loadedFiles++;
                    }
                } catch (error) {
                    console.log(`❌ Error cargando ${file}:`, error.message);
                }
            });

            await Promise.all(loadPromises);
            
            console.log(`📊 Cargadas ${allOfertas.length} ofertas de ${successfulFiles} archivos`);
            
            if (allOfertas.length === 0) {
                return await this.loadLegacyOfertas();
            }
            
            return allOfertas;

        } catch (error) {
            console.error('❌ Error cargando ofertas:', error);
            return await this.loadLegacyOfertas();
        }
    }

    // === CARGA LEGACY PARA COMPATIBILIDAD ===
    async loadLegacyOfertas() {
        try {
            console.log('🔄 Intentando carga legacy...');
            const legacyPaths = [
                `/${this.currentLocalidad}/datos/ofertas.json`,
                `/datos/ofertas.json`,
                `/${this.currentLocalidad}/data/ofertas.json`, 
                `/data/ofertas.json`
            ];
            
            for (const path of legacyPaths) {
                try {
                    const response = await fetch(this.getCorrectUrl(path));
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Ofertas cargadas desde legacy: ${path}`);
                        
                        let ofertasArray = [];
                        if (Array.isArray(data)) {
                            ofertasArray = data;
                        } else if (data.ofertas && Array.isArray(data.ofertas)) {
                            ofertasArray = data.ofertas;
                        }
                        
                        return ofertasArray.map(oferta => this.normalizeOfertaData(oferta, 'legacy'));
                    }
                } catch (e) {
                    continue;
                }
            }
            
            console.log('❌ No se pudieron cargar ofertas legacy');
            return [];
        } catch (error) {
            console.error('Error en carga legacy:', error);
            return [];
        }
    }

    // === NORMALIZACIÓN MEJORADA PARA OFERTAS ===
    normalizeOfertaData(oferta, filename) {
        const tipoNegocio = filename.replace('oferta-', '').replace('.json', '');
        
        const precioOriginal = oferta.precioOriginal || oferta.precioNormal;
        const precioOferta = oferta.precioOferta || oferta.precioEspecial;
        
        let precioOriginalFormatted = precioOriginal;
        let precioOfertaFormatted = precioOferta;
        
        if (typeof precioOriginal === 'number') {
            precioOriginalFormatted = `$${precioOriginal.toLocaleString('es-AR')}`;
        }
        if (typeof precioOferta === 'number') {
            precioOfertaFormatted = `$${precioOferta.toLocaleString('es-AR')}`;
        }
        
        const webUrl = oferta.pagina || oferta.url;
        const tarjetaUrl = oferta.tarjetaUrl || oferta.tarjeta || this.generateOfertaTarjetaUrl(oferta, tipoNegocio);
        
        let botonData = oferta.boton;
        if (!botonData && oferta.whatsapp) {
            const mensaje = encodeURIComponent(`Hola! Me interesa la oferta: ${oferta.titulo}`);
            botonData = {
                texto: 'Contactar',
                url: `https://wa.me/${oferta.whatsapp}?text=${mensaje}`
            };
        }
        
        return {
            ...oferta,
            tipoNegocio: tipoNegocio,
            localidad: this.currentLocalidad,
            titulo: oferta.titulo || oferta.nombre || `Oferta de ${tipoNegocio}`,
            descripcion: oferta.descripcion || oferta.detalle || 'Oferta especial',
            negocio: oferta.negocio || oferta.establecimiento || 'Establecimiento local',
            categoria: oferta.categoria || tipoNegocio,
            validez: oferta.validez || oferta.vigencia || oferta.fechaFin || 'Válido por tiempo limitado',
            precioOriginal: precioOriginalFormatted,
            precioOferta: precioOfertaFormatted,
            descuento: oferta.descuento || oferta.porcentaje,
            imagen: oferta.imagen || oferta.foto,
            boton: botonData,
            webUrl: webUrl,
            tarjetaUrl: tarjetaUrl,
            whatsapp: oferta.whatsapp,
            timestamp: oferta.timestamp || Date.now()
        };
    }

    // === GENERAR URL DE TARJETA PARA OFERTAS ===
    generateOfertaTarjetaUrl(oferta, tipoNegocio) {
        const negocio = oferta.negocio || oferta.establecimiento;
        if (!negocio) return null;
        
        const negocioUrl = negocio
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
            
        return this.getCorrectUrl(`/${this.currentLocalidad}/tarjeta.html?negocio=${negocioUrl}&categoria=${tipoNegocio}`);
    }

    async loadLocalOficios() {
        try {
            const response = await fetch(this.getCorrectUrl(`/${this.currentLocalidad}/datos/oficios.json`));
            return response.ok ? await response.json() : [];
        } catch (error) {
            return [];
        }
    }

    async loadLocalEmprendimientos() {
        try {
            const response = await fetch(this.getCorrectUrl(`/${this.currentLocalidad}/data/emprendimientos.json`));
            return response.ok ? await response.json() : [];
        } catch (error) {
            return [];
        }
    }

    // === CONTROL MEJORADO DE SÍNTESIS DE VOZ ===
    async setupSpeechSystems() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'es-ES';
            
            this.recognition.onresult = (event) => this.handleSpeechResult(event);
            this.recognition.onerror = (event) => this.handleSpeechError(event);
            this.recognition.onend = () => this.updateUIListening(false);
        }

        this.synthesis = window.speechSynthesis;
        
        if (this.synthesis) {
            this.synthesis.onstart = () => {
                this.isSpeaking = true;
                this.updateUISpeaking(true);
            };
            
            this.synthesis.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.updateUISpeaking(false);
            };
            
            this.synthesis.onerror = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.updateUISpeaking(false);
            };
        }
    }

    // === DETENER HABLA ===
    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateUISpeaking(false);
            console.log('🔇 Voz detenida por el usuario');
        }
    }

    // === ACTUALIZAR UI DURANTE HABLA ===
    updateUISpeaking(speaking) {
        const voiceBtn = document.querySelector('.voice-btn');
        const stopSpeechBtn = document.querySelector('.stop-speech-btn');
        
        if (speaking) {
            if (voiceBtn) voiceBtn.style.display = 'none';
            if (stopSpeechBtn) stopSpeechBtn.style.display = 'inline-block';
        } else {
            if (voiceBtn) voiceBtn.style.display = 'inline-block';
            if (stopSpeechBtn) stopSpeechBtn.style.display = 'none';
        }
    }

    handleSpeechResult(event) {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            const processedInput = this.preprocessInput(finalTranscript);
            this.processUserInput(processedInput, true);
        }
    }

    handleSpeechError(event) {
        console.error('Error en reconocimiento de voz:', event.error);
        this.addMessage('system', 'No pude entender tu voz. ¿Puedes intentarlo de nuevo o escribir tu pregunta?');
        this.updateUIListening(false);
    }

    // === PREPROCESAMIENTO MEJORADO ===
    preprocessInput(input, alternatives = []) {
        let corrected = this.correctCommonErrors(input);
        corrected = corrected.toLowerCase().trim();
        return corrected;
    }

    correctCommonErrors(text) {
        const corrections = {
            'restorante': 'restaurante', 'restorantes': 'restaurantes',
            'farmacua': 'farmacia', 'farmacuas': 'farmacias',
            'supermercao': 'supermercado', 'supermecado': 'supermercado',
            'emerjencia': 'emergencia', 'impormación': 'información',
            'comersio': 'comercio', 'enprendimiento': 'emprendimiento',
            'barberia': 'barberia', 'pelukería': 'peluqueria',
            'carniceria': 'carniceria', 'verduleria': 'verduleria',
            'veterinaria': 'veterinaria', 'ferreteria': 'ferreteria',
            'albañil': 'albañil', 'albañiles': 'albañiles',
            'cerrajero': 'cerrajero', 'electricista': 'electricista',
            'plomero': 'plomero', 'mecanico': 'mecánico'
        };

        let corrected = text.toLowerCase();
        Object.entries(corrections).forEach(([error, correction]) => {
            const regex = new RegExp(`\\b${error}\\b`, 'gi');
            corrected = corrected.replace(regex, correction);
        });

        return corrected;
    }

    // === PROCESAMIENTO PRINCIPAL ===
    async processUserInput(input, isVoice = false) {
        if (!this.isInitialized) {
            this.addMessage('system', 'El chatbot se está inicializando, por favor espera...');
            return;
        }

        this.stats.interactions++;
        const processedInput = this.preprocessInput(input);
        this.addMessage('user', processedInput);
        
        this.conversationHistory.push({ 
            role: 'user', 
            content: processedInput,
            timestamp: new Date().toISOString(),
            localidad: this.currentLocalidad
        });

        this.showTypingIndicator();

        try {
            const response = await this.generateIntelligentResponse(processedInput);
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage('assistant', response);
                
                if (isVoice || this.userPreferences.voiceResponses) {
                    const cleanText = this.stripIconsForSpeech(response);
                    const summary = this.createVoiceSummary(cleanText);
                    this.speakText(summary);
                }
                
                this.stats.successfulSearches++;
                
            }, this.calculateTypingDelay(response));

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('system', 'Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.');
            console.error('Error procesando mensaje:', error);
        }
    }

    // === FILTRAR ICONOS PARA VOZ ===
    stripIconsForSpeech(text) {
        let cleanText = text
            .replace(/[🟢🔴🟡⚫⚪🟠🟣🟤🔵🟢🔴🟡🟠🟣🟤⚫⚪🔵]/g, '')
            .replace(/[🏪💊🔧🍞🥦🧀🏪🐾✂️👕🛠️☕📚🧋🌹🥩🌾🪑💅🍽️🎁✨📍🕒📊🤔💡🔍❌✅⚠️📝🛠️🌟📱📧📞🌐💬🚨]/g, '')
            .replace(/\[\]\([^)]*\)/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/\n/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
        
        cleanText = cleanText
            .replace(/\.\.+/g, '.')
            .replace(/\s\s+/g, ' ');
            
        return cleanText || 'No hay texto para leer';
    }

    // Crear resumen para voz (más corto)
    createVoiceSummary(text) {
        let summary = text
            .substring(0, 500)
            .replace(/\d+\.\s*\*\*/g, '')
            .replace(/\*\*/g, '')
            .replace(/\[[^\]]+\]\([^)]+\)/g, '')
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (summary.length > 300) {
            const lastPeriod = summary.lastIndexOf('.', 300);
            if (lastPeriod > 100) {
                summary = summary.substring(0, lastPeriod + 1);
            }
        }
        
        return summary || 'Información disponible. Revisa el chat para más detalles.';
    }

    // === SÍNTESIS DE VOZ MEJORADA CON RESUMEN ===
    speakText(text) {
        if (!this.synthesis || !this.userPreferences.voiceResponses) return;
        
        this.stopSpeaking();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    calculateTypingDelay(response) {
        const baseDelay = 800;
        const lengthDelay = Math.min(response.length * 20, 3000);
        return baseDelay + lengthDelay;
    }

    // === DETECCIÓN MEJORADA DE INTENCIONES ===
    detectIntent(input) {
        const intents = {
            'buscar': ['buscar', 'encontrar', 'dónde hay', 'quiero', 'necesito'],
            'contactar': ['contactar', 'llamar', 'escribir', 'whatsapp', 'teléfono'],
            'informacion': ['información', 'datos', 'detalles', 'saber', 'contar'],
            'urgencia': ['urgente', 'emergencia', 'rápido', 'inmediato', 'ahora'],
            'recomendacion': ['recomendar', 'mejor', 'sugerir', 'recomendación'],
            'mas_resultados': ['más', 'más resultados', 'ver más', 'siguiente', 'continuar']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return intent;
            }
        }
        return 'general';
    }

    async generateIntelligentResponse(input) {
        if (this.intelligenceSystem) {
            const aiResponse = await this.intelligenceSystem.processInput(input, {
                localidad: this.currentLocalidad,
                history: this.conversationHistory
            });
            
            if (aiResponse && aiResponse.confidence > 0.7) {
                return aiResponse.text;
            }
        }

        const category = this.detectCategory(input);
        const intent = this.detectIntent(input);
        
        console.log(`🔍 Categoría detectada: ${category}, Intención: ${intent}`);

        if (intent === 'mas_resultados') {
            return await this.handleMoreResults(input);
        }

        switch (category) {
            case 'saludo':
                return this.handleGreeting(intent);
            case 'negocio':
                return await this.handleBusinessSearch(input, intent);
            case 'oferta':
                return await this.handleOfertasSearch(input);
            case 'oficio':
                return await this.handleOficiosSearch(input);
            case 'emprendimiento':
                return await this.handleEmprendimientosSearch(input);
            case 'soporte':
                return await this.handleSoporte(input, intent);
            case 'ubicacion':
                return await this.handleLocationRequest(intent);
            case 'horario':
                return await this.handleHoursRequest(input);
            case 'comunidad':
                return await this.handleComunidad(input);
            case 'inscripcion':
                return await this.handleInscripcion();
            default:
                return await this.handleUnknownWithAI(input);
        }
    }

    // === MÉTODO PARA MANEJAR "MÁS RESULTADOS" ===
    async handleMoreResults(input) {
        if (this.currentSearchResults.length === 0) {
            return "No hay una búsqueda activa. Por favor, busca algo primero.";
        }

        const totalCount = this.currentSearchResults.length;
        const currentOffset = this.currentSearchOffset + 8;
        
        if (currentOffset >= totalCount) {
            return `✅ Ya estás viendo todos los ${totalCount} resultados de ${this.currentSearchType}.`;
        }

        const nextResults = this.currentSearchResults.slice(currentOffset, currentOffset + 8);
        this.currentSearchOffset = currentOffset;

        let response = `📋 **Más ${this.formatBusinessType(this.currentSearchType)} (${currentOffset + 1}-${Math.min(currentOffset + 8, totalCount)} de ${totalCount})**\n\n`;

        nextResults.forEach((business, index) => {
            const globalIndex = currentOffset + index + 1;
            const timeStatus = this.getBusinessTimeStatus(business);
            
            response += `${globalIndex}. **${business.nombre || business.name}**\n`;
            response += `   ${timeStatus.message}\n`;
            response += `   📍 ${business.direccion || business.address || 'Dirección no disponible'}\n`;
            response += `   🕒 ${business.horario || business.hours || 'Horario no especificado'}\n`;
            response += `   📞 ${business.telefono || business.phone || 'Sin teléfono'}\n`;
            
            if (business.whatsapp || business.tarjetaUrl || business.url) {
                response += `   🔗 `;
                const links = [];
                
                if (business.whatsapp) {
                    const whatsappUrl = `https://wa.me/${business.whatsapp}?text=Hola ${business.nombre || business.name}, vi tu negocio en Tu Barrio A Un Click`;
                    links.push(`[WhatsApp](${whatsappUrl})`);
                }
                
                if (business.tarjetaUrl) {
                    links.push(`[Tarjeta](${business.tarjetaUrl})`);
                }
                
                if (business.url) {
                    const webUrl = business.url.startsWith('http') ? business.url : `https://${business.url}`;
                    links.push(`[Web](${webUrl})`);
                }
                
                response += links.join(' • ') + '\n';
            }
            
            response += '\n';
        });

        const remaining = totalCount - (currentOffset + 8);
        if (remaining > 0) {
            response += `\n📋 **Quedan ${remaining} resultados más.** Escribe "más" para continuar.`;
        } else {
            response += `\n✅ **Has visto todos los ${totalCount} resultados.**`;
        }

        return response;
    }

    // === DETECCIÓN DE CATEGORÍA MEJORADA ===
    detectCategory(input) {
        const categories = {
            'saludo': ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi', 'saludos'],
            'negocio': this.getAllBusinessKeywords(),
            'oferta': ['oferta', 'descuento', 'promoción', 'rebaja', 'especial', 'barato', 'economico'],
            'oficio': ['plomero', 'electricista', 'técnico', 'reparación', 'gasista', 'albañil', 'carpintero', 'mecánico', 'cerrajero', 'herrero', 'jardinero', 'pintor', 'transporte', 'flete', 'mudanza'],
            'emprendimiento': ['emprendimiento', 'emprendedor', 'nuevo negocio', 'startup'],
            'soporte': ['soporte', 'ayuda', 'problema', 'error', 'no funciona', 'contacto'],
            'ubicacion': ['ubicación', 'dirección', 'cerca', 'cercano', 'donde estoy', 'localizar'],
            'horario': ['horario', 'abierto', 'cerrado', 'hora', 'cuándo abre', 'atendiendo'],
            'comunidad': ['comunidad', 'vecino', 'vecinos', 'barrio', 'zona'],
            'inscripcion': ['inscripción', 'registrar', 'agregar negocio', 'formulario']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return category;
            }
        }
        return 'desconocido';
    }

    getAllBusinessKeywords() {
        return [
            'restaurante', 'farmacia', 'supermercado', 'tienda', 'comercio', 'negocio', 'local',
            'barberia', 'cafeteria', 'carniceria', 'verduleria', 'veterinaria', 'ferreteria',
            'panaderia', 'kiosco', 'libreria', 'mascotas', 'muebles', 'fiambreria', 'granja',
            'pastas', 'taller', 'uñas', 'estetica', 'peluqueria', 'pizzeria', 'comida',
            'albañil', 'cerrajero', 'electricista', 'herrero', 'jardinero', 'limpieza', 'mecánico', 'pintor', 'plomero', 'transporte',
            'oferta', 'descuento', 'promoción', 'rebaja', 'especial', 'barato', 'economico'
        ];
    }

    // === MANEJADORES PRINCIPALES CORREGIDOS ===
    handleGreeting(intent) {
        const greetings = {
            general: [
                `¡Hola! Soy tu asistente de Tu Barrio A Un Click en ${this.formatLocalidadName(this.currentLocalidad)}. ¿En qué puedo ayudarte?`,
                `¡Buenas! Estoy aquí para ayudarte a descubrir lo mejor de ${this.formatLocalidadName(this.currentLocalidad)}.`,
                `¡Hola vecino de ${this.formatLocalidadName(this.currentLocalidad)}! ¿Buscas algún negocio o servicio en particular?`
            ],
            urgencia: [
                "¡Hola! Veo que necesitas ayuda urgente. ¿En qué puedo asistirte inmediatamente?",
                "¡Hola! Para emergencias, puedo conectarte rápidamente con servicios esenciales."
            ]
        };

        const options = greetings[intent] || greetings.general;
        return options[Math.floor(Math.random() * options.length)];
    }

    // === MÉTODO CORREGIDO PARA BÚSQUEDA DE NEGOCIOS ===
    async handleBusinessSearch(input, intent) {
        const businessType = this.extractBusinessType(input);
        
        if (businessType && this.isOficioCategory(businessType)) {
            return await this.handleOficiosSearch(input);
        }
        
        try {
            const businesses = await this.dataManager.loadBusinessData();
            
            if (!businesses || businesses.length === 0) {
                return "❌ No hay negocios cargados en este momento. Por favor intenta más tarde.";
            }

            let results = businesses;

            if (businessType && !this.isOficioCategory(businessType)) {
                results = this.filterBusinessesByType(results, businessType);
                
                if (results.length === 0) {
                    return this.handleNoBusinessFound(businessType, input);
                }
            }

            this.currentSearchResults = results;
            this.currentSearchType = businessType || 'general';
            this.currentSearchOffset = 0;

            if (!businessType) {
                const openBusinesses = results.filter(b => {
                    const status = this.getBusinessTimeStatus(b);
                    return status.status === 'open' || status.status === 'closing_soon';
                });
                
                return `🏪 **Comercios en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n` +
                       `Tengo **${results.length} comercios** registrados:\n\n` +
                       `• 🟢 **${openBusinesses.length} abiertos** ahora\n` +
                       `• 🔴 **${results.length - openBusinesses.length} cerrados**\n\n` +
                       `¿Qué tipo de negocio buscas? Por ejemplo: "farmacias", "panaderías", "verdulerías"...`;
            }

            return this.formatBusinessResponse(results, businessType, intent);

        } catch (error) {
            console.error('Error en búsqueda:', error);
            return "❌ No pude cargar la información de negocios en este momento. Por favor intenta más tarde.";
        }
    }

    // === FORMATO MEJORADO DE RESPUESTAS ===
    formatBusinessResponse(businesses, type, intent) {
        const sortedBusinesses = businesses.map(business => {
            const timeStatus = this.getBusinessTimeStatus(business);
            return { ...business, timeStatus };
        }).sort((a, b) => {
            if (a.timeStatus.status === 'open' && b.timeStatus.status !== 'open') return -1;
            if (a.timeStatus.status !== 'open' && b.timeStatus.status === 'open') return 1;
            
            if (a.timeStatus.minutesUntilClose && b.timeStatus.minutesUntilClose) {
                return a.timeStatus.minutesUntilClose - b.timeStatus.minutesUntilClose;
            }
            
            return 0;
        });

        const openBusinesses = sortedBusinesses.filter(b => 
            b.timeStatus.status === 'open' || b.timeStatus.status === 'closing_soon'
        );
        const totalCount = sortedBusinesses.length;
        const openCount = openBusinesses.length;

        const displayCount = Math.min(sortedBusinesses.length, 8);
        const displayBusinesses = sortedBusinesses.slice(0, displayCount);

        let response = `🏪 **${this.formatBusinessType(type)} en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n`;

        if (intent === 'contactar') {
            response += `Encontré ${totalCount} ${type || 'negocio'}${totalCount > 1 ? 's' : ''}. Aquí los contactos:\n\n`;
            displayBusinesses.forEach((business, index) => {
                response += `${index + 1}. **${business.nombre || business.name}**\n`;
                response += `   ${business.timeStatus.message}\n`;
                response += `   📞 ${business.telefono || business.phone || 'Sin teléfono'}\n`;
                response += `   📍 ${business.direccion || business.address || 'Dirección no disponible'}\n`;
                
                if (business.whatsapp) {
                    const whatsappUrl = `https://wa.me/${business.whatsapp}?text=Hola ${business.nombre || business.name}, vi tu negocio en Tu Barrio A Un Click`;
                    response += `   💬 [Contactar por WhatsApp](${whatsappUrl})\n`;
                }
                
                if (business.tarjetaUrl) {
                    response += `   📇 [Ver tarjeta digital](${business.tarjetaUrl})\n`;
                }
                
                if (business.url) {
                    const webUrl = business.url.startsWith('http') ? business.url : `https://${business.url}`;
                    response += `   🌐 [Visitar web](${webUrl})\n`;
                }
                
                response += '\n';
            });
        } else {
            response += `Encontré ${totalCount} ${type || 'negocio'}${totalCount > 1 ? 's' : ''} `;
            response += `(${openCount} abierto${openCount > 1 ? 's' : ''} ahora):\n\n`;

            displayBusinesses.forEach((business, index) => {
                response += `${index + 1}. **${business.nombre || business.name}**\n`;
                response += `   ${business.timeStatus.message}\n`;
                response += `   📍 ${business.direccion || business.address || 'Dirección no disponible'}\n`;
                response += `   🕒 ${business.horario || business.hours || 'Horario no especificado'}\n`;
                response += `   📞 ${business.telefono || business.phone || 'Sin teléfono'}\n`;
                
                if (business.whatsapp || business.tarjetaUrl || business.url) {
                    response += `   🔗 `;
                    const links = [];
                    
                    if (business.whatsapp) {
                        const whatsappUrl = `https://wa.me/${business.whatsapp}?text=Hola ${business.nombre || business.name}, vi tu negocio en Tu Barrio A Un Click`;
                        links.push(`[WhatsApp](${whatsappUrl})`);
                    }
                    
                    if (business.tarjetaUrl) {
                        links.push(`[Tarjeta](${business.tarjetaUrl})`);
                    }
                    
                    if (business.url) {
                        const webUrl = business.url.startsWith('http') ? business.url : `https://${business.url}`;
                        links.push(`[Web](${webUrl})`);
                    }
                    
                    response += links.join(' • ') + '\n';
                }
                
                response += '\n';
            });
        }

        if (totalCount > 8) {
            response += `\n📋 **Mostrando 8 de ${totalCount} resultados**\n\n`;
            response += `🔍 *¿Quieres ver más resultados? Escribe "más resultados"*`;
        }

        if (totalCount < 3) {
            const emprendimientosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/emprendimientos.html`);
            response += `\n\n💡 *¿Buscás algo más específico? También puedes ver [nuestros emprendimientos locales](${emprendimientosUrl})*`;
        }

        return response;
    }

    // === MANEJADOR MEJORADO PARA OFICIOS ===
    async handleOficiosSearch(input) {
        try {
            const negocios = await this.dataManager.loadBusinessData();
            
            const allOficios = negocios.filter(negocio => 
                negocio.tipo === 'oficio' || 
                (negocio.categoria && this.isOficioCategory(negocio.categoria)) ||
                this.isOficioByName(negocio.name || negocio.nombre)
            );
            
            if (allOficios.length === 0) {
                const oficiosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/oficios-profeciones.html`);
                return "🔧 No tengo información de profesionales disponibles en este momento. " +
                       `Puedes [ver todos los oficios aquí](${oficiosUrl})`;
            }

            const oficioType = this.extractOficioType(input);
            let relevantOficios = allOficios;

            if (oficioType) {
                relevantOficios = allOficios.filter(oficio => 
                    oficio.profesion?.toLowerCase().includes(oficioType) ||
                    oficio.servicio?.toLowerCase().includes(oficioType) ||
                    oficio.categoria?.toLowerCase().includes(oficioType) ||
                    oficio.nombre?.toLowerCase().includes(oficioType) ||
                    oficio.name?.toLowerCase().includes(oficioType)
                );
            }

            if (relevantOficios.length === 0) {
                const oficiosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/oficios-profeciones.html`);
                return `❌ No encontré ${oficioType ? oficioType + ' ' : ''}disponibles. ` +
                       `Puedes [ver todos los oficios aquí](${oficiosUrl})`;
            }

            this.currentSearchResults = relevantOficios;
            this.currentSearchType = oficioType || 'oficios';
            this.currentSearchOffset = 0;

            return this.formatOficiosResponse(relevantOficios.slice(0, 8), oficioType);

        } catch (error) {
            console.error('Error cargando oficios:', error);
            const oficiosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/oficios-profeciones.html`);
            return `🔧 No pude cargar la información de profesionales. ` +
                   `Puedes [ver los oficios disponibles aquí](${oficiosUrl})`;
        }
    }

    isOficioCategory(categoria) {
        const oficiosKeys = ['albañil', 'cerrajero', 'electricista', 'herrero', 'jardinero', 
                           'limpieza', 'mecanico', 'pintor', 'plomero', 'transporte', 'oficio'];
        return oficiosKeys.some(oficio => categoria.toLowerCase().includes(oficio));
    }

    isOficioByName(nombre) {
        if (!nombre) return false;
        const oficiosKeys = ['albañil', 'cerrajero', 'electricista', 'herrero', 'jardinero', 
                           'limpieza', 'mecánico', 'mecanico', 'pintor', 'plomero', 'transporte'];
        return oficiosKeys.some(oficio => nombre.toLowerCase().includes(oficio));
    }

    extractOficioType(input) {
        const oficios = {
            'albañil': ['albañil', 'albañiles', 'construcción', 'obra', 'pared', 'revoque', 'mampostería'],
            'cerrajero': ['cerrajero', 'cerrajeros', 'llave', 'candado', 'apertura', 'cerradura'],
            'electricista': ['electricista', 'electricistas', 'electricidad', 'instalación eléctrica', 'cableado', 'luz'],
            'herrero': ['herrero', 'herreros', 'metal', 'forja', 'rejas', 'herrería'],
            'jardinero': ['jardinero', 'jardineros', 'jardín', 'poda', 'plantas', 'jardinería'],
            'limpieza': ['limpieza', 'limpiador', 'aseo', 'hogar', 'oficina', 'limpia'],
            'mecanico': ['mecánico', 'mecanico', 'mecánicos', 'auto', 'coche', 'reparación vehicular', 'vehículo'],
            'pintor': ['pintor', 'pintores', 'pintura', 'pintar', 'revestimiento', 'brocha'],
            'plomero': ['plomero', 'plomeros', 'plomería', 'cañería', 'agua', 'desagote', 'fontanero'],
            'transporte': ['transporte', 'flete', 'mudanza', 'camión', 'delivery', 'envíos', 'acarreo']
        };

        for (const [oficio, keywords] of Object.entries(oficios)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return oficio;
            }
        }
        return null;
    }

    // === FORMATO MEJORADO PARA OFICIOS ===
    formatOficiosResponse(oficios, tipo) {
        let response = `🔧 **${tipo ? this.formatOficioType(tipo) : 'Profesionales y Oficios'} en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n`;

        if (oficios.length === 0) {
            response += "No encontré profesionales disponibles en este momento.\n\n";
        } else {
            oficios.forEach((oficio, index) => {
                response += `${index + 1}. **${oficio.profesion || oficio.nombre || oficio.name || 'Profesional'}**\n`;
                response += `   🛠️ ${oficio.servicio || oficio.especialidad || 'Servicios profesionales'}\n`;
                response += `   📞 ${oficio.telefono || 'Contactar para presupuesto'}\n`;
                
                if (oficio.experiencia) {
                    response += `   ⭐ ${oficio.experiencia}\n`;
                }
                if (oficio.zona || oficio.direccion) {
                    response += `   📍 ${oficio.zona || oficio.direccion}\n`;
                }
                
                if (oficio.whatsapp) {
                    const whatsappUrl = `https://wa.me/${oficio.whatsapp}?text=Hola, vi tu servicio en Tu Barrio A Un Click`;
                    response += `   💬 [Contactar por WhatsApp](${whatsappUrl})\n`;
                }
                
                if (oficio.tarjetaUrl) {
                    response += `   📇 [Ver tarjeta digital](${oficio.tarjetaUrl})\n`;
                }
                
                if (oficio.url) {
                    const webUrl = oficio.url.startsWith('http') ? oficio.url : `https://${oficio.url}`;
                    response += `   🌐 [Visitar web](${webUrl})\n`;
                }
                
                response += '\n';
            });
        }

        if (this.currentSearchResults.length > 8) {
            response += `\n📋 **Mostrando 8 de ${this.currentSearchResults.length} profesionales**\n\n`;
            response += `🔍 *¿Quieres ver más? Escribe "más resultados"*`;
        }

        const oficiosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/oficios-profeciones.html`);
        response += `\n💡 *¿Necesitás otro tipo de profesional? [Ver todos los oficios](${oficiosUrl})*`;

        return response;
    }

    formatOficioType(tipo) {
        const types = {
            'albañil': 'Albañiles',
            'cerrajero': 'Cerrajeros',
            'electricista': 'Electricistas',
            'herrero': 'Herreros',
            'jardinero': 'Jardineros',
            'limpieza': 'Servicios de Limpieza',
            'mecanico': 'Mecánicos',
            'pintor': 'Pintores',
            'plomero': 'Plomeros',
            'transporte': 'Servicios de Transporte'
        };
        return types[tipo] || (tipo.charAt(0).toUpperCase() + tipo.slice(1) + 's');
    }

    // === MANEJADOR MEJORADO PARA EMPRENDIMIENTOS ===
    async handleEmprendimientosSearch(input) {
        try {
            const emprendimientos = await this.dataManager.loadEmprendimientos();
            
            if (!emprendimientos || emprendimientos.length === 0) {
                const inscripcionUrl = this.getCorrectUrl(`/${this.currentLocalidad}/inscripcion.html`);
                return `💡 **Emprendimientos Locales**\n\n` +
                       `Actualmente no tengo emprendimientos cargados en ${this.formatLocalidadName(this.currentLocalidad)}.\n\n` +
                       `¿Te gustaría [ser el primero en registrar tu emprendimiento](${inscripcionUrl})?`;
            }

            let response = `💡 **Emprendimientos en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n`;

            emprendimientos.slice(0, 8).forEach((emp, index) => {
                response += `${index + 1}. **${emp.nombre}**\n`;
                response += `   📝 ${emp.descripcion || 'Nuevo emprendimiento local'}\n`;
                response += `   🛍️ ${emp.rubro || 'Productos/Servicios'}\n`;
                if (emp.contacto) {
                    response += `   📞 ${emp.contacto}\n`;
                }
                
                if (emp.whatsapp) {
                    const whatsappUrl = `https://wa.me/${emp.whatsapp}?text=Hola, vi tu emprendimiento en Tu Barrio A Un Click`;
                    response += `   💬 [Contactar por WhatsApp](${whatsappUrl})\n`;
                }
                
                if (emp.pagina || emp.url) {
                    const webUrl = (emp.pagina || emp.url).startsWith('http') ? (emp.pagina || emp.url) : `https://${emp.pagina || emp.url}`;
                    response += `   🌐 [Visitar web](${webUrl})\n`;
                }
                
                if (emp.tarjetaUrl || emp.tarjeta) {
                    response += `   📇 [Ver tarjeta digital](${emp.tarjetaUrl || emp.tarjeta})\n`;
                }
                
                response += '\n';
            });

            const inscripcionUrl = this.getCorrectUrl(`/${this.currentLocalidad}/inscripcion.html`);
            response += `\n🌟 *¿Tienes un emprendimiento? [¡Inscríbelo aquí!](${inscripcionUrl})*`;

            return response;

        } catch (error) {
            const emprendimientosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/emprendimientos.html`);
            return `💡 **Emprendimientos Locales**\n\n` +
                   `Puedes [explorar todos los emprendimientos aquí](${emprendimientosUrl})\n\n` +
                   `*¿Te gustaría registrar tu propio emprendimiento?*`;
        }
    }

    // === MANEJADOR MEJORADO DE OFERTAS ===
    async handleOfertasSearch(input) {
        console.log(`🎯 Buscando ofertas... Localidad: ${this.currentLocalidad}`);
        
        try {
            const ofertas = await this.dataManager.loadOfertas();
            
            console.log(`📦 Ofertas cargadas:`, ofertas);
            console.log(`📊 Total de ofertas: ${ofertas ? ofertas.length : 0}`);
            
            if (!ofertas || ofertas.length === 0) {
                const inscripcionUrl = this.getCorrectUrl(`/${this.currentLocalidad}/inscripcion.html`);
                return "📭 No hay ofertas disponibles en este momento. ¡Vuelve pronto para descubrir nuevas promociones!\n\n" +
                       `💡 *¿Eres un comercio? [Agrega tus ofertas aquí](${inscripcionUrl})*`;
            }

            let filteredOfertas = ofertas;
            const businessType = this.extractBusinessType(input);
            
            if (businessType) {
                filteredOfertas = ofertas.filter(oferta => 
                    oferta.tipoNegocio?.includes(businessType) ||
                    oferta.categoria?.includes(businessType) ||
                    oferta.negocio?.toLowerCase().includes(businessType) ||
                    (oferta.titulo && oferta.titulo.toLowerCase().includes(businessType))
                );
            }

            console.log(`🎯 Ofertas filtradas: ${filteredOfertas.length}`);

            if (filteredOfertas.length === 0) {
                const ofertasUrl = this.getCorrectUrl(`/${this.currentLocalidad}/comunidad-de-ofertas.html`);
                if (businessType) {
                    return `❌ No encontré ofertas de **${this.formatBusinessType(businessType)}** disponibles.\n\n` +
                           `💡 *Puedes [ver todas las ofertas aquí](${ofertasUrl}) o probar con otra categoría.*`;
                } else {
                    return `❌ No encontré ofertas que coincidan con tu búsqueda.\n\n` +
                           `💡 *Puedes [ver todas las ofertas aquí](${ofertasUrl})*`;
                }
            }

            return this.formatOfertasResponse(filteredOfertas, businessType);

        } catch (error) {
            console.error('Error en búsqueda de ofertas:', error);
            const ofertasUrl = this.getCorrectUrl(`/${this.currentLocalidad}/comunidad-de-ofertas.html`);
            return "❌ No pude cargar las ofertas en este momento. Por favor intenta más tarde.\n\n" +
                   `💡 *Puedes [ver las ofertas en la web](${ofertasUrl})*`;
        }
    }

    // === FUNCIÓN MEJORADA: Formatear respuesta de ofertas ===
    formatOfertasResponse(ofertas, tipo) {
        let response = `🎯 **Ofertas ${tipo ? 'de ' + this.formatBusinessType(tipo) : ''} en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n`;

        ofertas.slice(0, 8).forEach((oferta, index) => {
            response += `${index + 1}. **${oferta.titulo}**\n`;
            response += `   📝 ${oferta.descripcion}\n`;
            
            if (oferta.negocio && oferta.negocio !== 'Establecimiento local') {
                response += `   🏪 ${oferta.negocio}\n`;
            }
            
            if (oferta.precioOriginal && oferta.precioOferta) {
                response += `   💰 ${oferta.precioOriginal} → **${oferta.precioOferta}**\n`;
            } else if (oferta.precioOferta) {
                response += `   💰 **${oferta.precioOferta}**\n`;
            }
            
            if (oferta.descuento) {
                response += `   🏷️ ${oferta.descuento}% OFF\n`;
            }
            
            if (oferta.validez) {
                response += `   ⏰ ${oferta.validez}\n`;
            }
            
            if (oferta.boton && oferta.boton.texto) {
                const botonUrl = oferta.boton.url.startsWith('http') ? oferta.boton.url : this.getCorrectUrl(oferta.boton.url);
                response += `   🔗 [${oferta.boton.texto}](${botonUrl})\n`;
            }
            
            if (oferta.webUrl) {
                const webUrl = oferta.webUrl.startsWith('http') ? oferta.webUrl : `https://${oferta.webUrl}`;
                response += `   🌐 [Visitar web](${webUrl})\n`;
            }
            
            if (oferta.tarjetaUrl) {
                response += `   📇 [Ver tarjeta digital](${oferta.tarjetaUrl})\n`;
            }
            
            response += '\n';
        });

        if (ofertas.length > 8) {
            response += `*... y ${ofertas.length - 8} ofertas más.*\n\n`;
        }

        const ofertasUrl = this.getCorrectUrl(`/${this.currentLocalidad}/comunidad-de-ofertas.html`);
        response += `💡 *¿No encontrás lo que buscas? [Ver todas las ofertas](${ofertasUrl})*`;

        return response;
    }

    async handleSoporte(input, intent) {
        const phoneNumber = '5491157194796';
        const encodedMessage = encodeURIComponent(
            `🛠️ Soporte Tu Barrio\n\n` +
            `Localidad: ${this.formatLocalidadName(this.currentLocalidad)}\n` +
            `Consulta: "${input}"`
        );
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        return `🛠️ **Soporte y Ayuda**\n\n` +
               `Estamos aquí para ayudarte:\n\n` +
               `**💬 Contacto Directo:**\n` +
               `[📱 Contactar por WhatsApp](${whatsappUrl})\n\n` +
               `**📧 Otros Medios:**\n` +
               `• ✉️ Email: soporte@tubarrio.com\n` +
               `• 🌐 Web: tubarrio.com/ayuda\n\n` +
               `*¡Nuestro equipo te responderá a la brevedad!*`;
    }

    async handleLocationRequest(intent) {
        return "📍 **Ubicación**\n\n" +
               "Para ver tu ubicación y comercios cercanos, usa la función de mapa en la aplicación principal.\n\n" +
               "¿Te gustaría buscar algún tipo de comercio en particular?";
    }

    async handleHoursRequest(input) {
        return "🕒 **Horarios**\n\n" +
               "Puedo ayudarte a encontrar comercios abiertos ahora. ¿Qué tipo de comercio buscas?\n\n" +
               "Por ejemplo: \"farmacias abiertas\", \"panaderías abiertas ahora\", etc.";
    }

    async handleComunidad(input) {
        return `🏘️ **Comunidad de ${this.formatLocalidadName(this.currentLocalidad)}**\n\n` +
               `¡Bienvenido a tu comunidad local! Tenemos **${this.stats.businessesLoaded} comercios** registrados.\n\n` +
               `¿Te gustaría explorar alguna categoría en particular?`;
    }

    async handleInscripcion() {
        const inscripcionUrl = this.getCorrectUrl(`/${this.currentLocalidad}/inscripcion.html`);
        return `📝 **Inscripción de Negocios**\n\n` +
               `¡Qué bueno que quieras unirte a Tu Barrio A Un Click!\n\n` +
               `Puedes registrar tu negocio completando el formulario online:\n\n` +
               `[📋 Ir al formulario de inscripción](${inscripcionUrl})\n\n` +
               `¿Necesitas ayuda con el proceso?`;
    }

    async handleUnknownWithAI(input) {
        const suggestions = this.generateContextualSuggestions(input);
        
        let response = `🤔 No estoy seguro de entender "${input}".\n\n`;
        
        if (suggestions.length > 0) {
            response += "**¿Quizás quisiste decir?**\n";
            response += suggestions.map(s => `• ${s}`).join('\n');
            response += "\n\n";
        }
        
        response += "**También puedes:**\n";
        response += "• 🏪 **Buscar por categoría** (farmacias, panaderías, etc.)\n";
        response += "• 🔧 **Buscar profesionales** (plomeros, electricistas, etc.)\n";
        response += "• 🕒 **Consultar horarios**\n";
        response += "• 🎁 **Ver ofertas activas**\n";
        response += "• 💡 **Ver emprendimientos**\n";
        response += "• 🛠️ **Contactar soporte**";
        
        return response;
    }

    // ... (el resto del código se mantiene igual, solo se corrigieron las rutas)

    // === QUICK ACTIONS MEJORADO ===
    handleQuickAction(action) {
        const actions = {
            'negocios': async () => {
                const businesses = await this.dataManager.loadBusinessData();
                const openBusinesses = businesses.filter(b => {
                    const status = this.getBusinessTimeStatus(b);
                    return status.status === 'open' || status.status === 'closing_soon';
                });
                
                return `🏪 **Comercios en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n` +
                       `Tengo **${businesses.length} comercios** registrados:\n\n` +
                       `• 🟢 **${openBusinesses.length} abiertos** ahora\n` +
                       `• 🔴 **${businesses.length - openBusinesses.length} cerrados**\n\n` +
                       `¿Qué tipo de negocio buscas? Por ejemplo: "farmacias", "panaderías", "verdulerías"...`;
            },
            'oficios': () => {
                const oficiosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/oficios-profeciones.html`);
                return `¿Qué profesional necesitas? Te ayudo a encontrar albañiles, electricistas, plomeros, etc. También puedes [ver todos los oficios aquí](${oficiosUrl})`;
            },
            'ofertas': async () => {
                const ofertas = await this.dataManager.loadOfertas();
                
                console.log(`🎯 Quick Action - Ofertas cargadas: ${ofertas ? ofertas.length : 0}`);
                
                if (!ofertas || ofertas.length === 0) {
                    const inscripcionUrl = this.getCorrectUrl(`/${this.currentLocalidad}/inscripcion.html`);
                    return "📭 No hay ofertas disponibles en este momento. ¡Vuelve pronto para descubrir nuevas promociones!\n\n" +
                           `💡 *¿Eres un comercio? [Agrega tus ofertas aquí](${inscripcionUrl})*`;
                }
                
                return this.formatOfertasResponse(ofertas, null);
            },
            'emprendimientos': () => {
                const emprendimientosUrl = this.getCorrectUrl(`/${this.currentLocalidad}/emprendimientos.html`);
                return `Te muestro los emprendimientos locales. También puedes [ver todos los emprendimientos aquí](${emprendimientosUrl})`;
            }
        };
        
        if (actions[action]) {
            Promise.resolve(actions[action]()).then(response => {
                this.addMessage('assistant', response);
            });
        }
    }

    // === UTILIDADES ===
    formatLocalidadName(localidad) {
        const names = {
            'castelar': 'Castelar',
            'ituzaingo': 'Ituzaingó', 
            'moron': 'Morón',
            'ciudadela': 'Ciudadela',
            'merlo': 'Merlo',
            'haedo': 'Haedo',
            'ramos-mejia': 'Ramos Mejía'
        };
        return names[localidad] || localidad;
    }

    formatBusinessType(type) {
        const types = {
            'barberia': 'Barberías',
            'cafeteria': 'Cafeterías',
            'carniceria': 'Carnicerías',
            'comida': 'Restaurantes y Comida',
            'farmacia': 'Farmacias',
            'ferreteria': 'Ferreterías',
            'fiambreria': 'Fiambrerías',
            'granja': 'Granjas',
            'kiosco': 'Kioscos',
            'libreria': 'Librerías',
            'mascotas': 'Tiendas de Mascotas',
            'muebles': 'Mueblerías',
            'panaderia': 'Panaderías',
            'pastas': 'Pastas Frescas',
            'taller': 'Talleres',
            'tienda': 'Tiendas',
            'uñas': 'Estéticas de Uñas',
            'verduleria': 'Verdulerías',
            'veterinaria': 'Veterinarias',
            'albañil': 'Albañiles',
            'cerrajero': 'Cerrajeros',
            'electricista': 'Electricistas',
            'herrero': 'Herreros',
            'jardinero': 'Jardineros',
            'limpieza': 'Servicios de Limpieza',
            'mecanico': 'Mecánicos',
            'pintor': 'Pintores',
            'plomero': 'Plomeros',
            'transporte': 'Servicios de Transporte'
        };
        return types[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) + 's' : 'Negocios');
    }

    // ... (el resto del código UI se mantiene igual)

    // === SISTEMA DE HORARIOS (se mantiene igual) ===
    getBusinessTimeStatus(business) {
        // ... (código existente de horarios)
    }

    // ... (resto de métodos auxiliares)
}

// === INICIALIZACIÓN AUTOMÁTICA ===
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.tuBarrioChatbot = new TuBarrioChatbot();
        
        window.chatbot = {
            getStatus: () => window.tuBarrioChatbot?.getStatus(),
            setLocalidad: (localidad) => window.tuBarrioChatbot?.setLocalidad(localidad),
            test: (message) => window.tuBarrioChatbot?.processUserInput(message),
            stopSpeaking: () => window.tuBarrioChatbot?.stopSpeaking()
        };
    }, 1000);
});

window.addEventListener('hashchange', function() {
    if (window.tuBarrioChatbot) {
        window.tuBarrioChatbot.setLocalidad(window.tuBarrioChatbot.detectLocalidad());
    }
});
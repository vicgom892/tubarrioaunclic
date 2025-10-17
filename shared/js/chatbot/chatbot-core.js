// shared/js/chatbot/chatbot-core.js - VERSIÓN COMPLETA CORREGIDA
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
        this.resultsPerPage = 8; // 🎯 MOSTRAR 8 RESULTADOS DIRECTAMENTE
        
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

        // Archivos de oficios - corregido para usar la estructura correcta
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
                const response = await fetch(`/${this.currentLocalidad}/data/${file}`);
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

        // Cargar oficios - corregido para manejar diferentes ubicaciones
        const oficiosPromises = oficiosFiles.map(async (file) => {
            try {
                // Intentar diferentes ubicaciones posibles
                const possiblePaths = [
                    `/${this.currentLocalidad}/data/oficios/${file}`,
                    `/${this.currentLocalidad}/datos/oficios/${file}`,
                    `/data/oficios/${file}`,
                    `/datos/oficios/${file}`
                ];

                let response = null;
                for (const path of possiblePaths) {
                    try {
                        response = await fetch(path);
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
        
        // Convertir nombre a formato URL
        const nombreUrl = nombre
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remover acentos
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
            
        return `/${this.currentLocalidad}/tarjeta.html?negocio=${nombreUrl}&categoria=${categoria}`;
    }

    generateWebUrl(business) {
        if (business.url) {
            return business.url.startsWith('http') ? business.url : `https://${business.url}`;
        }
        return null;
    }

    // === CARGA MEJORADA DE OFERTAS DESDE NUEVA CARPETA ===
    async loadLocalOfertas() {
        try {
            console.log(`🎯 Buscando ofertas en nueva carpeta para: ${this.currentLocalidad}`);
            
            // Archivos de ofertas individuales por tipo de negocio - ACTUALIZADO
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

            console.log(`📂 Buscando ${ofertaFiles.length} archivos en carpeta ofertas/...`);

            // Cargar todas las ofertas individuales desde NUEVA CARPETA
            const loadPromises = ofertaFiles.map(async (file) => {
                try {
                    // ✅ RUTAS CORREGIDAS - Usar siempre la misma estructura
                    const possiblePaths = [
                        `/${this.currentLocalidad}/ofertas/${file}`, // ✅ Ruta principal corregida
                        `/ofertas/${file}`,                          // ✅ Ruta global
                        `/${this.currentLocalidad}/datos/${file}`,   // ⬅️ Fallback a datos/
                        `/datos/${file}`,                            // ⬅️ Fallback global
                        `/${this.currentLocalidad}/data/${file}`,    // ⬅️ Fallback alternativo
                        `/data/${file}`                              // ⬅️ Último fallback
                    ];

                    let response = null;
                    let successfulPath = null;
                    
                    for (const path of possiblePaths) {
                        try {
                            console.log(`🔍 Intentando cargar: ${path}`);
                            response = await fetch(path);
                            if (response.ok) {
                                successfulPath = path;
                                console.log(`✅ Encontrado en: ${path}`);
                                break;
                            } else {
                                console.log(`❌ No encontrado en: ${path} (${response.status})`);
                            }
                        } catch (e) {
                            console.log(`🚫 Error en ruta ${path}:`, e.message);
                            continue;
                        }
                    }

                    if (response && response.ok) {
                        const data = await response.json();
                        console.log(`📄 ${file} cargado desde: ${successfulPath}`, data);
                        
                        // 🎯 MANEJAR AMBAS ESTRUCTURAS
                        let ofertasArray = [];
                        
                        if (Array.isArray(data)) {
                            // Estructura antigua: array directo
                            ofertasArray = data;
                            console.log(`📋 ${file}: Estructura array directo`);
                        } else if (data.ofertas && Array.isArray(data.ofertas)) {
                            // Estructura nueva: objeto con propiedad "ofertas"
                            ofertasArray = data.ofertas;
                            console.log(`📋 ${file}: Estructura objeto con "ofertas"`);
                        } else if (data.ofertas && typeof data.ofertas === 'object') {
                            // Si ofertas es un objeto, convertirlo a array
                            ofertasArray = [data.ofertas];
                            console.log(`📋 ${file}: Estructura objeto único convertido a array`);
                        } else {
                            console.log(`⚠️ ${file}: Estructura desconocida`, data);
                            ofertasArray = [data]; // Intentar con el objeto completo
                        }
                        
                        if (ofertasArray.length > 0) {
                            const ofertasWithCategory = ofertasArray.map(oferta => 
                                this.normalizeOfertaData(oferta, file)
                            );
                            allOfertas = allOfertas.concat(ofertasWithCategory);
                            successfulFiles++;
                            console.log(`✅ ${file}: ${ofertasWithCategory.length} ofertas válidas`);
                        } else {
                            console.log(`⚠️ ${file}: No hay ofertas en el array`);
                        }
                        
                        loadedFiles++;
                    } else {
                        console.log(`❌ No se pudo cargar: ${file} desde ninguna ruta`);
                    }
                } catch (error) {
                    console.log(`❌ Error cargando ${file}:`, error.message);
                }
            });

            await Promise.all(loadPromises);
            
            console.log(`📊 Cargadas ${allOfertas.length} ofertas de ${successfulFiles} archivos desde carpeta ofertas/`);
            
            // Si no se cargaron ofertas, intentar carga legacy
            if (allOfertas.length === 0) {
                console.log('🔄 Intentando carga legacy desde datos/ofertas.json...');
                return await this.loadLegacyOfertas();
            }
            
            return allOfertas;

        } catch (error) {
            console.error('❌ Error cargando ofertas desde nueva carpeta:', error);
            // Fallback a carga legacy
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
                    const response = await fetch(path);
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
        // Extraer tipo de negocio del nombre del archivo
        const tipoNegocio = filename.replace('oferta-', '').replace('.json', '');
        
        // Asegurar que los precios sean números y formatearlos correctamente
        const precioOriginal = oferta.precioOriginal || oferta.precioNormal;
        const precioOferta = oferta.precioOferta || oferta.precioEspecial;
        
        // Formatear precios como números o strings
        let precioOriginalFormatted = precioOriginal;
        let precioOfertaFormatted = precioOferta;
        
        if (typeof precioOriginal === 'number') {
            precioOriginalFormatted = `$${precioOriginal.toLocaleString('es-AR')}`;
        }
        if (typeof precioOferta === 'number') {
            precioOfertaFormatted = `$${precioOferta.toLocaleString('es-AR')}`;
        }
        
        // Generar URLs para web y tarjeta
        const webUrl = oferta.pagina || oferta.url;
        const tarjetaUrl = oferta.tarjetaUrl || oferta.tarjeta || this.generateOfertaTarjetaUrl(oferta, tipoNegocio);
        
        // Procesar botón de acción
        let botonData = oferta.boton;
        if (!botonData && oferta.whatsapp) {
            // Si no hay botón pero hay WhatsApp, crear uno automático
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
            // Agregar timestamp para ordenamiento
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
            
        return `/${this.currentLocalidad}/tarjeta.html?negocio=${negocioUrl}&categoria=${tipoNegocio}`;
    }

    async loadLocalOficios() {
        try {
            const response = await fetch(`/${this.currentLocalidad}/datos/oficios.json`);
            return response.ok ? await response.json() : [];
        } catch (error) {
            return [];
        }
    }

    async loadLocalEmprendimientos() {
        try {
            const response = await fetch(`/${this.currentLocalidad}/data/emprendimientos.json`);
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
        
        // Configurar eventos para control de voz
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
                
                // Filtrar iconos antes de hablar y usar resumen
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
        // Remover emojis y iconos comunes
        let cleanText = text
            .replace(/[🟢🔴🟡⚫⚪🟠🟣🟤🔵🟢🔴🟡🟠🟣🟤⚫⚪🔵]/g, '')
            .replace(/[🏪💊🔧🍞🥦🧀🏪🐾✂️👕🛠️☕📚🧋🌹🥩🌾🪑💅🍽️🎁✨📍🕒📊🤔💡🔍❌✅⚠️📝🛠️🌟📱📧📞🌐💬🚨]/g, '')
            .replace(/\[\]\([^)]*\)/g, '') // Remover enlaces markdown
            .replace(/\*\*/g, '') // Remover negritas
            .replace(/\*/g, '') // Remover cursivas
            .replace(/\n/g, '. ') // Reemplazar saltos de línea
            .replace(/\s+/g, ' ') // Normalizar espacios
            .trim();
        
        // Limpiar texto repetitivo
        cleanText = cleanText
            .replace(/\.\.+/g, '.')
            .replace(/\s\s+/g, ' ');
            
        return cleanText || 'No hay texto para leer';
    }

    // Crear resumen para voz (más corto)
    createVoiceSummary(text) {
        // Limitar la longitud para voz
        let summary = text
            .substring(0, 500) // Máximo 500 caracteres para voz
            .replace(/\d+\.\s*\*\*/g, '') // Remover numeración y negritas
            .replace(/\*\*/g, '') // Remover negritas
            .replace(/\[[^\]]+\]\([^)]+\)/g, '') // Remover enlaces
            .replace(/\n+/g, '. ') // Reemplazar saltos de línea
            .replace(/\s+/g, ' ') // Normalizar espacios
            .trim();
        
        // Si es muy largo, cortar en un punto natural
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
        
        this.stopSpeaking(); // Detener cualquier habla anterior
        
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

    // === DETECCIÓN MEJORADA DE INTENCIONES - INCLUYE "MÁS RESULTADOS" ===
    detectIntent(input) {
        const intents = {
            'buscar': ['buscar', 'encontrar', 'dónde hay', 'quiero', 'necesito'],
            'contactar': ['contactar', 'llamar', 'escribir', 'whatsapp', 'teléfono'],
            'informacion': ['información', 'datos', 'detalles', 'saber', 'contar'],
            'urgencia': ['urgente', 'emergencia', 'rápido', 'inmediato', 'ahora'],
            'recomendacion': ['recomendar', 'mejor', 'sugerir', 'recomendación'],
            'mas_resultados': ['más', 'más resultados', 'ver más', 'siguiente', 'continuar'] // 🎯 NUEVO
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return intent;
            }
        }
        return 'general';
    }

    async generateIntelligentResponse(input) {
        // Usar sistema de IA si está disponible
        if (this.intelligenceSystem) {
            const aiResponse = await this.intelligenceSystem.processInput(input, {
                localidad: this.currentLocalidad,
                history: this.conversationHistory
            });
            
            if (aiResponse && aiResponse.confidence > 0.7) {
                return aiResponse.text;
            }
        }

        // Detección de categoría mejorada
        const category = this.detectCategory(input);
        const intent = this.detectIntent(input);
        
        console.log(`🔍 Categoría detectada: ${category}, Intención: ${intent}`);

        // 🎯 NUEVO: Manejar solicitud de más resultados
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

    // === NUEVO MÉTODO PARA MANEJAR "MÁS RESULTADOS" ===
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
            
            // Enlaces
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
            // 🎯 NUEVAS CATEGORÍAS PARA OFERTAS
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
        
        // Si es un oficio, redirigir al manejador de oficios
        if (businessType && this.isOficioCategory(businessType)) {
            return await this.handleOficiosSearch(input);
        }
        
        try {
            const businesses = await this.dataManager.loadBusinessData();
            
            if (!businesses || businesses.length === 0) {
                return "❌ No hay negocios cargados en este momento. Por favor intenta más tarde.";
            }

            let results = businesses;

            // Filtrar por tipo si se especificó (excluyendo oficios)
            if (businessType && !this.isOficioCategory(businessType)) {
                results = this.filterBusinessesByType(results, businessType);
                
                if (results.length === 0) {
                    return this.handleNoBusinessFound(businessType, input);
                }
            }

            // 🎯 NUEVO: Guardar resultados para posible paginación
            this.currentSearchResults = results;
            this.currentSearchType = businessType || 'general';
            this.currentSearchOffset = 0;

            // Si no se especificó tipo, mostrar estadísticas y preguntar
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

            // 🎯 CORREGIDO: Mostrar hasta 8 resultados directamente
            return this.formatBusinessResponse(results, businessType, intent);

        } catch (error) {
            console.error('Error en búsqueda:', error);
            return "❌ No pude cargar la información de negocios en este momento. Por favor intenta más tarde.";
        }
    }

    // === FORMATO MEJORADO DE RESPUESTAS - MUESTRA MÁS RESULTADOS ===
    formatBusinessResponse(businesses, type, intent) {
        // Ordenar por estado: abiertos primero, luego por tiempo de cierre
        const sortedBusinesses = businesses.map(business => {
            const timeStatus = this.getBusinessTimeStatus(business);
            return { ...business, timeStatus };
        }).sort((a, b) => {
            // Abiertos primero
            if (a.timeStatus.status === 'open' && b.timeStatus.status !== 'open') return -1;
            if (a.timeStatus.status !== 'open' && b.timeStatus.status === 'open') return 1;
            
            // Luego por tiempo hasta cierre (los que cierran pronto primero)
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

        // 🎯 CORREGIDO: Mostrar hasta 8 resultados en lugar de 5
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
                
                // 🔗 ENLACES MEJORADOS
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
                
                // 🔗 ENLACES MEJORADOS
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

        // 🎯 NUEVO: Botón para cargar más resultados si hay más de 8
        if (totalCount > 8) {
            response += `\n📋 **Mostrando 8 de ${totalCount} resultados**\n\n`;
            response += `🔍 *¿Quieres ver más resultados? Escribe "más resultados" o [ver todos los ${type}](${this.generateCategoryUrl(type)})*`;
        }

        // Agregar sugerencia de emprendimientos si no hay muchos resultados
        if (totalCount < 3) {
            response += `\n\n💡 *¿Buscás algo más específico? También puedes ver [nuestros emprendimientos locales](/${this.currentLocalidad}/emprendimientos.html)*`;
        }

        return response;
    }

    // === NUEVO MÉTODO PARA GENERAR URLS DE CATEGORÍAS ===
    generateCategoryUrl(category) {
        const categoryMap = {
            'kiosco': 'kioscos',
            'panaderia': 'panaderias', 
            'verduleria': 'verdulerias',
            'farmacia': 'farmacias',
            'carniceria': 'carnicerias',
            'fiambreria': 'fiambrerias',
            'supermercado': 'supermercados',
            'restaurante': 'restaurantes',
            'barberia': 'barberias',
            'peluqueria': 'peluquerias'
        };
        
        const urlCategory = categoryMap[category] || category;
        return `/${this.currentLocalidad}/categorias/${urlCategory}.html`;
    }

    // === EXTRACCIÓN MEJORADA DE TIPOS DE NEGOCIO - INCLUYE OFICIOS ===
    extractBusinessType(input) {
        const categories = {
            'barberia': ['barberia', 'barbero', 'corte de pelo', 'peluqueria'],
            'cafeteria': ['cafeteria', 'cafe', 'café', 'desayuno', 'merienda'],
            'carniceria': ['carniceria', 'carne', 'carnicero', 'asado', 'vacuno'],
            'comida': ['restaurante', 'comida', 'almuerzo', 'cena', 'menu', 'pizza', 'hamburguesa'],
            'farmacia': ['farmacia', 'medicina', 'remedio', 'farmaceutico', 'turno'],
            'ferreteria': ['ferreteria', 'herramientas', 'materiales', 'construccion'],
            'fiambreria': ['fiambreria', 'fiambre', 'queso', 'embutidos', 'picada'],
            'granja': ['granja', 'avicola', 'huevos', 'pollos', 'granjero'],
            'kiosco': ['kiosco', 'golosinas', 'cigarrillos', 'revistas', 'diarios'],
            'libreria': ['libreria', 'libros', 'papeleria', 'utiles', 'cuadernos'],
            'mascotas': ['mascotas', 'veterinaria', 'perro', 'gato', 'animales'],
            'muebles': ['muebles', 'muebleria', 'sillas', 'mesas', 'decoracion'],
            'panaderia': ['panaderia', 'pan', 'facturas', 'medialunas', 'tortas'],
            'pastas': ['pastas', 'pasta', 'ravioles', 'ñoquis', 'tallarines'],
            'taller': ['taller', 'mecanico', 'reparacion', 'auto', 'vehiculo'],
            'tienda': ['tienda', 'ropa', 'indumentaria', 'moda', 'vestimenta'],
            'uñas': ['uñas', 'manicuria', 'esmalte', 'manicura', 'unas'],
            'verduleria': ['verduleria', 'verdura', 'fruta', 'fruteria', 'hortaliza'],
            'veterinaria': ['veterinaria', 'veterinario', 'animales', 'mascotas'],
            // OFICIOS - mejorado con más sinónimos
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

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return category;
            }
        }
        
        return null;
    }

    filterBusinessesByType(businesses, type) {
        return businesses.filter(business => {
            const businessCategory = business.categoria || business.category || '';
            const businessName = business.nombre || business.name || '';
            
            return businessCategory.toLowerCase().includes(type) ||
                   businessName.toLowerCase().includes(type) ||
                   this.doesBusinessMatchType(business, type);
        });
    }

    doesBusinessMatchType(business, type) {
        const typeSynonyms = {
            'comida': ['restaurante', 'comida', 'almuerzo', 'cena', 'pizza', 'hamburguesa'],
            'barberia': ['barberia', 'peluqueria', 'corte', 'barba'],
            'farmacia': ['farmacia', 'medicina', 'remedio'],
            'panaderia': ['panaderia', 'pan', 'facturas'],
            'verduleria': ['verduleria', 'verdura', 'fruta'],
            'kiosco': ['kiosco', 'golosinas', 'cigarrillos']
        };
        
        const synonyms = typeSynonyms[type] || [type];
        const businessName = (business.nombre || business.name || '').toLowerCase();
        const businessCategory = (business.categoria || business.category || '').toLowerCase();
        
        return synonyms.some(synonym => 
            businessName.includes(synonym) ||
            businessCategory.includes(synonym)
        );
    }

   // === SISTEMA MEJORADO DE HORARIOS ARGENTINA ===
getBusinessTimeStatus(business) {
    const hours = business.hours || business.horario;
    if (!hours) return { status: 'unknown', message: 'Horario no disponible' };
    
    // Obtener hora actual de Argentina (UTC-3) de forma más precisa
    const now = new Date();
    
    // Convertir a hora de Argentina (UTC-3)
    // Argentina no tiene horario de verano desde 2020
    const argentinaTime = new Date(now.toLocaleString("en-US", {
        timeZone: "America/Argentina/Buenos_Aires"
    }));
    
    const currentTime = argentinaTime.getHours() * 60 + argentinaTime.getMinutes();
    const currentHour = argentinaTime.getHours();
    const currentMinute = argentinaTime.getMinutes();
    const currentDay = argentinaTime.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    console.log(`🕒 Hora Argentina actual: ${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute} (Día ${currentDay})`);
    
    try {
        // Intentar parsear horarios en diferentes formatos
        const timeInfo = this.parseBusinessHours(hours, currentTime, currentDay);
        
        if (timeInfo.status === 'open') {
            const minutesUntilClose = timeInfo.minutesUntilClose;
            
            if (minutesUntilClose <= 30) {
                return {
                    status: 'closing_soon',
                    message: `⏰ ¡Apressúrate! Cierra en ${minutesUntilClose} minutos`,
                    minutesUntilClose: minutesUntilClose,
                    nextChange: 'close',
                    minutesUntilChange: minutesUntilClose
                };
            } else if (minutesUntilClose <= 60) {
                return {
                    status: 'closing_soon',
                    message: `⏰ Cierra en ${minutesUntilClose} minutos`,
                    minutesUntilClose: minutesUntilClose,
                    nextChange: 'close',
                    minutesUntilChange: minutesUntilClose
                };
            } else {
                const hoursUntilClose = Math.floor(minutesUntilClose / 60);
                const minutesRemaining = minutesUntilClose % 60;
                let mensajeTiempo = `${hoursUntilClose} hora${hoursUntilClose > 1 ? 's' : ''}`;
                
                if (minutesRemaining > 0) {
                    mensajeTiempo += ` y ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''}`;
                }
                
                return {
                    status: 'open',
                    message: `🟢 Abierto - Cierra en ${mensajeTiempo}`,
                    minutesUntilClose: minutesUntilClose,
                    nextChange: 'close',
                    minutesUntilChange: minutesUntilClose
                };
            }
        } else if (timeInfo.status === 'closed') {
            const minutesUntilOpen = timeInfo.minutesUntilOpen;
            
            if (minutesUntilOpen <= 60) {
                return {
                    status: 'opening_soon',
                    message: `🟡 Abre en ${minutesUntilOpen} minutos`,
                    minutesUntilOpen: minutesUntilOpen,
                    nextChange: 'open',
                    minutesUntilChange: minutesUntilOpen
                };
            } else {
                const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
                const minutesRemaining = minutesUntilOpen % 60;
                let mensajeTiempo = `${hoursUntilOpen} hora${hoursUntilOpen > 1 ? 's' : ''}`;
                
                if (minutesRemaining > 0) {
                    mensajeTiempo += ` y ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''}`;
                }
                
                return {
                    status: 'closed',
                    message: `🔴 Cerrado - Abre en ${mensajeTiempo}`,
                    minutesUntilOpen: minutesUntilOpen,
                    nextChange: 'open',
                    minutesUntilChange: minutesUntilOpen
                };
            }
        }
    } catch (error) {
        console.warn('Error parsing hours:', error, hours);
    }
    
    // Fallback básico mejorado
    return this.getBasicTimeStatus(hours);
}

// === PARSER MEJORADO DE HORARIOS CON SOPORTE PARA DÍAS ===
parseBusinessHours(hoursString, currentTime, currentDay) {
    const normalized = hoursString.toLowerCase().trim();
    
    console.log(`📅 Analizando horario: "${hoursString}"`);
    
    // Casos especiales
    if (normalized.includes('24 horas') || normalized.includes('24hs') || normalized.includes('24 h')) {
        console.log('✅ Negocio 24 horas');
        return { status: 'open', minutesUntilClose: 24 * 60, minutesUntilOpen: 0 };
    }
    
    if (normalized.includes('cerrado') || normalized.includes('cerrada') || normalized.includes('closed')) {
        console.log('❌ Negocio cerrado');
        return { status: 'closed', minutesUntilOpen: 24 * 60, minutesUntilClose: 0 };
    }
    
    // Verificar si es domingo (muchos comercios cierran)
    if (currentDay === 0) {
        // Es domingo - muchos comercios tienen horarios reducidos o cierran
        if (normalized.includes('domingo')) {
            // Intentar extraer horario específico para domingos
            const domingoMatch = normalized.match(/domingo[^\d]*(\d{1,2})[:\.]?(\d{2})?\s*(?:a|hs?|-|–)\s*(\d{1,2})[:\.]?(\d{2})?/);
            if (domingoMatch) {
                return this.parseTimeRange(domingoMatch, currentTime);
            }
        }
        // Si no hay horario específico para domingo, asumir horario reducido
        console.log('📅 Es domingo - horario reducido por defecto');
        return this.parseTimeRange(null, currentTime, true); // Horario reducido dominical
    }
    
    // Intentar extraer horarios en formato argentino común
    const timeFormats = [
        // Formato: 8:00 a 20:00, 08:00-20:00, 8 a 20 hs
        /(\d{1,2})[:\.]?(\d{2})?\s*(?:a|hs?|-|–|a)\s*(\d{1,2})[:\.]?(\d{2})?\s*(?:hs?|horas)?/,
        // Formato: 8 a 20, 08-20
        /(\d{1,2})\s*(?:a|hs?|-|–)\s*(\d{1,2})\s*(?:hs?|horas)?/,
        // Formato: De 8 a 20 hs
        /de\s*(\d{1,2})\s*(?:a|hs?)\s*(\d{1,2})\s*(?:hs?|horas)?/
    ];
    
    for (const format of timeFormats) {
        const timeMatch = normalized.match(format);
        if (timeMatch) {
            return this.parseTimeRange(timeMatch, currentTime);
        }
    }
    
    // Si no se pudo parsear, usar horario extendido común con ajuste para días
    console.log('⚠️ Usando horario por defecto ajustado por día');
    return this.getDefaultHours(currentTime, currentDay);
}

// === MÉTODO AUXILIAR PARA PARSEAR RANGOS DE TIEMPO ===
parseTimeRange(timeMatch, currentTime, isSunday = false) {
    if (!timeMatch) {
        // Si no hay match, usar horarios por defecto según el día
        return this.getDefaultHours(currentTime, isSunday ? 0 : new Date().getDay());
    }
    
    console.log('✅ Horario detectado con formato:', timeMatch);
    
    let startHour, startMinute, endHour, endMinute;
    
    if (timeMatch[2] !== undefined && timeMatch[4] !== undefined) {
        // Formato con minutos: 8:00 a 20:00
        startHour = parseInt(timeMatch[1]);
        startMinute = parseInt(timeMatch[2]) || 0;
        endHour = parseInt(timeMatch[3]);
        endMinute = parseInt(timeMatch[4]) || 0;
    } else if (timeMatch[2] !== undefined && timeMatch[3] === undefined) {
        // Formato simple: 8 a 20
        startHour = parseInt(timeMatch[1]);
        startMinute = 0;
        endHour = parseInt(timeMatch[2]);
        endMinute = 0;
    } else {
        // Formato: De 8 a 20
        startHour = parseInt(timeMatch[1]);
        startMinute = 0;
        endHour = parseInt(timeMatch[2]);
        endMinute = 0;
    }
    
    // Ajustar horarios para domingos (generalmente cierran más temprano)
    if (isSunday) {
        endHour = Math.min(endHour, 18); // Máximo hasta las 18hs los domingos
    }
    
    // Validar horas
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        return this.getDefaultHours(currentTime, isSunday ? 0 : new Date().getDay());
    }
    
    const startTime = startHour * 60 + startMinute;
    let endTime = endHour * 60 + endMinute;
    
    console.log(`⏰ Horario parseado: ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
    console.log(`⏰ Tiempos: inicio=${startTime}, fin=${endTime}, actual=${currentTime}`);
    
    // Manejar horarios que pasan de medianoche
    if (endTime < startTime) {
        endTime += 24 * 60;
    }
    
    // Ajustar currentTime si el horario pasa de medianoche
    let adjustedCurrentTime = currentTime;
    if (endTime > 24 * 60 && currentTime < startTime) {
        adjustedCurrentTime += 24 * 60;
    }
    
    if (adjustedCurrentTime >= startTime && adjustedCurrentTime <= endTime) {
        const minutesUntilClose = endTime - adjustedCurrentTime;
        console.log(`✅ Abierto - Cierra en ${minutesUntilClose} minutos`);
        return { 
            status: 'open', 
            minutesUntilClose: minutesUntilClose,
            minutesUntilOpen: 0
        };
    } else if (adjustedCurrentTime < startTime) {
        const minutesUntilOpen = startTime - adjustedCurrentTime;
        console.log(`❌ Cerrado - Abre en ${minutesUntilOpen} minutos`);
        return { 
            status: 'closed', 
            minutesUntilOpen: minutesUntilOpen,
            minutesUntilClose: 0
        };
    } else {
        const minutesUntilOpen = (24 * 60 - adjustedCurrentTime) + startTime;
        console.log(`❌ Cerrado - Abre en ${minutesUntilOpen} minutos`);
        return { 
            status: 'closed', 
            minutesUntilOpen: minutesUntilOpen,
            minutesUntilClose: 0
        };
    }
}

// === HORARIOS POR DEFECTO MEJORADOS ===
getDefaultHours(currentTime, currentDay) {
    let startTime, endTime;
    
    // Ajustar horarios según el día de la semana
    switch (currentDay) {
        case 0: // Domingo
            startTime = 9 * 60;  // 9:00
            endTime = 13 * 60;   // 13:00 (medio día)
            break;
        case 6: // Sábado
            startTime = 8 * 60;  // 8:00
            endTime = 14 * 60;   // 14:00
            break;
        default: // Lunes a Viernes
            startTime = 8 * 60;  // 8:00
            endTime = 20 * 60;   // 20:00
    }
    
    if (currentTime >= startTime && currentTime <= endTime) {
        return { 
            status: 'open', 
            minutesUntilClose: endTime - currentTime,
            minutesUntilOpen: 0
        };
    } else if (currentTime < startTime) {
        return { 
            status: 'closed', 
            minutesUntilOpen: startTime - currentTime,
            minutesUntilClose: 0
        };
    } else {
        return { 
            status: 'closed', 
            minutesUntilOpen: (24 * 60 - currentTime) + startTime,
            minutesUntilClose: 0
        };
    }
}

// === FALLBACK BÁSICO MEJORADO ===
getBasicTimeStatus(hours) {
    try {
        const normalized = hours.toLowerCase();
        if (normalized.includes('cerrado') || normalized.includes('cerrada') || normalized.includes('closed')) {
            return { 
                status: 'closed', 
                message: '🔴 Cerrado',
                nextChange: 'unknown',
                minutesUntilChange: null
            };
        }
        if (normalized.includes('24 horas') || normalized.includes('24hs') || normalized.includes('24 h')) {
            return { 
                status: 'open', 
                message: '🟢 Abierto 24 horas',
                nextChange: 'never',
                minutesUntilChange: null
            };
        }
        return { 
            status: 'open', 
            message: '🟢 Abierto (horario estándar)',
            nextChange: 'unknown',
            minutesUntilChange: null
        };
    } catch (error) {
        return { 
            status: 'unknown', 
            message: 'Horario no disponible',
            nextChange: 'unknown',
            minutesUntilChange: null
        };
    }
}

    // === PARSER MEJORADO DE HORARIOS ===
    parseBusinessHours(hoursString, currentTime) {
        const normalized = hoursString.toLowerCase().trim();
        
        console.log(`📅 Analizando horario: "${hoursString}"`);
        
        // Casos especiales
        if (normalized.includes('24 horas') || normalized.includes('24hs') || normalized.includes('24 h')) {
            console.log('✅ Negocio 24 horas');
            return { status: 'open', minutesUntilClose: 24 * 60, minutesUntilOpen: 0 };
        }
        
        if (normalized.includes('cerrado') || normalized.includes('cerrada') || normalized.includes('closed')) {
            console.log('❌ Negocio cerrado');
            return { status: 'closed', minutesUntilOpen: 24 * 60, minutesUntilClose: 0 };
        }
        
        // Intentar extraer horarios en formato argentino común
        const timeFormats = [
            // Formato: 8:00 a 20:00, 08:00-20:00, 8 a 20 hs
            /(\d{1,2})[:\.]?(\d{2})?\s*(?:a|hs?|-|–|a)\s*(\d{1,2})[:\.]?(\d{2})?\s*(?:hs?|horas)?/,
            // Formato: 8 a 20, 08-20
            /(\d{1,2})\s*(?:a|hs?|-|–)\s*(\d{1,2})\s*(?:hs?|horas)?/,
            // Formato: De 8 a 20 hs
            /de\s*(\d{1,2})\s*(?:a|hs?)\s*(\d{1,2})\s*(?:hs?|horas)?/
        ];
        
        for (const format of timeFormats) {
            const timeMatch = normalized.match(format);
            if (timeMatch) {
                console.log('✅ Horario detectado con formato:', timeMatch);
                
                let startHour, startMinute, endHour, endMinute;
                
                if (timeMatch[2] !== undefined && timeMatch[4] !== undefined) {
                    // Formato con minutos: 8:00 a 20:00
                    startHour = parseInt(timeMatch[1]);
                    startMinute = parseInt(timeMatch[2]) || 0;
                    endHour = parseInt(timeMatch[3]);
                    endMinute = parseInt(timeMatch[4]) || 0;
                } else if (timeMatch[2] !== undefined && timeMatch[3] === undefined) {
                    // Formato simple: 8 a 20
                    startHour = parseInt(timeMatch[1]);
                    startMinute = 0;
                    endHour = parseInt(timeMatch[2]);
                    endMinute = 0;
                } else {
                    // Formato: De 8 a 20
                    startHour = parseInt(timeMatch[1]);
                    startMinute = 0;
                    endHour = parseInt(timeMatch[2]);
                    endMinute = 0;
                }
                
                // Validar horas
                if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
                    continue;
                }
                
                const startTime = startHour * 60 + startMinute;
                let endTime = endHour * 60 + endMinute;
                
                console.log(`⏰ Horario parseado: ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
                console.log(`⏰ Tiempos: inicio=${startTime}, fin=${endTime}, actual=${currentTime}`);
                
                // Manejar horarios que pasan de medianoche
                if (endTime < startTime) {
                    endTime += 24 * 60;
                }
                
                // Ajustar currentTime si el horario pasa de medianoche
                let adjustedCurrentTime = currentTime;
                if (endTime > 24 * 60 && currentTime < startTime) {
                    adjustedCurrentTime += 24 * 60;
                }
                
                if (adjustedCurrentTime >= startTime && adjustedCurrentTime <= endTime) {
                    const minutesUntilClose = endTime - adjustedCurrentTime;
                    console.log(`✅ Abierto - Cierra en ${minutesUntilClose} minutos`);
                    return { 
                        status: 'open', 
                        minutesUntilClose: minutesUntilClose,
                        minutesUntilOpen: 0
                    };
                } else if (adjustedCurrentTime < startTime) {
                    const minutesUntilOpen = startTime - adjustedCurrentTime;
                    console.log(`❌ Cerrado - Abre en ${minutesUntilOpen} minutos`);
                    return { 
                        status: 'closed', 
                        minutesUntilOpen: minutesUntilOpen,
                        minutesUntilClose: 0
                    };
                } else {
                    const minutesUntilOpen = (24 * 60 - adjustedCurrentTime) + startTime;
                    console.log(`❌ Cerrado - Abre en ${minutesUntilOpen} minutos`);
                    return { 
                        status: 'closed', 
                        minutesUntilOpen: minutesUntilOpen,
                        minutesUntilClose: 0
                    };
                }
            }
        }
        
        // Si no se pudo parsear, intentar con horario extendido común (8:00-20:00)
        console.log('⚠️ Usando horario por defecto 8:00-20:00');
        const startTime = 8 * 60; // 8:00
        const endTime = 20 * 60; // 20:00
        
        if (currentTime >= startTime && currentTime <= endTime) {
            return { 
                status: 'open', 
                minutesUntilClose: endTime - currentTime,
                minutesUntilOpen: 0
            };
        } else if (currentTime < startTime) {
            return { 
                status: 'closed', 
                minutesUntilOpen: startTime - currentTime,
                minutesUntilClose: 0
            };
        } else {
            return { 
                status: 'closed', 
                minutesUntilOpen: (24 * 60 - currentTime) + startTime,
                minutesUntilClose: 0
            };
        }
    }

    handleNoBusinessFound(type, input) {
        const suggestions = this.getAlternativeSuggestions(type);
        
        let response = `❌ No encontré "${type}" en ${this.formatLocalidadName(this.currentLocalidad)}.\n\n`;
        
        if (suggestions.length > 0) {
            response += "**¿Quizás te interese?**\n";
            response += suggestions.map(s => `• ${s}`).join('\n');
            response += "\n\n";
        }
        
        response += "**También puedes:**\n";
        response += "• 🔍 **Buscar otras categorías**\n";
        response += "• 🏪 **Ver todos los comercios**\n";
        response += "• 📝 **Registrar tu negocio** si eres propietario";
        
        return response;
    }

    getAlternativeSuggestions(type) {
        const alternatives = {
            'barberia': ['peluquerías', 'estéticas'],
            'farmacia': ['farmacias de turno'],
            'supermercado': ['almacenes', 'despensas'],
            'restaurante': ['cafeterías', 'pizzerías', 'parrillas']
        };
        
        return alternatives[type] || [];
    }

    // === MANEJADOR MEJORADO PARA OFICIOS (también muestra más resultados) ===
    async handleOficiosSearch(input) {
        try {
            const negocios = await this.dataManager.loadBusinessData();
            
            // Filtrar solo oficios de los negocios cargados
            const allOficios = negocios.filter(negocio => 
                negocio.tipo === 'oficio' || 
                (negocio.categoria && this.isOficioCategory(negocio.categoria)) ||
                this.isOficioByName(negocio.name || negocio.nombre)
            );
            
            if (allOficios.length === 0) {
                return "🔧 No tengo información de profesionales disponibles en este momento. " +
                       `Puedes [ver todos los oficios aquí](/${this.currentLocalidad}../oficios-profeciones.html)`;
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
                return `❌ No encontré ${oficioType ? oficioType + ' ' : ''}disponibles. ` +
                       `Puedes [ver todos los oficios aquí](/${this.currentLocalidad}../oficios-profeciones.html)`;
            }

            // 🎯 GUARDAR RESULTADOS PARA PAGINACIÓN
            this.currentSearchResults = relevantOficios;
            this.currentSearchType = oficioType || 'oficios';
            this.currentSearchOffset = 0;

            return this.formatOficiosResponse(relevantOficios.slice(0, 8), oficioType); // 🎯 Mostrar 8

        } catch (error) {
            console.error('Error cargando oficios:', error);
            return `🔧 No pude cargar la información de profesionales. ` +
                   `Puedes [ver los oficios disponibles aquí](/${this.currentLocalidad}../oficios-profeciones.html)`;
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
                
                // 🔗 ENLACES MEJORADOS
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

        // 🎯 NUEVO: Indicar si hay más resultados
        if (this.currentSearchResults.length > 8) {
            response += `\n📋 **Mostrando 8 de ${this.currentSearchResults.length} profesionales**\n\n`;
            response += `🔍 *¿Quieres ver más? Escribe "más resultados"*`;
        }

        response += `\n💡 *¿Necesitás otro tipo de profesional? [Ver todos los oficios](/${this.currentLocalidad}../oficios-profeciones.html)*`;

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
                return `💡 **Emprendimientos Locales**\n\n` +
                       `Actualmente no tengo emprendimientos cargados en ${this.formatLocalidadName(this.currentLocalidad)}.\n\n` +
                       `¿Te gustaría [ser el primero en registrar tu emprendimiento](/${this.currentLocalidad}../inscripcion.html)?`;
            }

            let response = `💡 **Emprendimientos en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n`;

            emprendimientos.slice(0, 8).forEach((emp, index) => { // 🎯 Mostrar 8
                response += `${index + 1}. **${emp.nombre}**\n`;
                response += `   📝 ${emp.descripcion || 'Nuevo emprendimiento local'}\n`;
                response += `   🛍️ ${emp.rubro || 'Productos/Servicios'}\n`;
                if (emp.contacto) {
                    response += `   📞 ${emp.contacto}\n`;
                }
                
                // 🔗 ENLACES MEJORADOS PARA EMPRENDIMIENTOS
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

            response += `\n🌟 *¿Tienes un emprendimiento? [¡Inscríbelo aquí!](/${this.currentLocalidad}../inscripcion.html)*`;

            return response;

        } catch (error) {
            return `💡 **Emprendimientos Locales**\n\n` +
                   `Puedes [explorar todos los emprendimientos aquí](/${this.currentLocalidad}../emprendimientos.html)\n\n` +
                   `*¿Te gustaría registrar tu propio emprendimiento?*`;
        }
    }

    // === MANEJADOR MEJORADO DE OFERTAS CON ENLACES ===
    async handleOfertasSearch(input) {
        console.log(`🎯 Buscando ofertas... Localidad: ${this.currentLocalidad}`);
        
        try {
            const ofertas = await this.dataManager.loadOfertas();
            
            console.log(`📦 Ofertas cargadas:`, ofertas);
            console.log(`📊 Total de ofertas: ${ofertas ? ofertas.length : 0}`);
            
            if (!ofertas || ofertas.length === 0) {
                console.log('❌ No se cargaron ofertas');
                return "📭 No hay ofertas disponibles en este momento. ¡Vuelve pronto para descubrir nuevas promociones!\n\n" +
                       `💡 *¿Eres un comercio? [Agrega tus ofertas aquí](/${this.currentLocalidad}../inscripcion.html)*`;
            }

            // Filtrar ofertas por tipo si se especifica
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
                if (businessType) {
                    return `❌ No encontré ofertas de **${this.formatBusinessType(businessType)}** disponibles.\n\n` +
                           `💡 *Puedes [ver todas las ofertas aquí](/${this.currentLocalidad}../comunidad-de-ofertas.html) o probar con otra categoría.*`;
                } else {
                    return `❌ No encontré ofertas que coincidan con tu búsqueda.\n\n` +
                           `💡 *Puedes [ver todas las ofertas aquí](/${this.currentLocalidad}../comunidad-de-ofertas.html)*`;
                }
            }

            return this.formatOfertasResponse(filteredOfertas, businessType);

        } catch (error) {
            console.error('Error en búsqueda de ofertas:', error);
            return "❌ No pude cargar las ofertas en este momento. Por favor intenta más tarde.\n\n" +
                   `💡 *Puedes [ver las ofertas en la web](/${this.currentLocalidad}../comunidad-de-ofertas.html)*`;
        }
    }

    // === FUNCIÓN MEJORADA: Formatear respuesta de ofertas con enlaces ===
    formatOfertasResponse(ofertas, tipo) {
        let response = `🎯 **Ofertas ${tipo ? 'de ' + this.formatBusinessType(tipo) : ''} en ${this.formatLocalidadName(this.currentLocalidad)}**\n\n`;

        ofertas.slice(0, 8).forEach((oferta, index) => { // 🎯 Mostrar 8
            response += `${index + 1}. **${oferta.titulo}**\n`;
            response += `   📝 ${oferta.descripcion}\n`;
            
            // Mostrar negocio si está disponible
            if (oferta.negocio && oferta.negocio !== 'Establecimiento local') {
                response += `   🏪 ${oferta.negocio}\n`;
            }
            
            // Mostrar precios si están disponibles
            if (oferta.precioOriginal && oferta.precioOferta) {
                response += `   💰 ${oferta.precioOriginal} → **${oferta.precioOferta}**\n`;
            } else if (oferta.precioOferta) {
                response += `   💰 **${oferta.precioOferta}**\n`;
            }
            
            // Mostrar descuento si está disponible
            if (oferta.descuento) {
                response += `   🏷️ ${oferta.descuento}% OFF\n`;
            }
            
            // Mostrar validez si está disponible
            if (oferta.validez) {
                response += `   ⏰ ${oferta.validez}\n`;
            }
            
            // 🔗 ENLACES MEJORADOS PARA OFERTAS
            if (oferta.boton && oferta.boton.texto) {
                const botonUrl = oferta.boton.url.startsWith('http') ? oferta.boton.url : `/${this.currentLocalidad}${oferta.boton.url}`;
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

        response += `💡 *¿No encontrás lo que buscas? [Ver todas las ofertas](/${this.currentLocalidad}../comunidad-de-ofertas.html)*`;

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
        const inscripcionUrl = `/${this.currentLocalidad}../inscripcion.html`;
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

    generateContextualSuggestions(input) {
        const allSuggestions = [
            'farmacias abiertas ahora',
            'panaderías cercanas',
            'verdulerías',
            'supermercados',
            'ofertas del día',
            'horarios de atención',
            'plomeros disponibles',
            'electricistas',
            'emprendimientos locales',
            'contactar soporte'
        ];

        return allSuggestions.filter(suggestion => 
            this.calculateSimilarity(input, suggestion) > 0.2
        ).slice(0, 3);
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
    }

    editDistance(str1, str2) {
        const track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
        for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
        
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1, 
                    track[j - 1][i - 1] + indicator,
                );
            }
        }
        
        return track[str2.length][str1.length];
    }

    // === QUICK ACTIONS MEJORADO ===
    handleQuickAction(action) {
        const actions = {
            'negocios': async () => {
                // Mostrar estadísticas directamente y preguntar
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
            'oficios': () => `¿Qué profesional necesitas? Te ayudo a encontrar albañiles, electricistas, plomeros, etc. También puedes [ver todos los oficios aquí](/${this.currentLocalidad}/oficios-profeciones.html)`,
            'ofertas': async () => {
                // Mostrar ofertas directamente
                const ofertas = await this.dataManager.loadOfertas();
                
                console.log(`🎯 Quick Action - Ofertas cargadas: ${ofertas ? ofertas.length : 0}`);
                
                if (!ofertas || ofertas.length === 0) {
                    return "📭 No hay ofertas disponibles en este momento. ¡Vuelve pronto para descubrir nuevas promociones!\n\n" +
                           `💡 *¿Eres un comercio? [Agrega tus ofertas aquí](/${this.currentLocalidad}../inscripcion.html)*`;
                }
                
                return this.formatOfertasResponse(ofertas, null);
            },
            'emprendimientos': () => `Te muestro los emprendimientos locales. También puedes [ver todos los emprendimientos aquí](/${this.currentLocalidad}/emprendimientos.html)`
        };
        
        if (actions[action]) {
            // Usar Promise para manejar las funciones async
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

    // === SISTEMA DE UI MEJORADO CON BOTÓN DE DETENER VOZ ===
    setupUI() {
        this.createChatInterface();
        this.setupEventListeners();
        this.loadUserPreferences();
    }

    createChatInterface() {
        const chatHTML = `
            <div id="tuBarrioChatbot" class="chatbot-container">
                <div class="chatbot-header">
                    <div class="chatbot-logo">
                        <img src="../shared/img/icon-192x192.png" alt="Tu Barrio A Un Click">
                        <div class="chatbot-info">
                            <h3>Tu Barrio Assistant</h3>
                            <span class="localidad-badge">${this.formatLocalidadName(this.currentLocalidad)}</span>
                        </div>
                    </div>
                    <div class="chatbot-controls">
                        <button class="voice-toggle" title="Activar voz">🎤</button>
                        <button class="clear-chat" title="Limpiar chat">🗑️</button>
                        <button class="close-chatbot">×</button>
                    </div>
                </div>
                
                <div class="chatbot-messages">
                    <div class="welcome-message">
                        <strong>¡Hola! Soy tu asistente de Tu Barrio</strong><br>
                        Estoy aquí para ayudarte en <strong>${this.formatLocalidadName(this.currentLocalidad)}</strong><br><br>
                        Puedo ayudarte con:<br>
                        • 🏪 Negocios y servicios locales<br>
                        • 🔧 Profesionales y oficios<br>
                        • 🎯 Ofertas y promociones<br>
                        • 💡 Emprendimientos locales<br>
                        • 🛠️ Soporte técnico<br>
                        • 📍 Ubicación y horarios inteligentes
                    </div>
                </div>
                
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span>Escribiendo...</span>
                </div>
                
                <div class="quick-actions">
                    <button class="quick-btn" data-action="negocios">🏪 Negocios</button>
                    <button class="quick-btn" data-action="oficios">🔧 Oficios</button>
                    <button class="quick-btn" data-action="ofertas">🎯 Ofertas</button>
                    <button class="quick-btn" data-action="emprendimientos">💡 Emprendimientos</button>
                </div>
                
                <div class="chatbot-input">
                    <input type="text" placeholder="Pregunta por negocios, oficios, horarios..." class="chat-input">
                    <button class="voice-btn" title="Hablar con el asistente">🎤</button>
                    <button class="stop-speech-btn" title="Detener voz" style="display: none;">⏹️</button>
                    <button class="send-btn" title="Enviar mensaje">➤</button>
                </div>
            </div>
            
            <button class="chatbot-toggle">
                <img src="../shared/img/icon-192x192.png" alt="Chat Tu Barrio">
                <span class="notification-dot"></span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    setupEventListeners() {
        // Toggle del chat
        document.querySelector('.chatbot-toggle').addEventListener('click', () => this.toggleChat());
        document.querySelector('.close-chatbot').addEventListener('click', () => this.toggleChat());
        
        // Input de texto
        const chatInput = document.querySelector('.chat-input');
        const sendBtn = document.querySelector('.send-btn');
        
        sendBtn.addEventListener('click', () => this.handleTextInput());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleTextInput();
        });
        
        // Sistema de voz
        const voiceBtn = document.querySelector('.voice-btn');
        voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Botón para detener voz
        const stopSpeechBtn = document.querySelector('.stop-speech-btn');
        stopSpeechBtn.addEventListener('click', () => this.stopSpeaking());
        
        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Controles adicionales
        document.querySelector('.clear-chat').addEventListener('click', () => this.clearChat());
        document.querySelector('.voice-toggle').addEventListener('click', () => this.toggleVoiceResponses());
    }

    handleTextInput() {
        const input = document.querySelector('.chat-input');
        const text = input.value.trim();
        
        if (text) {
            this.processUserInput(text);
            input.value = '';
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.addMessage('system', 'El reconocimiento de voz no está disponible en este navegador.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            this.updateUIListening(false);
        } else {
            this.recognition.start();
            this.updateUIListening(true);
        }
    }

    updateUIListening(listening) {
        this.isListening = listening;
        const voiceBtn = document.querySelector('.voice-btn');
        
        if (listening) {
            voiceBtn.textContent = '🔴';
            voiceBtn.style.background = '#e74c3c';
            voiceBtn.title = 'Escuchando...';
        } else {
            voiceBtn.textContent = '🎤';
            voiceBtn.style.background = '';
            voiceBtn.title = 'Hablar con el asistente';
        }
    }

    toggleChat() {
        const chatbot = document.getElementById('tuBarrioChatbot');
        const toggle = document.querySelector('.chatbot-toggle');
        
        chatbot.classList.toggle('active');
        toggle.classList.toggle('active');
        
        if (chatbot.classList.contains('active')) {
            setTimeout(() => {
                document.querySelector('.chat-input').focus();
            }, 300);
        }
    }

    toggleVoiceResponses() {
        this.userPreferences.voiceResponses = !this.userPreferences.voiceResponses;
        localStorage.setItem('chatbot_preferences', JSON.stringify(this.userPreferences));
        
        const voiceToggle = document.querySelector('.voice-toggle');
        voiceToggle.style.background = this.userPreferences.voiceResponses ? '#27ae60' : '';
        voiceToggle.title = this.userPreferences.voiceResponses ? 'Voz activada' : 'Voz desactivada';
        
        this.addMessage('system', 
            this.userPreferences.voiceResponses ? 
            '🔊 Respuestas por voz activadas' : 
            '🔇 Respuestas por voz desactivadas'
        );
    }

    clearChat() {
        const messagesContainer = document.querySelector('.chatbot-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <strong>¡Hola! Soy tu asistente de Tu Barrio</strong><br>
                Estoy aquí para ayudarte en <strong>${this.formatLocalidadName(this.currentLocalidad)}</strong><br><br>
                ¿En qué puedo ayudarte hoy?
            </div>
        `;
        
        this.conversationHistory = [];
        this.addMessage('system', 'La conversación ha sido limpiada. ¿En qué puedo ayudarte?');
    }

    addMessage(role, content) {
        const messagesContainer = document.querySelector('.chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // Procesar contenido con formato
        if (role === 'assistant') {
            let htmlContent = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            
            // Procesar enlaces
            htmlContent = htmlContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="chat-link">$1</a>');
            
            messageDiv.innerHTML = htmlContent;
        } else {
            messageDiv.textContent = content;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        document.querySelector('.typing-indicator').style.display = 'flex';
    }

    hideTypingIndicator() {
        document.querySelector('.typing-indicator').style.display = 'none';
    }

    loadUserPreferences() {
        this.userPreferences = JSON.parse(localStorage.getItem('chatbot_preferences') || '{}');
        
        if (this.userPreferences.voiceResponses) {
            const voiceToggle = document.querySelector('.voice-toggle');
            if (voiceToggle) voiceToggle.style.background = '#27ae60';
        }
    }

    // === MÉTODOS PÚBLICOS ===
    setLocalidad(localidad) {
        this.currentLocalidad = localidad;
        this.updateLocalidadUI();
    }

    updateLocalidadUI() {
        const badge = document.querySelector('.localidad-badge');
        const welcomeMsg = document.querySelector('.welcome-message');
        
        if (badge) {
            badge.textContent = this.formatLocalidadName(this.currentLocalidad);
        }
        
        if (welcomeMsg) {
            welcomeMsg.querySelector('strong').textContent = 
                `¡Hola! Soy tu asistente de Tu Barrio - ${this.formatLocalidadName(this.currentLocalidad)}`;
        }
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            localidad: this.currentLocalidad,
            businessesLoaded: this.stats.businessesLoaded,
            interactions: this.stats.interactions
        };
    }

    // Sistema básico de inteligencia
    basicIntelligence(input) {
        if (input.includes('gracias') || input.includes('thanks')) {
            return "¡De nada! ¿Hay algo más en lo que pueda ayudarte?";
        }
        if (input.includes('adiós') || input.includes('chau') || input.includes('bye')) {
            return "¡Hasta luego! Recuerda que estoy aquí para ayudarte cuando me necesites.";
        }
        return "Interesante pregunta. Estoy aprendiendo constantemente para mejorar mis respuestas.";
    }
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
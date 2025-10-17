// shared/js/chatbot/chatbot-intelligence.js
class ChatbotIntelligence {
    constructor() {
        this.knowledgeBase = this.loadKnowledgeBase();
        this.userPatterns = this.loadUserPatterns();
        this.conversationContext = [];
        this.learningEnabled = true;
    }

    loadKnowledgeBase() {
        return {
            categories: {
                'barberia': ['corte', 'barba', 'afeitado', 'estilista', 'peluqueria'],
                'cafeteria': ['cafe', 'desayuno', 'merienda', 'tostadas', 'medialunas'],
                'carniceria': ['carne', 'asado', 'vacuno', 'pollo', 'cerdo'],
                'farmacia': ['medicamento', 'remedio', 'turno', 'guardia', 'receta'],
                'ferreteria': ['herramienta', 'material', 'pintura', 'clavos', 'tornillos'],
                'panaderia': ['pan', 'facturas', 'tortas', 'masas', 'medialunas'],
                'verduleria': ['verdura', 'fruta', 'ensalada', 'hortaliza', 'fresco']
            },
            responses: {
                greeting: [
                    "¡Hola! Soy tu asistente de Tu Barrio. ¿En qué puedo ayudarte?",
                    "¡Buenas! Estoy aquí para ayudarte a encontrar lo mejor de tu zona.",
                    "¡Hola! ¿Buscas algún negocio o servicio en particular?"
                ],
                fallback: [
                    "No estoy seguro de entender. ¿Podrías reformular tu pregunta?",
                    "Interesante pregunta. ¿Te refieres a negocios, servicios o algo específico?",
                    "Voy a aprender de tu pregunta. Mientras tanto, ¿puedes contarme más detalles?"
                ]
            }
        };
    }

    async processInput(input, context = {}) {
        const processedInput = this.preprocessInput(input);
        const intent = this.detectIntent(processedInput);
        const entities = this.extractEntities(processedInput);
        
        // Actualizar contexto
        this.updateContext(processedInput, intent, entities);
        
        // Generar respuesta basada en intent y contexto
        const response = await this.generateResponse(intent, entities, context);
        
        return {
            text: response,
            confidence: this.calculateConfidence(intent, entities),
            intent: intent,
            entities: entities
        };
    }

    preprocessInput(input) {
        return input.toLowerCase()
            .replace(/[^\w\sáéíóúñ]/gi, '')
            .trim();
    }

    detectIntent(input) {
        const intentPatterns = {
            'search_business': ['buscar', 'encontrar', 'dónde hay', 'necesito', 'quiero'],
            'business_info': ['horario', 'abierto', 'cerrado', 'atiende', 'cuándo'],
            'contact': ['teléfono', 'contactar', 'llamar', 'whatsapp', 'escribir'],
            'location': ['cerca', 'cercano', 'ubicación', 'donde estoy', 'cómo llegar'],
            'support': ['ayuda', 'soporte', 'problema', 'error', 'no funciona'],
            'greeting': ['hola', 'buenos días', 'buenas tardes', 'buenas noches']
        };

        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            if (patterns.some(pattern => input.includes(pattern))) {
                return intent;
            }
        }

        return 'unknown';
    }

    extractEntities(input) {
        const entities = {
            business_type: null,
            business_name: null,
            location: null,
            time: null
        };

        // Extraer tipo de negocio
        for (const [type, keywords] of Object.entries(this.knowledgeBase.categories)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                entities.business_type = type;
                break;
            }
        }

        // Extraer nombre de negocio (básico)
        const words = input.split(' ');
        if (words.length > 2) {
            // Buscar palabras que podrían ser nombres propios
            const possibleNames = words.filter(word => 
                word.length > 3 && 
                !Object.values(this.knowledgeBase.categories).flat().includes(word)
            );
            if (possibleNames.length > 0) {
                entities.business_name = possibleNames[0];
            }
        }

        return entities;
    }

    updateContext(input, intent, entities) {
        this.conversationContext.push({
            input,
            intent,
            entities,
            timestamp: new Date().toISOString()
        });

        // Mantener solo los últimos 10 mensajes
        if (this.conversationContext.length > 10) {
            this.conversationContext = this.conversationContext.slice(-10);
        }
    }

    async generateResponse(intent, entities, context) {
        switch (intent) {
            case 'greeting':
                return this.getRandomResponse('greeting');
            
            case 'search_business':
                return this.generateSearchResponse(entities, context);
            
            case 'business_info':
                return this.generateBusinessInfoResponse(entities, context);
            
            case 'contact':
                return this.generateContactResponse(entities, context);
            
            case 'location':
                return this.generateLocationResponse(context);
            
            case 'support':
                return this.generateSupportResponse();
            
            default:
                return this.generateFallbackResponse(entities);
        }
    }

    generateSearchResponse(entities, context) {
        if (!entities.business_type) {
            return "¿Qué tipo de negocio estás buscando? Por ejemplo: farmacia, supermercado, restaurante...";
        }

        const businessName = this.formatBusinessName(entities.business_type);
        return `Encontraré ${businessName} en ${context.localidad}. Déjame buscar la información más actualizada...`;
    }

    generateBusinessInfoResponse(entities, context) {
        if (entities.business_name) {
            return `Voy a consultar los horarios de ${entities.business_name}. ¿Te interesa saber si está abierto ahora?`;
        } else if (entities.business_type) {
            const businessName = this.formatBusinessName(entities.business_type);
            return `¿De qué ${businessName} te gustaría saber el horario?`;
        } else {
            return "¿De qué negocio específico te gustaría conocer el horario?";
        }
    }

    generateContactResponse(entities, context) {
        if (entities.business_name) {
            return `Puedo ayudarte a contactar ${entities.business_name}. ¿Prefieres llamar por teléfono o contactar por WhatsApp?`;
        } else {
            return "¿De qué negocio te gustaría obtener información de contacto?";
        }
    }

    generateLocationResponse(context) {
        if (context.location) {
            return "Perfecto, usaré tu ubicación para encontrar negocios cercanos.";
        } else {
            return "Para encontrar negocios cerca de ti, necesito acceso a tu ubicación. ¿Puedes activar la geolocalización?";
        }
    }

    generateSupportResponse() {
        return "Puedo conectarte con nuestro equipo de soporte. ¿Es un problema técnico, una sugerencia o necesitas ayuda con otra cosa?";
    }

    generateFallbackResponse(entities) {
        if (this.learningEnabled) {
            this.learnFromUnknownInput(entities);
        }
        return this.getRandomResponse('fallback');
    }

    formatBusinessName(businessType) {
        const names = {
            'barberia': 'barberías',
            'cafeteria': 'cafeterías', 
            'carniceria': 'carnicerías',
            'farmacia': 'farmacias',
            'ferreteria': 'ferreterías',
            'panaderia': 'panaderías',
            'verduleria': 'verdulerías'
        };
        return names[businessType] || businessType + 's';
    }

    getRandomResponse(type) {
        const responses = this.knowledgeBase.responses[type];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    calculateConfidence(intent, entities) {
        let confidence = 0.5; // Base confidence

        // Aumentar confianza si detectamos intent claro
        if (intent !== 'unknown') confidence += 0.2;

        // Aumentar confianza si detectamos entidades
        if (entities.business_type) confidence += 0.2;
        if (entities.business_name) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    learnFromInteraction(input, response) {
        if (!this.learningEnabled) return;

        // Aprender patrones del usuario
        this.userPatterns.interactions = this.userPatterns.interactions || [];
        this.userPatterns.interactions.push({
            input,
            response,
            timestamp: new Date().toISOString()
        });

        this.saveUserPatterns();
    }

    learnFromUnknownInput(entities) {
        // Aprender de inputs no entendidos para mejorar
        this.userPatterns.unknownInputs = this.userPatterns.unknownInputs || [];
        this.userPatterns.unknownInputs.push({
            entities,
            timestamp: new Date().toISOString()
        });
    }

    loadUserPatterns() {
        try {
            return JSON.parse(localStorage.getItem('chatbot_intelligence_patterns')) || {};
        } catch {
            return {};
        }
    }

    saveUserPatterns() {
        try {
            localStorage.setItem('chatbot_intelligence_patterns', JSON.stringify(this.userPatterns));
        } catch (error) {
            console.error('Error saving user patterns:', error);
        }
    }

    // Método para entrenar el chatbot con nuevos datos
    trainWithData(trainingData) {
        if (trainingData.categories) {
            this.knowledgeBase.categories = {
                ...this.knowledgeBase.categories,
                ...trainingData.categories
            };
        }

        if (trainingData.responses) {
            this.knowledgeBase.responses = {
                ...this.knowledgeBase.responses,
                ...trainingData.responses
            };
        }
    }

    // Obtener estadísticas de uso
    getStats() {
        return {
            totalInteractions: this.userPatterns.interactions?.length || 0,
            unknownInputs: this.userPatterns.unknownInputs?.length || 0,
            contextSize: this.conversationContext.length,
            learningEnabled: this.learningEnabled
        };
    }
}
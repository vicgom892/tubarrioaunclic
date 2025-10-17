// shared/js/chatbot/chatbot-utils.js
class ChatbotUtils {
    static formatBusinessList(businesses, category = null) {
        if (!businesses || businesses.length === 0) {
            return "No encontré negocios con esos criterios.";
        }

        let response = `🏪 **${category ? this.formatCategoryName(category) : 'Negocios'} Encontrados**\n\n`;

        businesses.slice(0, 5).forEach((business, index) => {
            const status = business.abierto ? '🟢 ABIERTO' : '🔴 CERRADO';
            response += `${index + 1}. **${business.nombre}** - ${status}\n`;
            
            if (business.direccion) {
                response += `   📍 ${business.direccion}\n`;
            }
            
            if (business.horario) {
                response += `   🕒 ${business.horario}\n`;
            }
            
            if (business.telefono) {
                response += `   📞 ${business.telefono}\n`;
            }
            
            if (business.whatsapp) {
                response += `   💬 [Contactar por WhatsApp](https://wa.me/${business.whatsapp})\n`;
            }
            
            response += '\n';
        });

        if (businesses.length > 5) {
            response += `*... y ${businesses.length - 5} más negocios disponibles.*`;
        }

        return response;
    }

    static formatCategoryName(category) {
        const categories = {
            'barberia': 'Barberías',
            'cafeteria': 'Cafeterías',
            'carniceria': 'Carnicerías', 
            'farmacia': 'Farmacias',
            'ferreteria': 'Ferreterías',
            'panaderia': 'Panaderías',
            'verduleria': 'Verdulerías',
            'comercio': 'Comercios'
        };
        
        return categories[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
    }

    static deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    static isBusinessOpen(business) {
        if (!business.horario) return true;
        
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Lógica básica de horarios (puede mejorarse)
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const todayName = dayNames[currentDay];
        
        if (business.horario.toLowerCase().includes(todayName)) {
            return true; // Simplificado para demo
        }
        
        return true; // Por defecto asumir abierto
    }

    static sortByDistance(businesses, userLocation) {
        if (!userLocation) return businesses;
        
        return businesses
            .map(business => ({
                ...business,
                distance: business.lat && business.lng ? 
                    this.calculateDistance(
                        userLocation.lat, userLocation.lng,
                        business.lat, business.lng
                    ) : Number.MAX_SAFE_INTEGER
            }))
            .sort((a, b) => a.distance - b.distance);
    }

    static filterByCategory(businesses, category) {
        if (!category) return businesses;
        
        return businesses.filter(business => 
            business.categoria === category ||
            business.rubro?.toLowerCase().includes(category) ||
            business.nombre?.toLowerCase().includes(category)
        );
    }

    static searchBusinesses(businesses, query) {
        if (!query) return businesses;
        
        const lowerQuery = query.toLowerCase();
        return businesses.filter(business => 
            business.nombre?.toLowerCase().includes(lowerQuery) ||
            business.direccion?.toLowerCase().includes(lowerQuery) ||
            business.rubro?.toLowerCase().includes(lowerQuery) ||
            business.categoria?.includes(lowerQuery)
        );
    }

    static validateBusinessData(business) {
        const required = ['nombre', 'direccion'];
        const missing = required.filter(field => !business[field]);
        
        if (missing.length > 0) {
            throw new Error(`Faltan campos requeridos: ${missing.join(', ')}`);
        }
        
        return true;
    }

    static generateBusinessSuggestions(businesses, userPreferences = {}) {
        const suggestions = [];
        
        // Sugerir basado en categorías favoritas
        if (userPreferences.favorite_categories) {
            userPreferences.favorite_categories.forEach(category => {
                const categoryBusinesses = this.filterByCategory(businesses, category);
                if (categoryBusinesses.length > 0) {
                    suggestions.push({
                        type: 'category',
                        category: category,
                        businesses: categoryBusinesses.slice(0, 3),
                        message: `¿Buscas ${this.formatCategoryName(category)}?`
                    });
                }
            });
        }
        
        // Sugerir negocios abiertos
        const openBusinesses = businesses.filter(b => this.isBusinessOpen(b));
        if (openBusinesses.length > 0) {
            suggestions.push({
                type: 'open',
                businesses: openBusinesses.slice(0, 3),
                message: 'Negocios abiertos ahora'
            });
        }
        
        return suggestions;
    }
}
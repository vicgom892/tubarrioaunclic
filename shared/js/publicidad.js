// shared/publicidad.js - VERSIÓN COMPLETA CON TODAS LAS CATEGORÍAS
class SeccionPublicidad {
    constructor() {
        this.config = {
            titulo: "Cyber Monday",
            fechaInicio: "2024-11-03",
            fechaFin: "2024-11-09",
            urlVerMas: "comunidad-de-ofertas.html"
        };
        this.categorias = [];
        this.rubrosConfig = [
            { id: 'electro-tecno', nombre: 'ELECTRO Y TECNO' },
            { id: 'salud-belleza', nombre: 'SALUD Y BELLEZA' },
            { id: 'moda-calzado', nombre: 'MODA Y CALZADO' },
            { id: 'carniceria-granja', nombre: 'CARNICERIA Y GRANJA' },
            { id: 'verduleria', nombre: 'VERDULERIA' },
            { id: 'hogar-muebles', nombre: 'HOGAR Y MUEBLES' },
            { id: 'deportes', nombre: 'DEPORTES' },
            { id: 'jugueteria', nombre: 'JUGUETERIA' },
            { id: 'libros-papeleria', nombre: 'LIBROS Y PAPELERIA' },
            { id: 'restaurantes', nombre: 'RESTAURANTES' }
        ];
        this.init();
    }

    async init() {
        await this.cargarCategorias();
        this.renderizarCategorias();
        this.agregarEventListeners();
        this.iniciarScrollers();
    }

    async cargarCategorias() {
        this.categorias = [];
        
        for (const rubro of this.rubrosConfig) {
            try {
                const datos = await this.cargarRubro(rubro.id);
                if (datos && datos.anuncios && datos.anuncios.length > 0) {
                    this.categorias.push({
                        id: rubro.id,
                        nombre: rubro.nombre,
                        imagen: "../shared/img/icon-192x192.png", // Imagen fija
                        descuento: this.obtenerDescuentoPorRubro(rubro.id),
                        descripcion: "Aplican topes y condiciones por banco y tienda.",
                        url: `comunidad-de-ofertas.html?categoria=${rubro.id}`,
                        tiendas: datos.anuncios.map(anuncio => ({
                            id: anuncio.id,
                            nombre: anuncio.titulo,
                            imagen: anuncio.imagen,
                            url: anuncio.enlace || '#'
                        }))
                    });
                }
            } catch (error) {
                console.error(`Error cargando rubro ${rubro.nombre}:`, error);
                // Si hay error, crear categoría con datos demo
                this.categorias.push(this.crearCategoriaDemo(rubro));
            }
        }

        // Si no se cargaron categorías, usar datos demo completos
        if (this.categorias.length === 0) {
            this.cargarDatosDemoCompletos();
        }
    }

    crearCategoriaDemo(rubro) {
        const datosDemo = {
            'electro-tecno': {
                descuento: "20% y hasta 18 cuotas sin interés",
                tiendas: [
                    { id: 1, nombre: "Fravega", imagen: "https://assets.mobile.playdigital.com.ar/images/ptmo/cyber_25/Electro%20y%20tecno/Fravega.jpg", url: "comunidad-de-ofertas.html?tienda=fravega" },
                    { id: 2, nombre: "On City", imagen: "https://assets.mobile.playdigital.com.ar/images/ptmo/cyber_25/Electro%20y%20tecno/OnCity.jpg", url: "comunidad-de-ofertas.html?tienda=oncity" }
                ]
            },
            'salud-belleza': {
                descuento: "20% y hasta 12 cuotas sin interés",
                tiendas: [
                    { id: 1, nombre: "Parfumerie", imagen: "https://assets.mobile.playdigital.com.ar/images/ptmo/cyber_25/Farmacias/1%20-%20Parfumerie.jpg", url: "comunidad-de-ofertas.html?tienda=parfumerie" },
                    { id: 2, nombre: "Rouge", imagen: "https://assets.mobile.playdigital.com.ar/images/ptmo/cyber_25/Farmacias/2%20-%20Rouge.jpg", url: "comunidad-de-ofertas.html?tienda=rouge" }
                ]
            },
            'moda-calzado': {
                descuento: "25% y hasta 6 cuotas sin interés",
                tiendas: [
                    { id: 1, nombre: "Zara", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=Z", url: "comunidad-de-ofertas.html?tienda=zara" },
                    { id: 2, nombre: "Nike", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=N", url: "comunidad-de-ofertas.html?tienda=nike" }
                ]
            },
            'carniceria-granja': {
                descuento: "15% de descuento",
                tiendas: [
                    { id: 1, nombre: "Carnicería Don José", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=CDJ", url: "comunidad-de-ofertas.html?tienda=donjose" },
                    { id: 2, nombre: "Granja Familiar", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=GF", url: "comunidad-de-ofertas.html?tienda=granjafamiliar" }
                ]
            },
            'verduleria': {
                descuento: "10% de descuento en compras mayores a $5000",
                tiendas: [
                    { id: 1, nombre: "Verdulería Fresca", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=VF", url: "comunidad-de-ofertas.html?tienda=verduleriafresca" },
                    { id: 2, nombre: "El Jardín Orgánico", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=EJO", url: "comunidad-de-ofertas.html?tienda=jardinorganico" }
                ]
            },
            'hogar-muebles': {
                descuento: "30% y hasta 12 cuotas sin interés",
                tiendas: [
                    { id: 1, nombre: "Muebles Plus", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=MP", url: "comunidad-de-ofertas.html?tienda=mueblesplus" },
                    { id: 2, nombre: "Hogar Center", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=HC", url: "comunidad-de-ofertas.html?tienda=hogarcenter" }
                ]
            },
            'deportes': {
                descuento: "20% en artículos deportivos",
                tiendas: [
                    { id: 1, nombre: "Deportes Total", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=DT", url: "comunidad-de-ofertas.html?tienda=deportestotal" },
                    { id: 2, nombre: "Fit Store", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=FS", url: "comunidad-de-ofertas.html?tienda=fitstore" }
                ]
            },
            'jugueteria': {
                descuento: "15% y 3 cuotas sin interés",
                tiendas: [
                    { id: 1, nombre: "Juguetelandia", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=J", url: "comunidad-de-ofertas.html?tienda=juguetelandia" },
                    { id: 2, nombre: "Toy Planet", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=TP", url: "comunidad-de-ofertas.html?tienda=toyplanet" }
                ]
            },
            'libros-papeleria': {
                descuento: "20% en libros y 15% en papelería",
                tiendas: [
                    { id: 1, nombre: "Librería Central", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=LC", url: "comunidad-de-ofertas.html?tienda=libreriacentral" },
                    { id: 2, nombre: "El Ateneo", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=EA", url: "comunidad-de-ofertas.html?tienda=ateneo" }
                ]
            },
            'restaurantes': {
                descuento: "10% en delivery y 15% en restaurante",
                tiendas: [
                    { id: 1, nombre: "La Parilla", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=LP", url: "comunidad-de-ofertas.html?tienda=laparrilla" },
                    { id: 2, nombre: "Pizzería Napoli", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=PN", url: "comunidad-de-ofertas.html?tienda=pizzeria" }
                ]
            }
        };

        const demoData = datosDemo[rubro.id] || {
            descuento: "Descuentos especiales",
            tiendas: [
                { id: 1, nombre: "Tienda Demo 1", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=T1", url: "comunidad-de-ofertas.html" },
                { id: 2, nombre: "Tienda Demo 2", imagen: "https://via.placeholder.com/60x60/333/FFD700?text=T2", url: "comunidad-de-ofertas.html" }
            ]
        };

        return {
            id: rubro.id,
            nombre: rubro.nombre,
            imagen: "../shared/img/icon-192x192.png",
            descuento: demoData.descuento,
            descripcion: "Aplican topes y condiciones por banco y tienda.",
            url: `comunidad-de-ofertas.html?categoria=${rubro.id}`,
            tiendas: demoData.tiendas
        };
    }

    async cargarRubro(rubroId) {
        const response = await fetch(`../publicidad/${rubroId}.json`);
        if (!response.ok) {
            throw new Error(`Error cargando ${rubroId}.json`);
        }
        return await response.json();
    }

    obtenerDescuentoPorRubro(rubroId) {
        const descuentos = {
            'electro-tecno': '20% y hasta 18 cuotas sin interés',
            'salud-belleza': '20% y hasta 12 cuotas sin interés',
            'moda-calzado': '25% y hasta 6 cuotas sin interés',
            'carniceria-granja': '15% de descuento',
            'verduleria': '10% de descuento en compras mayores a $5000',
            'hogar-muebles': '30% y hasta 12 cuotas sin interés',
            'deportes': '20% en artículos deportivos',
            'jugueteria': '15% y 3 cuotas sin interés',
            'libros-papeleria': '20% en libros y 15% en papelería',
            'restaurantes': '10% en delivery y 15% en restaurante'
        };
        return descuentos[rubroId] || 'Descuentos especiales';
    }

    cargarDatosDemoCompletos() {
        console.log('Cargando datos de demostración completos...');
        this.categorias = this.rubrosConfig.map(rubro => this.crearCategoriaDemo(rubro));
    }

    renderizarCategorias() {
        const container = document.getElementById('categoriasContainer');
        
        if (this.categorias.length === 0) {
            container.innerHTML = '<div class="sin-datos">No hay categorías disponibles en este momento</div>';
            return;
        }

        container.innerHTML = '';

        this.categorias.forEach(categoria => {
            const categoriaHTML = this.crearCategoriaHTML(categoria);
            container.innerHTML += categoriaHTML;
        });
    }

    crearCategoriaHTML(categoria) {
        return `
            <div class="categoria-card" data-id="${categoria.id}">
                <div class="categoria-header">
                    <img src="${categoria.imagen}" alt="${categoria.nombre}" class="categoria-imagen"
                         onerror="this.src='https://via.placeholder.com/80x80/333/FFD700?text=${categoria.nombre.charAt(0)}'">
                    <div class="categoria-info">
                        <div class="categoria-titulo">
                            ${categoria.nombre}
                            <button class="btn-saber-mas" onclick="publicidad.irACategoria('${categoria.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                                </svg>
                                Saber más
                            </button>
                        </div>
                        <div class="categoria-descuento">${categoria.descuento}</div>
                        <p class="categoria-descripcion">${categoria.descripcion}</p>
                    </div>
                </div>
                
                <div class="tiendas-container">
                    <p class="tiendas-titulo">Ingresá a las tiendas adheridas de la promo:</p>
                    <div class="carrera-tiendas" data-categoria="${categoria.id}">
                        <button class="btn-scroll prev hidden">‹</button>
                        <div class="contenedor-tiendas">
                            ${this.crearTiendasHTML(categoria.tiendas)}
                            <button class="btn-ver-mas-tiendas" onclick="publicidad.verMasTiendas('${categoria.id}')">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                <p>Ver más</p>
                            </button>
                        </div>
                        <button class="btn-scroll next">›</button>
                    </div>
                </div>
            </div>
        `;
    }

    crearTiendasHTML(tiendas) {
        if (!tiendas || tiendas.length === 0) {
            return '<p class="sin-datos">No hay tiendas disponibles</p>';
        }

        return tiendas.map(tienda => `
            <div class="tienda-card" data-tienda="${tienda.id}" onclick="publicidad.irATienda('${tienda.url}')">
                <img src="${tienda.imagen}" alt="${tienda.nombre}" class="tienda-imagen"
                     onerror="this.src='https://via.placeholder.com/60x60/333/FFD700?text=${tienda.nombre.charAt(0)}'">
                <p class="tienda-nombre">${tienda.nombre}</p>
            </div>
        `).join('');
    }

    iniciarScrollers() {
        setTimeout(() => {
            document.querySelectorAll('.carrera-tiendas').forEach(carrera => {
                this.configurarScroller(carrera);
            });
        }, 100);
    }

    configurarScroller(carrera) {
        const contenedor = carrera.querySelector('.contenedor-tiendas');
        const btnPrev = carrera.querySelector('.btn-scroll.prev');
        const btnNext = carrera.querySelector('.btn-scroll.next');

        const actualizarBotones = () => {
            const scrollLeft = contenedor.scrollLeft;
            const scrollWidth = contenedor.scrollWidth;
            const clientWidth = contenedor.clientWidth;

            btnPrev.classList.toggle('hidden', scrollLeft === 0);
            btnNext.classList.toggle('hidden', scrollLeft + clientWidth >= scrollWidth - 10);
        };

        btnPrev.addEventListener('click', () => {
            contenedor.scrollBy({ left: -200, behavior: 'smooth' });
        });

        btnNext.addEventListener('click', () => {
            contenedor.scrollBy({ left: 200, behavior: 'smooth' });
        });

        contenedor.addEventListener('scroll', actualizarBotones);
        window.addEventListener('resize', actualizarBotones);
        
        actualizarBotones();
    }

    agregarEventListeners() {
        // Botón "Ver Todas las Ofertas" - FUNCIONAL
        document.getElementById('btnVerMas').addEventListener('click', () => {
            window.location.href = this.config.urlVerMas;
        });

        // Navegación por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const carreraActiva = document.querySelector('.carrera-tiendas:hover');
                if (carreraActiva) {
                    const contenedor = carreraActiva.querySelector('.contenedor-tiendas');
                    const scrollAmount = 200;
                    contenedor.scrollBy({
                        left: e.key === 'ArrowLeft' ? -scrollAmount : scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }

    irACategoria(id) {
        const categoria = this.categorias.find(c => c.id === id);
        if (categoria && categoria.url) {
            window.location.href = categoria.url;
        }
    }

    irATienda(url) {
        if (url && url !== '#') {
            window.location.href = url;
        }
    }

    verMasTiendas(idCategoria) {
        const categoria = this.categorias.find(c => c.id === idCategoria);
        if (categoria) {
            window.location.href = categoria.url;
        }
    }

    async recargarDatos() {
        await this.cargarCategorias();
        this.renderizarCategorias();
        this.iniciarScrollers();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.publicidad = new SeccionPublicidad();
});
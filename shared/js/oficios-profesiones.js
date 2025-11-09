// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBbtXyZA6W1MZW97u0Jf0kUVYr_6PCtYpU",
    authDomain: "tubarrioaunclick-27ad0.firebaseapp.com",
    projectId: "tubarrioaunclick-27ad0",
    storageBucket: "tubarrioaunclick-27ad0.firebasestorage.app",
    messagingSenderId: "647767328178",
    appId: "1:647767328178:web:3fcc0c709b5e257b3e10ab",
    measurementId: "G-RL8K5Z31KS"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase conectado correctamente');
} catch (error) {
    console.error('❌ Error conectando Firebase:', error);
}
const db = firebase.firestore();

// Variables globales
let currentProfessionalId = '';
let selectedRating = 0;
let allProfessionals = [];

// Lista de oficios
const oficios = [
    { id: 'plomeros', name: 'Plomeros', icon: 'fas fa-wrench' },
    { id: 'electricistas', name: 'Electricistas', icon: 'fas fa-bolt' },
    { id: 'cerrajeros', name: 'Cerrajeros', icon: 'fas fa-key' },
    { id: 'albaniles', name: 'Albañiles', icon: 'fas fa-hard-hat' },
    { id: 'pintores', name: 'Pintores', icon: 'fas fa-paint-roller' },
    { id: 'mecanicos', name: 'Mecánicos', icon: 'fas fa-car' },
    { id: 'herreros', name: 'Herreros', icon: 'fas fa-hammer' },
    { id: 'jardineros', name: 'Jardineros', icon: 'fas fa-seedling' },
    { id: 'limpieza', name: 'Limpieza', icon: 'fas fa-broom' },
    { id: 'transporte', name: 'Transporte', icon: 'fas fa-truck' }
];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSections();
    initializeReviewStars();
});

// Inicializar barra de navegación
function initializeNavigation() {
    const bottomNav = document.getElementById('bottom-nav');
    
    oficios.forEach(oficio => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.innerHTML = `<i class="${oficio.icon}"></i>${oficio.name}`;
        btn.dataset.oficio = oficio.id;
        btn.onclick = () => scrollToSection(oficio.id);
        bottomNav.appendChild(btn);
    });
}

// Inicializar secciones
function initializeSections() {
    const sectionsContainer = document.getElementById('sections-container');
    
    oficios.forEach(oficio => {
        const section = document.createElement('section');
        section.id = oficio.id;
        section.innerHTML = `
            <div class="oficio-section">
                <div class="container">
                    <h2 class="text-center mb-4 section-title">${oficio.name}</h2>
                    <div class="row g-4 justify-content-center cards-container">
                        <div class="col-12 text-center loading-container">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        sectionsContainer.appendChild(section);
        loadOficio(oficio.id, oficio.name);
    });
}

// Cargar oficio específico
async function loadOficio(oficioId, oficioName) {
    const container = document.querySelector(`#${oficioId} .cards-container`);
    try {
        const response = await fetch(`oficios/${oficioId}.json`);
        if (!response.ok) throw new Error(`Archivo no encontrado: oficios/${oficioId}.json`);
        const data = await response.json();
        const profesionales = Array.isArray(data) ? data : [data];
        
        // Guardar en array global con ID único
        profesionales.forEach((prof, index) => {
            prof._id = `${oficioId}-${index}`;
            allProfessionals.push(prof);
        });
        
        renderCards(profesionales, container, oficioName, oficioId);
    } catch (error) {
        console.error('Error cargando oficio:', error);
        container.innerHTML = `<div class="col-12 text-center py-4" style="color: #ef4444;">No hay ${oficioName.toLowerCase()} disponibles.</div>`;
    }
}

// Renderizar tarjetas de profesionales
function renderCards(profesionales, container, oficioName, oficioId) {
    container.innerHTML = '';
    
    profesionales.forEach((prof, index) => {
        const professionalId = `${oficioId}-${index}`;
        const professionalRating = reviewSystem.ratings[professionalId] || { averageRating: 0, totalReviews: 0 };
        
        // Construir botones de contacto
        let contactButtons = '';
        if (prof.whatsapp) {
            contactButtons += `<a href="https://wa.me/${prof.whatsapp.replace(/\D/g, '')}" target="_blank" class="contact-btn whatsapp-btn">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>`;
        }
        if (prof.facebook) {
            contactButtons += `<a href="${prof.facebook}" target="_blank" class="contact-btn facebook-btn">
                <i class="fab fa-facebook-f"></i>
            </a>`;
        }
        if (prof.instagram) {
            contactButtons += `<a href="${prof.instagram}" target="_blank" class="contact-btn instagram-btn">
                <i class="fab fa-instagram"></i>
            </a>`;
        }
        if (prof.latitud && prof.longitud) {
            contactButtons += `<a href="https://www.google.com/maps?q=${prof.latitud},${prof.longitud}" target="_blank" class="contact-btn location-btn">
                <i class="fas fa-map-marker-alt"></i>
            </a>`;
        }
        if (prof.pagina) {
            contactButtons += `<a href="${prof.pagina}" target="_blank" class="contact-btn website-btn">
                <i class="fas fa-globe"></i>
            </a>`;
        }
        
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card h-100" onclick="openCardModal('${professionalId}')" data-professional-id="${professionalId}">
                <img src="${prof.imagen || 'https://placehold.co/400x250?text=Sin+Imagen'}" 
                     class="card-img-top" 
                     alt="${prof.nombre}">
                <div class="card-body d-flex flex-column">
                    <div class="mb-2">
                        <i class="${prof.icono || 'fas fa-user'} text-info me-2"></i>
                        <strong>${prof.rubro || oficioName}</strong>
                    </div>
                    <h5 class="card-title">${prof.nombre}</h5>
                    <!-- Sistema de Rating -->
                    <div class="professional-rating mb-2">
                        ${reviewSystem.generateStarRating(
                            professionalRating.averageRating, 
                            professionalRating.totalReviews
                        )}
                    </div>
                    <p class="card-text flex-grow-1">${prof.direccion || ''}</p>
                    <p class="text-muted small">
                        <i class="fas fa-clock me-1"></i> ${prof.horario || 'Horario no especificado'}
                    </p>
                    <div class="contact-buttons">
                        ${contactButtons}
                        <!-- Botón para agregar reseña -->
                        <button class="contact-btn review-btn" 
                                onclick="event.stopPropagation(); showReviewForm('${professionalId}', '${prof.nombre}')">
                            <i class="fas fa-star"></i> Calificar
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// Modal de tarjeta completa
function openCardModal(profId) {
    const prof = allProfessionals.find(p => p._id === profId);
    if (!prof) return;
    
    const professionalRating = reviewSystem.ratings[profId] || { averageRating: 0, totalReviews: 0 };
    const modalContent = document.getElementById('modalCardContent');
    
    // Construir botones del modal
    let modalButtons = '';
    if (prof.whatsapp) {
        modalButtons += `<a href="https://wa.me/${prof.whatsapp.replace(/\D/g, '')}" target="_blank" class="modal-contact-btn whatsapp-btn">
            <i class="fab fa-whatsapp"></i> WhatsApp
        </a>`;
    }
    if (prof.facebook) {
        modalButtons += `<a href="${prof.facebook}" target="_blank" class="modal-contact-btn facebook-btn">
            <i class="fab fa-facebook-f"></i> Facebook
        </a>`;
    }
    if (prof.instagram) {
        modalButtons += `<a href="${prof.instagram}" target="_blank" class="modal-contact-btn instagram-btn">
            <i class="fab fa-instagram"></i> Instagram
        </a>`;
    }
    if (prof.latitud && prof.longitud) {
        modalButtons += `<a href="https://www.google.com/maps?q=${prof.latitud},${prof.longitud}" target="_blank" class="modal-contact-btn location-btn">
            <i class="fas fa-map-marker-alt"></i> Ubicación
        </a>`;
    }
    if (prof.pagina) {
        modalButtons += `<a href="${prof.pagina}" target="_blank" class="modal-contact-btn website-btn">
            <i class="fas fa-globe"></i> Sitio Web
        </a>`;
    }
    
    modalButtons += `<button class="modal-contact-btn review-btn" onclick="showReviewForm('${profId}', '${prof.nombre}')">
        <i class="fas fa-star"></i> Dejar Reseña
    </button>`;
    
    modalContent.innerHTML = `
        <img src="${prof.imagen || 'https://placehold.co/400x250?text=Sin+Imagen'}" alt="${prof.nombre}">
        <h3>${prof.nombre}</h3>
        <p><strong>${prof.rubro}</strong></p>
        <!-- Rating en modal -->
        <div class="professional-rating mb-3">
            ${reviewSystem.generateStarRating(
                professionalRating.averageRating, 
                professionalRating.totalReviews
            )}
        </div>
        <p><i class="fas fa-map-marker-alt me-2"></i>${prof.direccion || 'Sin dirección'}</p>
        <p><i class="fas fa-clock me-2"></i>${prof.horario || 'Horario no especificado'}</p>
        <div class="modal-contact-buttons">
            ${modalButtons}
        </div>
        <!-- Sección de reseñas -->
        <div class="reviews-section">
            <h5>Reseñas de Clientes</h5>
            ${reviewSystem.generateReviewsHTML(profId)}
        </div>
    `;
    
    document.getElementById('cardModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCardModal() {
    document.getElementById('cardModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Mostrar formulario de reseña
function showReviewForm(professionalId, professionalName) {
    currentProfessionalId = professionalId;
    selectedRating = 0;
    
    // Cerrar modal de tarjeta si está abierto
    closeCardModal();
    
    document.getElementById('reviewProfessionalInfo').innerHTML = `
        <h6>Calificar a: <strong>${professionalName}</strong></h6>
    `;
    
    // Resetear estrellas
    document.querySelectorAll('.star-icon').forEach(star => {
        star.className = 'far fa-star star-icon';
        star.style.cursor = 'pointer';
        star.onclick = () => selectRating(parseInt(star.dataset.rating));
    });
    
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewerName').value = '';
    
    // Mostrar modal
    const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    reviewModal.show();
}

// Seleccionar rating
function selectRating(rating) {
    selectedRating = rating;
    document.querySelectorAll('.star-icon').forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star star-icon text-warning';
        } else {
            star.className = 'far fa-star star-icon';
        }
    });
}

// Enviar reseña
async function submitReview() {
    if (selectedRating === 0) {
        alert('Por favor selecciona una calificación');
        return;
    }
    
    const comment = document.getElementById('reviewComment').value;
    const userName = document.getElementById('reviewerName').value || 'Anónimo';
    
    const result = await reviewSystem.addReview(
        currentProfessionalId,
        selectedRating,
        comment,
        userName
    );
    
    if (result.success) {
        alert(result.message);
        const reviewModal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        reviewModal.hide();
    } else {
        alert('Error: ' + result.message);
    }
    
    // Recargar modal de tarjeta si estaba abierto
    openCardModal(currentProfessionalId);
}

// Inicializar estrellas del modal de reseñas
function initializeReviewStars() {
    document.querySelectorAll('.star-icon').forEach(star => {
        star.onclick = () => selectRating(parseInt(star.dataset.rating));
    });
}

// Navegación por secciones
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 100,
            behavior: 'smooth'
        });
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[data-oficio="${id}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

// Scroll tracking para navegación
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            let current = '';
            oficios.forEach(oficio => {
                const section = document.getElementById(oficio.id);
                const sectionTop = section.offsetTop - 150;
                const sectionBottom = sectionTop + section.offsetHeight;
                if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                    current = oficio.id;
                }
            });
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.oficio === current);
            });
            ticking = false;
        });
        ticking = true;
    }
});

// Función para saltar splash screen
function skipSplash() {
    document.getElementById('splash-screen').classList.add('fade-out');
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
    }, 800);
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCardModal();
});
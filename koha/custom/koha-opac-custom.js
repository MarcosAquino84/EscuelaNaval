/*
 * ================================================
 * KOHA OPAC - HEADERS Y FOOTERS INSTITUCIONALES
 * Catálogo Público - Heroica Escuela Naval Militar
 * ================================================
 */

(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInstitucionalHeaders);
    } else {
        initInstitucionalHeaders();
    }

    function initInstitucionalHeaders() {
        // Inyectar Google Fonts (Montserrat)
        injectGoogleFonts();

        // Crear e inyectar headers institucionales
        createTopBar();
        createSuperHeader();
        createSubHeader();

        // Crear e inyectar footer institucional
        createFooter();

        // Mejoras adicionales
        enhanceSearchBox();
        enhanceBookCovers();
        addAccessibilityFeatures();

        console.log('✅ Headers y Footer institucionales HENM cargados en OPAC');
    }

    /**
     * Inyectar Google Fonts
     */
    function injectGoogleFonts() {
        if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Montserrat"]')) {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }

    /**
     * Crear barra tricolor superior
     */
    function createTopBar() {
        const topBar = document.createElement('div');
        topBar.id = 'opac-top-bar';
        document.body.insertBefore(topBar, document.body.firstChild);
    }

    /**
     * Crear Super Header (Gobierno de México)
     */
    function createSuperHeader() {
        const superHeader = document.createElement('div');
        superHeader.id = 'opac-super-header';
        superHeader.innerHTML = '<img src="/SuperHeader.png" alt="Gobierno de México" onerror="this.style.display=\'none\'">';

        document.body.insertBefore(superHeader, document.body.children[1]);
    }

    /**
     * Crear Sub Header (Colegio Naval)
     */
    function createSubHeader() {
        const subHeader = document.createElement('div');
        subHeader.id = 'opac-sub-header';
        subHeader.innerHTML = '<img src="/HeaderColegioNaval.png" alt="Universidad Naval - HENM" onerror="this.style.display=\'none\'">';

        document.body.insertBefore(subHeader, document.body.children[2]);
    }

    /**
     * Crear Footer Institucional
     */
    function createFooter() {
        const footer = document.createElement('footer');
        footer.id = 'opac-footer';
        footer.innerHTML = '<img src="/Footer.png" alt="Footer Institucional" onerror="this.style.display=\'none\'">';

        // Agregar el footer al final del body
        document.body.appendChild(footer);
    }

    /**
     * Mejorar caja de búsqueda
     */
    function enhanceSearchBox() {
        const searchBox = document.querySelector('#translControl1');
        if (searchBox) {
            searchBox.placeholder = '🔍 Buscar libros, artículos, recursos...';
            searchBox.setAttribute('aria-label', 'Buscar en el catálogo');
        }

        // Agregar foco automático a la búsqueda
        const mainSearch = document.querySelector('#q, input[name="q"]');
        if (mainSearch && window.location.pathname === '/') {
            mainSearch.focus();
        }
    }

    /**
     * Mejorar portadas de libros
     */
    function enhanceBookCovers() {
        const bookCovers = document.querySelectorAll('.bookcover, .cover-image, img[alt*="Cover"]');
        bookCovers.forEach(function(cover) {
            cover.classList.add('animated-entry');
            cover.style.cursor = 'pointer';

            // Agregar efecto hover
            cover.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'all 0.3s ease';
            });

            cover.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Agregar características de accesibilidad
     */
    function addAccessibilityFeatures() {
        // Agregar skip to content link
        const skipLink = document.createElement('a');
        skipLink.href = '#maincontent';
        skipLink.className = 'skip-to-content';
        skipLink.textContent = 'Saltar al contenido principal';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Mejorar contraste de enlaces
        const links = document.querySelectorAll('a');
        links.forEach(function(link) {
            link.style.textDecoration = 'none';
            link.addEventListener('focus', function() {
                this.style.outline = '3px solid #D4AF37';
                this.style.outlineOffset = '2px';
            });
        });
    }

})();

/*
 * ================================================
 * MEJORAS ADICIONALES
 * ================================================
 */

// Agregar clase institucional al body
document.body.classList.add('opac-henm-institucional');

// Mejorar títulos de resultados
window.addEventListener('load', function() {
    const resultTitles = document.querySelectorAll('.title, .results-title');
    resultTitles.forEach(function(title) {
        title.classList.add('animated-entry');
    });
});

// Mejorar mensajes de disponibilidad
window.addEventListener('load', function() {
    const availableItems = document.querySelectorAll('.available');
    availableItems.forEach(function(item) {
        item.innerHTML = '✅ ' + item.textContent;
    });

    const unavailableItems = document.querySelectorAll('.unavailable');
    unavailableItems.forEach(function(item) {
        item.innerHTML = '❌ ' + item.textContent;
    });
});

// Mejorar botones
window.addEventListener('load', function() {
    const buttons = document.querySelectorAll('.btn, button');
    buttons.forEach(function(btn) {
        btn.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
});

// Mejorar tablas de resultados
window.addEventListener('load', function() {
    const tables = document.querySelectorAll('table');
    tables.forEach(function(table) {
        table.classList.add('table', 'table-striped', 'table-hover');
    });
});

// Agregar animación de carga
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(function() {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// Agregar mensaje de bienvenida personalizado
window.addEventListener('load', function() {
    const mainContent = document.querySelector('#wrapper, #maincontent');
    if (mainContent && window.location.pathname === '/') {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'alert alert-info animated-entry';
        welcomeMsg.style.marginBottom = '20px';
        welcomeMsg.innerHTML = `
            <strong>🎓 Bienvenido al Catálogo de la Biblioteca Digital HENM</strong>
            <p style="margin-bottom: 0; margin-top: 10px;">
                Heroica Escuela Naval Militar - Sistema de gestión bibliotecaria
            </p>
        `;

        const firstChild = mainContent.firstElementChild;
        if (firstChild) {
            mainContent.insertBefore(welcomeMsg, firstChild);
        }
    }
});

// Mejorar navegación con teclado
document.addEventListener('keydown', function(e) {
    // Alt + S = Focus en búsqueda
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchBox = document.querySelector('#q, input[name="q"]');
        if (searchBox) {
            searchBox.focus();
        }
    }

    // Alt + H = Ir al inicio
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '/';
    }
});

// Console log con estilo
console.log(
    '%c🎓 Biblioteca Digital HENM',
    'color: #9D2449; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'
);
console.log(
    '%cHeroica Escuela Naval Militar',
    'color: #2E7D32; font-size: 14px; font-weight: 600;'
);
console.log(
    '%cSistema de catálogo público con diseño institucional',
    'color: #666; font-size: 12px;'
);

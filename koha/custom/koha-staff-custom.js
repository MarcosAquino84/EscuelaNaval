/*
 * ================================================
 * KOHA STAFF - HEADERS Y FOOTERS INSTITUCIONALES
 * Heroica Escuela Naval Militar
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

        console.log('✅ Headers y Footer institucionales HENM cargados');
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
        topBar.id = 'koha-top-bar';
        document.body.insertBefore(topBar, document.body.firstChild);
    }

    /**
     * Crear Super Header (Gobierno de México)
     */
    function createSuperHeader() {
        const superHeader = document.createElement('div');
        superHeader.id = 'koha-super-header';
        superHeader.innerHTML = '<img src="/SuperHeader.png" alt="Gobierno de México" onerror="this.style.display=\'none\'">';

        document.body.insertBefore(superHeader, document.body.children[1]);
    }

    /**
     * Crear Sub Header (Colegio Naval)
     */
    function createSubHeader() {
        const subHeader = document.createElement('div');
        subHeader.id = 'koha-sub-header';
        subHeader.innerHTML = '<img src="/HeaderColegioNaval.png" alt="Universidad Naval - HENM" onerror="this.style.display=\'none\'">';

        document.body.insertBefore(subHeader, document.body.children[2]);
    }

    /**
     * Crear Footer Institucional
     */
    function createFooter() {
        // Buscar el footer existente de Koha o crear uno nuevo
        let mainContent = document.querySelector('#doc3') || document.querySelector('body');

        const footer = document.createElement('footer');
        footer.id = 'koha-footer';
        footer.innerHTML = '<img src="/Footer.png" alt="Footer Institucional" onerror="this.style.display=\'none\'">';

        // Agregar el footer al final del body
        document.body.appendChild(footer);
    }

})();

/*
 * ================================================
 * MEJORAS ADICIONALES
 * ================================================
 */

// Agregar clase institucional al body
document.body.classList.add('koha-henm-institucional');

// Personalizar el logo de Koha si existe
window.addEventListener('load', function() {
    const kohaLogo = document.querySelector('.navbar-brand img');
    if (kohaLogo) {
        kohaLogo.style.maxHeight = '40px';
        kohaLogo.style.border = '2px solid #D4AF37';
        kohaLogo.style.borderRadius = '4px';
        kohaLogo.style.padding = '2px';
    }
});

// Mejorar el contraste de mensajes importantes
window.addEventListener('load', function() {
    const messages = document.querySelectorAll('.dialog');
    messages.forEach(function(msg) {
        msg.style.fontWeight = '500';
        msg.style.borderLeft = '4px solid #D4AF37';
    });
});

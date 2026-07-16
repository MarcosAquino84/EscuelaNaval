// Crea en DSpace los mismos usuarios del panel (mismo email y contraseña)
// usando el API REST. Se ejecuta DENTRO del contenedor auth-service:
//   docker cp datos-ejemplo/dspace-usuarios-ejemplo.js auth-service:/tmp/
//   docker exec -e NODE_PATH=/app/node_modules auth-service node /tmp/dspace-usuarios-ejemplo.js
const axios = require('axios');

const API = process.env.DSPACE_API_URL || 'http://dspace:8080/server/api';
const ADMIN_EMAIL = 'admin@biblioteca.local';
const ADMIN_PASS = 'admin123';

// [email, nombre, apellido, password]
const usuarios = [
    ['marcos@biblioteca.local',      'Marcos',   'Administrador', 'marcos123'],
    ['maria.garcia@estudiante.local','María',    'García',        'estudiante123'],
    ['alumno@biblioteca.local',      'Juan',     'Pérez',         'alumno123'],
    ['psic.ramirez@henm.edu.mx',     'Laura',    'Ramírez',       'orientador123'],
    ['psic.martinez@henm.edu.mx',    'Carlos',   'Martínez',      'orientador123'],
    ['psic.lopez@henm.edu.mx',       'Ana',      'López',         'orientador123'],
    ['cadete.perez@henm.edu.mx',     'Luis',     'Pérez',         'Cadete123'],
    ['cadete.gomez@henm.edu.mx',     'Ana',      'Gómez',         'Cadete123'],
    ['cadete.torres@henm.edu.mx',    'María',    'Torres',        'Cadete123'],
    ['soldado.ramos@henm.edu.mx',    'Pedro',    'Ramos',         'Soldado123'],
    ['soldado.diaz@henm.edu.mx',     'Lucía',    'Díaz',          'Soldado123'],
    ['cabo.mendoza@henm.edu.mx',     'Jorge',    'Mendoza',       'Cabo1234'],
    ['cabo.silva@henm.edu.mx',       'Carmen',   'Silva',         'Cabo1234'],
    ['teniente.vargas@henm.edu.mx',  'Roberto',  'Vargas',        'Teniente123'],
    ['coronel.herrera@henm.edu.mx',  'Fernando', 'Herrera',       'Coronel123'],
];

(async () => {
    // 1. Token CSRF inicial
    const status = await axios.get(`${API}/authn/status`);
    let csrf = status.headers['dspace-xsrf-token'];
    let cookie = (status.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

    // 2. Login como admin
    const login = await axios.post(`${API}/authn/login`,
        new URLSearchParams({ user: ADMIN_EMAIL, password: ADMIN_PASS }),
        { headers: { 'X-XSRF-TOKEN': csrf, 'Cookie': cookie } });
    const bearer = login.headers['authorization'];
    // El token CSRF rota en el login: el header X-XSRF-TOKEN debe coincidir
    // con el valor de la cookie DSPACE-XSRF-COOKIE más reciente
    const nuevasCookies = (login.headers['set-cookie'] || []).map(c => c.split(';')[0]);
    if (nuevasCookies.length) cookie = nuevasCookies.join('; ');
    const xsrfCookie = nuevasCookies.find(c => c.startsWith('DSPACE-XSRF-COOKIE='));
    if (xsrfCookie) csrf = xsrfCookie.split('=')[1];
    else if (login.headers['dspace-xsrf-token']) csrf = login.headers['dspace-xsrf-token'];
    console.log('Login admin DSpace: OK');

    // Actualiza csrf/cookie desde cualquier respuesta que los traiga
    const refrescar = (headers) => {
        if (!headers) return;
        if (headers['dspace-xsrf-token']) csrf = headers['dspace-xsrf-token'];
        const sc = (headers['set-cookie'] || []).map(c => c.split(';')[0]);
        if (sc.length) {
            const mapa = Object.fromEntries(cookie.split('; ').filter(Boolean).map(p => p.split('=')));
            for (const c of sc) { const [k, v] = c.split('='); mapa[k] = v; }
            cookie = Object.entries(mapa).map(([k, v]) => `${k}=${v}`).join('; ');
        }
    };

    // 3. Crear cada usuario (reintenta una vez si el token CSRF rotó)
    for (const [email, nombre, apellido, password] of usuarios) {
        const cuerpo = {
            email, password,
            canLogIn: true,
            requireCertificate: false,
            metadata: {
                'eperson.firstname': [{ value: nombre }],
                'eperson.lastname': [{ value: apellido }]
            }
        };
        let creado = false;
        for (let intento = 1; intento <= 2 && !creado; intento++) {
            try {
                const r = await axios.post(`${API}/eperson/epersons`, cuerpo,
                    { headers: { 'Authorization': bearer, 'X-XSRF-TOKEN': csrf, 'Cookie': cookie, 'Content-Type': 'application/json' } });
                refrescar(r.headers);
                console.log(`${email}: creado`);
                creado = true;
            } catch (e) {
                const st = e.response?.status;
                refrescar(e.response?.headers);
                if (st === 422 || st === 409) { console.log(`${email}: ya existía`); creado = true; }
                else if (st === 403 && intento === 1) { /* token rotado: reintentar */ }
                else console.log(`${email}: ERROR ${st} ${JSON.stringify(e.response?.data)?.substring(0, 100)}`);
            }
        }
    }
    console.log('Listo.');
})().catch(e => { console.error('FALLO:', e.response?.status, e.message); process.exit(1); });

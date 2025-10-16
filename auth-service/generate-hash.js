/**
 * Script para generar hashes bcrypt de contraseñas
 * Uso: node generate-hash.js
 */

const bcrypt = require('bcryptjs');

// Contraseñas de prueba
const passwords = {
    admin: 'admin123',
    marcos: 'marcos123',
    estudiante: 'estudiante123',
    alumno: 'alumno123',
    orientador: 'orientador123'
};

async function generateHashes() {
    console.log('Generando hashes bcrypt...\n');

    for (const [user, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`${user}:`);
        console.log(`  Password: ${password}`);
        console.log(`  Hash: ${hash}`);
        console.log('');
    }
}

generateHashes().catch(console.error);

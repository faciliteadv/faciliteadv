const { Client } = require('pg');

// Tentativa com host direto do banco (sem pooler) e usuário postgres padrão
const connectionString = 'postgres://postgres:FaciliteAdv_2026_Secure@db.smjzkohukeopazajfxtb.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
    // ssl: { rejectUnauthorized: false } // Supabase direct precisa de SSL geralmente, mas as vezes simples funciona
});

async function test() {
    console.log('Testing DIRECT connection...');
    console.log('URL:', connectionString.replace(/:[^:@]+@/, ':****@'));

    try {
        console.log('Connecting...');
        await client.connect();
        console.log('CONNECTED! Database is UP.');
        const res = await client.query('SELECT version()');
        console.log('Version:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection Failed:', err.message);
        // Se der erro de DNS, o projeto pode não existir ou ID errado
        // Se der erro de senha, a senha não é essa para o user postgres
    }
}

test();

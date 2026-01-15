const { Client } = require('pg');

// Tentativa com POOLER usando sintaxe correta do Supavisor: user.project_id
const connectionString = 'postgres://postgres.smjzkohukeopazajfxtb:FaciliteAdv_2026_Secure@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    console.log('Testing POOLER connection...');
    console.log('URL:', connectionString.replace(/:[^:@]+@/, ':****@'));

    try {
        console.log('Connecting...');
        await client.connect();
        console.log('CONNECTED via Pooler!');
        const res = await client.query('SELECT version()');
        console.log('Version:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection Failed:', err.message);
    }
}

test();

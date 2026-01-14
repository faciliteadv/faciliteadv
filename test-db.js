const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://facilite_app.smjzkohukeopazajfxtb:FaciliteAdv_2026_Secure@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected! Verifying user...');
        const res = await client.query('SELECT current_user, current_database()');
        console.log('Result:', res.rows[0]);
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('Connection Failed:', err);
        process.exit(1);
    }
}

test();

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Check for required environment variable
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERROR: Database connection string not found.');
    console.error('Please ensure DIRECT_URL or DATABASE_URL is set in .env.local');
    process.exit(1);
}

// Using environment variable for database connection
const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function verifyTables() {
    try {
        console.log('Connecting to verify tables...');
        await client.connect();

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

        console.log('Tables found in database:');
        res.rows.forEach(row => console.log(' - ' + row.table_name));

        // Check for critical tables
        const expected = ['Client', 'Process', 'TaskCard'];
        const found = res.rows.map(r => r.table_name);
        const missing = expected.filter(t => !found.includes(t));

        if (missing.length > 0) {
            console.error('MISSING TABLES:', missing);
            process.exit(1);
        } else {
            console.log('SUCCESS: All core tables exist.');
            process.exit(0);
        }

        await client.end();
    } catch (err) {
        console.error('Verification Failed:', err);
        process.exit(1);
    }
}

verifyTables();

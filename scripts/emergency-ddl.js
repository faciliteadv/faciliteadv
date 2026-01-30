const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function getEnv(key) {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
            const parts = line.split('=');
            if (parts[0].trim() === key) {
                let val = parts.slice(1).join('=').trim();
                // Remove quotes if present
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                return val;
            }
        }
    }
    return process.env[key];
}

async function main() {
    const connectionString = getEnv('DATABASE_URL');
    if (!connectionString) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    console.log('Connecting to database...');
    // Use SSL
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected!');

        console.log('Adding columnId...');
        await client.query('ALTER TABLE "TaskCard" ADD COLUMN IF NOT EXISTS "columnId" text;');

        console.log('Adding FK constraint...');
        // Simple check might fail in transaction block if mixed, but let's try direct ALTER
        try {
            await client.query('ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "KanbanColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('Constraint already exists.');
            } else {
                throw e;
            }
        }

        console.log('Adding Index...');
        await client.query('CREATE INDEX IF NOT EXISTS "TaskCard_columnId_idx" ON "TaskCard"("columnId");');

        console.log('DDL Applied Successfully!');
    } catch (err) {
        console.error('Error applying DDL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();

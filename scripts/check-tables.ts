import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function checkTables() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const sql = neon(connectionString);

    try {
        // Check if users table exists
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

        console.log('Tables in database:');
        console.table(tables);

        // Check users table structure if it exists
        const usersTable = tables.find(t => t.table_name === 'users');
        if (usersTable) {
            console.log('\nUsers table structure:');
            const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users';
      `;
            console.table(columns);
        } else {
            console.log('\nUsers table does not exist in the database');
        }

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        process.exit(0);
    }
}

checkTables();

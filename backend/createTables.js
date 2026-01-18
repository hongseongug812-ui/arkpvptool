// Create tables in RDS
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: 'ark-pvp-db.c14ksw2i8qaf.ap-northeast-2.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'arkadmin',
    password: 'g86jjVEr9S3HQmp',
    ssl: { rejectUnauthorized: false }
});

const schema = `
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    item_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS hatching_timers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    dino_type VARCHAR(50) NOT NULL,
    nickname VARCHAR(100),
    start_time BIGINT NOT NULL,
    end_time BIGINT NOT NULL,
    server_rate INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_configs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    config_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function createTables() {
    try {
        console.log('Connecting to RDS...');
        await pool.query(schema);
        console.log('✅ Tables created successfully!');

        // Verify tables
        const result = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', result.rows.map(r => r.table_name));
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createTables();

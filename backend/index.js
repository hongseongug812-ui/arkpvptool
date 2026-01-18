// ARK PVP Tool - Lambda Backend
import pg from 'pg';
const { Pool } = pg;

// Database connection pool
const pool = new Pool({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
};

// Response helper
const response = (statusCode, body) => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
});

// Get user ID from token (simplified - in production use JWT verification)
const getUserId = (event) => {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader) return null;
    // For Function URL with Cognito, we'd verify JWT here
    // For now, return a test user ID
    return 'test-user-123';
};

// Parse path and method from Function URL event
const parseRequest = (event) => {
    // Function URL format
    const path = event.rawPath || event.requestContext?.http?.path || '/';
    const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
    return { path, method };
};

// API Routes
const routes = {
    // Health check / root
    'GET /': async () => {
        return response(200, { status: 'ok', message: 'ARK PVP API is running' });
    },

    // Get user favorites
    'GET /favorites': async (event) => {
        const userId = getUserId(event);
        if (!userId) return response(401, { error: 'Unauthorized' });

        const result = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1',
            [userId]
        );
        return response(200, result.rows);
    },

    // Add favorite
    'POST /favorites': async (event) => {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) return response(401, { error: 'Unauthorized' });

        const { item_type, item_id, item_data } = JSON.parse(event.body);
        const result = await pool.query(
            'INSERT INTO favorites (user_id, item_type, item_id, item_data) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, item_type, item_id, item_data]
        );
        return response(201, result.rows[0]);
    },

    // Delete favorite
    'DELETE /favorites/{id}': async (event) => {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        const id = event.pathParameters?.id;
        if (!userId) return response(401, { error: 'Unauthorized' });

        await pool.query(
            'DELETE FROM favorites WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        return response(204, null);
    },

    // Get hatching timers
    'GET /timers': async (event) => {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) return response(401, { error: 'Unauthorized' });

        const result = await pool.query(
            'SELECT * FROM hatching_timers WHERE user_id = $1',
            [userId]
        );
        return response(200, result.rows);
    },

    // Add timer
    'POST /timers': async (event) => {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) return response(401, { error: 'Unauthorized' });

        const { dino_type, nickname, start_time, end_time, server_rate } = JSON.parse(event.body);
        const result = await pool.query(
            'INSERT INTO hatching_timers (user_id, dino_type, nickname, start_time, end_time, server_rate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, dino_type, nickname, start_time, end_time, server_rate]
        );
        return response(201, result.rows[0]);
    },

    // Sync all user data (for multi-device sync)
    'GET /sync': async (event) => {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) return response(401, { error: 'Unauthorized' });

        const [favorites, timers] = await Promise.all([
            pool.query('SELECT * FROM favorites WHERE user_id = $1', [userId]),
            pool.query('SELECT * FROM hatching_timers WHERE user_id = $1', [userId])
        ]);

        return response(200, {
            favorites: favorites.rows,
            timers: timers.rows,
            synced_at: new Date().toISOString()
        });
    },

    // Bulk sync (upload local data)
    'POST /sync': async (event) => {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) return response(401, { error: 'Unauthorized' });

        const { favorites, timers } = JSON.parse(event.body);

        // Upsert favorites
        if (favorites?.length) {
            for (const fav of favorites) {
                await pool.query(
                    `INSERT INTO favorites (user_id, item_type, item_id, item_data) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET item_data = $4`,
                    [userId, fav.item_type, fav.item_id, fav.item_data]
                );
            }
        }

        return response(200, { synced: true, timestamp: new Date().toISOString() });
    }
};

// Lambda handler
export const handler = async (event) => {
    // Parse request from Function URL format
    const { path, method } = parseRequest(event);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return response(200, {});
    }

    try {
        const routeKey = `${method} ${path}`;
        const routeHandler = routes[routeKey];

        if (!routeHandler) {
            return response(404, { error: 'Not Found', route: routeKey });
        }

        return await routeHandler(event);
    } catch (error) {
        console.error('Error:', error);
        return response(500, { error: 'Internal Server Error', message: error.message });
    }
};

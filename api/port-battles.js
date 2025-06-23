// Port Battles API - CRUD operations for port battles using PostgreSQL
const { Database } = require('../lib/database');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            // Create new port battle
            const pbData = req.body;
            
            console.log('Creating new port battle:', pbData.port);
            
            // Map form data to database columns
            const query = `
                INSERT INTO port_battles (
                    id, port, battle_type, br_limit, meeting_time, pb_time,
                    meeting_location, max_signups, access_code, admin_code,
                    allowed_rates, allowed_ships, screening_fleets
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;
            
            const values = [
                pbData.pbId,
                pbData.port,
                pbData.battleType,
                parseInt(pbData.brLimit),
                pbData.meetingTime,
                pbData.pbTime,
                pbData.meetingLocation,
                parseInt(pbData.maxSignups) || 70,
                pbData.accessCode,
                pbData.adminCode,
                pbData.allowedRates || [],
                pbData.allowedShips || [],
                pbData.screeningFleets || []
            ];

            const result = await Database.query(query, values);

            console.log('Port battle created successfully:', result.rows[0].id);
            
            res.status(200).json({ 
                success: true, 
                port_battle: result.rows[0],
                message: 'Port battle created successfully' 
            });

        } else if (req.method === 'GET') {
            // Get port battles
            const { id, access_code } = req.query;
            
            let query = 'SELECT * FROM port_battles';
            let values = [];
            
            if (id) {
                query += ' WHERE id = $1';
                values = [id];
            } else if (access_code) {
                query += ' WHERE access_code = $1';
                values = [access_code];
            }
            
            query += ' ORDER BY pb_time ASC';

            const result = await Database.query(query, values);

            res.status(200).json({ 
                success: true, 
                port_battles: result.rows,
                count: result.rows.length 
            });

        } else if (req.method === 'PUT') {
            // Update port battle
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'Port battle ID is required' });
            }
            
            const setClause = [];
            const values = [];
            let paramCount = 1;
            
            // Build dynamic update query
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // Convert camelCase to snake_case
                    setClause.push(`${dbKey} = $${paramCount}`);
                    values.push(updateData[key]);
                    paramCount++;
                }
            });
            
            values.push(new Date().toISOString()); // updated_at
            setClause.push(`updated_at = $${paramCount}`);
            paramCount++;
            
            values.push(id); // WHERE condition
            
            const query = `
                UPDATE port_battles 
                SET ${setClause.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await Database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Port battle not found' });
            }

            res.status(200).json({ 
                success: true, 
                port_battle: result.rows[0],
                message: 'Port battle updated successfully' 
            });

        } else if (req.method === 'DELETE') {
            // Delete port battle
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'Port battle ID is required' });
            }
            
            const query = 'DELETE FROM port_battles WHERE id = $1';
            const result = await Database.query(query, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Port battle not found' });
            }

            res.status(200).json({ 
                success: true,
                message: 'Port battle deleted successfully' 
            });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: err.message 
        });
    }
};

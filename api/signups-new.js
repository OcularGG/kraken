// PB Signups API - Handle port battle signups using PostgreSQL
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
            // Create new signup
            const signupData = req.body;
            
            console.log('Creating PB signup:', signupData.captainName, 'for PB:', signupData.pbId);
            
            // Check if port battle exists
            const pbQuery = 'SELECT * FROM port_battles WHERE id = $1';
            const pbResult = await Database.query(pbQuery, [signupData.pbId]);

            if (pbResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Port battle not found' 
                });
            }

            // Check if captain already signed up
            const existingQuery = `
                SELECT * FROM pb_signups 
                WHERE pb_id = $1 AND captain_name = $2
            `;
            const existingResult = await Database.query(existingQuery, [
                signupData.pbId, 
                signupData.captainName
            ]);

            if (existingResult.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'Captain already signed up for this port battle' 
                });
            }

            // Insert new signup
            const insertQuery = `
                INSERT INTO pb_signups (
                    pb_id, captain_name, ship_name, ship_rate, 
                    fleet_assignment, status, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const values = [
                signupData.pbId,
                signupData.captainName,
                signupData.shipName,
                signupData.shipRate,
                signupData.fleetAssignment || null,
                'pending',
                signupData.notes || null
            ];

            const result = await Database.query(insertQuery, values);

            console.log('PB signup created successfully:', result.rows[0].id);
            
            res.status(200).json({ 
                success: true, 
                signup: result.rows[0],
                message: 'Signup created successfully' 
            });

        } else if (req.method === 'GET') {
            // Get signups for a specific port battle or all signups
            const { pb_id, captain_name } = req.query;
            
            let query = `
                SELECT s.*, p.port, p.pb_time, p.access_code
                FROM pb_signups s
                INNER JOIN port_battles p ON s.pb_id = p.id
            `;
            let values = [];
            let conditions = [];
            
            if (pb_id) {
                conditions.push('s.pb_id = $' + (values.length + 1));
                values.push(pb_id);
            }
            
            if (captain_name) {
                conditions.push('s.captain_name = $' + (values.length + 1));
                values.push(captain_name);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY s.signup_time DESC';

            const result = await Database.query(query, values);

            res.status(200).json({ 
                success: true, 
                signups: result.rows,
                count: result.rows.length 
            });

        } else if (req.method === 'PUT') {
            // Update signup status
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'Signup ID is required' });
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
            
            values.push(id); // WHERE condition
            
            const query = `
                UPDATE pb_signups 
                SET ${setClause.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await Database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Signup not found' });
            }

            res.status(200).json({ 
                success: true, 
                signup: result.rows[0],
                message: 'Signup updated successfully' 
            });

        } else if (req.method === 'DELETE') {
            // Delete signup
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'Signup ID is required' });
            }
            
            const query = 'DELETE FROM pb_signups WHERE id = $1';
            const result = await Database.query(query, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Signup not found' });
            }

            res.status(200).json({ 
                success: true,
                message: 'Signup deleted successfully' 
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

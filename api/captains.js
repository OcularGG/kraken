// Captains API - Handle captain code system using PostgreSQL
const { Database } = require('../lib/database');

// Generate random captain code
function generateCaptainCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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
            const { action, data } = req.body;

            switch (action) {
                case 'register':
                    // Register new captain
                    const { captainName, discordUsername, applicationId } = data;
                    
                    console.log('Registering new captain:', captainName);
                    
                    // Check if captain already exists
                    const existingQuery = `
                        SELECT * FROM captains 
                        WHERE username = $1 AND is_active = true
                    `;
                    const existingResult = await Database.query(existingQuery, [captainName]);

                    if (existingResult.rows.length > 0) {
                        return res.status(409).json({ 
                            error: 'Captain name already registered',
                            captainCode: existingResult.rows[0].code
                        });
                    }

                    // Generate unique captain code
                    let captainCode;
                    let isUnique = false;
                    let attempts = 0;

                    while (!isUnique && attempts < 10) {
                        captainCode = generateCaptainCode();
                        
                        const codeQuery = 'SELECT code FROM captains WHERE code = $1';
                        const codeResult = await Database.query(codeQuery, [captainCode]);
                        
                        if (codeResult.rows.length === 0) {
                            isUnique = true;
                        }
                        attempts++;
                    }

                    if (!isUnique) {
                        return res.status(500).json({ error: 'Unable to generate unique captain code' });
                    }

                    // Insert new captain
                    const insertQuery = `
                        INSERT INTO captains (
                            code, username, discord_username, application_id, 
                            pb_admin, gallery_admin, is_active
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                    `;                    
                    const insertValues = [
                        captainCode,
                        captainName,
                        discordUsername || null,
                        applicationId || null,
                        false,
                        false,
                        true
                    ];

                    const result = await Database.query(insertQuery, insertValues);

                    console.log('Captain registered successfully:', result.rows[0].code);
                    
                    return res.status(200).json({
                        success: true,
                        captainCode: result.rows[0].code,
                        captain: result.rows[0],
                        message: 'Captain registered successfully'
                    });

                case 'verify':
                    // Verify captain code
                    const { captainCode: verifyCode } = data;
                    
                    if (!verifyCode || verifyCode.length !== 8) {
                        return res.status(400).json({ error: 'Invalid captain code format' });
                    }

                    const verifyQuery = `
                        SELECT * FROM captains 
                        WHERE code = $1 AND is_active = true
                    `;
                    const verifyResult = await Database.query(verifyQuery, [verifyCode.toUpperCase()]);

                    if (verifyResult.rows.length === 0) {
                        return res.status(404).json({ 
                            error: 'Captain code not found or inactive' 
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        captain: verifyResult.rows[0],
                        message: 'Captain code verified'
                    });

                case 'admin_list':
                    // Admin: Get all captains
                    const { password } = data;
                    
                    if (password !== 'UnionJack123') {
                        return res.status(401).json({ error: 'Unauthorized' });
                    }

                    const listQuery = `
                        SELECT * FROM captains 
                        ORDER BY created_at DESC
                    `;
                    const listResult = await Database.query(listQuery);

                    return res.status(200).json({
                        success: true,
                        captains: listResult.rows
                    });

                case 'admin_update':
                    // Admin: Update captain permissions or info
                    const { password: adminPassword, captainId, updates } = data;
                    
                    if (adminPassword !== 'UnionJack123') {
                        return res.status(401).json({ error: 'Unauthorized' });
                    }                    const setClause = [];
                    const updateValues = [];
                    let paramCount = 1;
                      // Build dynamic update query
                    Object.keys(updates).forEach(key => {
                        if (updates[key] !== undefined) {
                            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // Convert camelCase to snake_case
                            setClause.push(`${dbKey} = $${paramCount}`);
                            updateValues.push(updates[key]);
                            paramCount++;
                        }
                    });
                    
                    updateValues.push(new Date().toISOString()); // updated_at
                    setClause.push(`updated_at = $${paramCount}`);
                    paramCount++;
                    
                    updateValues.push(captainId); // WHERE condition
                    
                    const updateQuery = `
                        UPDATE captains 
                        SET ${setClause.join(', ')}
                        WHERE id = $${paramCount}
                        RETURNING *
                    `;

                    const updateResult = await Database.query(updateQuery, updateValues);

                    if (updateResult.rows.length === 0) {
                        return res.status(404).json({ error: 'Captain not found' });
                    }

                    return res.status(200).json({
                        success: true,
                        captain: updateResult.rows[0],
                        message: 'Captain updated successfully'
                    });

                case 'reset_code':
                    // Admin: Reset captain code
                    const { password: resetPassword, captainId: resetCaptainId } = data;
                    
                    if (resetPassword !== 'UnionJack123') {
                        return res.status(401).json({ error: 'Unauthorized' });
                    }

                    // Generate new unique code
                    let newCaptainCode;
                    let isCodeUnique = false;
                    let resetAttempts = 0;

                    while (!isCodeUnique && resetAttempts < 10) {
                        newCaptainCode = generateCaptainCode();
                        
                        const checkQuery = 'SELECT code FROM captains WHERE code = $1';
                        const checkResult = await Database.query(checkQuery, [newCaptainCode]);
                        
                        if (checkResult.rows.length === 0) {
                            isCodeUnique = true;
                        }
                        resetAttempts++;
                    }

                    if (!isCodeUnique) {
                        return res.status(500).json({ error: 'Unable to generate unique captain code' });
                    }

                    const resetQuery = `
                        UPDATE captains 
                        SET code = $1, updated_at = $2
                        WHERE id = $3
                        RETURNING *
                    `;
                    
                    const resetResult = await Database.query(resetQuery, [
                        newCaptainCode,
                        new Date().toISOString(),
                        resetCaptainId
                    ]);

                    if (resetResult.rows.length === 0) {
                        return res.status(404).json({ error: 'Captain not found' });
                    }

                    return res.status(200).json({
                        success: true,
                        captainCode: resetResult.rows[0].code,
                        captain: resetResult.rows[0],
                        message: 'Captain code reset successfully'
                    });

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }

        } else if (req.method === 'GET') {
            // Get captain by code (public endpoint)
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({ error: 'Captain code is required' });
            }

            const query = `
                SELECT * FROM captains 
                WHERE code = $1 AND is_active = true
            `;
            const result = await Database.query(query, [code.toUpperCase()]);

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Captain not found or inactive' 
                });
            }

            res.status(200).json({
                success: true,
                captain: result.rows[0]
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

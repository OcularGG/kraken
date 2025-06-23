// Port Battles API - CRUD operations for port battles
const { supabase } = require('../../lib/supabase');

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
            
            console.log('Creating port battle:', pbData.port);
            
            // Map form data to database columns
            const dbData = {
                id: pbData.id,
                port: pbData.port,
                battle_type: pbData.type,
                br_limit: parseInt(pbData.brLimit),
                meeting_time: new Date(pbData.meetingTime).toISOString(),
                pb_time: new Date(pbData.pbTime).toISOString(),
                meeting_location: pbData.meetingLocation,
                max_signups: parseInt(pbData.maxSignups) || 70,
                access_code: pbData.accessCode,
                admin_code: pbData.adminCode,
                allowed_rates: pbData.allowedRates || [],
                allowed_ships: pbData.allowedShips || [],
                screening_fleets: pbData.screeningFleets || []
            };

            const { data, error } = await supabase
                .from('port_battles')
                .insert([dbData])
                .select();

            if (error) {
                console.error('Database insert error:', error);
                return res.status(500).json({ 
                    error: 'Failed to create port battle', 
                    details: error.message 
                });
            }

            console.log('Port battle created successfully:', data[0].id);
            
            res.status(200).json({ 
                success: true, 
                port_battle: data[0],
                message: 'Port battle created successfully' 
            });

        } else if (req.method === 'GET') {
            // Get all port battles or specific one
            const { id, access_code } = req.query;
            
            let query = supabase.from('port_battles').select('*');
            
            if (id) {
                query = query.eq('id', id);
            }
            
            if (access_code) {
                query = query.eq('access_code', access_code);
            }
            
            query = query.order('pb_time', { ascending: true });
            
            const { data, error } = await query;

            if (error) {
                console.error('Database select error:', error);
                return res.status(500).json({ 
                    error: 'Failed to fetch port battles', 
                    details: error.message 
                });
            }

            res.status(200).json({ 
                success: true, 
                port_battles: data,
                count: data.length 
            });

        } else if (req.method === 'PUT') {
            // Update port battle
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'Port battle ID is required' });
            }
            
            const { data, error } = await supabase
                .from('port_battles')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Database update error:', error);
                return res.status(500).json({ 
                    error: 'Failed to update port battle', 
                    details: error.message 
                });
            }

            res.status(200).json({ 
                success: true, 
                port_battle: data[0],
                message: 'Port battle updated successfully' 
            });

        } else if (req.method === 'DELETE') {
            // Delete port battle
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'Port battle ID is required' });
            }
            
            const { error } = await supabase
                .from('port_battles')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Database delete error:', error);
                return res.status(500).json({ 
                    error: 'Failed to delete port battle', 
                    details: error.message 
                });
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
            error: 'Server error', 
            details: err.message 
        });
    }
};

// PB Signups API - Handle port battle signups
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
            // Create new signup
            const signupData = req.body;
            
            console.log('Creating PB signup:', signupData.captainName, 'for PB:', signupData.pbId);
            
            // Check if port battle exists
            const { data: pbData, error: pbError } = await supabase
                .from('port_battles')
                .select('*')
                .eq('id', signupData.pbId)
                .single();

            if (pbError || !pbData) {
                return res.status(404).json({ 
                    error: 'Port battle not found' 
                });
            }

            // Check if captain already signed up
            const { data: existingSignup, error: checkError } = await supabase
                .from('pb_signups')
                .select('*')
                .eq('pb_id', signupData.pbId)
                .eq('captain_name', signupData.captainName)
                .single();

            if (existingSignup) {
                return res.status(400).json({ 
                    error: 'Captain already signed up for this port battle' 
                });
            }

            // Map form data to database columns
            const dbData = {
                pb_id: signupData.pbId,
                captain_name: signupData.captainName,
                ship_name: signupData.shipName,
                ship_rate: signupData.shipRate,
                fleet_assignment: signupData.fleetAssignment || null,
                status: 'pending',
                notes: signupData.notes || null
            };

            const { data, error } = await supabase
                .from('pb_signups')
                .insert([dbData])
                .select();

            if (error) {
                console.error('Database insert error:', error);
                return res.status(500).json({ 
                    error: 'Failed to create signup', 
                    details: error.message 
                });
            }

            console.log('PB signup created successfully:', data[0].id);
            
            res.status(200).json({ 
                success: true, 
                signup: data[0],
                message: 'Signup created successfully' 
            });

        } else if (req.method === 'GET') {
            // Get signups for a specific port battle or all signups
            const { pb_id, captain_name } = req.query;
            
            let query = supabase
                .from('pb_signups')
                .select(`
                    *,
                    port_battles!inner(
                        port,
                        pb_time,
                        access_code
                    )
                `);
            
            if (pb_id) {
                query = query.eq('pb_id', pb_id);
            }
            
            if (captain_name) {
                query = query.eq('captain_name', captain_name);
            }
            
            query = query.order('signup_time', { ascending: false });
            
            const { data, error } = await query;

            if (error) {
                console.error('Database select error:', error);
                return res.status(500).json({ 
                    error: 'Failed to fetch signups', 
                    details: error.message 
                });
            }

            res.status(200).json({ 
                success: true, 
                signups: data,
                count: data.length 
            });

        } else if (req.method === 'PUT') {
            // Update signup status
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'Signup ID is required' });
            }
            
            const { data, error } = await supabase
                .from('pb_signups')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Database update error:', error);
                return res.status(500).json({ 
                    error: 'Failed to update signup', 
                    details: error.message 
                });
            }

            res.status(200).json({ 
                success: true, 
                signup: data[0],
                message: 'Signup updated successfully' 
            });

        } else if (req.method === 'DELETE') {
            // Delete signup
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'Signup ID is required' });
            }
            
            const { error } = await supabase
                .from('pb_signups')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Database delete error:', error);
                return res.status(500).json({ 
                    error: 'Failed to delete signup', 
                    details: error.message 
                });
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
            error: 'Server error', 
            details: err.message 
        });
    }
};

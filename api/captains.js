// Captain's Code API - Manage captain codes and registrations
const { supabase } = require('../../lib/supabase');

// Generate random 8-digit captain code
function generateCaptainCode() {
    return Math.random().toString().substr(2, 8);
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
            const { action, ...data } = req.body;

            switch (action) {
                case 'register':
                    // Register a new captain with their code
                    const { captainName, discordUsername } = data;
                    
                    if (!captainName) {
                        return res.status(400).json({ error: 'Captain name is required' });
                    }                    // Check if captain already exists
                    const { data: existingCaptain } = await supabase
                        .from('captains')
                        .select('*')
                        .eq('username', captainName)
                        .eq('is_active', true)
                        .single();

                    if (existingCaptain) {
                        return res.status(409).json({ 
                            error: 'Captain name already registered',
                            captainCode: existingCaptain.code
                        });
                    }

                    // Generate unique captain code
                    let captainCode;
                    let isUnique = false;
                    let attempts = 0;

                    while (!isUnique && attempts < 10) {
                        captainCode = generateCaptainCode();                        const { data: codeCheck } = await supabase
                            .from('captains')
                            .select('code')
                            .eq('code', captainCode)
                            .single();
                        
                        if (!codeCheck) {
                            isUnique = true;
                        }
                        attempts++;
                    }

                    if (!isUnique) {
                        return res.status(500).json({ error: 'Unable to generate unique captain code' });
                    }                    // Insert new captain
                    const { data: newCaptain, error: insertError } = await supabase
                        .from('captains')
                        .insert([{
                            code: captainCode,
                            username: captainName,
                            discord_username: discordUsername || null
                        }])
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Error registering captain:', insertError);
                        return res.status(500).json({ error: 'Failed to register captain' });
                    }

                    return res.status(201).json({
                        success: true,
                        captain: newCaptain,
                        message: 'Captain registered successfully'
                    });

                case 'verify':
                    // Verify a captain code and return captain info
                    const { captainCode: codeToVerify } = data;
                    
                    if (!codeToVerify) {
                        return res.status(400).json({ error: 'Captain code is required' });
                    }                    const { data: captain, error: verifyError } = await supabase
                        .from('captains')
                        .select('*')
                        .eq('code', codeToVerify)
                        .eq('is_active', true)
                        .single();

                    if (verifyError || !captain) {
                        return res.status(404).json({ error: 'Invalid captain code' });
                    }

                    // Check for required permission if specified
                    const { requiredPermission } = data;
                    let hasPermission = true;
                    
                    if (requiredPermission) {
                        switch (requiredPermission) {
                            case 'pb_admin':
                                hasPermission = captain.pb_admin === true;
                                break;
                            case 'gallery_admin':
                                hasPermission = captain.gallery_admin === true;
                                break;
                            default:
                                hasPermission = true;
                        }
                    }

                    return res.status(200).json({
                        success: true,
                        hasPermission: hasPermission,
                        captain: {
                            captainName: captain.username,
                            captainCode: captain.code,
                            pbAdmin: captain.pb_admin,
                            galleryAdmin: captain.gallery_admin,
                            discordUsername: captain.discord_username
                        }
                    });

                case 'admin_list':
                    // Admin: Get all captains (password protected)
                    const { password } = data;
                    
                    if (password !== 'UnionJack123') {
                        return res.status(401).json({ error: 'Unauthorized' });
                    }

                    const { data: allCaptains, error: listError } = await supabase
                        .from('captains')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (listError) {
                        return res.status(500).json({ error: 'Failed to fetch captains' });
                    }

                    return res.status(200).json({
                        success: true,
                        captains: allCaptains
                    });

                case 'admin_update':
                    // Admin: Update captain permissions or info
                    const { password: adminPassword, captainId, updates } = data;
                    
                    if (adminPassword !== 'UnionJack123') {
                        return res.status(401).json({ error: 'Unauthorized' });
                    }

                    const { data: updatedCaptain, error: updateError } = await supabase
                        .from('captains')
                        .update({
                            ...updates,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', captainId)
                        .select()
                        .single();

                    if (updateError) {
                        return res.status(500).json({ error: 'Failed to update captain' });
                    }

                    return res.status(200).json({
                        success: true,
                        captain: updatedCaptain
                    });

                case 'admin_reset_code':
                    // Admin: Reset captain code
                    const { password: resetPassword, captainId: resetCaptainId } = data;
                    
                    if (resetPassword !== 'UnionJack123') {
                        return res.status(401).json({ error: 'Unauthorized' });
                    }

                    // Generate new unique captain code
                    let newCaptainCode;
                    let isNewUnique = false;
                    let resetAttempts = 0;

                    while (!isNewUnique && resetAttempts < 10) {
                        newCaptainCode = generateCaptainCode();                        const { data: codeCheck } = await supabase
                            .from('captains')
                            .select('code')
                            .eq('code', newCaptainCode)
                            .single();
                        
                        if (!codeCheck) {
                            isNewUnique = true;
                        }
                        resetAttempts++;
                    }

                    if (!isNewUnique) {
                        return res.status(500).json({ error: 'Unable to generate unique captain code' });
                    }                    const { data: resetCaptain, error: resetError } = await supabase
                        .from('captains')
                        .update({
                            code: newCaptainCode,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', resetCaptainId)
                        .select()
                        .single();

                    if (resetError) {
                        return res.status(500).json({ error: 'Failed to reset captain code' });
                    }

                    return res.status(200).json({
                        success: true,
                        captain: resetCaptain,
                        newCode: newCaptainCode
                    });

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
        }

        if (req.method === 'GET') {
            // Get captain by code (public endpoint)
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({ error: 'Captain code is required' });
            }            const { data: captain, error } = await supabase
                .from('captains')
                .select('username, code, pb_admin, gallery_admin, discord_username')
                .eq('code', code)
                .eq('is_active', true)
                .single();

            if (error || !captain) {
                return res.status(404).json({ error: 'Invalid captain code' });
            }

            return res.status(200).json({
                success: true,
                captain: {
                    captainName: captain.username,
                    captainCode: captain.code,
                    pbAdmin: captain.pb_admin,
                    galleryAdmin: captain.gallery_admin,
                    discordUsername: captain.discord_username
                }
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Captain API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

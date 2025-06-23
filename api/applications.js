// Applications API - Save application data to Supabase
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
            // Save new application
            const applicationData = req.body;
            
            console.log('Saving application to database:', applicationData.captainName);
            
            // Map form data to database columns
            const dbData = {
                captain_name: applicationData.captainName,
                preferred_name: applicationData.preferredName,
                age: applicationData.age,
                discord: applicationData.discord,
                timezone: applicationData.timezone,
                nation: applicationData.nation,
                hours_played: applicationData.hoursPlayed,
                current_rank: applicationData.currentRank,
                previous_clans: applicationData.previousClans || null,
                pb_role: applicationData.pbRole,
                pb_commander: applicationData.pbCommander,
                pb_experience: applicationData.pbExperience || null,
                crafter: applicationData.crafter,
                play_time: applicationData.playTime,
                port_battles: applicationData.portBattles,
                schedule: applicationData.schedule || null,
                why_join: applicationData.whyJoin,
                contribution: applicationData.contribution,
                additional_info: applicationData.additionalInfo || null,
                signature: applicationData.signature,
                application_date: applicationData.date,
                submitted_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('applications')
                .insert([dbData])
                .select();

            if (error) {
                console.error('Database insert error:', error);
                return res.status(500).json({ 
                    error: 'Failed to save application', 
                    details: error.message 
                });
            }

            console.log('Application saved successfully:', data[0].id);
            
            res.status(200).json({ 
                success: true, 
                application_id: data[0].id,
                message: 'Application saved successfully' 
            });

        } else if (req.method === 'GET') {
            // Get all applications (for admin view)
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (error) {
                console.error('Database select error:', error);
                return res.status(500).json({ 
                    error: 'Failed to fetch applications', 
                    details: error.message 
                });
            }

            res.status(200).json({ 
                success: true, 
                applications: data,
                count: data.length 
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

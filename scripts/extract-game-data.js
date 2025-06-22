const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Naval Action API endpoint
const API_URL = 'https://storage.googleapis.com/nacleanopenworldprodshards/ItemTemplates_cleanopenworldprodeu1.json';

async function fetchGameData() {
    try {
        console.log('Fetching Naval Action game data...');
        const response = await fetch(API_URL);
        const textData = await response.text();
        
        console.log('Parsing JavaScript response...');
        
        // Extract the array from the variable assignment
        const arrayMatch = textData.match(/var ItemTemplates = (\[.*\]);/s);
        if (!arrayMatch) {
            throw new Error('Could not extract array data from JavaScript response');
        }
        
        console.log('Found array data, parsing...');
        const dataArray = JSON.parse(arrayMatch[1]);
        console.log(`Found ${dataArray.length} items in the database`);
        
        // Convert array to object with Id as key for easier processing
        const data = {};
        dataArray.forEach(item => {
            if (item.Id) {
                data[item.Id] = item;
            }
        });
        console.log(`Converted to object with ${Object.keys(data).length} indexed items`);
        
        // Extract ships data
        const ships = extractShips(data);
        console.log(`Extracted ${ships.length} ships`);
        
        // Extract ports data (if available)
        const ports = extractPorts(data);
        console.log(`Extracted ${ports.length} ports`);
        
        // Save extracted data
        const outputDir = path.join(__dirname, '../data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save ships data
        fs.writeFileSync(
            path.join(outputDir, 'ships.json'),
            JSON.stringify(ships, null, 2)
        );
        
        // Save ports data
        fs.writeFileSync(
            path.join(outputDir, 'ports.json'),
            JSON.stringify(ports, null, 2)
        );
        
        // Save raw data for reference
        fs.writeFileSync(
            path.join(outputDir, 'raw-game-data.json'),
            JSON.stringify(data, null, 2)
        );
        
        console.log('Data extraction completed successfully!');
        
        // Generate summary
        generateSummary(ships, ports);
        
    } catch (error) {
        console.error('Error fetching game data:', error);
    }
}

function extractShips(data) {
    const ships = [];
    
    for (const [key, item] of Object.entries(data)) {
        // Look for ship templates based on available properties
        if (item.Name && (item.__type?.includes('Ship') || item.Name.includes('Ship') || item.ItemType === 'Ship')) {
            
            // Log first ship found to see structure
            if (ships.length === 0) {
                console.log('First ship item structure:');
                console.log(JSON.stringify(item, null, 2));
                console.log('---');
            }
            
            const ship = {
                id: item.Id || key,
                name: item.Name,
                type: item.__type || 'Ship',
                template: item.Template || '',
                class: item.ShipClass || item.Class || '',
                shipType: item.ShipType || item.Type || '',
                nationality: item.Nation || item.Nationality || 'Universal',
                tier: item.Tier || item.Rating || 0,
                stats: {
                    crew: item.CrewRequired || item.Crew || 0,
                    guns: item.GunsTotal || item.Guns || 0,
                    health: item.Structure || item.HP || item.Health || 0,
                    armor: item.Armor || 0,
                    speed: item.MaxSpeed || item.Speed || 0,
                    turnSpeed: item.TurnAcceleration || item.TurnSpeed || 0,
                    upwindSpeed: item.UpwindSpeed || 0,
                    downwindSpeed: item.DownwindSpeed || 0
                },
                requirements: {
                    rank: item.RequiredRank || item.Rank || 0,
                    craftingLevel: item.RequiredCraftingLevel || 0
                },
                economy: {
                    basePrice: item.BasePrice || 0,
                    laborHours: item.LaborHoursRequired || 0
                },
                description: item.Description || '',
                craftable: item.Craftable || false,
                dlc: item.DLC || false,
                weight: item.ItemWeight || 0,
                maxStack: item.MaxStack || 1
            };
            
            ships.push(ship);
        }
    }
    
    console.log(`Found ships with these names: ${ships.slice(0, 10).map(s => s.name).join(', ')}...`);
    return ships.sort((a, b) => a.name.localeCompare(b.name));
}

function extractPorts(data) {
    const ports = [];
    
    for (const [key, item] of Object.entries(data)) {
        // Look for port templates - might be in different format
        if (item.Name && (item.__type?.includes('Port') || item.Name.includes('Port') || item.Template?.includes('Port'))) {
            
            // Log first port found to see structure
            if (ports.length === 0) {
                console.log('First port item structure:');
                console.log(JSON.stringify(item, null, 2));
                console.log('---');
            }
            
            const port = {
                id: item.Id || key,
                name: item.Name,
                type: item.__type || item.ItemType || 'Port',
                template: item.Template || '',
                nationality: item.Nation || item.Nationality || 'Neutral',
                region: item.Region || '',
                coordinates: {
                    x: item.Position?.x || item.X || 0,
                    y: item.Position?.y || item.Y || 0,
                    z: item.Position?.z || item.Z || 0
                },
                services: {
                    shipyard: item.HasShipyard || false,
                    academy: item.HasAcademy || false,
                    warehouse: item.HasWarehouse || false,
                    admiralty: item.HasAdmiralty || false
                },
                economy: {
                    goldGeneration: item.GoldGeneration || 0,
                    population: item.Population || 0,
                    basePrice: item.BasePrice || 0
                },
                description: item.Description || '',
                weight: item.ItemWeight || 0
            };
            
            ports.push(port);
        }
    }
    
    // If no ports found with strict criteria, try broader search
    if (ports.length === 0) {
        console.log('No ports found with strict criteria, trying broader search...');
        for (const [key, item] of Object.entries(data)) {
            if (item.Name && item.Name.toLowerCase().includes('port')) {
                ports.push({
                    id: item.Id || key,
                    name: item.Name,
                    type: item.__type || 'Port',
                    nationality: 'Unknown',
                    description: item.Description || ''
                });
            }
        }
    }
    
    console.log(`Found ports with these names: ${ports.slice(0, 10).map(p => p.name).join(', ')}...`);
    return ports.sort((a, b) => a.name.localeCompare(b.name));
}

function generateSummary(ships, ports) {
    console.log('\n=== EXTRACTION SUMMARY ===');
    
    // Ships summary
    const shipsByNation = ships.reduce((acc, ship) => {
        acc[ship.nationality] = (acc[ship.nationality] || 0) + 1;
        return acc;
    }, {});
    
    const shipsByClass = ships.reduce((acc, ship) => {
        acc[ship.class] = (acc[ship.class] || 0) + 1;
        return acc;
    }, {});
    
    console.log(`\nShips by Nation:`);
    Object.entries(shipsByNation).forEach(([nation, count]) => {
        console.log(`  ${nation}: ${count}`);
    });
    
    console.log(`\nShips by Class:`);
    Object.entries(shipsByClass).forEach(([shipClass, count]) => {
        console.log(`  ${shipClass}: ${count}`);
    });
    
    // Ports summary
    const portsByNation = ports.reduce((acc, port) => {
        acc[port.nationality] = (acc[port.nationality] || 0) + 1;
        return acc;
    }, {});
    
    console.log(`\nPorts by Nation:`);
    Object.entries(portsByNation).forEach(([nation, count]) => {
        console.log(`  ${nation}: ${count}`);
    });
    
    console.log('\n=== FILES CREATED ===');
    console.log('- data/ships.json');
    console.log('- data/ports.json');
    console.log('- data/raw-game-data.json');
}

// Run the extraction
fetchGameData();

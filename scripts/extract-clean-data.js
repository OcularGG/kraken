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
        
        // Extract resources and goods data
        const resources = extractResources(data);
        console.log(`Extracted ${resources.length} resources/goods`);
        
        // Extract ship modules data
        const modules = extractModules(data);
        console.log(`Extracted ${modules.length} ship modules`);
        
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
        
        // Save resources data
        fs.writeFileSync(
            path.join(outputDir, 'resources.json'),
            JSON.stringify(resources, null, 2)
        );
        
        // Save modules data
        fs.writeFileSync(
            path.join(outputDir, 'modules.json'),
            JSON.stringify(modules, null, 2)
        );
        
        // Create a sample of all item types for debugging
        const itemTypes = {};
        Object.values(data).forEach(item => {
            const type = item.__type || 'Unknown';
            if (!itemTypes[type]) {
                itemTypes[type] = { count: 0, example: item };
            }
            itemTypes[type].count++;
        });
        
        fs.writeFileSync(
            path.join(outputDir, 'item-types-summary.json'),
            JSON.stringify(itemTypes, null, 2)
        );
        
        console.log('Data extraction completed successfully!');
        
        // Generate summary
        generateSummary(ships, resources, modules);
        
    } catch (error) {
        console.error('Error fetching game data:', error);
    }
}

function extractShips(data) {
    const ships = [];
    
    for (const [key, item] of Object.entries(data)) {
        // Look for actual ship templates (not blueprints, skins, or containers)
        if (item.Name && 
            item.__type === 'MegaChaka.Services.Items.ShipTemplate, MegaChaka' &&
            !item.Name.includes('Blueprint') &&
            !item.Name.includes('Container') &&
            !item.Name.includes('Letter') &&
            !item.NotUsed) {
            
            const ship = {
                id: item.Id,
                name: item.Name,
                type: 'Ship',
                class: item.Class || 0,
                rating: item.Rating || 0,
                nationality: item.Nationality || 'Universal',
                stats: {
                    structure: item.Structure || 0,
                    armor: item.Armor || 0,
                    crew: item.CrewRequired || 0,
                    guns: item.GunsTotal || 0,
                    speed: item.MaxSpeed || 0,
                    turnSpeed: item.TurnAcceleration || 0,
                    upwindSpeed: item.UpwindSpeed || 0,
                    downwindSpeed: item.DownwindSpeed || 0,
                    acceleration: item.Acceleration || 0
                },
                requirements: {
                    rank: item.RequiredRank || 0,
                    craftingLevel: item.RequiredCraftingLevel || 0
                },
                economy: {
                    basePrice: item.BasePrice || 0,
                    sellPrice: item.SellPrice || { x: 0, y: 0 },
                    buyPrice: item.BuyPrice || { x: 0, y: 0 }
                },
                weight: item.ItemWeight || 0,
                tradeable: !item.NotTradeable,
                hidden: item.Hided || false
            };
            
            ships.push(ship);
        }
    }
    
    return ships.sort((a, b) => a.name.localeCompare(b.name));
}

function extractResources(data) {
    const resources = [];
    
    for (const [key, item] of Object.entries(data)) {
        // Look for resource and trade good templates
        if (item.Name && 
            (item.__type === 'MegaChaka.Services.Items.ResourceTemplate, MegaChaka' ||
             item.__type === 'MegaChaka.Services.Items.TradeGoodTemplate, MegaChaka') &&
            !item.NotUsed &&
            !item.Hided) {
            
            const resource = {
                id: item.Id,
                name: item.Name,
                type: item.__type.includes('Resource') ? 'Resource' : 'TradeGood',
                weight: item.ItemWeight || 0,
                maxStack: item.MaxStack || 1,
                economy: {
                    basePrice: item.BasePrice || 0,
                    sellPrice: item.SellPrice || { x: 0, y: 0 },
                    buyPrice: item.BuyPrice || { x: 0, y: 0 },
                    minContract: item.MinContractAmount || 1,
                    maxContract: item.MaxContractAmount || 1000
                },
                tradeable: !item.NotTradeable,
                teleportable: !item.PreventTeleport
            };
            
            resources.push(resource);
        }
    }
    
    return resources.sort((a, b) => a.name.localeCompare(b.name));
}

function extractModules(data) {
    const modules = [];
    
    for (const [key, item] of Object.entries(data)) {
        // Look for ship module templates
        if (item.Name && 
            (item.__type === 'MegaChaka.Services.Items.UpgradeTemplate, MegaChaka' ||
             item.__type === 'MegaChaka.Services.Items.ModuleTemplate, MegaChaka') &&
            !item.NotUsed &&
            !item.Hided) {
            
            const module = {
                id: item.Id,
                name: item.Name,
                type: item.__type.includes('Upgrade') ? 'Upgrade' : 'Module',
                weight: item.ItemWeight || 0,
                economy: {
                    basePrice: item.BasePrice || 0,
                    sellPrice: item.SellPrice || { x: 0, y: 0 },
                    buyPrice: item.BuyPrice || { x: 0, y: 0 }
                },
                tradeable: !item.NotTradeable,
                craftable: item.Craftable || false
            };
            
            modules.push(module);
        }
    }
    
    return modules.sort((a, b) => a.name.localeCompare(b.name));
}

function generateSummary(ships, resources, modules) {
    console.log('\n=== EXTRACTION SUMMARY ===');
    
    // Ships summary
    const shipsByClass = ships.reduce((acc, ship) => {
        const className = ship.class ? `${ship.class}rd Rate` : 'Unclassified';
        acc[className] = (acc[className] || 0) + 1;
        return acc;
    }, {});
    
    const shipsByNation = ships.reduce((acc, ship) => {
        acc[ship.nationality] = (acc[ship.nationality] || 0) + 1;
        return acc;
    }, {});
    
    console.log(`\nShips by Class:`);
    Object.entries(shipsByClass).forEach(([shipClass, count]) => {
        console.log(`  ${shipClass}: ${count}`);
    });
    
    console.log(`\nShips by Nation:`);
    Object.entries(shipsByNation).forEach(([nation, count]) => {
        console.log(`  ${nation}: ${count}`);
    });
    
    // Resources summary
    const resourcesByType = resources.reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
    }, {});
    
    console.log(`\nResources by Type:`);
    Object.entries(resourcesByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    
    console.log(`\nModules: ${modules.length}`);
    
    console.log('\n=== TOP 10 SHIPS ===');
    ships.slice(0, 10).forEach(ship => {
        console.log(`${ship.name} (Class ${ship.class}, ${ship.stats.guns} guns)`);
    });
    
    console.log('\n=== FILES CREATED ===');
    console.log('- data/ships.json');
    console.log('- data/resources.json');
    console.log('- data/modules.json');
    console.log('- data/item-types-summary.json');
}

// Run the extraction
fetchGameData();

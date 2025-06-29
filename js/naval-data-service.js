// Naval Action Marketplace Data Service - Fixed Version
class NavalActionDataService {
    constructor() {
        this.ships = [];
        this.items = {};
        this.itemCategories = {};
        this.ports = [];
        this.loaded = false;
    }

    async loadData() {
        if (this.loaded) return;

        try {
            // Load ships data
            const shipsResponse = await fetch('./data/ships.json');
            this.ships = await shipsResponse.json();

            // Load resources data
            const resourcesResponse = await fetch('./data/resources.json');
            const resources = await resourcesResponse.json();

            // Load modules data
            const modulesResponse = await fetch('./data/modules.json');
            const modules = await modulesResponse.json();

            // Load ports data
            try {
                const portsResponse = await fetch('./data/ports-complete.json');
                this.ports = await portsResponse.json();
            } catch (e) {
                console.warn('Ports data not available, using fallback');
                this.ports = [];
            }

            // Categorize all items
            this.categorizeItems(resources, modules);
            this.loaded = true;

            console.log('Naval Action data loaded successfully');
            console.log(`${this.ships.length} ships loaded`);
            console.log(`${Object.keys(this.itemCategories).length} item categories loaded`);
            console.log(`${this.ports.length} ports loaded`);
        } catch (error) {
            console.error('Error loading Naval Action data:', error);
        }
    }

    categorizeItems(resources, modules) {
        this.itemCategories = {
            'Woods': [],
            'Metals & Ores': [],
            'Textiles & Fibers': [],
            'Food & Provisions': [],
            'Cannons & Weapons': [],
            'Ship Modules': [],
            'Ship Equipment': [],
            'Trade Goods': [],
            'Crafting Materials': [],
            'Naval Supplies': [],
            'Other Resources': []
        };

        // Categorize resources
        resources.forEach(item => {
            const name = item.name.toLowerCase();
            const category = this.determineCategory(name, item.type);
            
            if (this.itemCategories[category]) {
                this.itemCategories[category].push({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    weight: item.weight,
                    maxStack: item.maxStack,
                    basePrice: item.economy.basePrice
                });
            }
        });

        // Categorize modules into more specific categories
        modules.forEach(item => {
            const name = item.name.toLowerCase();
            let category = 'Ship Modules';
            
            // Weapons and gun-related modules
            if (name.includes('gun') || name.includes('cannon') || name.includes('carronade') || 
                name.includes('weapon') || name.includes('artillery')) {
                category = 'Cannons & Weapons';
            }
            // Ship equipment (sails, hull, etc.)
            else if (name.includes('sail') || name.includes('hull') || name.includes('rudder') || 
                     name.includes('mast') || name.includes('rigging') || name.includes('armor')) {
                category = 'Ship Equipment';
            }
            // Naval supplies (powder, shot, etc.)
            else if (name.includes('powder') || name.includes('shot') || name.includes('ball') || 
                     name.includes('grape') || name.includes('chain') || name.includes('repair')) {
                category = 'Naval Supplies';
            }
            
            this.itemCategories[category].push({
                id: item.id,
                name: item.name,
                type: item.type,
                weight: item.weight,
                basePrice: item.economy.basePrice
            });
        });

        // Sort each category alphabetically
        Object.keys(this.itemCategories).forEach(category => {
            this.itemCategories[category].sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    determineCategory(name, type) {
        // Wood materials
        if (name.includes('oak') || name.includes('teak') || name.includes('fir') || 
            name.includes('cedar') || name.includes('mahogany') || name.includes('wood') ||
            name.includes('log') || name.includes('timber') || name.includes('sabicu') ||
            name.includes('pine')) {
            return 'Woods';
        }

        // Metals and ores
        if (name.includes('iron') || name.includes('copper') || name.includes('gold') ||
            name.includes('silver') || name.includes('tin') || name.includes('ore') ||
            name.includes('ingot') || name.includes('metal') || name.includes('lead') ||
            name.includes('zinc') || name.includes('bronze')) {
            return 'Metals & Ores';
        }

        // Textiles and fibers
        if (name.includes('cotton') || name.includes('hemp') || name.includes('silk') ||
            name.includes('wool') || name.includes('linen') || name.includes('canvas') ||
            name.includes('cloth') || name.includes('fiber') || name.includes('thread') ||
            name.includes('rope') || name.includes('cordage')) {
            return 'Textiles & Fibers';
        }

        // Food and provisions
        if (name.includes('meat') || name.includes('fish') || name.includes('bread') ||
            name.includes('water') || name.includes('rum') || name.includes('wine') ||
            name.includes('beer') || name.includes('food') || name.includes('provisions') ||
            name.includes('flour') || name.includes('sugar') || name.includes('salt') ||
            name.includes('spice') || name.includes('coffee') || name.includes('tea') ||
            name.includes('tobacco') || name.includes('cocoa') || name.includes('fruit')) {
            return 'Food & Provisions';
        }

        // Naval supplies
        if (name.includes('powder') || name.includes('gunpowder') || name.includes('shot') ||
            name.includes('ball') || name.includes('cannonball') || name.includes('grape') ||
            name.includes('chain') || name.includes('repair') || name.includes('kit') ||
            name.includes('tools') || name.includes('nail') || name.includes('tar') ||
            name.includes('pitch') || name.includes('oakum') || name.includes('paint')) {
            return 'Naval Supplies';
        }

        // Weapons and cannons
        if (name.includes('cannon') || name.includes('gun') || name.includes('carronade') ||
            name.includes('weapon') || name.includes('musket') || name.includes('pistol') ||
            name.includes('sword') || name.includes('cutlass') || name.includes('long') ||
            name.includes('medium') || name.includes('short') || name.includes('artillery')) {
            return 'Cannons & Weapons';
        }

        // Trade goods
        if (name.includes('dye') || name.includes('indigo') || name.includes('logwood') ||
            name.includes('mahogany') || name.includes('precious') || name.includes('gem') ||
            name.includes('pearl') || name.includes('ivory') || name.includes('amber') ||
            name.includes('luxury') || name.includes('exotic')) {
            return 'Trade Goods';
        }

        // Crafting materials
        if (name.includes('coal') || name.includes('charcoal') || name.includes('sulfur') ||
            name.includes('saltpeter') || name.includes('component') || name.includes('part') ||
            name.includes('frame') || name.includes('stock') || name.includes('blank') ||
            name.includes('raw') || name.includes('crude')) {
            return 'Crafting Materials';
        }

        return 'Other Resources';
    }

    getShips() {
        return this.ships
            .map(ship => ({
                id: ship.id,
                name: ship.name,
                class: ship.class,
                nationality: ship.nationality
            }))
            .filter(ship => ship.name && ship.name !== 'Ship' && ship.name !== 'Unknown')
            .sort((a, b) => {
                // Sort by class first (1st rate to 7th rate)
                if (a.class !== b.class) {
                    return (a.class || 99) - (b.class || 99);
                }
                // Then sort by name
                return a.name.localeCompare(b.name);
            });
    }

    getPorts() {
        return this.ports;
    }

    searchPorts(query) {
        if (!query || query.length < 2) return [];
        
        const searchTerm = query.toLowerCase();
        return this.ports
            .filter(port => port.searchText.includes(searchTerm) || port.name.toLowerCase().includes(searchTerm))
            .slice(0, 10); // Limit to 10 results for performance
    }

    getItemCategories() {
        return Object.keys(this.itemCategories);
    }

    getItemsByCategory(category) {
        return this.itemCategories[category] || [];
    }

    getAllItems() {
        return this.itemCategories;
    }

    searchShips(query) {
        if (!query) return this.getShips();
        
        return this.ships
            .filter(ship => ship.name.toLowerCase().includes(query.toLowerCase()))
            .map(ship => ({
                id: ship.id,
                name: ship.name,
                class: ship.class,
                nationality: ship.nationality
            }));
    }

    searchItems(query, category = null) {
        if (!query) return category ? this.getItemsByCategory(category) : this.getAllItems();

        const results = [];
        const searchTarget = category ? [category] : Object.keys(this.itemCategories);

        searchTarget.forEach(cat => {
            const items = this.itemCategories[cat].filter(item => 
                item.name.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...items);
        });

        return results;
    }

    getItemSubcategories(category) {
        if (!this.itemCategories[category]) return [];
        
        const items = this.itemCategories[category];
        const subcategories = new Set();
        
        items.forEach(item => {
            const subcategory = this.determineSubcategory(item.name, category);
            if (subcategory) {
                subcategories.add(subcategory);
            }
        });
        
        return Array.from(subcategories).sort();
    }

    determineSubcategory(itemName, category) {
        const name = itemName.toLowerCase();
        
        if (category === 'Woods') {
            if (name.includes('oak')) return 'Oak';
            if (name.includes('teak')) return 'Teak';
            if (name.includes('fir')) return 'Fir';
            if (name.includes('cedar')) return 'Cedar';
            if (name.includes('mahogany')) return 'Mahogany';
            if (name.includes('sabicu')) return 'Sabicu';
            if (name.includes('pine')) return 'Pine';
            return 'Other Woods';
        }
        
        if (category === 'Metals & Ores') {
            if (name.includes('iron')) return 'Iron';
            if (name.includes('copper')) return 'Copper';
            if (name.includes('gold')) return 'Gold';
            if (name.includes('silver')) return 'Silver';
            if (name.includes('tin')) return 'Tin';
            if (name.includes('lead')) return 'Lead';
            return 'Other Metals';
        }
        
        if (category === 'Cannons & Weapons') {
            if (name.includes('carronade')) return 'Carronades';
            if (name.includes('long')) return 'Long Guns';
            if (name.includes('medium')) return 'Medium Guns';
            if (name.includes('short')) return 'Short Guns';
            if (name.includes('musket')) return 'Small Arms';
            if (name.includes('gun sight') || name.includes('tackle') || name.includes('gunner')) return 'Gun Equipment';
            return 'Other Weapons';
        }

        if (category === 'Ship Modules') {
            if (name.includes('hull')) return 'Hull Modules';
            if (name.includes('sail')) return 'Sail Modules';
            if (name.includes('crew')) return 'Crew Modules';
            if (name.includes('speed')) return 'Speed Modules';
            return 'Other Modules';
        }
        
        return null;
    }

    getItemsBySubcategory(category, subcategory) {
        if (!this.itemCategories[category]) return [];
        
        if (!subcategory) return this.itemCategories[category];
        
        return this.itemCategories[category].filter(item => {
            const itemSubcategory = this.determineSubcategory(item.name, category);
            return itemSubcategory === subcategory;
        });
    }
}

// Create global instance
window.navalDataService = new NavalActionDataService();

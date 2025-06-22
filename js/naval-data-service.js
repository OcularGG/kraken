// Naval Action Marketplace Data Service
class NavalActionDataService {
    constructor() {
        this.ships = [];
        this.items = {};
        this.itemCategories = {};
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

            // Categorize all items
            this.categorizeItems(resources, modules);
            this.loaded = true;

            console.log('Naval Action data loaded successfully');
            console.log(`${this.ships.length} ships loaded`);
            console.log(`${Object.keys(this.itemCategories).length} item categories loaded`);
        } catch (error) {
            console.error('Error loading Naval Action data:', error);
        }
    }

    categorizeItems(resources, modules) {
        this.itemCategories = {
            'Woods': [],
            'Metals': [],
            'Textiles': [],
            'Food & Provisions': [],
            'Cannons & Weapons': [],
            'Ship Modules': [],
            'Trade Goods': [],
            'Crafting Materials': [],
            'Other': []
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

        // Categorize modules
        modules.forEach(item => {
            this.itemCategories['Ship Modules'].push({
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
            name.includes('log') || name.includes('timber')) {
            return 'Woods';
        }

        // Metals and ores
        if (name.includes('iron') || name.includes('copper') || name.includes('gold') ||
            name.includes('silver') || name.includes('tin') || name.includes('ore') ||
            name.includes('ingot') || name.includes('metal')) {
            return 'Metals';
        }

        // Textiles
        if (name.includes('cotton') || name.includes('hemp') || name.includes('flax') ||
            name.includes('silk') || name.includes('wool') || name.includes('cloth') ||
            name.includes('canvas') || name.includes('sail')) {
            return 'Textiles';
        }

        // Food and provisions
        if (name.includes('rum') || name.includes('tobacco') || name.includes('sugar') ||
            name.includes('coffee') || name.includes('tea') || name.includes('spice') ||
            name.includes('salt') || name.includes('fish') || name.includes('beef') ||
            name.includes('pork') || name.includes('grain') || name.includes('water') ||
            name.includes('food') || name.includes('provision')) {
            return 'Food & Provisions';
        }

        // Cannons and weapons
        if (name.includes('cannon') || name.includes('gun') || name.includes('carronade') ||
            name.includes('mortar') || name.includes('swivel') || name.includes('musket') ||
            name.includes('pistol') || name.includes('sword') || name.includes('boarding') ||
            name.includes('round shot') || name.includes('chain shot') || name.includes('grape shot')) {
            return 'Cannons & Weapons';
        }

        // Trade goods
        if (type === 'TradeGood' || name.includes('luxury') || name.includes('rare') ||
            name.includes('exotic') || name.includes('dye') || name.includes('perfume')) {
            return 'Trade Goods';
        }

        // Crafting materials
        if (name.includes('tar') || name.includes('pitch') || name.includes('resin') ||
            name.includes('coal') || name.includes('charcoal') || name.includes('tools') ||
            name.includes('part') || name.includes('component')) {
            return 'Crafting Materials';
        }

        return 'Other';
    }    getShips() {
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
        
        if (category === 'Metals') {
            if (name.includes('iron')) return 'Iron';
            if (name.includes('copper')) return 'Copper';
            if (name.includes('gold')) return 'Gold';
            if (name.includes('silver')) return 'Silver';
            if (name.includes('tin')) return 'Tin';
            return 'Other Metals';
        }
        
        if (category === 'Cannons & Weapons') {
            if (name.includes('carronade')) return 'Carronades';
            if (name.includes('long')) return 'Long Guns';
            if (name.includes('medium')) return 'Medium Guns';
            if (name.includes('musket')) return 'Small Arms';
            return 'Other Weapons';
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

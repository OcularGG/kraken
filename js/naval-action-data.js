/**
 * Naval Action Game Data Service
 * Provides access to ships, resources, and modules data from the Naval Action API
 */
class NavalActionDataService {
    constructor() {
        this.ships = [];
        this.resources = [];
        this.modules = [];
        this.loaded = false;
    }

    /**
     * Load all game data from JSON files
     */
    async loadData() {
        try {
            const [shipsResponse, resourcesResponse, modulesResponse] = await Promise.all([
                fetch('./data/ships.json'),
                fetch('./data/resources.json'),
                fetch('./data/modules.json')
            ]);

            this.ships = await shipsResponse.json();
            this.resources = await resourcesResponse.json();
            this.modules = await modulesResponse.json();
            
            this.loaded = true;
            console.log(`Loaded ${this.ships.length} ships, ${this.resources.length} resources, ${this.modules.length} modules`);
            
            return {
                ships: this.ships.length,
                resources: this.resources.length,
                modules: this.modules.length
            };
        } catch (error) {
            console.error('Error loading Naval Action data:', error);
            return null;
        }
    }

    /**
     * Get all ships
     */
    getShips() {
        return this.ships;
    }

    /**
     * Get ships by class/rating
     */
    getShipsByClass(shipClass) {
        return this.ships.filter(ship => ship.class === shipClass);
    }

    /**
     * Get ships by nationality
     */
    getShipsByNationality(nationality) {
        return this.ships.filter(ship => ship.nationality === nationality);
    }

    /**
     * Search ships by name
     */
    searchShips(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.ships.filter(ship => 
            ship.name.toLowerCase().includes(lowercaseQuery)
        );
    }

    /**
     * Get ship by ID
     */
    getShipById(id) {
        return this.ships.find(ship => ship.id === parseInt(id));
    }

    /**
     * Get all ship classes available
     */
    getShipClasses() {
        const classes = [...new Set(this.ships.map(ship => ship.class))];
        return classes.filter(c => c && c > 0).sort((a, b) => a - b);
    }

    /**
     * Get all nationalities available
     */
    getNationalities() {
        const nationalities = [...new Set(this.ships.map(ship => ship.nationality))];
        return nationalities.filter(n => n && n !== 'Universal').sort();
    }

    /**
     * Get all resources/trade goods
     */
    getResources() {
        return this.resources;
    }

    /**
     * Get all ship modules
     */
    getModules() {
        return this.modules;
    }

    /**
     * Get trading resources (excluding materials)
     */
    getTradingResources() {
        return this.resources.filter(resource => resource.tradeable);
    }

    /**
     * Format price for display
     */
    formatPrice(price) {
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(1)}M`;
        } else if (price >= 1000) {
            return `${(price / 1000).toFixed(1)}K`;
        }
        return price.toString();
    }

    /**
     * Get ship class name
     */
    getShipClassName(shipClass) {
        const classNames = {
            1: '1st Rate',
            2: '2nd Rate', 
            3: '3rd Rate',
            4: '4th Rate',
            5: '5th Rate',
            6: '6th Rate',
            7: '7th Rate'
        };
        return classNames[shipClass] || `Class ${shipClass}`;
    }

    /**
     * Generate ship card HTML
     */
    generateShipCard(ship) {
        return `
            <div class="ship-card" data-id="${ship.id}" data-class="${ship.class}" data-nationality="${ship.nationality}">
                <div class="ship-header">
                    <h3 class="ship-name">${ship.name}</h3>
                    <span class="ship-class">${this.getShipClassName(ship.class)}</span>
                </div>
                <div class="ship-stats">
                    <div class="stat">
                        <span class="stat-label">Price:</span>
                        <span class="stat-value">${this.formatPrice(ship.economy.basePrice)} gold</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Guns:</span>
                        <span class="stat-value">${ship.stats.guns || 'Unknown'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Crew:</span>
                        <span class="stat-value">${ship.stats.crew || 'Unknown'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Structure:</span>
                        <span class="stat-value">${ship.stats.structure || 'Unknown'}</span>
                    </div>
                </div>
                <div class="ship-actions">
                    <button class="btn-select-ship" data-ship-id="${ship.id}">Select Ship</button>
                    <button class="btn-view-details" data-ship-id="${ship.id}">View Details</button>
                </div>
            </div>
        `;
    }

    /**
     * Populate ship selector dropdown
     */
    populateShipSelector(selectElement) {
        selectElement.innerHTML = '<option value="">Select a ship...</option>';
        
        // Group ships by class
        const shipsByClass = {};
        this.ships.forEach(ship => {
            const className = this.getShipClassName(ship.class);
            if (!shipsByClass[className]) {
                shipsByClass[className] = [];
            }
            shipsByClass[className].push(ship);
        });

        // Add optgroups for each class
        Object.keys(shipsByClass).sort().forEach(className => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = className;
            
            shipsByClass[className]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(ship => {
                    const option = document.createElement('option');
                    option.value = ship.id;
                    option.textContent = `${ship.name} (${this.formatPrice(ship.economy.basePrice)} gold)`;
                    optgroup.appendChild(option);
                });
            
            selectElement.appendChild(optgroup);
        });
    }
}

// Create global instance
window.navalActionData = new NavalActionDataService();

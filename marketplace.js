// Naval Action Marketplace JavaScript
class NavalMarketplace {
    constructor() {
        this.currentListing = [];
        this.listings = JSON.parse(localStorage.getItem('navalMarketplaceListings')) || [];
        this.init();
    }

    async init() {
        // Show loading overlay
        this.showLoading();
        
        try {
            // Load Naval Action data
            await window.navalDataService.loadData();
            
            // Initialize form handlers
            this.initializeFormHandlers();
            
            // Populate dropdowns
            this.populateShipDropdown();
            this.populateItemCategoryDropdown();
            
            // Load existing listings
            this.displayListings();
            
            // Hide loading overlay
            this.hideLoading();
            
        } catch (error) {
            console.error('Error initializing marketplace:', error);
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    initializeFormHandlers() {
        // Item type change handler
        document.getElementById('item-type').addEventListener('change', (e) => {
            this.handleItemTypeChange(e.target.value);
        });

        // Item category change handler
        document.getElementById('item-category').addEventListener('change', (e) => {
            this.handleItemCategoryChange(e.target.value);
        });

        // Form submission
        document.getElementById('listing-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });

        // Search and filter handlers
        document.getElementById('search-listings').addEventListener('input', (e) => {
            this.filterListings();
        });

        document.getElementById('filter-type').addEventListener('change', () => {
            this.filterListings();
        });

        document.getElementById('filter-category').addEventListener('change', () => {
            this.filterListings();
        });
    }

    handleItemTypeChange(itemType) {
        const shipSelection = document.getElementById('ship-selection');
        const itemSelection = document.getElementById('item-selection');
        const quantityGroup = document.getElementById('quantity-group');

        // Reset all selections
        shipSelection.style.display = 'none';
        itemSelection.style.display = 'none';
        quantityGroup.style.display = 'none';
        document.getElementById('item-select').style.display = 'none';

        if (itemType === 'ship') {
            shipSelection.style.display = 'block';
        } else if (itemType === 'item') {
            itemSelection.style.display = 'block';
            quantityGroup.style.display = 'block';
        }
    }

    handleItemCategoryChange(category) {
        const itemSelect = document.getElementById('item-select');
        
        if (category) {
            // Populate items for the selected category
            const items = window.navalDataService.getItemsByCategory(category);
            itemSelect.innerHTML = '<option value="">Select item...</option>';
            
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                option.dataset.itemName = item.name;
                itemSelect.appendChild(option);
            });
            
            itemSelect.style.display = 'block';
        } else {
            itemSelect.style.display = 'none';
        }
    }

    populateShipDropdown() {
        const shipSelect = document.getElementById('ship-select');
        const ships = window.navalDataService.getShips();
        
        shipSelect.innerHTML = '<option value="">Select ship...</option>';
        
        ships.forEach(ship => {
            const option = document.createElement('option');
            option.value = ship.id;
            option.textContent = `${ship.name} (${ship.class ? ship.class + ' Rate' : 'Unclassified'})`;
            option.dataset.shipName = ship.name;
            option.dataset.shipClass = ship.class;
            shipSelect.appendChild(option);
        });
    }

    populateItemCategoryDropdown() {
        const categorySelect = document.getElementById('item-category');
        const categories = window.navalDataService.getItemCategories();
        
        categorySelect.innerHTML = '<option value="">Select category...</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    handleFormSubmission() {
        const formData = new FormData(document.getElementById('listing-form'));
        const listingType = formData.get('listing-type');
        const itemType = formData.get('item-type');
        const price = formData.get('price');
        const location = formData.get('location');
        const contact = formData.get('contact');
        const notes = formData.get('notes');

        let itemName = '';
        let quantity = 1;

        if (itemType === 'ship') {
            const shipSelect = document.getElementById('ship-select');
            const selectedOption = shipSelect.options[shipSelect.selectedIndex];
            if (selectedOption && selectedOption.dataset.shipName) {
                itemName = selectedOption.dataset.shipName;
            }
        } else if (itemType === 'item') {
            const itemSelect = document.getElementById('item-select');
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            if (selectedOption && selectedOption.dataset.itemName) {
                itemName = selectedOption.dataset.itemName;
            }
            quantity = parseInt(formData.get('quantity')) || 1;
        }

        if (!itemName) {
            alert('Please select an item to list.');
            return;
        }

        const listing = {
            id: Date.now().toString(),
            type: listingType,
            itemType: itemType,
            itemName: itemName,
            quantity: quantity,
            price: parseInt(price),
            location: location,
            contact: contact,
            notes: notes,
            dateCreated: new Date().toISOString()
        };

        this.listings.push(listing);
        this.saveListings();
        this.displayListings();
        
        // Reset form
        document.getElementById('listing-form').reset();
        this.handleItemTypeChange('');
        
        alert('Listing created successfully!');
    }

    addItemToListing() {
        // This functionality can be expanded for multiple items per listing
        alert('Multiple items per listing feature coming soon!');
    }

    clearCurrentListing() {
        this.currentListing = [];
        document.getElementById('current-listing').style.display = 'none';
    }

    displayListings() {
        const container = document.getElementById('listings-container');
        container.innerHTML = '';

        if (this.listings.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--kraken-white); grid-column: 1 / -1;">No listings found. Create the first one!</p>';
            return;
        }

        this.listings.forEach(listing => {
            const card = this.createListingCard(listing);
            container.appendChild(card);
        });
    }

    createListingCard(listing) {
        const card = document.createElement('div');
        card.className = 'listing-card';
        
        const quantityText = listing.itemType === 'item' && listing.quantity > 1 ? ` (x${listing.quantity})` : '';
        
        card.innerHTML = `
            <div class="listing-type ${listing.type}">${listing.type.toUpperCase()}</div>
            <div class="listing-title">${listing.itemName}${quantityText}</div>
            <div class="listing-price">${listing.price.toLocaleString()} Gold</div>
            <div class="listing-details">
                <div><strong>Type:</strong> ${listing.itemType === 'ship' ? 'Ship' : 'Item'}</div>
                <div><strong>Location:</strong> ${listing.location}</div>
                ${listing.notes ? `<div><strong>Notes:</strong> ${listing.notes}</div>` : ''}
                <div><strong>Posted:</strong> ${new Date(listing.dateCreated).toLocaleDateString()}</div>
            </div>
            <div class="listing-contact">
                <strong>Contact:</strong> ${listing.contact}
            </div>
            <button class="remove-listing" onclick="navalMarketplace.removeListing('${listing.id}')" 
                    style="position: absolute; top: 10px; right: 10px; background: #ff6b6b; color: white; border: none; padding: 5px 8px; cursor: pointer; font-size: 12px;">
                ✕
            </button>
        `;
        
        return card;
    }

    removeListing(listingId) {
        if (confirm('Are you sure you want to remove this listing?')) {
            this.listings = this.listings.filter(listing => listing.id !== listingId);
            this.saveListings();
            this.displayListings();
        }
    }

    filterListings() {
        const searchTerm = document.getElementById('search-listings').value.toLowerCase();
        const typeFilter = document.getElementById('filter-type').value;
        const categoryFilter = document.getElementById('filter-category').value;

        const filteredListings = this.listings.filter(listing => {
            const matchesSearch = listing.itemName.toLowerCase().includes(searchTerm) ||
                                  listing.location.toLowerCase().includes(searchTerm) ||
                                  listing.contact.toLowerCase().includes(searchTerm);
            
            const matchesType = !typeFilter || listing.type === typeFilter;
            const matchesCategory = !categoryFilter || listing.itemType === categoryFilter;

            return matchesSearch && matchesType && matchesCategory;
        });

        this.displayFilteredListings(filteredListings);
    }

    displayFilteredListings(filteredListings) {
        const container = document.getElementById('listings-container');
        container.innerHTML = '';

        if (filteredListings.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--kraken-white); grid-column: 1 / -1;">No listings match your filters.</p>';
            return;
        }

        filteredListings.forEach(listing => {
            const card = this.createListingCard(listing);
            container.appendChild(card);
        });
    }

    saveListings() {
        localStorage.setItem('navalMarketplaceListings', JSON.stringify(this.listings));
    }
}

// Global functions for HTML onclick handlers
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const button = event.target;
    const span = button.querySelector('span');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        span.textContent = '▲';
    } else {
        content.style.display = 'none';
        span.textContent = '▼';
    }
}

function addItemToListing() {
    navalMarketplace.addItemToListing();
}

function clearCurrentListing() {
    navalMarketplace.clearCurrentListing();
}

// Initialize marketplace when page loads
let navalMarketplace;
document.addEventListener('DOMContentLoaded', () => {
    navalMarketplace = new NavalMarketplace();
});

// Naval Action Marketplace JavaScript - Enhanced Version
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

        // Ship selection change handler
        document.getElementById('ship-select').addEventListener('change', (e) => {
            const shipOptions = document.getElementById('ship-options');
            shipOptions.style.display = e.target.value ? 'block' : 'none';
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

        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.handleFilterCategoryChange(e.target.value);
        });

        document.getElementById('filter-subcategory').addEventListener('change', () => {
            this.filterListings();
        });

        // Port autocomplete handler
        const portInput = document.getElementById('port');
        if (portInput) {
            this.initializePortAutocomplete();
        }
    }

    handleItemTypeChange(itemType) {
        const shipSelection = document.getElementById('ship-selection');
        const itemSelection = document.getElementById('item-selection');

        // Reset all selections
        shipSelection.style.display = 'none';
        itemSelection.style.display = 'none';
        document.getElementById('ship-options').style.display = 'none';
        document.getElementById('item-category-items').style.display = 'none';

        if (itemType === 'ship') {
            shipSelection.style.display = 'block';
        } else if (itemType === 'item') {
            itemSelection.style.display = 'block';
        }
    }

    handleItemCategoryChange(category) {
        const itemCategoryItems = document.getElementById('item-category-items');
        const subcategorySelect = document.getElementById('item-subcategory-select');
        
        if (category) {
            // Show item list for category
            this.populateItemsForCategory(category);
            itemCategoryItems.style.display = 'block';

            // Populate subcategories if available
            const subcategories = window.navalDataService.getItemSubcategories(category);
            if (subcategories.length > 0) {
                document.getElementById('item-subcategory').style.display = 'block';
                subcategorySelect.innerHTML = '<option value="">All Items</option>';
                subcategories.forEach(subcat => {
                    const option = document.createElement('option');
                    option.value = subcat;
                    option.textContent = subcat;
                    subcategorySelect.appendChild(option);
                });
            } else {
                document.getElementById('item-subcategory').style.display = 'none';
            }
        } else {
            itemCategoryItems.style.display = 'none';
            document.getElementById('item-subcategory').style.display = 'none';
        }
    }

    handleFilterCategoryChange(category) {
        const subcategoryFilter = document.getElementById('filter-subcategory');
        
        if (category === 'item') {
            // Show subcategory filter
            subcategoryFilter.style.display = 'block';
            this.populateFilterSubcategories();
        } else {
            subcategoryFilter.style.display = 'none';
        }
        
        this.filterListings();
    }

    populateShipDropdown() {
        const shipSelect = document.getElementById('ship-select');
        const ships = window.navalDataService.getShips();
        
        shipSelect.innerHTML = '<option value="">Select ship...</option>';
        
        ships.forEach(ship => {
            const option = document.createElement('option');
            option.value = ship.id;
            
            // Use proper ordinal numbers for rates
            let ratingText = '';
            if (ship.class) {
                const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
                ratingText = ` (${ordinals[ship.class] || ship.class} Rate)`;
            }
            
            option.textContent = `${ship.name}${ratingText}`;
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
    }    populateItemsForCategory(category) {
        const itemsList = document.getElementById('category-items-list');
        const items = window.navalDataService.getItemsByCategory(category);
        const subcategories = window.navalDataService.getItemSubcategories(category);
        
        itemsList.innerHTML = '';
        
        if (subcategories.length > 0) {
            // Group items by subcategory
            subcategories.forEach(subcategory => {
                const subcategoryItems = window.navalDataService.getItemsBySubcategory(category, subcategory);
                
                if (subcategoryItems.length > 0) {
                    // Add subcategory header
                    const headerRow = document.createElement('div');
                    headerRow.className = 'category-subcategory-header';
                    headerRow.innerHTML = `<h4>${subcategory}</h4>`;
                    itemsList.appendChild(headerRow);
                    
                    // Add items for this subcategory
                    subcategoryItems.forEach(item => {
                        const itemRow = this.createItemRow(item);
                        itemsList.appendChild(itemRow);
                    });
                }
            });
        } else {
            // No subcategories, just list all items
            items.forEach(item => {
                const itemRow = this.createItemRow(item);
                itemsList.appendChild(itemRow);
            });
        }
    }    createItemRow(item) {
        const itemRow = document.createElement('div');
        itemRow.className = 'category-item-row';
        itemRow.innerHTML = `
            <div class="category-item-name">${item.name}</div>
            <div class="category-item-controls">
                <input type="number" 
                       min="1" 
                       step="1" 
                       placeholder="Qty" 
                       data-item-id="${item.id}"
                       data-item-name="${item.name}"
                       class="item-quantity"
                       value="">
                <input type="number" 
                       min="0" 
                       step="1" 
                       placeholder="Price/unit" 
                       data-item-id="${item.id}"
                       data-item-name="${item.name}"
                       class="price-per-unit"
                       value="">
            </div>
        `;
        return itemRow;
    }

    populateFilterSubcategories() {
        const subcategoryFilter = document.getElementById('filter-subcategory');
        const allSubcategories = new Set();
        
        // Collect all subcategories from all item categories
        window.navalDataService.getItemCategories().forEach(category => {
            const subcategories = window.navalDataService.getItemSubcategories(category);
            subcategories.forEach(subcat => allSubcategories.add(subcat));
        });
        
        subcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
        Array.from(allSubcategories).sort().forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat;
            option.textContent = subcat;
            subcategoryFilter.appendChild(option);
        });
    }    collectItemsFromForm() {
        const items = [];
        const itemType = document.getElementById('item-type').value;
        
        if (itemType === 'ship') {
            const shipSelect = document.getElementById('ship-select');
            const selectedOption = shipSelect.options[shipSelect.selectedIndex];
            const withCannons = document.getElementById('ship-with-cannons').checked;
            const priceValue = document.getElementById('price').value;
            
            if (selectedOption && selectedOption.dataset.shipName && priceValue) {
                items.push({
                    type: 'ship',
                    name: selectedOption.dataset.shipName,
                    quantity: 1,
                    pricePerUnit: parseInt(priceValue) || 0,
                    withCannons: withCannons
                });
            }
        } else if (itemType === 'item') {
            const quantityInputs = document.querySelectorAll('.item-quantity');
            const priceInputs = document.querySelectorAll('.price-per-unit');
            
            quantityInputs.forEach((qtyInput) => {
                const quantity = parseInt(qtyInput.value);
                const itemName = qtyInput.dataset.itemName;
                const itemId = qtyInput.dataset.itemId;
                
                // Find corresponding price input for this item
                const priceInput = document.querySelector(`.price-per-unit[data-item-id="${itemId}"]`);
                const pricePerUnit = priceInput ? parseInt(priceInput.value) : 0;
                
                if (quantity > 0 && pricePerUnit >= 0 && itemName) {
                    items.push({
                        type: 'item',
                        name: itemName,
                        quantity: quantity,
                        pricePerUnit: pricePerUnit
                    });
                }
            });
        }
        
        return items;
    }

    calculateTotalPrice(items) {
        return items.reduce((total, item) => {
            return total + (item.quantity * item.pricePerUnit);
        }, 0);
    }    handleFormSubmission() {
        console.log('Form submission started');
        
        const formData = new FormData(document.getElementById('listing-form'));
        const listingType = formData.get('listing-type');
        const port = formData.get('port');
        const ingameName = formData.get('ingame-name');
        const discordName = formData.get('discord-name');
        const notes = formData.get('notes');

        console.log('Form data:', { listingType, port, ingameName, discordName });

        const items = this.collectItemsFromForm();
        console.log('Collected items:', items);
        
        if (items.length === 0) {
            alert('Please add at least one item to your listing.');
            return;
        }

        if (!listingType) {
            alert('Please select a listing type (Selling or Buying).');
            return;
        }

        if (!port) {
            alert('Please enter a port.');
            return;
        }

        if (!ingameName || !discordName) {
            alert('Please fill in both your in-game name and Discord name.');
            return;
        }

        const totalPrice = this.calculateTotalPrice(items);

        const listing = {
            id: Date.now().toString(),
            type: listingType,
            items: items,
            totalPrice: totalPrice,
            port: port,
            ingameName: ingameName,
            discordName: discordName,
            notes: notes,
            dateCreated: new Date().toISOString()
        };

        this.listings.push(listing);
        this.saveListings();
        this.displayListings();
        
        // Reset form
        document.getElementById('listing-form').reset();
        this.handleItemTypeChange('');
        
        // Send webhook notification (simplified version)
        this.sendWebhookNotification(listing);
        
        alert('Listing created successfully!');
    }    async sendWebhookNotification(listing) {
        // Simplified webhook with less emojis and total price only
        const embed = {
            title: `New ${listing.type.toUpperCase()} Listing`,
            color: listing.type === 'sell' ? 0x22c55e : 0x3b82f6,
            fields: [
                {
                    name: "Items",
                    value: listing.items.map(item => 
                        `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}${item.withCannons ? ' (with cannons)' : ''}`
                    ).join('\n'),
                    inline: false
                },
                {
                    name: "Total Price",
                    value: `${listing.totalPrice.toLocaleString()} Reals`,
                    inline: true
                },
                {
                    name: "Port",
                    value: listing.port,
                    inline: true
                },
                {
                    name: "Contact",
                    value: `**In-game:** ${listing.ingameName}\n**Discord:** ${listing.discordName}`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        };

        if (listing.notes) {
            embed.fields.push({
                name: "Notes",
                value: listing.notes,
                inline: false
            });
        }

        // Send to Discord webhook
        try {
            const response = await fetch('/api/discord-webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (response.ok) {
                console.log('Successfully sent to Discord webhook');
            } else {
                console.error('Failed to send to Discord webhook:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error sending to Discord webhook:', error);
        }
    }

    displayListings() {
        const container = document.getElementById('listings-container');
        container.innerHTML = '';

        if (this.listings.length === 0) {
            container.innerHTML = '<p class="no-listings">No listings available</p>';
            return;
        }

        this.listings.forEach(listing => {
            const listingCard = this.createListingCard(listing);
            container.appendChild(listingCard);
        });
    }

    createListingCard(listing) {
        const card = document.createElement('div');
        card.className = `listing-card ${listing.type}`;
        
        const itemsText = listing.items.map(item => 
            `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}${item.withCannons ? ' (with cannons)' : ''}`
        ).join(', ');

        card.innerHTML = `
            <div class="listing-header">
                <span class="listing-type ${listing.type}">${listing.type.toUpperCase()}</span>
                <span class="listing-date">${new Date(listing.dateCreated).toLocaleDateString()}</span>
            </div>
            <div class="listing-content">
                <h3 class="listing-title">${itemsText}</h3>
                <div class="listing-price">Total: ${listing.totalPrice.toLocaleString()} Reals</div>
                <div class="listing-location">Port: ${listing.port}</div>
                <div class="listing-contact">
                    <div>In-game: ${listing.ingameName}</div>
                    <div>Discord: ${listing.discordName}</div>
                </div>
                ${listing.notes ? `<div class="listing-notes">${listing.notes}</div>` : ''}
            </div>
            <div class="listing-actions">
                <button onclick="marketplace.deleteListing('${listing.id}')" class="btn-danger">Delete</button>
            </div>
        `;

        return card;
    }

    filterListings() {
        const searchTerm = document.getElementById('search-listings').value.toLowerCase();
        const typeFilter = document.getElementById('filter-type').value;
        const categoryFilter = document.getElementById('filter-category').value;
        const subcategoryFilter = document.getElementById('filter-subcategory').value;

        const filteredListings = this.listings.filter(listing => {
            // Type filter
            if (typeFilter && listing.type !== typeFilter) return false;

            // Category filter
            if (categoryFilter === 'ship') {
                if (!listing.items.some(item => item.type === 'ship')) return false;
            } else if (categoryFilter === 'item') {
                if (!listing.items.some(item => item.type === 'item')) return false;
            }

            // Subcategory filter (for items only)
            if (subcategoryFilter && categoryFilter === 'item') {
                const hasMatchingSubcategory = listing.items.some(item => {
                    if (item.type !== 'item') return false;
                    // Check if item belongs to the selected subcategory
                    const itemCategory = this.findItemCategory(item.name);
                    if (!itemCategory) return false;
                    const itemSubcategory = window.navalDataService.determineSubcategory(item.name, itemCategory);
                    return itemSubcategory === subcategoryFilter;
                });
                if (!hasMatchingSubcategory) return false;
            }

            // Search term filter
            if (searchTerm) {
                const searchText = (
                    listing.items.map(item => item.name).join(' ') + ' ' +
                    listing.port + ' ' +
                    listing.ingameName + ' ' +
                    listing.discordName + ' ' +
                    (listing.notes || '')
                ).toLowerCase();
                
                if (!searchText.includes(searchTerm)) return false;
            }

            return true;
        });

        this.displayFilteredListings(filteredListings);
    }

    findItemCategory(itemName) {
        const categories = window.navalDataService.getItemCategories();
        for (const category of categories) {
            const items = window.navalDataService.getItemsByCategory(category);
            if (items.some(item => item.name === itemName)) {
                return category;
            }
        }
        return null;
    }

    displayFilteredListings(listings) {
        const container = document.getElementById('listings-container');
        container.innerHTML = '';

        if (listings.length === 0) {
            container.innerHTML = '<p class="no-listings">No listings match your filters</p>';
            return;
        }

        listings.forEach(listing => {
            const listingCard = this.createListingCard(listing);
            container.appendChild(listingCard);
        });
    }

    deleteListing(id) {
        if (confirm('Are you sure you want to delete this listing?')) {
            this.listings = this.listings.filter(listing => listing.id !== id);
            this.saveListings();
            this.displayListings();
        }
    }

    saveListings() {
        localStorage.setItem('navalMarketplaceListings', JSON.stringify(this.listings));
    }

    initializePortAutocomplete() {
        const portInput = document.getElementById('port');
        const suggestionsContainer = document.getElementById('port-suggestions');
        let currentSuggestionIndex = -1;

        portInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.hidePortSuggestions();
                return;
            }

            const suggestions = window.navalDataService.searchPorts(query);
            this.showPortSuggestions(suggestions, suggestionsContainer);
        });

        portInput.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.autocomplete-suggestion');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
                this.highlightSuggestion(suggestions, currentSuggestionIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
                this.highlightSuggestion(suggestions, currentSuggestionIndex);
            } else if (e.key === 'Enter' && currentSuggestionIndex >= 0) {
                e.preventDefault();
                const selectedSuggestion = suggestions[currentSuggestionIndex];
                if (selectedSuggestion) {
                    portInput.value = selectedSuggestion.textContent;
                    this.hidePortSuggestions();
                    currentSuggestionIndex = -1;
                }
            } else if (e.key === 'Escape') {
                this.hidePortSuggestions();
                currentSuggestionIndex = -1;
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!portInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                this.hidePortSuggestions();
                currentSuggestionIndex = -1;
            }
        });
    }

    showPortSuggestions(suggestions, container) {
        container.innerHTML = '';
        
        if (suggestions.length === 0) {
            this.hidePortSuggestions();
            return;
        }

        suggestions.forEach((port, index) => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'autocomplete-suggestion';
            suggestionElement.textContent = port.name;
            
            suggestionElement.addEventListener('click', () => {
                document.getElementById('port').value = port.name;
                this.hidePortSuggestions();
            });

            container.appendChild(suggestionElement);
        });

        container.classList.add('active');
    }

    hidePortSuggestions() {
        const suggestionsContainer = document.getElementById('port-suggestions');
        suggestionsContainer.classList.remove('active');
        suggestionsContainer.innerHTML = '';
    }

    highlightSuggestion(suggestions, index) {
        suggestions.forEach((suggestion, i) => {
            suggestion.classList.toggle('highlighted', i === index);
        });
    }
}

// Utility functions
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const button = content.previousElementSibling.querySelector('.btn-toggle span');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        button.textContent = '▲';
    } else {
        content.style.display = 'none';
        button.textContent = '▼';
    }
}

// Initialize marketplace when DOM is loaded
let marketplace;
document.addEventListener('DOMContentLoaded', () => {
    marketplace = new NavalMarketplace();
});

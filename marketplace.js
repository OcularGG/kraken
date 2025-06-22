// Naval Action Marketplace JavaScript
let itemTemplates = [];
let selectedItems = new Map();
let currentListing = null;

// Debug function to clear all marketplace data
function clearMarketplaceData() {
    localStorage.removeItem('krakenListings');
    console.log('Marketplace data cleared');
}

// Initialize marketplace
document.addEventListener('DOMContentLoaded', function() {
    console.log('Marketplace initializing...');
    
    // Check if modals are properly hidden
    const successModal = document.getElementById('successModal');
    const confirmModal = document.getElementById('confirmModal');
    
    console.log('Success modal classes:', successModal.className);
    console.log('Confirm modal classes:', confirmModal.className);
    
    // Ensure modals are hidden
    successModal.classList.add('hidden');
    confirmModal.classList.add('hidden');
    
    showCreateListing();
    
    // Add event listeners
    setupEventListeners();
    
    console.log('Marketplace initialized successfully');
});

function setupEventListeners() {
    // Toggle sections based on checkboxes
    document.getElementById('sellingShip').addEventListener('change', function() {
        document.getElementById('shipSection').classList.toggle('hidden', !this.checked);
    });

    document.getElementById('sellingItems').addEventListener('change', function() {
        document.getElementById('itemsSection').classList.toggle('hidden', !this.checked);
    });

    // Preview ship screenshot
    document.getElementById('shipScreenshot').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('shipPreview');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Load items when server is selected
    document.getElementById('server').addEventListener('change', async function() {
        const server = this.value;
        if (server && document.getElementById('sellingItems').checked) {
            await loadItems(server);
        }
    });

    // Item search
    document.getElementById('itemSearch').addEventListener('input', function() {
        displayItems(this.value);
    });

    // Form submission
    document.getElementById('listingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission();
    });
}

function showCreateListing() {
    document.getElementById('createListingSection').classList.remove('hidden');
    document.getElementById('listingsSection').classList.add('hidden');
}

function showAllListings() {
    document.getElementById('createListingSection').classList.add('hidden');
    document.getElementById('listingsSection').classList.remove('hidden');
    loadAllListings();
}

async function loadItems(server) {
    try {
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '<div class="loading"></div> Loading items...';
        
        const response = await fetch(`https://storage.googleapis.com/nacleanopenworldprodshards/ItemTemplates_${server}.json`);
        const data = await response.json();
        
        itemTemplates = Object.entries(data).map(([id, item]) => ({
            id,
            name: item.Name || item.name || 'Unknown Item',
            type: item.ItemType || item.itemType || 'Unknown'
        }));
        
        displayItems();
    } catch (error) {
        console.error('Error loading items:', error);
        document.getElementById('itemsContainer').innerHTML = '<p style="color: #ffd700;">Error loading items. Please try again.</p>';
    }
}

function displayItems(filter = '') {
    const container = document.getElementById('itemsContainer');
    const filteredItems = itemTemplates.filter(item => 
        item.name.toLowerCase().includes(filter.toLowerCase())
    );
    
    container.innerHTML = filteredItems.slice(0, 100).map(item => `
        <div class="item-entry">
            <div>
                <strong>${item.name}</strong><br>
                <small style="color: #ffd700;">${item.type}</small>
            </div>
            <button class="btn" onclick="toggleItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">
                ${selectedItems.has(item.id) ? 'Remove' : 'Add'}
            </button>
        </div>
    `).join('');
}

function toggleItem(itemId, itemName) {
    if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
    } else {
        selectedItems.set(itemId, {
            name: itemName,
            quantity: 1,
            price: ''
        });
    }
    displayItems(document.getElementById('itemSearch').value);
    updateSelectedItemsList();
}

function updateSelectedItemsList() {
    const container = document.getElementById('selectedItemsContainer');
    const list = document.getElementById('selectedItemsList');
    
    if (selectedItems.size === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    list.innerHTML = Array.from(selectedItems.entries()).map(([id, item]) => `
        <div class="selected-item">
            <div>
                <strong>${item.name}</strong>
                <input type="number" placeholder="Qty" value="${item.quantity}" 
                       onchange="updateItemQuantity('${id}', this.value)"
                       style="width: 60px; margin: 0 10px;">
                <input type="text" placeholder="Price" value="${item.price}"
                       onchange="updateItemPrice('${id}', this.value)"
                       style="width: 120px;">
            </div>
            <span class="remove-item" onclick="toggleItem('${id}', '${item.name.replace(/'/g, "\\'")}')">✖</span>
        </div>
    `).join('');
}

function updateItemQuantity(itemId, quantity) {
    const item = selectedItems.get(itemId);
    if (item) {
        item.quantity = parseInt(quantity) || 1;
    }
}

function updateItemPrice(itemId, price) {
    const item = selectedItems.get(itemId);
    if (item) {
        item.price = price;
    }
}

function handleFormSubmission() {
    const formData = new FormData(document.getElementById('listingForm'));
    const listing = {
        id: generateListingId(),
        captainName: formData.get('captainName'),
        discordUsername: formData.get('discordUsername'),
        server: formData.get('server'),
        sellingShip: document.getElementById('sellingShip').checked,
        sellingItems: document.getElementById('sellingItems').checked,
        shipPrice: formData.get('shipPrice'),
        description: formData.get('description'),
        location: formData.get('location'),
        items: Array.from(selectedItems.values()),
        timestamp: new Date().toISOString()
    };
    
    // Validate required fields
    if (!listing.captainName || !listing.discordUsername || !listing.server) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (!listing.sellingShip && !listing.sellingItems) {
        alert('Please select what you are selling (ship or items)');
        return;
    }
    
    if (listing.sellingShip) {
        const shipFile = document.getElementById('shipScreenshot').files[0];
        if (shipFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                listing.shipImage = e.target.result;
                showConfirmModal(listing);
            };
            reader.readAsDataURL(shipFile);
        } else {
            alert('Please upload a ship screenshot');
            return;
        }
    } else {
        showConfirmModal(listing);
    }
}

function generateListingId() {
    return 'KRAKEN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function showConfirmModal(listing) {
    currentListing = listing;
    const modal = document.getElementById('confirmModal');
    const preview = document.getElementById('modalPreview');
    
    preview.innerHTML = `
        <div style="background: #2d2d2d; padding: 1rem; border-radius: 4px; border: 1px solid #ffd700;">
            <p><strong>Captain:</strong> ${listing.captainName}</p>
            <p><strong>Discord:</strong> ${listing.discordUsername}</p>
            <p><strong>Server:</strong> ${listing.server}</p>
            ${listing.location ? `<p><strong>Location:</strong> ${listing.location}</p>` : ''}
            ${listing.sellingShip ? `<p><strong>Ship Price:</strong> ${listing.shipPrice || 'Negotiable'}</p>` : ''}
            ${listing.sellingItems && listing.items.length > 0 ? `
                <p><strong>Items:</strong></p>
                <ul style="margin-left: 1rem; color: #ffd700;">
                    ${listing.items.map(item => `
                        <li>${item.name} x${item.quantity} - ${item.price || 'Negotiable'}</li>
                    `).join('')}
                </ul>
            ` : ''}
            ${listing.description ? `<p><strong>Description:</strong> ${listing.description}</p>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}

async function confirmListing() {
    try {
        // Save to localStorage
        const listings = JSON.parse(localStorage.getItem('krakenListings') || '[]');
        listings.push(currentListing);
        localStorage.setItem('krakenListings', JSON.stringify(listings));
        
        // Send to Discord webhook
        await sendToDiscord(currentListing);
        
        closeModal();
        showSuccessModal();
    } catch (error) {
        console.error('Error creating listing:', error);
        alert('Error creating listing. Please try again.');
    }
}

async function sendToDiscord(listing) {
    const webhookData = {
        content: `🏴‍☠️ **New KRAKEN Marketplace Listing!** 🏴‍☠️`,
        embeds: [{
            title: '⚓ Naval Action Marketplace - New Listing',
            description: `Captain **${listing.captainName}** has posted a new listing`,
            fields: [
                {
                    name: '👤 Captain',
                    value: listing.captainName,
                    inline: true
                },
                {
                    name: '💬 Discord',
                    value: listing.discordUsername,
                    inline: true
                },
                {
                    name: '🌊 Server',
                    value: getServerName(listing.server),
                    inline: true
                }
            ],
            color: 11961339, // Dark gold color
            timestamp: new Date().toISOString(),
            footer: {
                text: 'KRAKEN Naval Action Marketplace'
            }
        }]
    };

    // Add location if provided
    if (listing.location) {
        webhookData.embeds[0].fields.push({
            name: '📍 Location',
            value: listing.location,
            inline: true
        });
    }

    // Add ship information if selling a ship
    if (listing.sellingShip) {
        webhookData.embeds[0].fields.push({
            name: '🚢 Ship Price',
            value: listing.shipPrice || 'Negotiable',
            inline: true
        });
    }

    // Add items information if selling items
    if (listing.sellingItems && listing.items.length > 0) {
        const itemsList = listing.items
            .slice(0, 5) // Limit to first 5 items
            .map(item => `• ${item.name} x${item.quantity} - ${item.price || 'Negotiable'}`)
            .join('\n');
        
        webhookData.embeds[0].fields.push({
            name: `📦 Items (${listing.items.length} total)`,
            value: itemsList + (listing.items.length > 5 ? '\n• ...and more' : ''),
            inline: false
        });
    }

    // Add description if provided
    if (listing.description) {
        webhookData.embeds[0].fields.push({
            name: '📝 Description',
            value: listing.description.length > 200 ? 
                   listing.description.substring(0, 200) + '...' : 
                   listing.description,
            inline: false
        });
    }

    // Add listing ID
    webhookData.embeds[0].fields.push({
        name: '🆔 Listing ID',
        value: listing.id,
        inline: false
    });

    // Send to Discord
    const response = await fetch('/api/discord-webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
        throw new Error('Failed to send Discord notification');
    }
}

function getServerName(serverCode) {
    const servers = {
        'cleanopenworldprodeu1': 'EU PvP',
        'cleanopenworldprodeu2': 'EU PvE',
        'cleanopenworldprodus2': 'US PvP'
    };
    return servers[serverCode] || serverCode;
}

function showSuccessModal() {
    console.log('showSuccessModal called with currentListing:', currentListing);
    
    if (!currentListing) {
        console.error('showSuccessModal called but currentListing is null');
        return;
    }
    
    const modal = document.getElementById('successModal');
    document.getElementById('listingId').textContent = currentListing.id;
    modal.classList.remove('hidden');
    
    console.log('Success modal should now be visible');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    // Reset form
    document.getElementById('listingForm').reset();
    document.getElementById('shipPreview').classList.add('hidden');
    selectedItems.clear();
    updateSelectedItemsList();
    
    // Hide conditional sections
    document.getElementById('shipSection').classList.add('hidden');
    document.getElementById('itemsSection').classList.add('hidden');
}

function loadAllListings() {
    const container = document.getElementById('listingsContainer');
    const listings = JSON.parse(localStorage.getItem('krakenListings') || '[]');
    
    if (listings.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ffd700;">
                <h3>No listings yet</h3>
                <p>Be the first to create a marketplace listing!</p>
                <button class="btn btn-primary" onclick="showCreateListing()">Create First Listing</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = listings
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(listing => `
            <div class="form-section" style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h3 style="color: #ffd700; margin: 0;">
                        ${listing.captainName} - ${getServerName(listing.server)}
                    </h3>
                    <button class="btn" onclick="viewListing('${listing.id}')" style="margin-left: 1rem;">
                        View Details
                    </button>
                </div>
                <div style="display: grid; gap: 0.5rem;">
                    <p><strong>Discord:</strong> ${listing.discordUsername}</p>
                    ${listing.location ? `<p><strong>Location:</strong> ${listing.location}</p>` : ''}
                    ${listing.sellingShip ? `<p><strong>Ship Price:</strong> ${listing.shipPrice || 'Negotiable'}</p>` : ''}
                    ${listing.sellingItems && listing.items.length > 0 ? `
                        <div>
                            <strong>Items:</strong>
                            <ul style="margin-left: 1rem; color: #ffd700;">
                                ${listing.items.slice(0, 3).map(item => `
                                    <li>${item.name} x${item.quantity} - ${item.price || 'Negotiable'}</li>
                                `).join('')}
                                ${listing.items.length > 3 ? `<li style="color: #999;">...and ${listing.items.length - 3} more items</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                    ${listing.description ? `
                        <p><strong>Description:</strong> ${listing.description.length > 100 ? 
                            listing.description.substring(0, 100) + '...' : 
                            listing.description}</p>
                    ` : ''}
                    <p style="font-size: 0.8rem; color: #999;">
                        <strong>ID:</strong> ${listing.id} | 
                        <strong>Posted:</strong> ${new Date(listing.timestamp).toLocaleDateString()}
                    </p>
                </div>
            </div>
        `).join('');
}

function viewListing(listingId) {
    window.location.href = `listing-viewer.html?id=${listingId}`;
}

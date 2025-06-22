# KRAKEN Naval Action Marketplace Integration

## Overview
The Naval Action Marketplace has been successfully integrated into the main KRAKEN clan website. The marketplace allows players to create listings for ships and items, with automatic Discord notifications using the same webhook system as the clan application form.

## Files Added/Modified

### New Files Created:
- `marketplace.html` - Main marketplace page with listing creation and viewing
- `marketplace.css` - Marketplace-specific styling that extends the main site design
- `marketplace.js` - JavaScript functionality for the marketplace
- `listing-viewer.html` - Individual listing view page (replaced existing)

### Modified Files:
- `index.html` - Added marketplace link to navigation
- `style.css` - Added active navigation state styling

## Features

### 🏴‍☠️ Marketplace Features:
- **Create Listings**: Players can list ships and/or items for sale
- **Ship Screenshots**: Upload images of ships being sold
- **Item Search**: Search through all Naval Action items from official game data
- **Server Selection**: Support for EU PvP, EU PvE, and US PvP servers
- **Discord Integration**: Automatic notifications to the same Discord webhook
- **Listing Management**: View all listings with pagination and details

### 🎨 Design Integration:
- Matches the existing KRAKEN clan website design
- Uses the same color scheme (black, gold, white)
- Responsive design for mobile and desktop
- Neo-brutalist styling consistent with the main site

### 🔗 Discord Integration:
- Uses the same Discord webhook as the application form
- Rich embeds with listing details
- Contact system for buyers to reach sellers
- Automatic notifications when listings are created

## How It Works

### Creating a Listing:
1. Players visit `/marketplace.html`
2. Fill out the listing form with captain name, Discord, server
3. Optionally add ship screenshots and/or select items from the game database
4. Submit the listing, which gets saved locally and posted to Discord

### Viewing Listings:
1. Browse all listings on the marketplace page
2. Click "View Details" to see full listing on individual page
3. Use the contact form to message sellers via Discord

### Discord Notifications:
- New listings automatically post to Discord with rich embeds
- Buyers can contact sellers, triggering Discord messages
- All notifications include KRAKEN branding and listing details

## Technical Details

### Data Storage:
- Listings are stored in browser localStorage with key `krakenListings`
- Ship images are stored as base64 data URLs
- Item data is fetched from official Naval Action API

### Discord Webhook:
- Uses the existing `/api/discord-webhook` endpoint
- Same webhook URL as application form: `https://discord.com/api/webhooks/1386130290640162857/...`
- Rich embeds with appropriate colors and formatting

### Navigation:
- Added "Marketplace" link to main navigation
- Active state styling for current page
- Consistent navigation across all pages

## Future Enhancements

Potential improvements could include:
- Backend database for persistent listing storage
- User authentication and listing management
- Search and filter functionality
- Image hosting service integration
- Trading history and ratings system

## Usage

The marketplace is now fully integrated and ready for use. Players can access it via:
- Direct URL: `/marketplace.html`
- Navigation link from any page
- Individual listings: `/listing-viewer.html?id=LISTING_ID`

All marketplace activity will appear in the Discord channel alongside clan application notifications.

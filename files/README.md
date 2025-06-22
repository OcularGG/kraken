# Naval Action Marketplace

A neo-brutalist web tool for posting ships and items for sale in Naval Action.

## Features

- **Ship Listings**: Upload screenshots of ships with pricing information
- **Item Listings**: Search and select items from the game's database
- **Discord Integration**: Built-in webhook support for buyer-seller communication
- **Captain Profiles**: Track listings by captain name
- **Server-Specific**: Separate listings for EU PvP, EU PvE, and US PvP servers
- **Unique URLs**: Each listing gets a shareable link

## Setup

1. **Frontend Files**:
   - `naval-action-marketplace.html` - Main listing creation page
   - `listing-viewer.html` - Individual listing view page
   - `naval-action-marketplace.css` - Additional styling

2. **Backend Requirements**:
   - Node.js server for webhook handling
   - Database for storing listings (MongoDB, PostgreSQL, etc.)
   - File storage for ship screenshots (AWS S3, local storage, etc.)

3. **Discord Webhook**:
   - Create a webhook in your Discord server
   - Add the webhook URL to your environment variables
   - Configure the webhook handler in `webhook-handler.js`

## Integration

To integrate into your website:

1. Host the HTML files on your web server
2. Set up the backend API endpoints
3. Configure routing for listing URLs (e.g., `/listing/:id`)
4. Set up Discord webhook URL
5. Implement database storage for listings

## API Integration

The tool uses the Naval Action API data from:
- `https://storage.googleapis.com/nacleanopenworldprodshards/ItemTemplates_[server].json`

Server codes:
- `cleanopenworldprodeu1` - EU PvP
- `cleanopenworldprodeu2` - EU PvE
- `cleanopenworldprodus2` - US PvP

## Customization

The neo-brutalist design uses:
- Black (#000000)
- White (#FFFFFF)
- Dark Gold (#B8860B)

Modify the CSS variables in the `:root` selector to change the color scheme.
# KRAKEN - Naval Action RvR Clan Website

A neo-brutalist designed website for the KRAKEN Naval Action clan featuring an ocean-themed hero section, Typeform-style application form, and Discord webhook integration.

## 🚢 Features

- **Neo-brutalist Design**: Modern, bold aesthetic with gold, black, and white color scheme
- **Ocean Hero Section**: Animated background with floating KRAKEN logo
- **Typewriter Effect**: Dynamic ship name cycling in the hero section
- **Interactive Application Form**: Typeform-style conversational application process
- **Naval Action Marketplace**: Real-time trading system with authentic Naval Action ships and items
  - **Real Ship Data**: 100+ authentic ships from Naval Action API
  - **Categorized Items**: Resources, trade goods, cannons, and ship modules organized by category
  - **Advanced Filtering**: Search and filter by type, category, location, and contact
  - **Quantity Management**: Support for bulk item trading with quantity controls
- **Discord Integration**: Applications and marketplace notifications sent to Discord via webhook
- **Responsive Design**: Optimized for all device sizes
- **Sticky Navigation**: Easy access to all site sections

## 🛠 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Fonts**: Space Grotesk (Google Fonts)
- **Integration**: Discord Webhooks
- **Deployment**: Local development server

## 📁 Project Structure

```
kraken/
├── index.html              # Main homepage
├── apply-typeform.html     # Application form page
├── marketplace.html        # Naval Action marketplace page
├── listing-viewer.html     # Individual listing viewer
├── style.css               # All styles and responsive design
├── marketplace.css         # Marketplace-specific styling
├── marketplace.js          # Marketplace functionality
├── discord-proxy.js        # Node.js proxy server for Discord webhook
├── package.json            # Node.js dependencies and scripts
├── krakenlogo.png          # KRAKEN clan logo
├── unnamed.png             # Ocean background image
├── data/                   # Naval Action game data
│   ├── ships.json          # Real ship data from Naval Action API
│   ├── resources.json      # Resources and trade goods data
│   ├── modules.json        # Ship modules and upgrades data
│   └── item-types-summary.json  # Data structure reference
├── js/                     # JavaScript modules
│   └── naval-data-service.js    # Naval Action data service
├── scripts/                # Data extraction scripts
│   ├── extract-game-data.js     # Original data extraction
│   └── extract-clean-data.js    # Clean data extraction
├── api/
│   └── discord-webhook.js  # Vercel serverless function for Discord
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OcularGG/kraken.git
   cd kraken
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Discord proxy server**
   ```bash
   npm start
   ```

4. **Open the website**
   - Open `index.html` in your web browser
   - Or serve it via a local server like Live Server in VS Code

### Discord Webhook Setup

1. Create a Discord webhook in your clan's Discord server
2. Replace the webhook URL in `discord-proxy.js` with your own
3. Restart the proxy server

## 🌐 **Vercel Deployment**

This site is optimized for deployment on Vercel with both static hosting and serverless functions.

### Quick Deploy to Vercel

1. **Connect GitHub to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Select your `kraken` repository

2. **Environment Variables:**
   - In Vercel dashboard, go to your project settings
   - Add these environment variables:
     ```
     DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
     NODE_ENV=production
     ```

3. **Deploy:**
   - Vercel will automatically deploy from your `main` branch
   - Any new commits will trigger automatic deployments

### Local Development with Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally with Vercel functions
vercel dev
```

### Vercel Configuration

The site includes a `vercel.json` configuration that:
- Serves static files (HTML, CSS, images)
- Runs the Discord proxy as a serverless function
- Routes API calls to `/api/discord-webhook`

## 🎮 Clan Features Highlighted

- **Shipbuilding Program**: Member exclusive discounts on all major ships
- **Consumables Crafting**: Bulk discounts on cannonballs, powder, and essentials
- **Dedicated Wiki**: Comprehensive guides and video tutorials
- **Seasoned Veterans**: Battle-tested RvR veterans and fleet commanders
- **Daily PvP & RvR**: 24/7 action with daily raids and operations

## 📋 Application Process

The application form includes:
- Captain name and previous clan history
- Discord verification and server membership
- Player experience level (new/returning)
- Naval rank (for returning players)
- RvR experience and familiarity

## 🔧 Development

### Running in Development Mode

```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Run with auto-restart
npm run dev
```

### Customization

- **Colors**: Modify CSS variables in `style.css`
- **Ships**: Update the ships array in `index.html`
- **Form Questions**: Modify form fields in `apply.html`
- **Discord Webhook**: Update URL in `discord-proxy.js`

## 🌊 Naval Action Clan Info

**KRAKEN** - Elite RvR clan based in Bensalem Port
- Active RvR participation required
- Discord membership mandatory
- Team player mentality essential

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚓ Contact

- **Discord**: Join our KRAKEN Discord server
- **In-Game**: Look for KRAKEN members in Naval Action
- **Location**: Bensalem Port, Naval Action

---

*Set sail with KRAKEN - Dominate the Caribbean seas!* 🏴‍☠️

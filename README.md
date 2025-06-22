# KRAKEN - Naval Action RvR Clan Website

A neo-brutalist designed website for the KRAKEN Naval Action clan featuring an ocean-themed hero section, Typeform-style application form, and Discord webhook integration.

## 🚢 Features

- **Neo-brutalist Design**: Modern, bold aesthetic with gold, black, and white color scheme
- **Ocean Hero Section**: Animated background with floating KRAKEN logo
- **Typewriter Effect**: Dynamic ship name cycling in the hero section
- **Interactive Application Form**: Typeform-style conversational application process
- **Discord Integration**: Applications automatically sent to Discord via webhook
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
├── apply.html              # Application form page
├── style.css               # All styles and responsive design
├── discord-proxy.js        # Node.js proxy server for Discord webhook
├── package.json            # Node.js dependencies and scripts
├── krakenlogo.png          # KRAKEN clan logo
├── unnamed.png             # Ocean background image
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

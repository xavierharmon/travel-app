# 🗺️ Roadtrip Travel App

A progressive web application for tracking U.S. road trips, logging memories, and creating a digital scrapbook of your travels. Built with React and Vite, featuring offline capabilities and cloud backup.

## 📚 About This Project

This is a learning project combining AI-assisted development with hands-on JavaScript exploration. It demonstrates modern web development practices while building a practical tool for travel documentation.

**Tech Stack**: React 18, Vite, Google Maps API, Google Drive API, Service Workers

## ✨ Features

### 🚗 Trip Management
- **Create and Edit Trips**: Log road trips with multiple stops
- **Route Mapping**: Visualize routes on interactive maps
- **Mileage Tracking**: Automatic calculation of trip distances
- **Stop Cards**: Add detailed information about each waypoint
- **Trip Stories**: Create narrative descriptions of your journeys

### 📸 Memories & Photos
- **Photo Upload**: Store and organize trip photos locally
- **Memory Editor**: Write stories and details about specific moments
- **Memory List**: Browse all memories with search functionality
- **Photo Grid**: Visual gallery of trip photos

### 🎮 Games & Entertainment
- **Game Logging**: Track games played during trips
- **Game Editor**: Create and manage game records
- **Game List**: Browse all games with details

### 💾 Data Management
- **Local Storage**: All data stored locally in browser
- **Google Drive Backup**: Automatic backup and restoration
- **Offline Support**: Full functionality without internet (via Service Worker)
- **Data Migration**: Support for legacy data formats

### 🗺️ Advanced Features
- **History Map**: View all your historical travels on a single map
- **Multiple Teams**: Support for different travel groups
- **Route Drawer**: Manual route creation and customization
- **Slideshow**: Visual tour of your travels
- **Image Compression**: Automatic photo optimization
- **Logo URLs**: Team/brand logo integration

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travel-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google APIs** (optional, for maps and backup features)
   - Create a Google Cloud project
   - Enable Maps JavaScript API
   - Enable Google Drive API
   - Add API keys to your environment

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Trips/          # Trip-related components
│   ├── Memories/       # Memory/photo components
│   ├── common/         # Shared UI elements (Button, Modal, etc.)
│   └── ...
├── pages/              # Full page components
│   ├── MapPage/
│   ├── TripListPage/
│   ├── MemoryListPage/
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useTrips.js
│   ├── useMemories.js
│   ├── useGoogleDriveBackup.js
│   └── ...
├── context/            # React Context providers
├── utils/              # Utility functions
│   ├── storage.js
│   ├── haversine.js
│   ├── loadGoogleMaps.js
│   └── ...
├── data/               # Static data (teams, constants)
└── styles/             # Global styles and CSS variables
```

## 🔧 Key Technologies

- **React 18**: UI framework
- **Vite**: Fast build tool and dev server
- **Google Maps API**: Map visualization and routing
- **Google Drive API**: Cloud backup functionality
- **Service Workers**: Offline capability
- **Local Storage API**: Client-side data persistence
- **CSS Modules**: Scoped styling

## 📖 Usage Guide

### Creating a Trip
1. Navigate to **Trips** section
2. Click **New Trip**
3. Add trip details and multiple stops
4. View route on interactive map
5. Save and share your journey

### Adding Memories
1. Go to **Memories** section
2. Click **New Memory**
3. Add photos, write descriptions
4. Attach to specific trips
5. View in slideshow mode

### Backing Up Data
1. Open **Settings** → **Backup**
2. Authenticate with Google Drive
3. Click **Backup to Drive**
4. Restore from backup anytime

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production bundle
- `npm run preview` - Preview production build locally

### Architecture Notes
- **Context API**: Manages global state (Trips, Memories, Games)
- **Custom Hooks**: Encapsulate logic for data operations
- **Auto Sync**: Provider component handles synchronization
- **Responsive Design**: Mobile-first CSS approach

## 🤝 Learning Goals

This project demonstrates:
- React fundamentals and hooks
- State management with Context API
- API integration (Google Maps, Google Drive)
- Progressive Web App concepts
- Local storage and IndexedDB patterns
- Component composition and reusability
- CSS Modules and styling strategies

## 📝 License

Personal learning project

## 🎯 Future Enhancements

- User authentication
- Social sharing features
- Trip cost tracking
- Weather history integration
- Enhanced search and filtering
- Mobile app version
- Collaborative trip planning
# Sudoku Game

A minimal, cute Progressive Web App (PWA) for playing Sudoku with notes feature.

## Features

- 🎮 **4 Difficulty Levels**: Easy, Medium, Hard, Insane
- 📝 **Notes Mode**: Add pencil marks using the same number row
- ↶ **Undo**: Undo your last move
- ⏱️ **Timer**: Track your solve time
- 💾 **Auto-Save**: Resume your game anytime
- 📊 **History**: View all your completed games
- 📱 **Mobile-First**: Optimized for mobile with PWA support
- 🎨 **Minimal Design**: Clean, cute interface

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## How to Play

1. Select difficulty level
2. Click "Play" to start
3. Click a cell to select it
4. Use number buttons to fill cells
5. Toggle "Notes" mode to add pencil marks
6. Click "Erase" to clear a cell
7. Use "Undo" to revert your last move
8. Pause/resume using the pause button

## PWA Installation

This app can be installed on your device:
- **Mobile**: Tap "Add to Home Screen" in your browser menu
- **Desktop**: Click the install icon in your browser's address bar

## Local Storage

The game uses LocalStorage to:
- Save your current game progress
- Store completed games history
- Resume where you left off

## Technologies

- Vanilla JavaScript
- Vite
- PWA (Progressive Web App)
- LocalStorage

## License

MIT

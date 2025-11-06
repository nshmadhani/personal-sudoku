// Game state
const state = {
  currentPuzzle: null,
  solution: null,
  board: Array(81).fill(0),
  notes: Array(81).fill(null).map(() => new Set()),
  given: Array(81).fill(false),
  selectedCell: null,
  notesMode: false,
  difficulty: 'easy',
  highlightedNumber: null,
  history: [],
  timerSeconds: 0,
  timerInterval: null,
  isPaused: false
};

// DOM elements
const playScreenEl = document.getElementById('play-screen');
const gameScreenEl = document.getElementById('game-screen');
const historyScreenEl = document.getElementById('history-screen');
const startBtnEl = document.getElementById('start-btn');
const historyBtnEl = document.getElementById('history-btn');
const backBtnEl = document.getElementById('back-btn');
const historyListEl = document.getElementById('history-list');
const gridEl = document.getElementById('sudoku-grid');
const timerEl = document.getElementById('timer');
const pauseBtnEl = document.getElementById('pause-btn');
const undoBtnEl = document.getElementById('undo-btn');
const notesBtnEl = document.getElementById('notes-btn');
const eraseBtnEl = document.getElementById('erase-btn');
const numBtns = document.querySelectorAll('.num-btn');
const diffBtns = document.querySelectorAll('.diff-btn');

// LocalStorage functions
function saveGameState() {
  const gameState = {
    currentPuzzle: state.currentPuzzle,
    solution: state.solution,
    board: state.board,
    notes: state.notes.map(noteSet => Array.from(noteSet)),
    given: state.given,
    difficulty: state.difficulty,
    timerSeconds: state.timerSeconds,
    timestamp: Date.now()
  };
  localStorage.setItem('sudoku_current_game', JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem('sudoku_current_game');
  if (!saved) return null;

  try {
    const gameState = JSON.parse(saved);
    return {
      ...gameState,
      notes: gameState.notes.map(arr => new Set(arr))
    };
  } catch (e) {
    console.error('Error loading game state:', e);
    return null;
  }
}

function clearGameState() {
  localStorage.removeItem('sudoku_current_game');
}

function saveCompletedGame(difficulty, time) {
  const history = JSON.parse(localStorage.getItem('sudoku_history') || '[]');
  history.unshift({
    difficulty,
    time,
    date: new Date().toISOString()
  });

  // Keep only last 50 games
  if (history.length > 50) {
    history.pop();
  }

  localStorage.setItem('sudoku_history', JSON.stringify(history));
}

function getGameHistory() {
  return JSON.parse(localStorage.getItem('sudoku_history') || '[]');
}

function restoreSavedGame() {
  const savedGame = loadGameState();
  if (!savedGame) return false;

  state.currentPuzzle = savedGame.currentPuzzle;
  state.solution = savedGame.solution;
  state.board = savedGame.board;
  state.notes = savedGame.notes;
  state.given = savedGame.given;
  state.difficulty = savedGame.difficulty;
  state.timerSeconds = savedGame.timerSeconds;
  state.selectedCell = null;
  state.notesMode = false;
  state.highlightedNumber = null;
  state.history = [];

  notesBtnEl.classList.remove('active');
  pauseBtnEl.textContent = '‖';
  pauseBtnEl.title = 'Pause';
  state.isPaused = false;

  renderBoard();
  startTimer();

  return true;
}

// Initialize grid
function initGrid() {
  gridEl.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', () => selectCell(i));
    gridEl.appendChild(cell);
  }
}

// Render board
function renderBoard() {
  const cells = gridEl.querySelectorAll('.cell');

  cells.forEach((cell, i) => {
    const value = state.board[i];
    const isGiven = state.given[i];
    const isSelected = state.selectedCell === i;
    const isHighlighted = state.highlightedNumber && state.board[i] === state.highlightedNumber;

    // Clear classes
    cell.className = 'cell';

    // Add classes
    if (isGiven) cell.classList.add('given');
    if (isSelected) cell.classList.add('selected');
    if (isHighlighted && value !== 0) cell.classList.add('highlighted');
    if (value !== 0 && !isGiven) cell.classList.add('user');

    // Render content
    if (value !== 0) {
      cell.textContent = value;
      cell.innerHTML = value;
    } else if (state.notes[i].size > 0) {
      // Render notes
      const notesEl = document.createElement('div');
      notesEl.className = 'notes';
      for (let n = 1; n <= 9; n++) {
        const noteSpan = document.createElement('span');
        noteSpan.textContent = state.notes[i].has(n) ? n : '';
        notesEl.appendChild(noteSpan);
      }
      cell.innerHTML = '';
      cell.appendChild(notesEl);
    } else {
      cell.textContent = '';
    }
  });
}

// Select cell
function selectCell(index) {
  state.selectedCell = index;

  // Update highlighted number
  if (state.board[index] !== 0) {
    state.highlightedNumber = state.board[index];
  } else {
    state.highlightedNumber = null;
  }

  renderBoard();
}

// Timer functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer() {
  timerEl.textContent = formatTime(state.timerSeconds);
}

function startTimer() {
  state.timerSeconds = 0;
  state.isPaused = false;
  updateTimer();

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }

  state.timerInterval = setInterval(() => {
    if (!state.isPaused) {
      state.timerSeconds++;
      updateTimer();

      // Save game state every 10 seconds
      if (state.timerSeconds % 10 === 0) {
        saveGameState();
      }
    }
  }, 1000);
}

function togglePause() {
  state.isPaused = !state.isPaused;

  if (state.isPaused) {
    pauseBtnEl.textContent = '▶';
    pauseBtnEl.title = 'Resume';
  } else {
    pauseBtnEl.textContent = '‖';
    pauseBtnEl.title = 'Pause';
  }
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

// Check if puzzle is completed
function checkCompletion() {
  // Check if board is full
  if (state.board.some(v => v === 0)) return false;

  // Check if solution matches
  const isCorrect = state.board.every((val, idx) => val === state.solution[idx]);

  if (isCorrect) {
    stopTimer();
    saveCompletedGame(state.difficulty, state.timerSeconds);
    clearGameState();
    setTimeout(() => {
      alert(`🎉 Congratulations! You solved it in ${formatTime(state.timerSeconds)}!`);
    }, 300);
    return true;
  }

  return false;
}

// Save current state to history
function saveState() {
  const snapshot = {
    board: [...state.board],
    notes: state.notes.map(noteSet => new Set(noteSet)),
    selectedCell: state.selectedCell
  };
  state.history.push(snapshot);

  // Limit history to last 50 moves
  if (state.history.length > 50) {
    state.history.shift();
  }
}

// Input number
function inputNumber(num) {
  if (state.selectedCell === null) return;
  if (state.given[state.selectedCell]) return;

  const index = state.selectedCell;

  // Save state before making changes
  saveState();

  if (state.notesMode) {
    // Toggle note
    if (state.notes[index].has(num)) {
      state.notes[index].delete(num);
    } else {
      state.notes[index].add(num);
    }
  } else {
    // Set number
    state.board[index] = num;
    state.notes[index].clear();
    state.highlightedNumber = num;

    // Add pop animation
    const cell = gridEl.querySelector(`[data-index="${index}"]`);
    cell.classList.add('pop');
    setTimeout(() => cell.classList.remove('pop'), 300);

    // Check if puzzle is completed
    checkCompletion();
  }

  renderBoard();
  saveGameState();
}

// Erase cell
function eraseCell() {
  if (state.selectedCell === null) return;
  if (state.given[state.selectedCell]) return;

  const index = state.selectedCell;

  // Save state before making changes
  saveState();

  state.board[index] = 0;
  state.notes[index].clear();
  state.highlightedNumber = null;

  renderBoard();
  saveGameState();
}

// Undo last move
function undo() {
  if (state.history.length === 0) return;

  const previousState = state.history.pop();

  state.board = previousState.board;
  state.notes = previousState.notes;
  state.selectedCell = previousState.selectedCell;

  // Update highlighted number
  if (state.selectedCell !== null && state.board[state.selectedCell] !== 0) {
    state.highlightedNumber = state.board[state.selectedCell];
  } else {
    state.highlightedNumber = null;
  }

  renderBoard();
}

// Toggle notes mode
function toggleNotesMode() {
  state.notesMode = !state.notesMode;
  notesBtnEl.classList.toggle('active', state.notesMode);
}

// Load puzzle
function loadPuzzle(puzzleString, solutionString) {
  // Reset state
  state.currentPuzzle = puzzleString;
  state.solution = solutionString.split('').map(c => parseInt(c));
  state.board = puzzleString.split('').map(c => c === '.' ? 0 : parseInt(c));
  state.given = state.board.map(v => v !== 0);
  state.notes = Array(81).fill(null).map(() => new Set());
  state.selectedCell = null;
  state.notesMode = false;
  state.highlightedNumber = null;
  state.history = [];

  notesBtnEl.classList.remove('active');
  pauseBtnEl.textContent = '‖';
  pauseBtnEl.title = 'Pause';
  state.isPaused = false;

  renderBoard();
  startTimer();
  saveGameState();
}

// Load puzzle from JSON
async function loadPuzzleFromJSON(difficulty) {
  try {
    const response = await fetch('/puzzles.json');
    const data = await response.json();
    const puzzles = data[difficulty];

    if (puzzles && puzzles.length > 0) {
      const randomIndex = Math.floor(Math.random() * puzzles.length);
      const puzzle = puzzles[randomIndex];
      loadPuzzle(puzzle.puzzle, puzzle.solution);
    }
  } catch (error) {
    console.error('Error loading puzzle:', error);
    // Fallback to a default puzzle
    loadDefaultPuzzle();
  }
}

// Default puzzle (easy)
function loadDefaultPuzzle() {
  const puzzle = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
  const solution = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
  loadPuzzle(puzzle, solution);
}

// Change difficulty
function changeDifficulty(difficulty) {
  state.difficulty = difficulty;

  // Update active button
  diffBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === difficulty);
  });
}

// Start game
function startGame() {
  playScreenEl.classList.add('hidden');
  gameScreenEl.classList.remove('hidden');
  gameScreenEl.classList.add('fade-in');

  // Check if there's a saved game
  const savedGame = loadGameState();
  if (savedGame) {
    const resume = confirm('You have a game in progress. Resume it?');
    if (resume) {
      restoreSavedGame();
      return;
    }
  }

  loadPuzzleFromJSON(state.difficulty);
}

// Unselect cell
function unselectCell() {
  state.selectedCell = null;
  state.highlightedNumber = null;
  renderBoard();
}

// Show history
function showHistory() {
  playScreenEl.classList.add('hidden');
  historyScreenEl.classList.remove('hidden');
  renderHistory();
}

// Back to play screen
function backToPlay() {
  historyScreenEl.classList.add('hidden');
  playScreenEl.classList.remove('hidden');
}

// Render history list
function renderHistory() {
  const history = getGameHistory();

  if (history.length === 0) {
    historyListEl.innerHTML = '<div class="history-empty">No games played yet. Start playing to build your history!</div>';
    return;
  }

  historyListEl.innerHTML = history.map(game => {
    const date = new Date(game.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = formatTime(game.time);

    return `
      <div class="history-item">
        <div class="history-info">
          <div class="history-difficulty">${game.difficulty}</div>
          <div class="history-date">${dateStr}</div>
        </div>
        <div class="history-time">${timeStr}</div>
      </div>
    `;
  }).join('');
}

// Event listeners
startBtnEl.addEventListener('click', startGame);
historyBtnEl.addEventListener('click', showHistory);
backBtnEl.addEventListener('click', backToPlay);

pauseBtnEl.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePause();
});

undoBtnEl.addEventListener('click', (e) => {
  e.stopPropagation();
  undo();
});

notesBtnEl.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleNotesMode();
});

eraseBtnEl.addEventListener('click', (e) => {
  e.stopPropagation();
  eraseCell();
});

numBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const num = parseInt(btn.dataset.num);
    inputNumber(num);
  });
});

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    changeDifficulty(btn.dataset.level);
  });
});

// Click outside grid to unselect
document.addEventListener('click', (e) => {
  const clickedInsideGrid = gridEl.contains(e.target);
  const clickedInsideControls = e.target.closest('.controls');

  if (!clickedInsideGrid && !clickedInsideControls) {
    unselectCell();
  }
});

// Keyboard support (optional, for desktop)
document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '9') {
    inputNumber(parseInt(e.key));
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    eraseCell();
  } else if (e.key === 'n' || e.key === 'N') {
    toggleNotesMode();
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
  }
});

// Initialize
initGrid();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

/* Emotion Explorer - Card Matching Game */
// ===================== DATA ===================== //
const EMOTIONS = [
  {
    type: 'happy',
    situations: [
      'You get a surprise gift\nfrom your best friend.\nYou smile really big!',
      'Your family goes to\nthe ice cream shop.\nYou pick your favorite flavor!'
    ]
  },
  {
    type: 'sad',
    situations: [
      'Your pet goldfish\ngoes to heaven.\nYou miss them so much.',
      'Your best friend moves\nto a different city.\nYou feel lonely without them.'
    ]
  },
  {
    type: 'angry',
    situations: [
      'Someone breaks your\nfavorite toy on purpose.\nYour face gets hot and red.',
      'Your sibling takes your\nsnack without asking.\nYou clench your fists tight.'
    ]
  },
  {
    type: 'surprised',
    situations: [
      'You open your lunchbox\nand find a special treat.\nYour eyes go wide!',
      "Dad jumps out and says\n'Surprise!' for your birthday.\nYour mouth drops open!"
    ]
  },
  {
    type: 'excited',
    situations: [
      'Tomorrow is your first\nday at the theme park!\nYou can barely sleep tonight.',
      "You find out you're getting\na new puppy next week!\nYou bounce up and down!"
    ]
  },
  {
    type: 'calm',
    situations: [
      'You sit by the quiet lake\nwatching ducks swim by.\nYou feel peaceful and still.',
      'Mom reads you a story\nbefore bedtime.\nYou feel safe and relaxed.'
    ]
  },
  {
    type: 'scared',
    situations: [
      'You hear a loud thunder\nduring the storm.\nYou hide under the covers.',
      'You see a big spider\ncrawling on your arm.\nYour heart beats very fast!'
    ]
  },
  {
    type: 'love',
    situations: [
      'Your little sister falls\nand starts crying.\nYou give her a big hug.',
      'You see a stray cat\nlooking hungry and cold.\nYou want to help it.'
    ]
  },
  {
    type: 'confused',
    situations: [
      'Your math homework\nhas too many hard problems.\nYou scratch your head puzzled.',
      "Everyone is speaking\na language you don't know.\nYou feel lost and mixed up."
    ]
  },
  {
    type: 'proud',
    situations: [
      'You win first place\nin the spelling bee!\nYou stand up tall and smile.',
      'You help your grandma\ncarry heavy groceries.\nYou feel good inside.'
    ]
  },
  {
    type: 'tired',
    situations: [
      'You stayed up too late\nreading your favorite book.\nYour eyes feel heavy now.',
      'After running around\nall day at the playground.\nYou yawn really big.'
    ]
  },
  {
    type: 'laughing',
    situations: [
      "Your friend tells you\nthe silliest joke ever.\nYou can't stop giggling!",
      'You watch funny cat videos\nthat make you laugh.\nYour belly starts to hurt!'
    ]
  }
];

const LEVELS = [
  { level: 1, pairs: 2, cards: 4 },
  { level: 2, pairs: 3, cards: 6 },
  { level: 3, pairs: 4, cards: 8 },
  { level: 4, pairs: 5, cards: 10 },
  { level: 5, pairs: 6, cards: 12 },
  { level: 6, pairs: 7, cards: 14 }
];

// ===================== AUDIO SYSTEM ===================== //
class Sound { // simple wrapper for Web Audio
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Keep one gain node for volume control
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15; // global volume
    this.masterGain.connect(this.ctx.destination);
  }

  playTone(frequency, duration = 0.2, type = 'sine', when = 0) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime + when);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Envelope
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime + when);
    gainNode.gain.linearRampToValueAtTime(1, this.ctx.currentTime + when + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + when + duration);

    osc.start(this.ctx.currentTime + when);
    osc.stop(this.ctx.currentTime + when + duration + 0.02);
  }

  // sequences
  flip() {
    this.playTone(330, 0.15, 'triangle');
  }
  match() {
    this.playTone(440, 0.15, 'triangle');
    this.playTone(554.37, 0.15, 'triangle', 0.18);
  }
  success() {
    this.playTone(523.25, 0.18, 'sine'); // C5
    this.playTone(659.25, 0.18, 'sine', 0.2); // E5
    this.playTone(783.99, 0.25, 'sine', 0.4); // G5
  }
  error() {
    this.playTone(220, 0.3, 'sawtooth');
  }
}

const sounds = new Sound();

// ===================== UTILITIES ===================== //

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateDeck(level) {
  const { pairs } = LEVELS.find(lvl => lvl.level === level);
  const selectedEmotions = shuffleArray(EMOTIONS).slice(0, pairs);

  let deck = [];
  selectedEmotions.forEach(emotion => {
    const [situation1, situation2] = shuffleArray(emotion.situations);
    deck.push({ id: crypto.randomUUID(), type: emotion.type, text: situation1, flipped: false, matched: false });
    deck.push({ id: crypto.randomUUID(), type: emotion.type, text: situation2, flipped: false, matched: false });
  });
  return shuffleArray(deck);
}

// ===================== GAME STATE ===================== //
const state = {
  level: 1,
  deck: [],
  flippedCards: [], // store element references
  moves: 0,
  matches: 0
};

// ===================== DOM ELEMENTS ===================== //
const levelButtons = document.querySelectorAll('.level-btn');
const startGameBtn = document.getElementById('startGameBtn');
const newGameBtn = document.getElementById('newGameBtn');
const backToLevelsBtn = document.getElementById('backToLevels');
const cardGrid = document.getElementById('cardGrid');
const gameSettingsEl = document.getElementById('gameSettings');
const gameBoardEl = document.getElementById('gameBoard');
const gameStatsEl = document.getElementById('gameStats');
const movesCountEl = document.getElementById('movesCount');
const progressPercentEl = document.getElementById('progressPercent');
const currentLevelEl = document.getElementById('currentLevel');
const successModalEl = document.getElementById('successModal');
const completedLevelEl = document.getElementById('completedLevel');
const finalMovesEl = document.getElementById('finalMoves');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

// ===================== EVENT LISTENERS ===================== //
levelButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    levelButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.level = parseInt(btn.dataset.level, 10);
    startGameBtn.disabled = false;
  });
});

startGameBtn.addEventListener('click', () => startGame(state.level));
newGameBtn.addEventListener('click', () => startGame(state.level));
backToLevelsBtn.addEventListener('click', () => {
  resetUI();
});
nextLevelBtn.addEventListener('click', () => {
  const next = state.level < 6 ? state.level + 1 : 1;
  state.level = next;
  updateLevelSelectionUI();
  hideSuccessModal();
  startGame(next);
});
playAgainBtn.addEventListener('click', () => {
  hideSuccessModal();
  startGame(state.level);
});

// ===================== GAME FUNCTIONS ===================== //
function startGame(level) {
  // Prepare state
  state.deck = generateDeck(level);
  state.flippedCards = [];
  state.moves = 0;
  state.matches = 0;
  updateStats();

  // Render cards
  renderDeck(state.deck);

  // UI toggles
  gameSettingsEl.classList.add('hidden');
  gameBoardEl.classList.remove('hidden');
  gameStatsEl.classList.remove('hidden');

  currentLevelEl.textContent = level;
}

function renderDeck(deck) {
  // Clear
  cardGrid.innerHTML = '';
  // Set level class for grid layout
  cardGrid.className = ''; // reset
  cardGrid.id = 'cardGrid'; // ensure id persists (className resets all)
  cardGrid.classList.add(`level-${state.level}`);

  deck.forEach(cardData => {
    const cardEl = createCardElement(cardData);
    cardGrid.appendChild(cardEl);
  });
}

function createCardElement(card) {
  const outer = document.createElement('button');
  outer.className = 'game-card focus:outline-none';
  outer.setAttribute('data-id', card.id);
  outer.setAttribute('tabindex', '0');

  const inner = document.createElement('div');
  inner.className = 'card-inner';

  const front = document.createElement('div');
  front.className = 'card-front';
  const situationP = document.createElement('p');
  situationP.className = 'situation-text';
  situationP.textContent = card.text;
  front.appendChild(situationP);
  const indicator = document.createElement('div');
  indicator.className = 'match-indicator';
  indicator.innerHTML = '✓';
  front.appendChild(indicator);

  const back = document.createElement('div');
  back.className = 'card-back';
  back.textContent = '🎭 Emotion Explorer';

  inner.appendChild(back);
  inner.appendChild(front);
  outer.appendChild(inner);

  // click handler
  outer.addEventListener('click', () => handleCardFlip(outer));

  return outer;
}

function handleCardFlip(cardEl) {
  const id = cardEl.getAttribute('data-id');
  const cardData = state.deck.find(c => c.id === id);
  if (cardData.flipped || cardData.matched) return; // ignore
  if (state.flippedCards.length === 2) return; // wait for evaluation

  // Flip the card visually
  flipCard(cardEl, cardData);

  // Play flip audio
  sounds.flip();

  state.flippedCards.push({ el: cardEl, data: cardData });

  if (state.flippedCards.length === 2) {
    evaluateFlippedCards();
  }
}

function flipCard(cardEl, cardData) {
  cardEl.classList.add('flipped');
  cardData.flipped = true;
}

function unflipCard(cardEl, cardData) {
  cardEl.classList.remove('flipped');
  cardData.flipped = false;
}

function evaluateFlippedCards() {
  const [cardA, cardB] = state.flippedCards;
  state.moves += 1;
  updateStats();

  if (cardA.data.type === cardB.data.type) {
    // Match
    cardA.data.matched = true;
    cardB.data.matched = true;
    cardA.el.classList.add('matched', 'match-pulse');
    cardB.el.classList.add('matched', 'match-pulse');
    sounds.match();

    state.matches += 1;
    updateStats();

    // Check completion
    const totalPairs = LEVELS.find(l => l.level === state.level).pairs;
    if (state.matches === totalPairs) {
      // Victory
      setTimeout(() => endGameSuccess(), 600);
    }

    // reset flipped
    state.flippedCards = [];
  } else {
    // Not a match
    cardA.el.classList.add('shake');
    cardB.el.classList.add('shake');
    sounds.error();

    setTimeout(() => {
      cardA.el.classList.remove('shake');
      cardB.el.classList.remove('shake');
      unflipCard(cardA.el, cardA.data);
      unflipCard(cardB.el, cardB.data);
      state.flippedCards = [];
    }, 800);
  }
}

function updateStats() {
  movesCountEl.textContent = state.moves;
  const totalPairs = LEVELS.find(l => l.level === state.level).pairs;
  const percent = Math.round((state.matches / totalPairs) * 100);
  progressPercentEl.textContent = `${percent}%`;
}

function endGameSuccess() {
  sounds.success();
  completedLevelEl.textContent = state.level;
  finalMovesEl.textContent = state.moves;
  successModalEl.classList.remove('hidden');

  // Hide next level if we're at level 6
  if (state.level === 6) {
    nextLevelBtn.classList.add('hidden');
  } else {
    nextLevelBtn.classList.remove('hidden');
  }
}

function hideSuccessModal() {
  successModalEl.classList.add('hidden');
}

function resetUI() {
  gameBoardEl.classList.add('hidden');
  gameStatsEl.classList.add('hidden');
  gameSettingsEl.classList.remove('hidden');
  // reset selections
  levelButtons.forEach(b => b.classList.remove('selected'));
  startGameBtn.disabled = true;
  cardGrid.innerHTML = '';
}

function updateLevelSelectionUI() {
  levelButtons.forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.level, 10) === state.level);
  });
  startGameBtn.disabled = false;
}

// ===================== KEYBOARD ACCESSIBILITY ===================== //
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !successModalEl.classList.contains('hidden')) {
    hideSuccessModal();
  }
});

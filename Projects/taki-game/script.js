const STORAGE_KEY = "taki_2p_scores";

const TYPES = {
  NUMBER: "number",
  STOP: "stop",
  PLUS: "plus",
  PLUS2: "plus2",
  REVERSE: "reverse",
  TAKI: "taki",
  CHANGE_COLOR: "changeColor",
};

const COLORS = ["red", "blue", "green", "yellow"];

const COLOR_LABELS = {
  red: "אדום",
  blue: "כחול",
  green: "ירוק",
  yellow: "צהוב",
};

const state = {
  deck: [],
  pile: [],
  players: {
    1: [],
    2: [],
  },
  currentPlayer: 1,
  scores: loadScores(),
  started: false,
  winner: null,
  message: 'לחצי על "משחק חדש" כדי להתחיל.',
};

const els = {
  topHand: document.getElementById("topHand"),
  bottomHand: document.getElementById("bottomHand"),
  pileCardWrap: document.getElementById("pileCardWrap"),
  turnLabel: document.getElementById("turnLabel"),
  deckCount: document.getElementById("deckCount"),
  score1: document.getElementById("score1"),
  score2: document.getElementById("score2"),
  messageBox: document.getElementById("messageBox"),
  newGameBtn: document.getElementById("newGameBtn"),
  drawBtn: document.getElementById("drawBtn"),
  resetScoresBtn: document.getElementById("resetScoresBtn"),
  deckBtn: document.getElementById("deckBtn"),
};

function loadScores() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { 1: 0, 2: 0 };

  try {
    const parsed = JSON.parse(saved);
    return {
      1: Number(parsed[1]) || 0,
      2: Number(parsed[2]) || 0,
    };
  } catch {
    return { 1: 0, 2: 0 };
  }
}

function saveScores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scores));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck() {
  const deck = [];

  COLORS.forEach((color) => {
    deck.push({ id: uid(), type: TYPES.NUMBER, color, value: 0 });

    for (let n = 1; n <= 9; n++) {
      deck.push({ id: uid(), type: TYPES.NUMBER, color, value: n });
      deck.push({ id: uid(), type: TYPES.NUMBER, color, value: n });
    }

    [TYPES.STOP, TYPES.PLUS, TYPES.PLUS2, TYPES.REVERSE, TYPES.TAKI].forEach((type) => {
      deck.push({ id: uid(), type, color });
      deck.push({ id: uid(), type, color });
    });
  });

  for (let i = 0; i < 4; i++) {
    deck.push({ id: uid(), type: TYPES.CHANGE_COLOR, color: null });
  }

  return shuffle(deck);
}

function startGame() {
  state.deck = createDeck();
  state.players[1] = [];
  state.players[2] = [];
  state.pile = [];
  state.currentPlayer = 1;
  state.winner = null;
  state.started = true;

  for (let i = 0; i < 8; i++) {
    state.players[1].push(state.deck.pop());
    state.players[2].push(state.deck.pop());
  }

  let first = state.deck.pop();

  while (first.type === TYPES.CHANGE_COLOR) {
    state.deck.unshift(first);
    state.deck = shuffle(state.deck);
    first = state.deck.pop();
  }

  state.pile.push(first);
  state.message = "המשחק התחיל. שחקן 1 מתחיל.";
  render();
}

function topCard() {
  return state.pile[state.pile.length - 1];
}

function currentHand() {
  return state.players[state.currentPlayer];
}

function nextPlayer() {
  return state.currentPlayer === 1 ? 2 : 1;
}

function refillDeckIfNeeded() {
  if (state.deck.length > 0) return;
  if (state.pile.length <= 1) return;

  const lead = state.pile.pop();
  state.deck = shuffle(state.pile);
  state.pile = [lead];
}

function drawOneCard(player) {
  refillDeckIfNeeded();
  if (!state.deck.length) return;
  state.players[player].push(state.deck.pop());
}

function cardLabel(card) {
  if (card.type === TYPES.NUMBER) return String(card.value);
  if (card.type === TYPES.STOP) return "עצור";
  if (card.type === TYPES.PLUS) return "+";
  if (card.type === TYPES.PLUS2) return "+2";
  if (card.type === TYPES.REVERSE) return "↺";
  if (card.type === TYPES.TAKI) return "TAKI";
  if (card.type === TYPES.CHANGE_COLOR) return "שנה\nצבע";
  return "";
}

function cardFooter(card) {
  if (card.type === TYPES.NUMBER) return COLOR_LABELS[card.color];
  if (card.type === TYPES.STOP) return "דלג";
  if (card.type === TYPES.PLUS) return "עוד תור";
  if (card.type === TYPES.PLUS2) return "קח 2";
  if (card.type === TYPES.REVERSE) return "שנה כיוון";
  if (card.type === TYPES.TAKI) return "רצף צבע";
  if (card.type === TYPES.CHANGE_COLOR) return "בחרי צבע";
  return "";
}

function sameShapeOrNumber(a, b) {
  if (a.type === TYPES.NUMBER && b.type === TYPES.NUMBER) {
    return a.value === b.value;
  }
  return a.type === b.type;
}

function isPlayable(card) {
  const lead = topCard();
  if (!lead) return true;

  if (card.type === TYPES.CHANGE_COLOR) return true;
  if (lead.type === TYPES.CHANGE_COLOR) {
    return card.color === lead.chosenColor || card.type === TYPES.CHANGE_COLOR;
  }

  return card.color === lead.color || sameShapeOrNumber(card, lead);
}

function chooseColor() {
  const input = prompt("בחרי צבע: אדום / כחול / ירוק / צהוב");
  if (!input) return null;

  const clean = input.trim().toLowerCase();

  if (clean === "אדום") return "red";
  if (clean === "כחול") return "blue";
  if (clean === "ירוק") return "green";
  if (clean === "צהוב") return "yellow";

  return null;
}

function playCard(cardId) {
  if (state.winner) return;

  const hand = currentHand();
  const index = hand.findIndex((c) => c.id === cardId);
  if (index === -1) return;

  const card = hand[index];
  if (!isPlayable(card)) return;

  hand.splice(index, 1);

  if (card.type === TYPES.CHANGE_COLOR) {
    const color = chooseColor();
    if (!color) {
      hand.splice(index, 0, card);
      state.message = "לא נבחר צבע.";
      render();
      return;
    }
    card.chosenColor = color;
  }

  state.pile.push(card);

  if (hand.length === 0) {
    state.winner = state.currentPlayer;
    state.scores[state.currentPlayer] += 1;
    saveScores();
    state.message = `שחקן ${state.currentPlayer} ניצח!`;
    render();
    return;
  }

  handleCardEffect(card);
  render();
}

function handleCardEffect(card) {
  if (card.type === TYPES.PLUS) {
    state.message = `שחקן ${state.currentPlayer} שיחק פלוס ומשחק שוב.`;
    return;
  }

  if (card.type === TYPES.STOP) {
    state.message = `שחקן ${state.currentPlayer} שיחק עצור, ולכן ממשיך שוב.`;
    return;
  }

  if (card.type === TYPES.REVERSE) {
    state.message = `שחקן ${state.currentPlayer} שיחק שנה כיוון. במשחק של 2 שחקנים זה כמו עוד תור.`;
    return;
  }

  if (card.type === TYPES.PLUS2) {
    const target = nextPlayer();
    drawOneCard(target);
    drawOneCard(target);
    state.message = `שחקן ${target} קיבל 2 קלפים.`;
    endTurn();
    return;
  }

  if (card.type === TYPES.TAKI) {
    state.message = `שיחקת TAKI.`;
    endTurn();
    return;
  }

  if (card.type === TYPES.CHANGE_COLOR) {
    state.message = `הצבע הוחלף ל-${COLOR_LABELS[card.chosenColor]}.`;
    endTurn();
    return;
  }

  endTurn();
}

function endTurn() {
  state.currentPlayer = nextPlayer();
}

function drawCardForCurrentPlayer() {
  if (state.winner || !state.started) return;
  drawOneCard(state.currentPlayer);
  state.message = `שחקן ${state.currentPlayer} משך קלף.`;
  endTurn();
  render();
}

function createVisibleCard(card, clickable = false) {
  const btn = document.createElement("button");
  btn.type = "button";
  const colorClass = card.type === TYPES.CHANGE_COLOR ? "back-card" : card.color;
  btn.className = `taki-card ${colorClass}`;

  if (!clickable) btn.classList.add("disabled");

  const label = cardLabel(card);
  const footer = card.type === TYPES.CHANGE_COLOR && card.chosenColor
    ? `צבע: ${COLOR_LABELS[card.chosenColor]}`
    : cardFooter(card);

  btn.innerHTML = `
    <div class="inner">
      <div class="corner">${label.replace("\n", " ")}</div>
      <div class="center-text">${label}</div>
      <div class="footer">${footer}</div>
    </div>
  `;

  if (clickable) {
    btn.addEventListener("click", () => playCard(card.id));
  }

  return btn;
}

function renderHands() {
  els.topHand.innerHTML = "";
  els.bottomHand.innerHTML = "";

  state.players[2].forEach((card) => {
    els.topHand.appendChild(createVisibleCard(card, state.currentPlayer === 2 && isPlayable(card)));
  });

  state.players[1].forEach((card) => {
    els.bottomHand.appendChild(createVisibleCard(card, state.currentPlayer === 1 && isPlayable(card)));
  });
}

function renderPile() {
  els.pileCardWrap.innerHTML = "";
  const lead = topCard();
  if (!lead) return;
  els.pileCardWrap.appendChild(createVisibleCard(lead, false));
}

function render() {
  els.turnLabel.textContent = `שחקן ${state.currentPlayer}`;
  els.deckCount.textContent = state.deck.length;
  els.score1.textContent = state.scores[1];
  els.score2.textContent = state.scores[2];
  els.messageBox.textContent = state.message;
  els.drawBtn.disabled = !!state.winner || !state.started;

  renderHands();
  renderPile();
}

els.newGameBtn.addEventListener("click", startGame);
els.drawBtn.addEventListener("click", drawCardForCurrentPlayer);
els.deckBtn.addEventListener("click", drawCardForCurrentPlayer);

els.resetScoresBtn.addEventListener("click", () => {
  state.scores = { 1: 0, 2: 0 };
  saveScores();
  render();
});

render();
const flowersData = [
  { name: "ורד", image: "images/rose.svg" },
  { name: "צבעוני", image: "images/tulip.svg" },
  { name: "חמנייה", image: "images/sunflower.svg" },
  { name: "חרצית", image: "images/daisy.svg" },
  { name: "לבנדר", image: "images/lavender.svg" },
  { name: "סחלב", image: "images/orchid.svg" }
];

const gameBoard = document.getElementById("gameBoard");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const bestMovesEl = document.getElementById("bestMoves");
const bestTimeEl = document.getElementById("bestTime");
const statusText = document.getElementById("statusText");
const restartBtn = document.getElementById("restartBtn");
const resetScoresBtn = document.getElementById("resetScoresBtn");

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let seconds = 0;
let timer = null;
let gameStarted = false;

const BEST_MOVES_KEY = "flowerMemoryBestMoves";
const BEST_TIME_KEY = "flowerMemoryBestTime";

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[randomIndex]] = [copied[randomIndex], copied[i]];
  }
  return copied;
}

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function loadBestScores() {
  const bestMoves = localStorage.getItem(BEST_MOVES_KEY);
  const bestTime = localStorage.getItem(BEST_TIME_KEY);

  bestMovesEl.textContent = bestMoves ? bestMoves : "—";
  bestTimeEl.textContent = bestTime ? formatTime(Number(bestTime)) : "—";
}

function saveBestScores() {
  const currentBestMoves = localStorage.getItem(BEST_MOVES_KEY);
  const currentBestTime = localStorage.getItem(BEST_TIME_KEY);

  if (!currentBestMoves || moves < Number(currentBestMoves)) {
    localStorage.setItem(BEST_MOVES_KEY, String(moves));
  }

  if (!currentBestTime || seconds < Number(currentBestTime)) {
    localStorage.setItem(BEST_TIME_KEY, String(seconds));
  }

  loadBestScores();
}

function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function createCard(cardData) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.name = cardData.name;

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back">🌸</div>
      <div class="card-face card-front">
        <img src="${cardData.image}" alt="${cardData.name}">
        <div class="flower-name">${cardData.name}</div>
      </div>
    </div>
  `;

  card.addEventListener("click", () => flipCard(card));
  return card;
}

function buildBoard() {
  gameBoard.innerHTML = "";

  const duplicatedFlowers = [...flowersData, ...flowersData].map((flower, index) => ({
    ...flower,
    id: `${flower.name}-${index}`
  }));

  cards = shuffleArray(duplicatedFlowers);

  cards.forEach((cardData) => {
    const cardElement = createCard(cardData);
    gameBoard.appendChild(cardElement);
  });
}

function flipCard(card) {
  if (lockBoard) return;
  if (card === firstCard) return;
  if (card.classList.contains("flipped")) return;
  if (card.classList.contains("matched")) return;

  if (!gameStarted) {
    gameStarted = true;
    startTimer();
    statusText.textContent = "מעולה, המשחק התחיל! חפשי זוגות תואמים.";
  }

  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves++;
  movesEl.textContent = moves;

  const isMatch = firstCard.dataset.name === secondCard.dataset.name;

  if (isMatch) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matches++;

    statusText.textContent = `יש! מצאת זוג של ${firstCard.dataset.name} 🌷`;

    resetTurn();

    if (matches === flowersData.length) {
      stopTimer();
      saveBestScores();
      statusText.innerHTML = `🎉 כל הכבוד! סיימת את המשחק ב־<strong>${moves}</strong> מהלכים ובזמן <strong>${formatTime(seconds)}</strong>.`;
      statusText.classList.add("win-message");
    }
  } else {
    statusText.textContent = "לא תואם, נסי שוב 🌸";

    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 900);
  }
}

function resetGame() {
  stopTimer();
  moves = 0;
  matches = 0;
  seconds = 0;
  gameStarted = false;
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  movesEl.textContent = "0";
  timerEl.textContent = "00:00";
  statusText.textContent = "לחצי על שני קלפים כדי למצוא זוגות תואמים.";
  statusText.classList.remove("win-message");

  buildBoard();
}

function resetBestScores() {
  localStorage.removeItem(BEST_MOVES_KEY);
  localStorage.removeItem(BEST_TIME_KEY);
  loadBestScores();
  statusText.textContent = "השיאים אופסו בהצלחה.";
  statusText.classList.remove("win-message");
}

restartBtn.addEventListener("click", resetGame);
resetScoresBtn.addEventListener("click", resetBestScores);

loadBestScores();
resetGame();
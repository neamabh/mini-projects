let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameOver = false;

let scoreX = 0;
let scoreO = 0;

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");
const scoreXText = document.getElementById("scoreX");
const scoreOText = document.getElementById("scoreO");

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    makeMove(cell, index);
  });
});

resetBtn.addEventListener("click", clearBoard);
resetScoreBtn.addEventListener("click", clearScore);

function makeMove(cell, index) {
  if (board[index] !== "" || gameOver) {
    return;
  }

  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());

  const winner = checkWinner();

  if (winner) {
    winner.forEach((i) => {
      cells[i].classList.add("win");
      cells[i].classList.add(currentPlayer.toLowerCase());
    });

    if (currentPlayer === "X") {
      scoreX++;
      scoreXText.textContent = scoreX;
    } else {
      scoreO++;
      scoreOText.textContent = scoreO;
    }

    setTimeout(() => {
      alert("השחקן " + currentPlayer + " ניצח!");
    }, 200);

    gameOver = true;
    return;
  }

  if (!board.includes("")) {
    setTimeout(() => {
      alert("תיקו!");
    }, 200);

    gameOver = true;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";

  statusText.textContent = currentPlayer;
  statusText.classList.remove("x", "o");
  statusText.classList.add(currentPlayer.toLowerCase());
}

function checkWinner() {
  const combos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (let combo of combos) {
    const [a, b, c] = combo;

    if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }

  return null;
}

function clearBoard() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameOver = false;

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("x", "o", "win");
  });

  statusText.textContent = "X";
  statusText.classList.remove("x", "o");
  statusText.classList.add("x");
}

function clearScore() {
  scoreX = 0;
  scoreO = 0;

  scoreXText.textContent = scoreX;
  scoreOText.textContent = scoreO;
}
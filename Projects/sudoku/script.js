const sudokuData = {
  easy: [
    {
      SudokuBoard: [
        [5, 3, 0, 6, 7, 8, 9, 1, 2],
        [6, 0, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 0, 6, 7],
        [8, 5, 9, 7, 0, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 0, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 0],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ]
    }
  ],
  medium: [
    {
      SudokuBoard: [
        [0, 3, 0, 6, 7, 0, 9, 1, 0],
        [6, 0, 2, 1, 0, 5, 3, 0, 8],
        [1, 9, 0, 0, 4, 2, 5, 6, 0],
        [8, 0, 9, 7, 6, 1, 0, 2, 3],
        [0, 2, 6, 8, 0, 3, 7, 9, 0],
        [7, 1, 0, 9, 2, 4, 8, 0, 6],
        [9, 6, 1, 0, 3, 7, 0, 8, 4],
        [2, 0, 7, 4, 0, 9, 6, 0, 5],
        [0, 4, 5, 2, 8, 0, 1, 7, 0]
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ]
    }
  ],
  hard: [
    {
      SudokuBoard: [
        [0, 0, 0, 6, 0, 0, 9, 0, 0],
        [6, 0, 2, 0, 0, 5, 0, 0, 8],
        [0, 9, 0, 0, 4, 0, 5, 6, 0],
        [8, 0, 9, 0, 6, 0, 0, 2, 0],
        [0, 2, 0, 8, 0, 3, 0, 9, 0],
        [0, 1, 0, 0, 2, 0, 8, 0, 6],
        [0, 6, 1, 0, 3, 0, 0, 8, 0],
        [2, 0, 0, 4, 0, 0, 6, 0, 5],
        [0, 0, 5, 0, 0, 6, 0, 0, 0]
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ]
    }
  ]
};

const boardElement = document.getElementById("sudoku-board");
const timerElement = document.getElementById("timer");
const mistakesElement = document.getElementById("mistakes");
const hintsElement = document.getElementById("hints");
const messageElement = document.getElementById("message");
const difficultyElement = document.getElementById("difficulty");

let currentSudokuBoard = [];
let currentSolution = [];
let selectedCell = null;
let mistakes = 0;
let maxMistakes = 5;
let hints = 3;
let seconds = 0;
let timerInterval = null;
let gameOver = false;

function copyBoard(board) {
  return board.map(row => [...row]);
}

function startGame() {
  const level = difficultyElement.value;
  const game = sudokuData[level][0];

  currentSudokuBoard = copyBoard(game.SudokuBoard);
  currentSolution = copyBoard(game.solution);
  selectedCell = null;
  mistakes = 0;
  hints = 3;
  seconds = 0;
  gameOver = false;

  updateMistakes();
  updateHints();
  updateTimer();
  setMessage("Click an empty cell to start playing.");
  renderBoard();
  startTimer();
}

function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      const value = currentSudokuBoard[row][col];

      if (value !== 0) {
        cell.textContent = value;
      }

      if (currentSudokuBoard[row][col] === currentSolution[row][col] && gameCellWasOriginal(row, col)) {
        cell.classList.add("fixed");
      } else {
        cell.classList.add("editable");
        cell.addEventListener("click", () => selectCell(cell, row, col));
      }

      if (col === 2 || col === 5) {
        cell.classList.add("border-right");
      }

      if (row === 2 || row === 5) {
        cell.classList.add("border-bottom");
      }

      boardElement.appendChild(cell);
    }
  }
}

function gameCellWasOriginal(row, col) {
  const level = difficultyElement.value;
  return sudokuData[level][0].SudokuBoard[row][col] !== 0;
}

function selectCell(cell, row, col) {
  if (gameOver) return;

  document.querySelectorAll(".cell").forEach(item => {
    item.classList.remove("selected");
  });

  cell.classList.add("selected");
  selectedCell = { row, col, element: cell };
}

function handleNumberInput(number) {
  if (!selectedCell || gameOver) {
    setMessage("Select an empty cell first.");
    return;
  }

  const { row, col, element } = selectedCell;

  if (gameCellWasOriginal(row, col)) {
    setMessage("This cell cannot be changed.");
    return;
  }

  if (currentSolution[row][col] === number) {
    currentSudokuBoard[row][col] = number;
    element.textContent = number;
    element.classList.remove("error");
    setMessage("Good move.");
    checkWin();
  } else {
    mistakes++;
    updateMistakes();
    element.classList.add("error");
    setMessage("Wrong number.");

    setTimeout(() => {
      element.classList.remove("error");
    }, 500);

    if (mistakes >= maxMistakes) {
      gameOver = true;
      stopTimer();
      setMessage("Game over. Too many mistakes.", "lose-message");
    }
  }
}

function eraseCell() {
  if (!selectedCell || gameOver) {
    setMessage("Select a cell first.");
    return;
  }

  const { row, col, element } = selectedCell;

  if (gameCellWasOriginal(row, col)) {
    setMessage("This cell cannot be erased.");
    return;
  }

  currentSudokuBoard[row][col] = 0;
  element.textContent = "";
  setMessage("Cell cleared.");
}

function useHint() {
  if (!selectedCell || gameOver) {
    setMessage("Select a cell first.");
    return;
  }

  if (hints <= 0) {
    setMessage("No hints left.");
    return;
  }

  const { row, col, element } = selectedCell;

  if (gameCellWasOriginal(row, col)) {
    setMessage("This is a fixed cell.");
    return;
  }

  const correctNumber = currentSolution[row][col];
  currentSudokuBoard[row][col] = correctNumber;
  element.textContent = correctNumber;
  element.classList.remove("error");

  hints--;
  updateHints();
  setMessage("Hint used.");
  checkWin();
}

function checkBoard() {
  if (gameOver) return;

  let hasError = false;

  document.querySelectorAll(".cell").forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;

    if (
      currentSudokuBoard[row][col] !== 0 &&
      currentSudokuBoard[row][col] !== currentSolution[row][col]
    ) {
      cell.classList.add("error");
      hasError = true;
    } else {
      cell.classList.remove("error");
    }
  });

  if (hasError) {
    setMessage("There are mistakes on the board.");
  } else {
    setMessage("Board looks good so far.");
  }
}

function checkWin() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (currentSudokuBoard[row][col] !== currentSolution[row][col]) {
        return;
      }
    }
  }

  gameOver = true;
  stopTimer();
  setMessage("You won! Great job!", "win-message");
}

function updateMistakes() {
  mistakesElement.textContent = `${mistakes} / ${maxMistakes}`;
}

function updateHints() {
  hintsElement.textContent = hints;
}

function updateTimer() {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  timerElement.textContent = `${minutes}:${secs}`;
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function setMessage(text, extraClass = "") {
  messageElement.textContent = text;
  messageElement.className = "message";
  if (extraClass) {
    messageElement.classList.add(extraClass);
  }
}

document.querySelectorAll(".num-btn").forEach(button => {
  button.addEventListener("click", () => {
    const number = Number(button.dataset.number);
    handleNumberInput(number);
  });
});

document.getElementById("erase-btn").addEventListener("click", eraseCell);
document.getElementById("hint-btn").addEventListener("click", useHint);
document.getElementById("check-btn").addEventListener("click", checkBoard);
document.getElementById("reset-btn").addEventListener("click", startGame);
document.getElementById("new-game-btn").addEventListener("click", startGame);
difficultyElement.addEventListener("change", startGame);

document.addEventListener("keydown", event => {
  if (event.key >= "1" && event.key <= "9") {
    handleNumberInput(Number(event.key));
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    eraseCell();
  }
});

startGame();
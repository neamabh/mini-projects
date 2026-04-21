const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const livesElement = document.getElementById("lives");

const startScreen = document.getElementById("startScreen");
const gameOverlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const restartBtn = document.getElementById("restartBtn");
const resetHighScoreBtn = document.getElementById("resetHighScoreBtn");

const tileSize = 28;
const rows = 22;
const cols = 20;

const map = [
  "####################",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#o####.#.##.#.####o#",
  "#..................#",
  "#.####.## ##.####.#",
  "#......##..##......#",
  "######.##  ##.######",
  "     #.######.#     ",
  "######.# GG #.######",
  "      .      .      ",
  "######.# ## #.######",
  "     #.######.#     ",
  "######.######.######",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#o..##.#.P..#.##..o#",
  "###.##.######.##.###",
  "#......##  ##......#",
  "#.########...###### #",
  "#..................#",
  "####################"
];

let walls = [];
let pellets = [];
let powerPellets = [];
let ghosts = [];
let pelletCount = 0;

let score = 0;
let highScore = Number(localStorage.getItem("pacmanHighScore")) || 0;
let lives = 3;

let gameRunning = false;
let gamePaused = false;
let animationId = null;
let lastTime = 0;
let powerMode = false;
let powerModeTimeout = null;

const pacman = {
  x: 0,
  y: 0,
  radius: tileSize / 2 - 3,
  speed: 110,
  currentDirection: { x: 0, y: 0 },
  nextDirection: { x: 0, y: 0 },
  rotation: 0,
  mouthAngle: 0.22,
  mouthSpeed: 5.5,
  mouthTimer: 0
};

const ghostColors = ["#ff4d4d", "#ff9ff3", "#00e5ff", "#ffb347"];

function createGhost(x, y, color, releaseDelay = 0) {
  return {
    startX: x,
    startY: y,
    x,
    y,
    width: tileSize - 4,
    height: tileSize - 4,
    speed: 82,
    direction: { x: 0, y: -1 },
    color,
    frightened: false,
    changeCooldown: 0,
    mode: "waiting",
    releaseDelay,
    respawnDelay: 0
  };
}

function initializeGame() {
  walls = [];
  pellets = [];
  powerPellets = [];
  ghosts = [];
  pelletCount = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const symbol = map[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      if (symbol === "#") {
        walls.push({ x, y, width: tileSize, height: tileSize });
      } else if (symbol === ".") {
        pellets.push({
          x: x + tileSize / 2,
          y: y + tileSize / 2,
          eaten: false
        });
        pelletCount++;
      } else if (symbol === "o") {
        powerPellets.push({
          x: x + tileSize / 2,
          y: y + tileSize / 2,
          eaten: false,
          pulse: Math.random() * Math.PI * 2
        });
        pelletCount++;
      } else if (symbol === "G") {
        ghosts.push(
          createGhost(
            x + 2,
            y + 2,
            ghostColors[ghosts.length % ghostColors.length],
            ghosts.length * 0.9
          )
        );
      } else if (symbol === "P") {
        pacman.x = x + tileSize / 2;
        pacman.y = y + tileSize / 2;
      }
    }
  }

  if (ghosts.length === 0) {
    ghosts.push(createGhost(9 * tileSize + 2, 9 * tileSize + 2, ghostColors[0], 0));
    ghosts.push(createGhost(10 * tileSize + 2, 9 * tileSize + 2, ghostColors[1], 0.9));
    ghosts.push(createGhost(9 * tileSize + 2, 10 * tileSize + 2, ghostColors[2], 1.8));
    ghosts.push(createGhost(10 * tileSize + 2, 10 * tileSize + 2, ghostColors[3], 2.7));
  }

  updateHud();
}

function updateHud() {
  scoreElement.textContent = score;
  highScoreElement.textContent = highScore;
  livesElement.textContent = lives;
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("pacmanHighScore", highScore);
  }
  highScoreElement.textContent = highScore;
}

function resetHighScore() {
  const confirmed = confirm("Are you sure you want to reset the high score?");
  if (!confirmed) return;

  highScore = 0;
  localStorage.removeItem("pacmanHighScore");
  highScoreElement.textContent = highScore;
}

function resetPacmanPosition() {
  pacman.x = 9 * tileSize + tileSize / 2;
  pacman.y = 16 * tileSize + tileSize / 2;
  pacman.currentDirection = { x: 0, y: 0 };
  pacman.nextDirection = { x: 0, y: 0 };
  pacman.rotation = 0;
  pacman.mouthTimer = 0;
}

function resetGhostsPosition() {
  ghosts.forEach((ghost, index) => {
    ghost.x = ghost.startX;
    ghost.y = ghost.startY;
    ghost.direction = { x: 0, y: -1 };
    ghost.changeCooldown = 0;
    ghost.frightened = false;
    ghost.mode = "waiting";
    ghost.releaseDelay = index * 0.9;
    ghost.respawnDelay = 0;
  });
}

function rectCircleCollision(circleX, circleY, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(circleX, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circleY, rect.y + rect.height));

  const dx = circleX - closestX;
  const dy = circleY - closestY;

  return dx * dx + dy * dy < radius * radius;
}

function rectRectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function canMoveTo(x, y, radius) {
  for (const wall of walls) {
    if (rectCircleCollision(x, y, radius, wall)) {
      return false;
    }
  }
  return true;
}

function canGhostMove(ghost, newX, newY) {
  const ghostRect = {
    x: newX,
    y: newY,
    width: ghost.width,
    height: ghost.height
  };

  for (const wall of walls) {
    if (rectRectCollision(ghostRect, wall)) {
      return false;
    }
  }

  return true;
}

function handleInput(key) {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
  };

  if (!directions[key]) return;

  pacman.nextDirection = directions[key];

  if (key === "ArrowUp") pacman.rotation = 1.5 * Math.PI;
  if (key === "ArrowDown") pacman.rotation = 0.5 * Math.PI;
  if (key === "ArrowLeft") pacman.rotation = Math.PI;
  if (key === "ArrowRight") pacman.rotation = 0;
}

function updatePacman(deltaTime) {
  const centerX =
    Math.round((pacman.x - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
  const centerY =
    Math.round((pacman.y - tileSize / 2) / tileSize) * tileSize + tileSize / 2;

  const closeToCenterX = Math.abs(pacman.x - centerX) < 6;
  const closeToCenterY = Math.abs(pacman.y - centerY) < 6;

  const wantsHorizontalTurn = pacman.nextDirection.x !== 0;
  const wantsVerticalTurn = pacman.nextDirection.y !== 0;

  if (wantsHorizontalTurn && closeToCenterY) {
    pacman.y = centerY;
    const intendedX = pacman.x + pacman.nextDirection.x * pacman.speed * deltaTime;
    if (canMoveTo(intendedX, pacman.y, pacman.radius)) {
      pacman.currentDirection = { ...pacman.nextDirection };
    }
  }

  if (wantsVerticalTurn && closeToCenterX) {
    pacman.x = centerX;
    const intendedY = pacman.y + pacman.nextDirection.y * pacman.speed * deltaTime;
    if (canMoveTo(pacman.x, intendedY, pacman.radius)) {
      pacman.currentDirection = { ...pacman.nextDirection };
    }
  }

  const moveX = pacman.currentDirection.x * pacman.speed * deltaTime;
  const moveY = pacman.currentDirection.y * pacman.speed * deltaTime;

  const nextX = pacman.x + moveX;
  const nextY = pacman.y + moveY;

  if (canMoveTo(nextX, nextY, pacman.radius)) {
    pacman.x = nextX;
    pacman.y = nextY;
  } else {
    pacman.currentDirection = { x: 0, y: 0 };
  }

  if (pacman.currentDirection.x > 0) pacman.rotation = 0;
  if (pacman.currentDirection.x < 0) pacman.rotation = Math.PI;
  if (pacman.currentDirection.y > 0) pacman.rotation = 0.5 * Math.PI;
  if (pacman.currentDirection.y < 0) pacman.rotation = 1.5 * Math.PI;

  pacman.mouthTimer += deltaTime * pacman.mouthSpeed;
  pacman.mouthAngle = 0.12 + Math.abs(Math.sin(pacman.mouthTimer)) * 0.26;

  if (pacman.x < -tileSize / 2) {
    pacman.x = canvas.width + tileSize / 2;
  } else if (pacman.x > canvas.width + tileSize / 2) {
    pacman.x = -tileSize / 2;
  }

  eatPellets();
}

function eatPellets() {
  pellets.forEach((pellet) => {
    if (pellet.eaten) return;

    const dx = pacman.x - pellet.x;
    const dy = pacman.y - pellet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < pacman.radius + 4) {
      pellet.eaten = true;
      score += 10;
      pelletCount--;
      saveHighScore();
    }
  });

  powerPellets.forEach((pellet) => {
    if (pellet.eaten) return;

    const dx = pacman.x - pellet.x;
    const dy = pacman.y - pellet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < pacman.radius + 7) {
      pellet.eaten = true;
      score += 50;
      pelletCount--;
      activatePowerMode();
      saveHighScore();
    }
  });

  updateHud();

  if (pelletCount <= 0) {
    endGame(true);
  }
}

function activatePowerMode() {
  powerMode = true;

  ghosts.forEach((ghost) => {
    if (ghost.mode === "active") {
      ghost.frightened = true;
    }
  });

  clearTimeout(powerModeTimeout);
  powerModeTimeout = setTimeout(() => {
    powerMode = false;
    ghosts.forEach((ghost) => {
      if (ghost.mode === "active") {
        ghost.frightened = false;
      }
    });
  }, 7000);
}

function getValidGhostDirections(ghost) {
  const options = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  return options.filter((dir) => {
    const testX = ghost.x + dir.x * ghost.speed * 0.18;
    const testY = ghost.y + dir.y * ghost.speed * 0.18;
    return canGhostMove(ghost, testX, testY);
  });
}

function chooseGhostDirection(ghost) {
  const validMoves = getValidGhostDirections(ghost);

  if (validMoves.length === 0) return;

  const opposite = {
    x: -ghost.direction.x,
    y: -ghost.direction.y
  };

  let filteredMoves = validMoves.filter(
    (dir) => !(dir.x === opposite.x && dir.y === opposite.y)
  );

  if (filteredMoves.length === 0) {
    filteredMoves = validMoves;
  }

  filteredMoves.sort((a, b) => {
    const aDistance =
      Math.abs((ghost.x + a.x * tileSize) - pacman.x) +
      Math.abs((ghost.y + a.y * tileSize) - pacman.y);

    const bDistance =
      Math.abs((ghost.x + b.x * tileSize) - pacman.x) +
      Math.abs((ghost.y + b.y * tileSize) - pacman.y);

    return ghost.frightened ? bDistance - aDistance : aDistance - bDistance;
  });

  const smartMove = filteredMoves[0];
  const randomMove =
    filteredMoves[Math.floor(Math.random() * filteredMoves.length)];

  ghost.direction = Math.random() < 0.72 ? smartMove : randomMove;
}

function updateGhosts(deltaTime) {
  ghosts.forEach((ghost) => {
    if (ghost.mode === "waiting") {
      ghost.releaseDelay -= deltaTime;

      if (ghost.releaseDelay <= 0) {
        ghost.mode = "active";
        ghost.direction = { x: 0, y: -1 };
        ghost.changeCooldown = 0;
      } else {
        return;
      }
    }

    if (ghost.mode === "respawning") {
      ghost.respawnDelay -= deltaTime;

      if (ghost.respawnDelay <= 0) {
        ghost.mode = "waiting";
        ghost.releaseDelay = 1.2;
        ghost.direction = { x: 0, y: -1 };
      } else {
        return;
      }
    }

    ghost.changeCooldown -= deltaTime;

    const moveX = ghost.direction.x * ghost.speed * deltaTime;
    const moveY = ghost.direction.y * ghost.speed * deltaTime;

    const nextX = ghost.x + moveX;
    const nextY = ghost.y + moveY;

    const blocked = !canGhostMove(ghost, nextX, nextY);

    if (blocked || ghost.changeCooldown <= 0) {
      chooseGhostDirection(ghost);
      ghost.changeCooldown = 0.16 + Math.random() * 0.28;
    }

    const finalX = ghost.x + ghost.direction.x * ghost.speed * deltaTime;
    const finalY = ghost.y + ghost.direction.y * ghost.speed * deltaTime;

    if (canGhostMove(ghost, finalX, finalY)) {
      ghost.x = finalX;
      ghost.y = finalY;
    }

    if (ghost.x < -tileSize) {
      ghost.x = canvas.width;
    } else if (ghost.x > canvas.width) {
      ghost.x = -tileSize;
    }
  });
}

function checkGhostCollisions() {
  for (const ghost of ghosts) {
    if (ghost.mode !== "active") continue;

    const ghostCenterX = ghost.x + ghost.width / 2;
    const ghostCenterY = ghost.y + ghost.height / 2;

    const dx = pacman.x - ghostCenterX;
    const dy = pacman.y - ghostCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < pacman.radius + ghost.width / 2 - 4) {
      if (ghost.frightened) {
        score += 200;
        ghost.x = ghost.startX;
        ghost.y = ghost.startY;
        ghost.direction = { x: 0, y: -1 };
        ghost.frightened = false;
        ghost.mode = "respawning";
        ghost.respawnDelay = 1.1;
        saveHighScore();
        updateHud();
      } else {
        loseLife();
        break;
      }
    }
  }
}

function loseLife() {
  lives--;
  updateHud();

  if (lives <= 0) {
    endGame(false);
    return;
  }

  resetPacmanPosition();
  resetGhostsPosition();
}

function endGame(isWin) {
  gameRunning = false;
  gamePaused = false;
  cancelAnimationFrame(animationId);
  saveHighScore();

  gameOverlay.classList.remove("hidden");
  overlayTitle.textContent = isWin ? "You Win!" : "Game Over";
  overlayText.textContent = isWin
    ? "Amazing! You cleared the maze!"
    : "The ghosts caught you. Try again!";
}

function drawWalls() {
  walls.forEach((wall) => {
    ctx.fillStyle = "#001f66";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

    ctx.strokeStyle = "#00a8ff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00a8ff";
    ctx.shadowBlur = 8;
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.width - 2, wall.height - 2);
    ctx.shadowBlur = 0;
  });
}

function drawPellets(deltaTime) {
  pellets.forEach((pellet) => {
    if (!pellet.eaten) {
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe8a3";
      ctx.fill();
      ctx.closePath();
    }
  });

  powerPellets.forEach((pellet) => {
    if (!pellet.eaten) {
      pellet.pulse += deltaTime * 4;
      const radius = 6 + Math.sin(pellet.pulse) * 1.5;

      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
    }
  });
}

function drawPacman() {
  ctx.save();
  ctx.translate(pacman.x, pacman.y);
  ctx.rotate(pacman.rotation);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(
    0,
    0,
    pacman.radius,
    pacman.mouthAngle,
    Math.PI * 2 - pacman.mouthAngle
  );
  ctx.closePath();

  ctx.fillStyle = "#ffd43b";
  ctx.shadowColor = "#ffd43b";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawGhost(ghost, time) {
  if (ghost.mode === "respawning") return;

  let bodyColor = ghost.color;

  if (ghost.frightened) {
    bodyColor = Math.floor(time * 6) % 2 === 0 ? "#2952ff" : "#8aa4ff";
  }

  const x = ghost.x;
  const y = ghost.y;
  const w = ghost.width;
  const h = ghost.height;
  const wave = Math.sin(time * 8) * 2;

  ctx.fillStyle = bodyColor;
  ctx.shadowColor = bodyColor;
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 3, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h - 6 + wave);

  for (let i = 0; i < 4; i++) {
    const waveX = x + w - (i * w) / 4;
    const offset = i % 2 === 0 ? 0 : 6;
    ctx.lineTo(waveX - w / 8, y + h - offset + wave);
  }

  ctx.lineTo(x, y + h - 6 + wave);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + h * 0.38, 4.8, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65, y + h * 0.38, 4.8, 0, Math.PI * 2);
  ctx.fill();

  const eyeOffsetX = ghost.direction.x * 1.5;
  const eyeOffsetY = ghost.direction.y * 1.5;

  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(
    x + w * 0.35 + eyeOffsetX,
    y + h * 0.38 + eyeOffsetY,
    2.2,
    0,
    Math.PI * 2
  );
  ctx.arc(
    x + w * 0.65 + eyeOffsetX,
    y + h * 0.38 + eyeOffsetY,
    2.2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawGhosts(time) {
  ghosts.forEach((ghost) => drawGhost(ghost, time));
}

function drawBoard(deltaTime = 0, time = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWalls();
  drawPellets(deltaTime);
  drawPacman();
  drawGhosts(time);
}

function gameLoop(timestamp) {
  if (!gameRunning || gamePaused) return;

  if (!lastTime) lastTime = timestamp;
  const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.02);
  lastTime = timestamp;
  const time = timestamp / 1000;

  updatePacman(deltaTime);
  updateGhosts(deltaTime);
  checkGhostCollisions();
  drawBoard(deltaTime, time);

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  score = 0;
  lives = 3;
  powerMode = false;
  gameRunning = true;
  gamePaused = false;
  lastTime = 0;

  clearTimeout(powerModeTimeout);
  initializeGame();
  resetPacmanPosition();
  resetGhostsPosition();
  updateHud();
  drawBoard();

  startScreen.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  pauseBtn.textContent = "Pause";

  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!gameRunning) return;

  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? "Resume" : "Pause";

  if (!gamePaused) {
    lastTime = 0;
    animationId = requestAnimationFrame(gameLoop);
  }
}

function resetGame() {
  cancelAnimationFrame(animationId);
  clearTimeout(powerModeTimeout);

  gameRunning = false;
  gamePaused = false;
  score = 0;
  lives = 3;
  powerMode = false;
  lastTime = 0;

  initializeGame();
  resetPacmanPosition();
  resetGhostsPosition();
  updateHud();
  drawBoard();

  pauseBtn.textContent = "Pause";
  gameOverlay.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

document.addEventListener("keydown", (event) => {
  handleInput(event.key);
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", startGame);
resetHighScoreBtn.addEventListener("click", resetHighScore);

initializeGame();
resetPacmanPosition();
resetGhostsPosition();
updateHud();
drawBoard();
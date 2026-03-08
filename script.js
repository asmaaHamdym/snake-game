// Game Constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;

// Game Variables
let snake = [];
let food = {};
let score = 0;
let level = 1;
let gameSpeed = 5;
let gameRunning = false;
let gamePaused = false;
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let gameLoopId = null;

// DOM Elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const speedDisplay = document.getElementById("speed");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const gameOverModal = document.getElementById("gameOverModal");
const restartBtn = document.getElementById("restartBtn");
const finalScoreDisplay = document.getElementById("finalScore");
const finalLevelDisplay = document.getElementById("finalLevel");

// Initialize Game
function initializeGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  score = 0;
  level = 1;
  gameSpeed = 5;
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  spawnFood();
  updateUI();
  gameRunning = false;
  gamePaused = false;
  gameOverModal.classList.add("hidden");
}

// Spawn Food
function spawnFood() {
  let newFood;
  let foodOnSnake = true;

  while (foodOnSnake) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };

    foodOnSnake = snake.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y,
    );
  }

  food = newFood;
}

// Update Game State
function updateGame() {
  if (!gameRunning || gamePaused) return;

  // Update direction
  direction = { ...nextDirection };

  // Calculate new head position
  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  // Check wall collision
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    endGame();
    return;
  }

  // Check self collision
  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }

  // Add new head
  snake.unshift(head);

  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    spawnFood();
    checkLevelUp();
  } else {
    // Remove tail if no food eaten
    snake.pop();
  }

  updateUI();
}

// Check if level should increase
function checkLevelUp() {
  const newLevel = Math.floor(score / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    gameSpeed = 5 + (level - 1) * 2;
    if (gameLoopId) {
      clearInterval(gameLoopId);
      gameLoopId = setInterval(() => {
        updateGame();
        drawGame();
      }, 1000 / gameSpeed);
    }
  }
}

// Draw Game
function drawGame() {
  // Clear canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw grid (optional)
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TILE_SIZE, 0);
    ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * TILE_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE);
    ctx.stroke();
  }

  // Draw snake
  snake.forEach((segment, index) => {
    if (index === 0) {
      // Head - brighter color
      ctx.fillStyle = "#00ff00";
    } else {
      // Body - slightly darker
      ctx.fillStyle = "#00cc00";
    }

    ctx.fillRect(
      segment.x * TILE_SIZE + 1,
      segment.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
    );

    // Draw eyes on head
    if (index === 0) {
      ctx.fillStyle = "#000";
      const eyeSize = 2;
      if (direction.x === 1) {
        ctx.fillRect(
          segment.x * TILE_SIZE + 12,
          segment.y * TILE_SIZE + 6,
          eyeSize,
          eyeSize,
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + 12,
          segment.y * TILE_SIZE + 12,
          eyeSize,
          eyeSize,
        );
      } else if (direction.x === -1) {
        ctx.fillRect(
          segment.x * TILE_SIZE + 6,
          segment.y * TILE_SIZE + 6,
          eyeSize,
          eyeSize,
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + 6,
          segment.y * TILE_SIZE + 12,
          eyeSize,
          eyeSize,
        );
      } else if (direction.y === -1) {
        ctx.fillRect(
          segment.x * TILE_SIZE + 6,
          segment.y * TILE_SIZE + 6,
          eyeSize,
          eyeSize,
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + 12,
          segment.y * TILE_SIZE + 6,
          eyeSize,
          eyeSize,
        );
      } else {
        ctx.fillRect(
          segment.x * TILE_SIZE + 6,
          segment.y * TILE_SIZE + 12,
          eyeSize,
          eyeSize,
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + 12,
          segment.y * TILE_SIZE + 12,
          eyeSize,
          eyeSize,
        );
      }
    }
  });

  // Draw food
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(
    food.x * TILE_SIZE + TILE_SIZE / 2,
    food.y * TILE_SIZE + TILE_SIZE / 2,
    TILE_SIZE / 2 - 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Draw food outline
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Update UI
function updateUI() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  speedDisplay.textContent = gameSpeed;
}

// End Game
function endGame() {
  gameRunning = false;
  gamePaused = false;
  clearInterval(gameLoopId);
  finalScoreDisplay.textContent = score;
  finalLevelDisplay.textContent = level;
  gameOverModal.classList.remove("hidden");
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

// Start Game
function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  gamePaused = false;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  gameOverModal.classList.add("hidden");

  gameLoopId = setInterval(() => {
    updateGame();
    drawGame();
  }, 1000 / gameSpeed);

  drawGame();
}

// Toggle Pause
function togglePause() {
  if (!gameRunning) return;

  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
}

// Reset Game
function resetGame() {
  clearInterval(gameLoopId);
  initializeGame();
  drawGame();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";
  gameOverModal.classList.add("hidden");
}

// Event Listeners
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

// Keyboard Controls
document.addEventListener("keydown", (event) => {
  const key = event.key;

  // Arrow key controls
  if (key === "ArrowUp" && direction.y === 0) {
    nextDirection = { x: 0, y: -1 };
  } else if (key === "ArrowDown" && direction.y === 0) {
    nextDirection = { x: 0, y: 1 };
  } else if (key === "ArrowLeft" && direction.x === 0) {
    nextDirection = { x: -1, y: 0 };
  } else if (key === "ArrowRight" && direction.x === 0) {
    nextDirection = { x: 1, y: 0 };
  }

  // Spacebar to start/pause
  if (key === " ") {
    event.preventDefault();
    if (!gameRunning) {
      startGame();
    } else {
      togglePause();
    }
  }
});

// Mouse/Touch Controls (click on canvas regions)
canvas.addEventListener("click", (event) => {
  if (!gameRunning) {
    startGame();
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Determine which direction was clicked
  const dx = x - centerX;
  const dy = y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal click
    if (dx > 0 && direction.x === 0) nextDirection = { x: 1, y: 0 };
    else if (dx < 0 && direction.x === 0) nextDirection = { x: -1, y: 0 };
  } else {
    // Vertical click
    if (dy > 0 && direction.y === 0) nextDirection = { x: 0, y: 1 };
    else if (dy < 0 && direction.y === 0) nextDirection = { x: 0, y: -1 };
  }
});

// Initialize on page load
window.addEventListener("load", () => {
  initializeGame();
  drawGame();
});

/**
 * SNAKE GAME - Classic snake arcade game
 * Player controls a snake to eat food and grow longer
 * Game ends when snake hits wall or itself
 */

// ========================================
// GAME CONSTANTS - Grid and canvas sizing
// ========================================
const GRID_SIZE = 20; // 20x20 grid for game board
const CANVAS_SIZE = 400; // 400x400 pixel canvas
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE; // Each tile is 20x20 pixels

// ========================================
// GAME STATE VARIABLES - Track game data
// ========================================
let snake = []; // Array of snake segments {x, y}
let food = {}; // Current food location {x, y}
let score = 0; // Player score (10 points per food)
let level = 1; // Game level (increases every 100 points)
let gameSpeed = 3; // Game speed (updates per second)
let gameRunning = false; // Is game currently active?
let gamePaused = false; // Is game paused?
let direction = { x: 0, y: 0 }; // Current snake direction
let nextDirection = { x: 0, y: 0 }; // Next direction (from player input)
let gameLoopId = null; // ID of game loop interval
let obstacles = []; // Array of obstacle positions {x, y}
let animationFrame = 0; // Frame counter for animations

// ========================================
// DOM REFERENCES - Get HTML elements
// ========================================
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

// ========================================
// GAME INITIALIZATION
// ========================================
// Initialize or reset the game to starting state
function initializeGame() {
  // Create initial snake with 3 segments (head at 10,10 moving right)
  snake = [
    { x: 10, y: 10 }, // Head
    { x: 9, y: 10 }, // Body segment 1
    { x: 8, y: 10 }, // Body segment 2
  ];

  // Reset game stats
  score = 0;
  level = 1;
  gameSpeed = 3; // Start at speed 3
  direction = { x: 1, y: 0 }; // Start moving right
  nextDirection = { x: 1, y: 0 }; // Queue same direction
  animationFrame = 0; // Reset animation for pulsing effects

  // Prepare game
  spawnFood(); // Place first food
  spawnObstacles(); // Generate obstacles
  updateUI(); // Update score display
  gameRunning = false; // Game not started yet
  gamePaused = false; // Not paused
  gameOverModal.classList.add("hidden"); // Hide game over screen
}

// ========================================
// FOOD SPAWNING
// ========================================
// Generate random food location that doesn't overlap with snake
function spawnFood() {
  let newFood;
  let foodOnSnake = true;

  // Keep generating random positions until we find one not on snake
  while (foodOnSnake) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE), // Random X between 0-19
      y: Math.floor(Math.random() * GRID_SIZE), // Random Y between 0-19
    };

    // Check if food overlaps with any snake segment
    foodOnSnake = snake.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y,
    );
  }

  food = newFood;
}

// ========================================
// OBSTACLE SPAWNING
// ========================================
// Generate obstacles that snake must avoid
function spawnObstacles() {
  obstacles = []; // Clear existing obstacles

  // Maximum of 2 obstacles at a time (instead of level-based)
  const obstacleCount = 2;

  for (let i = 0; i < obstacleCount; i++) {
    let newObstacle;
    let isValid = false;

    // Keep trying positions until we find one that doesn't overlap
    while (!isValid) {
      newObstacle = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        // Each obstacle gets a DIFFERENT random lifespan for staggered timing
        // Ranges from 100-180 frames (so they disappear at different times)
        lifespan: 100 + Math.floor(Math.random() * 80),
        // First obstacle appears immediately (spawnDelay = 0)
        // Second obstacle appears after 80-120 frames delay
        spawnDelay: i === 0 ? 0 : 80 + Math.floor(Math.random() * 40),
      };

      // Check it doesn't overlap with snake, food, or existing obstacles
      const overlapsSnake = snake.some(
        (segment) => segment.x === newObstacle.x && segment.y === newObstacle.y,
      );
      const overlapsFood =
        food && food.x === newObstacle.x && food.y === newObstacle.y;
      const overlapsObstacle = obstacles.some(
        (obs) => obs.x === newObstacle.x && obs.y === newObstacle.y,
      );

      isValid = !overlapsSnake && !overlapsFood && !overlapsObstacle;
    }

    obstacles.push(newObstacle);
  }
}

// ========================================
// RESPAWN OBSTACLE AT NEW LOCATION
// ========================================
// Move an obstacle to a new random position
function respawnObstacle(obstacle) {
  let isValid = false;

  // Keep trying positions until we find one that doesn't overlap
  while (!isValid) {
    obstacle.x = Math.floor(Math.random() * GRID_SIZE);
    obstacle.y = Math.floor(Math.random() * GRID_SIZE);
    // Each respawn gets a NEW random lifespan for independent timing
    obstacle.lifespan = 100 + Math.floor(Math.random() * 80);
    // Respawned obstacles have a delay before appearing (80-120 frames)
    obstacle.spawnDelay = 80 + Math.floor(Math.random() * 40);

    // Check it doesn't overlap with snake, food, or other obstacles
    const overlapsSnake = snake.some(
      (segment) => segment.x === obstacle.x && segment.y === obstacle.y,
    );
    const overlapsFood = food && food.x === obstacle.x && food.y === obstacle.y;
    const overlapsOtherObstacle = obstacles.some(
      (obs) => obs !== obstacle && obs.x === obstacle.x && obs.y === obstacle.y,
    );

    isValid = !overlapsSnake && !overlapsFood && !overlapsOtherObstacle;
  }
}

// ========================================
// GAME LOGIC - Update game state each frame
// ========================================
// Process one game tick: move snake, check collisions, handle food
function updateGame() {
  // Skip update if game not running or paused
  if (!gameRunning || gamePaused) return;

  // Update obstacle lifespans - make obstacles disappear and respawn
  obstacles.forEach((obstacle) => {
    // Decrement spawn delay (delay before obstacle appears)
    if (obstacle.spawnDelay > 0) {
      obstacle.spawnDelay--;
    } else {
      // Only decrement lifespan if obstacle is visible
      obstacle.lifespan--;
      if (obstacle.lifespan <= 0) {
        respawnObstacle(obstacle); // Respawn at new location
      }
    }
  });

  // Update direction based on player input from last frame
  direction = { ...nextDirection };

  // Calculate new head position based on current direction
  const head = { ...snake[0] };
  head.x += direction.x; // -1, 0, or 1 for left/none/right
  head.y += direction.y; // -1, 0, or 1 for up/none/down

  // COLLISION CHECK 1: Wall collision (snake hit boundary)
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    endGame(); // Game over!
    return;
  }

  // COLLISION CHECK 2: Self collision (snake hit its own body)
  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    endGame(); // Game over!
    return;
  }

  // COLLISION CHECK 3: Obstacle collision (snake hit obstacle)
  if (
    obstacles.some(
      (obs) => obs.spawnDelay <= 0 && obs.x === head.x && obs.y === head.y,
    )
  ) {
    endGame(); // Game over!
    return;
  }

  // No collision - move snake by adding new head
  snake.unshift(head);

  // COLLISION CHECK 4: Food collision
  if (head.x === food.x && head.y === food.y) {
    // Snake ate food - grow and gain points
    score += 10; // Add 10 points
    spawnFood(); // Create new food
    checkLevelUp(); // Check if score triggers level increase
  } else {
    // No food eaten - remove tail to maintain snake length
    snake.pop();
  }

  // Update UI display (score, level, speed)
  updateUI();
}

// ========================================
// LEVEL & DIFFICULTY PROGRESSION
// ========================================
// Check if player earned enough points for next level and increase speed
function checkLevelUp() {
  // Calculate new level: 100 points = level 1, 200 points = level 2, etc
  const newLevel = Math.floor(score / 100) + 1;

  if (newLevel > level) {
    // Level up!
    level = newLevel;

    // Increase game speed: level 1 = speed 3, level 2 = speed 5, level 3 = speed 7, etc
    gameSpeed = 3 + (level - 1) * 2;

    // Restart game loop with new speed
    if (gameLoopId) {
      clearInterval(gameLoopId); // Stop old game loop
      gameLoopId = setInterval(() => {
        updateGame(); // Run game logic
        drawGame(); // Render graphics
      }, 1000 / gameSpeed); // Time between frames based on speed
      spawnObstacles(); // Spawn new obstacles for harder difficulty
    }
  }
}

// ========================================
// GRAPHICS RENDERING
// ========================================
// Draw all game elements: snake, food, grid
function drawGame() {
  // Increment animation frame counter for pulsing effects
  animationFrame++;

  // Fill entire canvas with black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw optional grid lines for visual reference
  ctx.strokeStyle = "#1a1a1a"; // Dark gray
  ctx.lineWidth = 0.5;
  // Draw vertical and horizontal lines for each grid cell
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

  // Draw snake body - lighter green for head, darker for body
  snake.forEach((segment, index) => {
    if (index === 0) {
      // First segment is head - bright green
      ctx.fillStyle = "#00ff00";
    } else {
      // Body segments - darker green
      ctx.fillStyle = "#00cc00";
    }

    ctx.fillRect(
      segment.x * TILE_SIZE + 1,
      segment.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
    );

    // Draw eyes on snake head to show direction
    if (index === 0) {
      ctx.fillStyle = "#000"; // Black eyes
      const eyeSize = 2; // 2x2 pixel eyes
      // Change eye position based on movement direction
      if (direction.x === 1) {
        // Moving right
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

  // Draw food as a spider
  const foodX = food.x * TILE_SIZE + TILE_SIZE / 2;
  const foodY = food.y * TILE_SIZE + TILE_SIZE / 2;

  // Draw outer glow effect for visibility
  ctx.fillStyle = "rgba(200, 100, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(foodX, foodY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Draw 8 spider legs - bright orange/tan
  ctx.strokeStyle = "#dd8844";
  ctx.lineWidth = 2;
  const legLength = 6;
  const legAngles = [
    0, // Right
    Math.PI / 4, // Bottom-right
    Math.PI / 2, // Down
    (3 * Math.PI) / 4, // Bottom-left
    Math.PI, // Left
    (5 * Math.PI) / 4, // Top-left
    (3 * Math.PI) / 2, // Up
    (7 * Math.PI) / 4, // Top-right
  ];

  // Draw each of the 8 legs
  legAngles.forEach((angle) => {
    const legX = foodX + Math.cos(angle) * 3;
    const legY = foodY + Math.sin(angle) * 3;
    const endX = foodX + Math.cos(angle) * (3 + legLength);
    const endY = foodY + Math.sin(angle) * (3 + legLength);

    ctx.beginPath();
    ctx.moveTo(legX, legY);
    // Curved leg (spider legs bend)
    const controlX = foodX + Math.cos(angle) * (3 + legLength / 2);
    const controlY = foodY + Math.sin(angle) * (3 + legLength / 2) + 2;
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();
  });

  // Draw abdomen (rear body) - larger circle - bright orange
  ctx.fillStyle = "#ff9944";
  ctx.beginPath();
  ctx.arc(foodX, foodY + 1, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw abdomen shading/pattern
  ctx.fillStyle = "#ff6622";
  ctx.beginPath();
  ctx.arc(foodX + 1, foodY + 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw abdomen highlights
  ctx.fillStyle = "rgba(255, 200, 100, 0.6)";
  ctx.beginPath();
  ctx.arc(foodX - 1.5, foodY - 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw cephalothorax (front body/head) - smaller circle - darker orange
  ctx.fillStyle = "#ff7722";
  ctx.beginPath();
  ctx.arc(foodX, foodY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw two eyes - bright yellow/green
  ctx.fillStyle = "#ffff00";
  ctx.beginPath();
  ctx.arc(foodX - 1, foodY - 3, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(foodX + 1, foodY - 3, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupils - black
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(foodX - 1, foodY - 3, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(foodX + 1, foodY - 3, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine - bright
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(foodX - 0.6, foodY - 3.4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(foodX + 1.4, foodY - 3.4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // ========================================
  // OBSTACLE STYLE 5: BOMB/CIRCULAR WITH GRADIENT
  // ========================================
  // Draw obstacles as round bombs with glossy gradient effect
  obstacles.forEach((obstacle) => {
    // Skip drawing if obstacle is still in spawn delay (not yet visible)
    if (obstacle.spawnDelay > 0) {
      return; // Don't draw this obstacle yet
    }

    const centerX = obstacle.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = obstacle.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = (TILE_SIZE - 4) / 2;

    // Calculate fading based on lifespan
    // At full lifespan (180), opacity = 1.0
    // At 0 lifespan, opacity = 0.3 (almost gone)
    const maxLifespan = 180; // Maximum lifespan range (100-180)
    const opacity = 0.3 + (obstacle.lifespan / maxLifespan) * 0.7;

    // Calculate warning color based on lifespan (gets more yellow/orange as time runs out)
    let colorIntensity = obstacle.lifespan / maxLifespan;
    if (colorIntensity < 0.3) {
      // Warning: flash bright orange/yellow when about to disappear
      colorIntensity = 0.5 + Math.sin(animationFrame * 0.3) * 0.3;
    }

    // Draw main bomb body with radial gradient (glossy sphere effect)
    const gradient = ctx.createRadialGradient(
      centerX - 2,
      centerY - 2,
      0,
      centerX,
      centerY,
      radius,
    );

    // Interpolate colors: red normally → orange/yellow when low
    const brightColor = `rgba(${255}, ${Math.floor(100 * colorIntensity)}, ${Math.floor(100 * colorIntensity)}, ${opacity})`;
    gradient.addColorStop(0, brightColor); // Bright color in center
    gradient.addColorStop(
      0.6,
      `rgba(${Math.floor(221 * colorIntensity)}, ${34}, ${34}, ${opacity})`,
    ); // Medium
    gradient.addColorStop(
      1,
      `rgba(${Math.floor(170 * colorIntensity)}, 0, 0, ${opacity})`,
    ); // Dark edges

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw bright glossy highlight on top-left
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * opacity})`;
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw secondary dimmer highlight
    ctx.fillStyle = `rgba(255, 150, 150, ${0.2 * opacity})`;
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY - 2, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw dark border with glow effect
    ctx.strokeStyle = `rgba(51, 0, 0, ${opacity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw outer glow ring - changes color as lifespan decreases
    const glowColor =
      obstacle.lifespan < 50
        ? `rgba(255, 200, 0, ${opacity * 0.8})` // Yellow warning (30% of max lifespan)
        : `rgba(255, 68, 68, ${opacity * 0.5})`; // Normal red
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Add small "fuse" on top of bomb
    ctx.strokeStyle = `rgba(51, 51, 51, ${opacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY - radius - 3);
    ctx.stroke();
  });
}

// ========================================
// USER INTERFACE UPDATES
// ========================================
// Update on-screen stats (score, level, speed)
function updateUI() {
  scoreDisplay.textContent = score; // Update score display
  levelDisplay.textContent = level; // Update level display
  speedDisplay.textContent = gameSpeed; // Update speed display
}

// ========================================
// GAME OVER LOGIC
// ========================================
// Stop game and show game over screen
function endGame() {
  gameRunning = false; // Stop game loop
  gamePaused = false; // Reset pause state
  clearInterval(gameLoopId); // Stop game loop interval

  // Show final stats in game over modal
  finalScoreDisplay.textContent = score;
  finalLevelDisplay.textContent = level;
  gameOverModal.classList.remove("hidden"); // Show modal

  // Update button states
  startBtn.disabled = false; // Allow restart
  pauseBtn.disabled = true; // Disable pause
}

// ========================================
// START GAME
// ========================================
// Begin or resume the game
function startGame() {
  if (gameRunning) return; // Already running, exit

  // Set game state
  gameRunning = true; // Activate game
  gamePaused = false; // Resume if paused
  startBtn.disabled = true; // Disable start button
  pauseBtn.disabled = false; // Enable pause button
  gameOverModal.classList.add("hidden"); // Hide game over screen

  // Start game loop - update and draw repeatedly
  gameLoopId = setInterval(() => {
    updateGame(); // Run game logic
    drawGame(); // Render frame
  }, 1000 / gameSpeed); // Calculate interval from speed

  // Draw initial frame
  drawGame();
}

// ========================================
// PAUSE/RESUME
// ========================================
// Pause or resume the running game
function togglePause() {
  if (!gameRunning) return; // Can't pause if not running

  gamePaused = !gamePaused; // Toggle pause state
  // Update button text to show action
  pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
}

// ========================================
// RESET GAME
// ========================================
// Reset game to initial state
function resetGame() {
  clearInterval(gameLoopId); // Stop game loop
  initializeGame(); // Reset all variables (includes spawning obstacles)
  drawGame(); // Render initial state

  // Reset button states
  startBtn.disabled = false; // Allow starting
  pauseBtn.disabled = true; // Disable pause
  pauseBtn.textContent = "Pause"; // Reset button text
  gameOverModal.classList.add("hidden"); // Hide game over
}

// ========================================
// EVENT LISTENERS - Button Controls
// ========================================
startBtn.addEventListener("click", startGame); // Start game button
pauseBtn.addEventListener("click", togglePause); // Pause game button
resetBtn.addEventListener("click", resetGame); // Reset game button
restartBtn.addEventListener("click", () => {
  // Game over modal restart button
  resetGame(); // Reset
  startGame(); // And immediately start
});

// ========================================
// KEYBOARD INPUT HANDLING
// ========================================
// Listen for keyboard input to control snake
document.addEventListener("keydown", (event) => {
  const key = event.key;

  // Arrow key controls - queue next direction
  // Prevent 180-degree turns (e.g., can't go right if already going left)
  if (key === "ArrowUp" && direction.y === 0) {
    nextDirection = { x: 0, y: -1 }; // Move up
  } else if (key === "ArrowDown" && direction.y === 0) {
    nextDirection = { x: 0, y: 1 }; // Move down
  } else if (key === "ArrowLeft" && direction.x === 0) {
    nextDirection = { x: -1, y: 0 }; // Move left
  } else if (key === "ArrowRight" && direction.x === 0) {
    nextDirection = { x: 1, y: 0 }; // Move right
  }

  // Spacebar to start/pause game
  if (key === " ") {
    event.preventDefault(); // Stop spacebar from scrolling
    if (!gameRunning) {
      startGame(); // Start a new game
    } else {
      togglePause(); // Pause or resume
    }
  }
});

// ========================================
// MOUSE/TOUCH INPUT HANDLING
// ========================================
// Alternative control: click canvas regions to change direction
canvas.addEventListener("click", (event) => {
  // Click to start if not running
  if (!gameRunning) {
    startGame();
    return;
  }

  // Get click position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Calculate distance from center in each axis
  const dx = x - centerX; // Distance left/right
  const dy = y - centerY; // Distance up/down

  // Determine which region was clicked
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal region - left/right click
    if (dx > 0 && direction.x === 0)
      nextDirection = { x: 1, y: 0 }; // Right
    else if (dx < 0 && direction.x === 0) nextDirection = { x: -1, y: 0 }; // Left
  } else {
    // Vertical region - up/down click
    if (dy > 0 && direction.y === 0)
      nextDirection = { x: 0, y: 1 }; // Down
    else if (dy < 0 && direction.y === 0) nextDirection = { x: 0, y: -1 }; // Up
  }
});

// ========================================
// PAGE INITIALIZATION
// ========================================
// Initialize game when page loads
window.addEventListener("load", () => {
  initializeGame(); // Set up initial game state
  drawGame(); // Render starting screen
});

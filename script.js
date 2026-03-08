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
      type: Math.floor(Math.random() * 10), // Random fruit type (0-9)
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

  // Random between 2-3 obstacles each game (adds variety)
  const obstacleCount = 2 + Math.floor(Math.random() * 2); // 2 or 3

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
        // Start with no spawn delay so all obstacles visible from the beginning
        spawnDelay: 0,
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

  // COLLISION CHECK 1: Wrap snake around edges (classic Snake behavior)
  head.x = (head.x + GRID_SIZE) % GRID_SIZE;
  head.y = (head.y + GRID_SIZE) % GRID_SIZE;

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

  // Draw food - 10 different fruit types with good contrast - EXTRA LARGE
  const foodX = food.x * TILE_SIZE + TILE_SIZE / 2;
  const foodY = food.y * TILE_SIZE + TILE_SIZE / 2;

  switch (food.type) {
    case 0: // Red Apple
      ctx.fillStyle = "#d32f2f";
      ctx.beginPath();
      ctx.arc(foodX, foodY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(foodX - 1.2, foodY - 10, 2.4, 4.5);
      ctx.fillStyle = "#558b2f";
      ctx.beginPath();
      ctx.arc(foodX - 3.5, foodY - 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(foodX - 3.5, foodY - 2.2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 1: // Yellow Banana
      ctx.fillStyle = "#ffeb3b";
      ctx.strokeStyle = "#f57f17";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(foodX - 5.5 + i * 5.5, foodY - 2.3, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = "#795548";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(foodX - 9.5, foodY + 4.5);
      ctx.lineTo(foodX + 9.5, foodY + 4.5);
      ctx.stroke();
      break;

    case 2: // Red Strawberry
      ctx.fillStyle = "#e91e63";
      ctx.beginPath();
      ctx.arc(foodX, foodY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffeb3b";
      const seedPositions = [
        [0, 0],
        [-4.5, -2.3],
        [4.5, -2.3],
        [-2.3, 2.3],
        [2.3, 2.3],
        [-4.5, 2.3],
        [4.5, 2.3],
      ];
      seedPositions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(foodX + pos[0], foodY + pos[1], 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#558b2f";
      ctx.beginPath();
      ctx.arc(foodX - 2.3, foodY - 7.5, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(foodX + 2.3, foodY - 7.5, 2.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 3: // Orange Orange
      ctx.fillStyle = "#ff9800";
      ctx.beginPath();
      ctx.arc(foodX, foodY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e65100";
      ctx.lineWidth = 2.3;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(foodX, foodY);
        ctx.lineTo(
          foodX + Math.cos(angle) * 7.5,
          foodY + Math.sin(angle) * 7.5,
        );
        ctx.stroke();
      }
      ctx.fillStyle = "#558b2f";
      ctx.beginPath();
      ctx.arc(foodX, foodY - 7.5, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(foodX - 3.3, foodY - 2.3, 3.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 4: // Purple Grapes
      ctx.fillStyle = "#9c27b0";
      const grapePositions = [
        [0, 0],
        [-4.5, -3.3],
        [4.5, -3.3],
        [-6.75, 0],
        [6.75, 0],
        [-4.5, 3.3],
        [4.5, 3.3],
      ];
      grapePositions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(foodX + pos[0], foodY + pos[1], 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#795548";
      ctx.fillRect(foodX - 1.2, foodY - 9, 2.4, 3.3);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(foodX - 2.25, foodY - 1.2, 2.25, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 5: // Green Watermelon
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(foodX, foodY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff5252";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(foodX - 4.5, foodY);
      ctx.lineTo(foodX + 4.5, foodY);
      ctx.stroke();
      ctx.strokeStyle = "#ffeb3b";
      ctx.lineWidth = 1.5;
      const seedPositions2 = [
        [-2.25, -2.25],
        [2.25, -2.25],
        [-2.25, 2.25],
        [2.25, 2.25],
      ];
      seedPositions2.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(foodX + pos[0], foodY + pos[1], 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      break;

    case 6: // Cherry Red (2 cherries)
      ctx.fillStyle = "#dc143c";
      ctx.beginPath();
      ctx.arc(foodX - 3.3, foodY, 5.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(foodX + 3.3, foodY, 5.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.moveTo(foodX - 3.3, foodY - 5.25);
      ctx.lineTo(foodX + 3.3, foodY - 5.25);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(foodX - 2.25, foodY - 2.25, 2.25, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 7: // Yellow Pineapple
      ctx.fillStyle = "#fdd835";
      ctx.beginPath();
      ctx.arc(foodX, foodY + 1.2, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f57f17";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          ctx.beginPath();
          ctx.rect(foodX - 6.75 + i * 2.7, foodY - 5.25 + j * 2.7, 2.55, 2.55);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#558b2f";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(foodX - 2.25 + i * 2.25, foodY - 9, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 8: // Orange/Yellow Mango
      ctx.fillStyle = "#fbc02d";
      ctx.beginPath();
      ctx.arc(foodX, foodY + 2.25, 6.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff9800";
      ctx.beginPath();
      ctx.arc(foodX, foodY + 1.2, 5.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6f00";
      ctx.beginPath();
      ctx.arc(foodX, foodY + 2.25, 3.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.moveTo(foodX, foodY - 4.5);
      ctx.lineTo(foodX + 2.25, foodY - 7.8);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(foodX - 1.2, foodY - 1.2, 3.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 9: // Pink Peach
      ctx.fillStyle = "#ff69b4";
      ctx.beginPath();
      ctx.arc(foodX, foodY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff1493";
      ctx.beginPath();
      ctx.arc(foodX + 1.2, foodY + 2.25, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(foodX, foodY, 7.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(foodX - 1.2, foodY - 7.5, 2.4, 2.25);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(foodX - 2.7, foodY - 2.7, 3.3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

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

# 🐍 Snake Game

A classic snake game implementation in HTML5 Canvas with JavaScript. The game features progressive difficulty, scoring system, and a smooth gaming experience.

## Features

- **Classic Gameplay**: Navigate the snake to eat food and grow longer
- **Progressive Difficulty**: The game gets faster as your score increases
- **Level System**: Levels increase every 100 points, with corresponding speed increases
- **Score Tracking**: Keep track of your score and current level
- **Multiple Control Methods**:
  - Arrow Keys for movement
  - Spacebar to start/pause
  - Mouse clicks on canvas for direction (click regions)
- **Responsive Design**: Works on desktop and mobile devices
- **Game Over Modal**: Shows final score and level when game ends

## How to Run

1. Open `index.html` in your web browser
2. Click "Start Game" or press Spacebar
3. Use Arrow Keys to control the snake
4. Eat the red circles to grow and earn points
5. Avoid hitting walls and your own tail

## Game Rules

- The snake automatically moves forward in the current direction
- Change direction using arrow keys
- Eating food adds 10 points and makes the snake grow longer
- The game ends when you hit a wall or collide with your own body
- Speed increases with each level (every 100 points = 1 level)

## Controls

| Control      | Action                      |
| ------------ | --------------------------- |
| Arrow Keys   | Change Direction            |
| Spacebar     | Start/Pause Game            |
| Click Canvas | Alternate Direction Control |
| Start Button | Start Game                  |
| Pause Button | Pause/Resume Game           |
| Reset Button | Reset Game to Start         |

## Files

- `index.html` - Game structure and UI
- `style.css` - Styling and layout
- `script.js` - Game logic and mechanics

## Game Stats

- **Score**: Points earned (10 per food item)
- **Level**: Current level (increases every 100 points)
- **Speed**: Current game speed (increases with level)

## Tips

- Plan your moves ahead to avoid trapping yourself
- Try to create loops or circular patterns to maximize space
- The game gets progressively harder as you eat more food
- Use edges strategically to maneuver around growing tail

Enjoy! 🎮

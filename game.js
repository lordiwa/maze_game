// game.js

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const COLS = 20;
const ROWS = 20;
const CELL_SIZE = canvas.width / COLS;

// Game variables
let grid = [];
let stack = [];
let obstacles = [];
let lifeItems = [];

// Player properties
let player = {
    x: 0,
    y: 0,
    size: CELL_SIZE * 0.6,
    lives: 5,
    maxLives: 5,
};

// Direction vectors
const directions = [
    { x: 0, y: -1 },  // Up
    { x: 1, y: 0 },   // Right
    { x: 0, y: 1 },   // Down
    { x: -1, y: 0 }   // Left
];

// Cell class
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = [true, true, true, true]; // Top, Right, Bottom, Left
        this.visited = false;
    }

    // Draw the cell walls
    draw() {
        const x = this.x * CELL_SIZE;
        const y = this.y * CELL_SIZE;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        if (this.walls[0]) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL_SIZE, y);
            ctx.stroke();
        }
        if (this.walls[1]) {
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE, y);
            ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            ctx.stroke();
        }
        if (this.walls[2]) {
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE, y + CELL_SIZE);
            ctx.lineTo(x, y + CELL_SIZE);
            ctx.stroke();
        }
        if (this.walls[3]) {
            ctx.beginPath();
            ctx.moveTo(x, y + CELL_SIZE);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    // Get unvisited neighbors
    getUnvisitedNeighbors() {
        let neighbors = [];

        for (let dir of directions) {
            let nx = this.x + dir.x;
            let ny = this.y + dir.y;

            if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
                let neighbor = grid[ny][nx];
                if (!neighbor.visited) {
                    neighbors.push({ neighbor, dir });
                }
            }
        }
        return neighbors;
    }
}

// Initialize the grid
function initGrid() {
    grid = [];
    for (let y = 0; y < ROWS; y++) {
        grid[y] = [];
        for (let x = 0; x < COLS; x++) {
            grid[y][x] = new Cell(x, y);
        }
    }
}

// Maze generation using Recursive Backtracking
function generateMaze() {
    let current = grid[0][0];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
        current = stack.pop();
        let neighbors = current.getUnvisitedNeighbors();

        if (neighbors.length > 0) {
            stack.push(current);

            // Pick a random neighbor
            let { neighbor, dir } = neighbors[Math.floor(Math.random() * neighbors.length)];
            neighbor.visited = true;

            // Remove walls between current and neighbor
            if (dir.x === 0 && dir.y === -1) { // Up
                current.walls[0] = false;
                neighbor.walls[2] = false;
            }
            if (dir.x === 1 && dir.y === 0) { // Right
                current.walls[1] = false;
                neighbor.walls[3] = false;
            }
            if (dir.x === 0 && dir.y === 1) { // Down
                current.walls[2] = false;
                neighbor.walls[0] = false;
            }
            if (dir.x === -1 && dir.y === 0) { // Left
                current.walls[3] = false;
                neighbor.walls[1] = false;
            }

            stack.push(neighbor);
        }
    }
}

// Draw the maze
function drawMaze() {
    for (let row of grid) {
        for (let cell of row) {
            cell.draw();
        }
    }
}

// Draw the player
function drawPlayer() {
    ctx.fillStyle = 'green';
    ctx.fillRect(
        player.x * CELL_SIZE + CELL_SIZE * 0.2,
        player.y * CELL_SIZE + CELL_SIZE * 0.2,
        player.size,
        player.size
    );
}

// Event listener for player movement
document.addEventListener('keydown', movePlayer);

function movePlayer(e) {
    let cell = grid[player.y][player.x];
    let moved = false;

    if (e.key === 'ArrowUp' && !cell.walls[0] && player.y > 0) {
        player.y--;
        moved = true;
    } else if (e.key === 'ArrowRight' && !cell.walls[1] && player.x < COLS - 1) {
        player.x++;
        moved = true;
    } else if (e.key === 'ArrowDown' && !cell.walls[2] && player.y < ROWS - 1) {
        player.y++;
        moved = true;
    } else if (e.key === 'ArrowLeft' && !cell.walls[3] && player.x > 0) {
        player.x--;
        moved = true;
    }

    if (moved) {
        checkCollisions();
        render();
    }
}

// Place obstacles and life items
function placeObstaclesAndLifeItems() {
    // Ensure there is always one more obstacle than life items
    const numLifeItems = 3; // You can adjust this number
    const numObstacles = numLifeItems + 1;

    // Place obstacles
    for (let i = 0; i < numObstacles; i++) {
        let pos = getRandomEmptyCell();
        obstacles.push(pos);
    }

    // Place life items
    for (let i = 0; i < numLifeItems; i++) {
        let pos = getRandomEmptyCell();
        lifeItems.push(pos);
    }
}

// Get a random empty cell
function getRandomEmptyCell() {
    let x, y;
    do {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
    } while (
        (x === 0 && y === 0) || // Avoid starting position
        (x === COLS - 1 && y === ROWS - 1) || // Avoid ending position
        obstacles.some(o => o.x === x && o.y === y) ||
        lifeItems.some(l => l.x === x && l.y === y)
        );
    return { x, y };
}

// Draw obstacles (red balls)
function drawObstacles() {
    for (let obs of obstacles) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(
            obs.x * CELL_SIZE + CELL_SIZE / 2,
            obs.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE * 0.2,
            0,
            2 * Math.PI
        );
        ctx.fill();
    }
}

// Draw life items (green triangles)
function drawLifeItems() {
    for (let item of lifeItems) {
        ctx.fillStyle = 'limegreen';
        ctx.beginPath();
        ctx.moveTo(
            item.x * CELL_SIZE + CELL_SIZE / 2,
            item.y * CELL_SIZE + CELL_SIZE * 0.3
        );
        ctx.lineTo(
            item.x * CELL_SIZE + CELL_SIZE * 0.7,
            item.y * CELL_SIZE + CELL_SIZE * 0.7
        );
        ctx.lineTo(
            item.x * CELL_SIZE + CELL_SIZE * 0.3,
            item.y * CELL_SIZE + CELL_SIZE * 0.7
        );
        ctx.closePath();
        ctx.fill();
    }
}

// Check for collisions
function checkCollisions() {
    // Collision with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        if (player.x === obstacles[i].x && player.y === obstacles[i].y) {
            obstacles.splice(i, 1); // Remove the obstacle
            player.lives--;
            updateHUD();
            if (player.lives <= 0) {
                setTimeout(() => {
                    alert('Game Over!');
                    resetGame();
                }, 100);
            }
            break;
        }
    }

    // Collision with life items
    for (let i = 0; i < lifeItems.length; i++) {
        if (player.x === lifeItems[i].x && player.y === lifeItems[i].y) {
            lifeItems.splice(i, 1); // Remove the life item
            if (player.lives < player.maxLives) {
                player.lives++;
                updateHUD();
            }
            break;
        }
    }

    // Check if reached the end
    if (player.x === COLS - 1 && player.y === ROWS - 1) {
        setTimeout(() => {
            alert('You Win!');
            resetGame();
        }, 100);
    }
}

// Update the HUD
function updateHUD() {
    document.getElementById('lives').textContent = `Lives: ${player.lives}`;
}

// Reset the game
function resetGame() {
    // Reset player position and lives
    player.x = 0;
    player.y = 0;
    player.lives = player.maxLives;

    // Reset game variables
    grid = [];
    stack = [];
    obstacles = [];
    lifeItems = [];

    initializeGame();
}

// Render the game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawObstacles();
    drawLifeItems();
    drawPlayer();
}

// Initialize the game
function initializeGame() {
    initGrid();
    generateMaze();
    placeObstaclesAndLifeItems();
    updateHUD();
    render();
}

// Start the game
initializeGame();

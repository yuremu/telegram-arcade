// Inicializar Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById('user-greeting').innerText = `¡Hola, ${user.first_name}!`;
  }
}

let coins = 0;
function addCoins(amount) {
  coins += amount;
  document.getElementById('coins-count').innerText = coins;
}

function showMenu() {
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('memory-game').classList.add('hidden');
  document.getElementById('snake-game').classList.add('hidden');
  stopSnake();
}

function showGame(game) {
  document.getElementById('main-menu').classList.add('hidden');
  if (game === 'memory') {
    document.getElementById('memory-game').classList.remove('hidden');
    initMemoryGame();
  } else if (game === 'snake') {
    document.getElementById('snake-game').classList.remove('hidden');
    startSnakeGame();
  }
}

/* --- LÓGICA JUEGO DE MEMORIA --- */
const emojis = ['🍕', '🍕', '🚀', '🚀', '🐱', '🐱', '🎮', '🎮'];
let flippedCards = [];
let matchedCount = 0;

function initMemoryGame() {
  const board = document.getElementById('memory-board');
  board.innerHTML = '';
  flippedCards = [];
  matchedCount = 0;
  
  const shuffled = [...emojis].sort(() => Math.random() - 0.5);
  shuffled.forEach((emoji) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.emoji = emoji;
    card.innerText = '❓';
    card.addEventListener('click', () => flipCard(card));
    board.appendChild(card);
  });
}

function flipCard(card) {
  if (flippedCards.length < 2 && !card.classList.contains('flipped')) {
    card.classList.add('flipped');
    card.innerText = card.dataset.emoji;
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      setTimeout(checkMemoryMatch, 700);
    }
  }
}

function checkMemoryMatch() {
  const [c1, c2] = flippedCards;
  if (c1.dataset.emoji === c2.dataset.emoji) {
    matchedCount += 2;
    if (matchedCount === emojis.length) {
      alert('¡Ganaste 10 Monedas!');
      addCoins(10);
      initMemoryGame();
    }
  } else {
    c1.classList.remove('flipped');
    c1.innerText = '❓';
    c2.classList.remove('flipped');
    c2.innerText = '❓';
  }
  flippedCards = [];
}

/* --- LÓGICA JUEGO DE SNAKE --- */
const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
const box = 15;
let snake = [];
let direction = 'RIGHT';
let food = {};
let gameLoop = null;

function startSnakeGame() {
  snake = [{ x: 9 * box, y: 10 * box }];
  direction = 'RIGHT';
  spawnFood();
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(drawSnake, 120);
}

function stopSnake() {
  if (gameLoop) clearInterval(gameLoop);
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * 19 + 1) * box,
    y: Math.floor(Math.random() * 19 + 1) * box
  };
}

function changeDirection(dir) {
  if (dir === 'LEFT' && direction !== 'RIGHT') direction = 'LEFT';
  if (dir === 'UP' && direction !== 'DOWN') direction = 'UP';
  if (dir === 'RIGHT' && direction !== 'LEFT') direction = 'RIGHT';
  if (dir === 'DOWN' && direction !== 'UP') direction = 'DOWN';
}

function drawSnake() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? '#2481cc' : '#ffffff';
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = '#e53935';
  ctx.fillRect(food.x, food.y, box, box);

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === 'LEFT') snakeX -= box;
  if (direction === 'UP') snakeY -= box;
  if (direction === 'RIGHT') snakeX += box;
  if (direction === 'DOWN') snakeY += box;

  if (snakeX === food.x && snakeY === food.y) {
    addCoins(5);
    spawnFood();
  } else {
    snake.pop();
  }

  const newHead = { x: snakeX, y: snakeY };

  if (
    snakeX < 0 || snakeX >= canvas.width ||
    snakeY < 0 || snakeY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(gameLoop);
    alert('Game Over! Puntuación finalizada.');
    showMenu();
  } else {
    snake.unshift(newHead);
  }
}

function collision(head, array) {
  return array.some(segment => head.x === segment.x && head.y === segment.y);
}
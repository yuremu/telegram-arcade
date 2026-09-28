// Variable global para guardar la información del jugador
let player = {
  id: null,
  firstName: 'Invitado',
  username: '',
  language: 'es'
};

// Inicializar el SDK de Telegram
function initTelegramUser() {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    // Expandir la app a pantalla completa
    tg.expand();
    tg.ready();

    // Obtener los datos del usuario enviados por Telegram
    const userData = tg.initDataUnsafe?.user;

    if (userData) {
      player.id = userData.id;
      player.firstName = userData.first_name || 'Jugador';
      player.username = userData.username || '';
      player.language = userData.language_code || 'es';

      console.log('✅ Usuario detectado en Telegram:', player);

      // Mostrar saludo e información en la interfaz
      document.getElementById('user-greeting').innerText = `¡Hola, ${player.firstName}!`;
      
      // Mostrar el ID en la interfaz si lo deseas para depuración
      const userInfoEl = document.getElementById('user-info');
      if (userInfoEl) {
        userInfoEl.innerText = `ID: ${player.id}`;
      }
    } else {
      console.warn('⚠️ Se ejecutó fuera de Telegram o en modo prueba local.');
      document.getElementById('user-greeting').innerText = '¡Hola, Invitado!';
    }
  } else {
    console.error('❌ El SDK de Telegram WebApp no está cargado.');
  }
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initTelegramUser();
});

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

// Configuración de recompensas por día de racha (en monedas)
const DAILY_REWARDS = [10, 20, 30, 50, 80, 120, 200];

// Claves únicas utilizando el id de Telegram si está disponible
function getStorageKey(keyName) {
  const userId = player.id || 'guest';
  return `${keyName}_${userId}`;
}

// Inicializar y verificar el estado de la recompensa
function checkDailyRewardStatus() {
  const lastClaimStr = localStorage.getItem(getStorageKey('last_claim_date'));
  const streak = parseInt(localStorage.getItem(getStorageKey('reward_streak')) || '0');
  
  const streakText = document.getElementById('streak-text');
  const btn = document.getElementById('daily-btn');
  const timerText = document.getElementById('timer-text');

  streakText.innerText = `Racha actual: ${streak} día(s)`;

  if (!lastClaimStr) {
    // Primera vez que entra
    btn.disabled = false;
    btn.innerText = `Reclamar +${DAILY_REWARDS[0]} 🪙`;
    timerText.innerText = '¡Tu primera recompensa está disponible!';
    return;
  }

  const lastClaim = new Date(lastClaimStr);
  const now = new Date();

  // Comprobar si es el mismo día calendario
  const isSameDay = lastClaim.toDateString() === now.toDateString();

  if (isSameDay) {
    // Ya reclamó hoy
    btn.disabled = true;
    btn.innerText = '¡Ya reclamaste hoy!';
    timerText.innerText = 'Regresa mañana para tu siguiente premio.';
  } else {
    // Pasó más de un día, verificar si se mantiene la racha
    const diffTime = Math.abs(now - lastClaim);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let nextStreak = streak;
    if (diffDays > 1) {
      // Se rompió la racha por no entrar un día completo
      nextStreak = 0;
      localStorage.setItem(getStorageKey('reward_streak'), '0');
    }

    const rewardAmount = DAILY_REWARDS[Math.min(nextStreak, DAILY_REWARDS.length - 1)];
    btn.disabled = false;
    btn.innerText = `Reclamar +${rewardAmount} 🪙`;
    timerText.innerText = '¡Recompensa disponible!';
  }
}

// Función ejecutada al presionar el botón de reclamo
function claimDailyReward() {
  let streak = parseInt(localStorage.getItem(getStorageKey('reward_streak')) || '0');
  
  // Calcular premio
  const rewardAmount = DAILY_REWARDS[Math.min(streak, DAILY_REWARDS.length - 1)];

  // Otorgar monedas
  addCoins(rewardAmount);

  // Actualizar racha y fecha
  streak += 1;
  localStorage.setItem(getStorageKey('reward_streak'), streak.toString());
  localStorage.setItem(getStorageKey('last_claim_date'), new Date().toISOString());

  // Confirmar visualmente
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) {
    // Vibración ligera en dispositivos móviles
    tg.HapticFeedback.notificationOccurred('success');
  }

  alert(`🎉 ¡Has recibido ${rewardAmount} monedas!`);

  // Actualizar estado del botón
  checkDailyRewardStatus();
}

// Ejecutar la verificación al iniciar la app
document.addEventListener('DOMContentLoaded', () => {
  // Le damos un pequeño tiempo para asegurar que el id de Telegram se cargó primero
  setTimeout(() => {
    checkDailyRewardStatus();
  }, 200);
});

const BACKEND_URL = 'https://telegram-arcade-backend.onrender.com/'; // O la URL donde alojes tu backend (ej. Render o Railway)

async function syncUserWithBackend() {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const user = tg?.initDataUnsafe?.user || { id: 9999, first_name: 'Invitado Local' };

  try {
    const response = await fetch(`${BACKEND_URL}/api/user/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, user })
    });

    const data = await response.json();
    if (data.success) {
      // Actualizar interfaz con datos reales guardados en la BD
      coins = data.user.coins;
      document.getElementById('coins-count').innerText = coins;
      console.log('✅ Datos sincronizados con el Backend:', data.user);
    }
  } catch (error) {
    console.error('❌ Error de conexión con el backend:', error);
  }
}
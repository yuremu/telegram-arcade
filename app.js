// 🌐 Configuración del Backend en Render
const BACKEND_URL = 'https://telegram-arcade-backend.onrender.com';

/* ==========================================
   INTEGRACIÓN DE ADSGRAM (ANUNCIOS RECOMPENSADOS)
   ========================================== */

// Reemplaza "YOUR_BLOCK_ID" por tu ID de bloque publicitario real de Adsgram
const ADSGRAM_BLOCK_ID = "50697"; 

let AdControllerInstance = null;

// Inicializar el controlador cuando la página esté lista
function initAdsgram() {
  if (window.Adsgram) {
    AdControllerInstance = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    console.log("✅ SDK de Adsgram listo.");
  } else {
    console.warn("⚠️ SDK de Adsgram no detectado. Revisa la etiqueta script en index.html");
  }
}

async function showRewardAd() {
  const adButton = document.getElementById("watch-ad-btn");
  if (adButton) adButton.disabled = true;

  if (!AdControllerInstance) {
    // Si no se ha inicializado o estamos en navegador de pruebas local
    if (window.Adsgram) {
      AdControllerInstance = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    } else {
      alert("Anuncios no disponibles fuera de Telegram o SDK no cargado.");
      if (adButton) adButton.disabled = false;
      return;
    }
  }

  try {
    const result = await AdControllerInstance.show();
    
    // Si el usuario vio el video publicitario completo
    if (result.done) {
      alert("🎉 ¡Gracias por ver el anuncio! Ganaste +50 monedas.");
      addCoinsToBackend(50); // Llama a nuestra función existente que guarda en Render
    }
  } catch (error) {
    if (error.error === "banner_not_found" || error.error === "no_ads") {
      alert("No hay anuncios disponibles en este momento. Intenta de nuevo más tarde.");
    } else if (error.error === "user_closed") {
      alert("Cerraste el video antes de tiempo. No se otorgaron las monedas.");
    } else {
      console.error("Error al reproducir el anuncio:", error);
    }
  } finally {
    if (adButton) adButton.disabled = false;
  }
}

// Inicializar Adsgram junto al resto de eventos
document.addEventListener('DOMContentLoaded', () => {
  initAdsgram();
});

// Variable global para almacenar el estado del jugador
let player = {
  id: null,
  firstName: 'Invitado',
  username: '',
  coins: 0
};

/* ==========================================
   1. INICIALIZACIÓN Y COMUNICACIÓN CON TELEGRAM Y BACKEND
   ========================================== */

async function initTelegramUser() {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.expand();
    tg.ready();

    const userData = tg.initDataUnsafe?.user;
    const initData = tg.initData || '';

    if (userData) {
      player.id = userData.id;
      player.firstName = userData.first_name || 'Jugador';
      player.username = userData.username || '';
    } else {
      // Usuario de prueba para desarrollo local en navegador
      player.id = 999999;
      player.firstName = 'Jugador Local';
    }

    document.getElementById('user-greeting').innerText = `¡Hola, ${player.firstName}!`;

    // Sincronizar datos del usuario con el servidor en Render
    await syncUserWithBackend(initData, userData || { id: player.id, first_name: player.firstName });
  }
}

// Sincronizar / Registrar usuario en Render
async function syncUserWithBackend(initData, user) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, user })
    });

    const data = await response.json();

    if (data.success && data.user) {
      player.coins = data.user.coins || 0;
      updateCoinsUI(player.coins);
      console.log('✅ Usuario sincronizado con Render:', data.user);
    }
  } catch (error) {
    console.error('❌ Error al conectar con el backend en Render:', error);
  }
}

// Enviar nuevas monedas ganadas al backend en Render
async function addCoinsToBackend(amount) {
  if (!player.id) return;

  // Actualización rápida en la interfaz para mejor UX
  player.coins += amount;
  updateCoinsUI(player.coins);

  try {
    const response = await fetch(`${BACKEND_URL}/api/user/add-coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: player.id,
        amount: amount
      })
    });

    const data = await response.json();
    if (data.success) {
      player.coins = data.coins;
      updateCoinsUI(player.coins);
    }
  } catch (error) {
    console.error('❌ Error guardando monedas en el servidor:', error);
  }
}

function updateCoinsUI(amount) {
  const coinsEl = document.getElementById('coins-count');
  if (coinsEl) {
    coinsEl.innerText = amount;
  }
}

/* ==========================================
   2. CONTROL DE PANTALLAS Y MENÚ
   ========================================== */

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

/* ==========================================
   3. LÓGICA JUEGO DE MEMORIA
   ========================================== */

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
      alert('🎉 ¡Completaste el juego de Memoria! +10 Monedas');
      addCoinsToBackend(10);
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

/* ==========================================
   4. LÓGICA JUEGO DE SNAKE
   ========================================== */

const canvas = document.getElementById('snake-canvas');
const ctx = canvas?.getContext('2d');
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
  if (!ctx) return;

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
    addCoinsToBackend(5);
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
    alert('💥 Game Over en Snake. Volviendo al menú...');
    showMenu();
  } else {
    snake.unshift(newHead);
  }
}

function collision(head, array) {
  return array.some(segment => head.x === segment.x && head.y === segment.y);
}

/* ==========================================
   5. INICIO DE LA APLICACIÓN
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTelegramUser();
});

// Configuración de recompensas por día de racha (en monedas)
const DAILY_REWARDS = [10, 20, 30, 50, 80, 120, 200];

// Claves únicas utilizando el id de Telegram si está disponible
function getStorageKey(keyName) {
  const userId = player.id || 'guest';
  return `${keyName}_${userId}`;
}

/* ==========================================
   6. Recompensa diaria
   ========================================== */

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

// Función para acreditar las monedas en frontend o backend
function addCoins(amount) {
  // Lógica para actualizar las monedas del usuario
  addCoinsToBackend(amount);
  console.log(`+${amount} monedas acreditadas.`);
}
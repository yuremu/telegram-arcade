// Configuración de la App
const ADSGRAM_BLOCK_ID = "int-50945"; // Tu Block ID de Adsgram
const ADMIN_IDS = [123456789, 630997761]; // Agrega aquí tus ID numéricos de Telegram de Admin

// 🌐 Configuración del Backend en Render
const BACKEND_URL = 'https://telegram-arcade-backend.onrender.com';

let currentUser = null;
let AdControllerInstance = null;

// Variable global para almacenar el estado del jugador
let player = {
  id: null,
  firstName: 'Invitado',
  username: '',
  coins: 0
};

// Inicialización cuando carga Telegram
document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    currentUser = tg.initDataUnsafe?.user || { id: 123456789, first_name: "Dev User" };
  } else {
    currentUser = { id: 123456789, first_name: "Dev User" };
  }
	
  initTelegramUser();
  setupUserInterface();
  initAdsgram();
  loadUserData();
});

// 1. CAMBIO DE PANTALLAS (TAB SWITCHING)
function switchTab(screenId, btnElement) {
  // Ocultar todas las pantallas
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Desactivar botones de navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Mostrar la pantalla seleccionada y activar botón
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.classList.add('active');
  if (btnElement) btnElement.classList.add('active');

  // Si entra al panel de Admin, cargar datos actualizados
  if (screenId === 'screen-admin') {
    loadAdminDashboard();
  }
}

// 2. VERIFICACIÓN DE ADMINISTRADOR
function setupUserInterface() {
  document.getElementById('user-name').innerText = currentUser.first_name || 'Usuario';
  document.getElementById('user-id').innerText = currentUser.id || 'ID';

  // Verificar si es administrador
  if (ADMIN_IDS.includes(currentUser.id)) {
    document.getElementById('user-role').innerText = "Administrador";
    // Mostrar accesos de admin
    document.querySelectorAll('.hidden-role').forEach(el => el.classList.remove('hidden-role'));
  }
}

// 3. INTEGRACIÓN CON ADSGRAM
function initAdsgram() {
  if (window.Adsgram) {
    AdControllerInstance = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
  }
}

async function showRewardAd() {
  const adBtn = document.getElementById('watch-ad-btn');
  adBtn.disabled = true;

  try {
    if (!AdControllerInstance && window.Adsgram) {
      AdControllerInstance = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    }

    if (AdControllerInstance) {
      const result = await AdControllerInstance.show();
      if (result.done) {
        alert("🎉 ¡Completado! +50 monedas añadidas.");
        updateBalance(50, "Recompensa Anuncio Video");
      }
    } else {
      alert("Anuncios no disponibles en entorno local de pruebas.");
    }
  } catch (err) {
    console.error("Error en Adsgram:", err);
  } finally {
    adBtn.disabled = false;
  }
}

// 4. RECOMPENSA DIARIA & BALANCE
function claimDailyReward() {
  const btn = document.getElementById('daily-claim-btn');
  btn.disabled = true;
  btn.innerText = "⏳ Reclamado hoy";
  updateBalance(50, "Recompensa Diaria");
  alert("🎁 Has reclamado tu recompensa diaria de +100 monedas.");
}

function updateBalance(amount, reason) {
  const balanceEl = document.getElementById('coin-balance');
  let currentBalance = parseInt(balanceEl.innerText) || 0;
  currentBalance += amount;
  balanceEl.innerText = currentBalance;

  // Registrar en lista de movimientos del frontend
  const list = document.getElementById('transactions-list');
  const emptyState = list.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const item = document.createElement('div');
  item.className = 'transaction-item';
  item.innerHTML = `<p><strong>${reason}</strong><br><small>${new Date().toLocaleTimeString()}</small></p><span style="color:var(--success-color)">+${amount} 🪙</span>`;
  list.prepend(item);
}

// 5. CARGAR DATOS DEL PANEL DE ADMIN
function loadAdminDashboard() {
  // Ejemplo simulado / consumirías tu API de Render/Backend aquí
  document.getElementById('stat-total-users').innerText = "1,240";
  document.getElementById('stat-total-coins').innerText = "450,000";

  const tbody = document.getElementById('admin-users-table');
  tbody.innerHTML = `
    <tr>
      <td>${currentUser.id}<br><small>${currentUser.first_name}</small></td>
      <td>550 🪙</td>
      <td><button onclick="alert('Detalles del usuario')">🔍 Ver</button></td>
    </tr>
  `;
}

function openGame(gameType) {
  alert(`Iniciando juego: ${gameType}`);
}

function loadUserData() {
  // Lógica para sincronizar saldo actual con la base de datos backend
}

/* ==========================================
   INICIALIZACIÓN Y COMUNICACIÓN CON TELEGRAM Y BACKEND
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
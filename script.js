const STORAGE_KEY = 'tallyAppData';
const LOGO_KEY = 'tallyLogo';
const BG_COLOR_KEY = 'bgColor';
const BG_IMAGE_KEY = 'bgImage';
const GLOBAL_LIMIT_KEY = 'globalLimitValue';
const DEFAULT_LOGO = 'img/logo.png';
const DEFAULT_IMAGE = 'img/placeholder-image.jpg';

let tallies = [];

function saveTallies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tallies));
}

function loadTallies() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    tallies = JSON.parse(data);
  } else {
    const savedGlobalLimit = parseInt(localStorage.getItem(GLOBAL_LIMIT_KEY), 10) || 10;
    tallies = [
      { id: Date.now(), name: 'Tally 1', count: 0, limit: savedGlobalLimit, image: DEFAULT_IMAGE},
      { id: Date.now() + 1, name: 'Tally 2', count: 0, limit: savedGlobalLimit, image: DEFAULT_IMAGE },
      { id: Date.now() + 2, name: 'Tally 3', count: 0, limit: savedGlobalLimit, image: DEFAULT_IMAGE}
    ];
    saveTallies();
  }
}

function createTallyElement(tally) {
  const tallyElem = document.createElement('div');
  tallyElem.className = 'tally';
  tallyElem.setAttribute('data-id', tally.id);

  tallyElem.innerHTML = `
    <div class="image-container">
      <img src="${tally.image}">
      <input type="file" accept="image/*" style="display:none;">
    </div>
    <div class="tally-controls">
      <div class="tally-name" title="Clicca per rinominare">${tally.name || 'Rinomina qui'}</div>
      <div class="buttons">
        <button class="decrement">-</button>
        <div class="count-number">${tally.count}</div>
        <button class="increment">+</button>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-inner"></div>
      </div>
    </div>
    <div class="tally-menu">⋮</div>
    <div class="menu-options">
      <button class="adjust-tally">Aggiungi/Togli</button>
      <button class="set-tally">Imposta</button>
      <button class="reset-tally">Azzerare</button>
      <button class="remove-tally">Rimuovi</button>
    </div>
  `;

  const decrementBtn = tallyElem.querySelector('.decrement');
  const incrementBtn = tallyElem.querySelector('.increment');
  const countElem = tallyElem.querySelector('.count-number');
  const progressInner = tallyElem.querySelector('.progress-bar-inner');
  const nameElem = tallyElem.querySelector('.tally-name');
  const imageContainer = tallyElem.querySelector('.image-container');
  const fileInput = tallyElem.querySelector('input[type="file"]');
  const imgElem = imageContainer.querySelector('img');
  const tallyMenu = tallyElem.querySelector('.tally-menu');
  const menuOptions = tallyElem.querySelector('.menu-options');
  const adjustBtn = tallyElem.querySelector('.adjust-tally');
  const setBtn = tallyElem.querySelector('.set-tally');
  const resetBtn = tallyElem.querySelector('.reset-tally');
  const removeBtn = tallyElem.querySelector('.remove-tally');

  updateProgress(tally, progressInner);

  // Funzione per gestire il "hold" con accelerazione progressiva
  let holdTimeout;
  const initialDelay = 400; // ritardo iniziale in ms
  const minDelay = 50;      // ritardo minimo
  const accelerationStep = 30; // quanto il delay si riduce ad ogni iterazione

  function startHold(action) {
    let currentDelay = initialDelay;
    function runAction() {
      action();
      currentDelay = Math.max(minDelay, currentDelay - accelerationStep);
      holdTimeout = setTimeout(runAction, currentDelay);
    }
    runAction();
  }
  function stopHold() {
    clearTimeout(holdTimeout);
  }

  // Gestione incremento con hold progressivo
  incrementBtn.addEventListener('mousedown', () => {
    startHold(() => {
      if (tally.count < tally.limit) {
        tally.count++;
        countElem.textContent = tally.count;
        updateProgress(tally, progressInner);
        saveTallies();
      }
    });
  });
  incrementBtn.addEventListener('mouseup', stopHold);
  incrementBtn.addEventListener('mouseleave', stopHold);

  // Gestione decremento con hold progressivo
  decrementBtn.addEventListener('mousedown', () => {
    startHold(() => {
      if (tally.count > 0) {
        tally.count--;
        countElem.textContent = tally.count;
        updateProgress(tally, progressInner);
        saveTallies();
      }
    });
  });
  decrementBtn.addEventListener('mouseup', stopHold);
  decrementBtn.addEventListener('mouseleave', stopHold);

  // Rinominazione con singolo click
  nameElem.addEventListener('click', () => {
    const nuovoNome = prompt("Inserisci il nuovo nome per il tally count:", tally.name);
    if (nuovoNome !== null) {
      tally.name = nuovoNome.trim() || 'Senza Nome';
      nameElem.textContent = tally.name;
      saveTallies();
    }
  });

  imageContainer.addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      tally.image = event.target.result; 
      imgElem.src = tally.image;
      saveTallies();
    };
    reader.readAsDataURL(file);
  });

  // Gestione del menu a tre puntini
  tallyMenu.addEventListener('click', (e) => {
    menuOptions.style.display = menuOptions.style.display === 'block' ? 'none' : 'block';
    e.stopPropagation();
  });
  document.addEventListener('click', () => {
    menuOptions.style.display = 'none';
  });

  // Aggiungi/Togli
  adjustBtn.addEventListener('click', (e) => {
    let delta = prompt("Inserisci il numero da aggiungere (usa numeri negativi per togliere):", "0");
    delta = parseInt(delta, 10);
    if (!isNaN(delta)) {
      tally.count += delta;
      if (tally.count < 0) tally.count = 0;
      if (tally.count > tally.limit) tally.count = tally.limit;
      countElem.textContent = tally.count;
      updateProgress(tally, progressInner);
      saveTallies();
    }
    menuOptions.style.display = 'none';
    e.stopPropagation();
  });

  // Imposta
  setBtn.addEventListener('click', (e) => {
    let value = prompt("Imposta il nuovo totale:", tally.count);
    value = parseInt(value, 10);
    if(!isNaN(value)) {
      if(value < 0) value = 0;
      if(value > tally.limit) value = tally.limit;
      tally.count = value;
      countElem.textContent = tally.count;
      updateProgress(tally, progressInner);
      saveTallies();
    }
    menuOptions.style.display = 'none';
    e.stopPropagation();
  });

  // Azzerare
  resetBtn.addEventListener('click', (e) => {
    if(confirm("Sei sicuro di voler azzerare il contatore?")) {
      tally.count = 0;
      countElem.textContent = tally.count;
      updateProgress(tally, progressInner);
      saveTallies();
    }
    menuOptions.style.display = 'none';
    e.stopPropagation();
  });

  // Rimuovi
  removeBtn.addEventListener('click', (e) => {
    if (confirm("Sei sicuro di voler rimuovere questo tally count?")) {
      tallies = tallies.filter(item => item.id !== tally.id);
      saveTallies();
      renderTallies();
    }
    menuOptions.style.display = 'none';
    e.stopPropagation();
  });

  return tallyElem;
}

function updateProgress(tally, progressInner) {
  let percent = (tally.count / tally.limit) * 100;
  if (percent > 100) percent = 100;
  if (percent < 0) percent = 0;
  progressInner.style.width = percent + '%';
}

function renderTallies() {
  const container = document.getElementById('tallyContainer');
  container.innerHTML = "";
  tallies.forEach(tally => {
    const tallyElem = createTallyElement(tally);
    container.appendChild(tallyElem);
  });
}

function loadLogo() {
  const savedLogo = localStorage.getItem(LOGO_KEY);
  document.querySelector('.logo-container img').src = savedLogo || DEFAULT_LOGO;
}

document.addEventListener("DOMContentLoaded", () => {
  loadTallies();
  renderTallies();
  loadLogo();
});

const logoContainer = document.querySelector('.logo-container');
const logoInput = document.getElementById('logoInput');
const logoImg = logoContainer.querySelector('img');
logoContainer.addEventListener('click', () => {
  logoInput.click();
});
logoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const newLogo = event.target.result;
    logoImg.src = newLogo;
    localStorage.setItem(LOGO_KEY, newLogo);
  };
  reader.readAsDataURL(file);
});

// Gestione impostazioni
const settingsModal = document.getElementById('settingsModal');
document.getElementById('openSettings').addEventListener('click', () => {
  settingsModal.style.display = 'block';
});
document.getElementById('closeSettings').addEventListener('click', () => {
  settingsModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = 'none';
  }
});

// Imposta limite globale e salvalo in LocalStorage
document.getElementById('setGlobalLimit').addEventListener('click', () => {
  const newLimit = parseInt(document.getElementById('globalLimit').value, 10);
  if (!isNaN(newLimit) && newLimit > 0) {
    localStorage.setItem(GLOBAL_LIMIT_KEY, newLimit);
    tallies.forEach(tally => {
      tally.limit = newLimit;
      if (tally.count > newLimit) {
        tally.count = newLimit;
      }
    });
    saveTallies();
    renderTallies();
    alert("Limite globale aggiornato a " + newLimit);
  } else {
    alert("Inserisci un valore valido per il limite.");
  }
});

const bgColorInput = document.getElementById('bgColor');
bgColorInput.addEventListener('change', (e) => {
  const bg = e.target.value;
  // Rimuove l'immagine di sfondo salvata, se presente, per usare il colore scelto
  localStorage.removeItem(BG_IMAGE_KEY);
  document.body.style.background = bg;
  document.body.style.backgroundAttachment = "fixed";
  document.body.style.backgroundSize = "initial";
  localStorage.setItem(BG_COLOR_KEY, bg);
});

// Gestione sfondo immagine (fisso)
const bgImageInput = document.getElementById('bgImageInput');
bgImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const bgImg = event.target.result;
    localStorage.setItem(BG_IMAGE_KEY, bgImg);
    // Rimuove eventuale colore di sfondo salvato
    localStorage.removeItem(BG_COLOR_KEY);
    applyBackgroundImage(bgImg);
  };
  reader.readAsDataURL(file);
});

function applyBackgroundImage(bgImg) {
  // Imposta lo sfondo (centro, no-repeat e fisso)
  document.body.style.background = `url(${bgImg}) center no-repeat fixed`;
  // Crea un oggetto immagine per ottenere le dimensioni naturali
  const img = new Image();
  img.src = bgImg;
  img.onload = function() {
    // Se l'immagine è più piccola della finestra, non viene ingrandita (background-size: auto)
    // Altrimenti, viene adattata (background-size: contain)
    if (img.naturalWidth < window.innerWidth && img.naturalHeight < window.innerHeight) {
      document.body.style.backgroundSize = "auto";
    } else {
      document.body.style.backgroundSize = "contain";
    }
  }
}

// Applica lo sfondo salvato (l'immagine ha precedenza sul colore)
const savedBgImage = localStorage.getItem(BG_IMAGE_KEY);
const savedBgColor = localStorage.getItem(BG_COLOR_KEY);
if (savedBgImage) {
  applyBackgroundImage(savedBgImage);
  // Imposta il valore dell'input colore al valore predefinito (se presente)
  if(savedBgColor) bgColorInput.value = savedBgColor;
} else if (savedBgColor) {
  document.body.style.background = savedBgColor;
  document.body.style.backgroundAttachment = "fixed";
  document.body.style.backgroundSize = "initial";
  bgColorInput.value = savedBgColor;
}

document.getElementById('addTallyBtn').addEventListener('click', () => {
  const savedGlobalLimit = parseInt(localStorage.getItem(GLOBAL_LIMIT_KEY), 10) || 10;
  const newTally = {
    id: Date.now(),
    name: '',
    count: 0,
    limit: savedGlobalLimit,
    image: DEFAULT_IMAGE // Immagine predefinita
  };
  tallies.push(newTally);
  saveTallies();
  renderTallies();
  alert("Nuovo tally count aggiunto!");
});
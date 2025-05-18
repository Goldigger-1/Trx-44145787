// Script pour incrémenter le scoretotal du current user lors du clic sur HOME ou PLAY
// Ce script doit être inclus dans index.html après les autres scripts principaux

// Utilitaire pour obtenir le userId (ou deviceId) déjà utilisé dans le jeu
function getCurrentUserIdOrDeviceId() {
    let telegramId = null;
    let deviceId = null;
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        telegramId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    if (!telegramId) {
        // fallback deviceId (même logique que dans initUserProfile)
        deviceId = getCookie && getCookie("tidashDeviceId");
    }
    return telegramId || deviceId;
}

// Fonction pour envoyer l'incrément du scoretotal au backend
function addScoreToScoreTotal(score) {
    const userIdOrDeviceId = getCurrentUserIdOrDeviceId();
    if (!userIdOrDeviceId) return;
    fetch('/api/users/add-scoretotal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userIdOrDeviceId, scoreToAdd: score })
    }).then(() => {
        // Optionnel : log, toast, etc.
    }).catch(() => {});
}

// Fonction pour fetch le scoretotal du current user et l'afficher
function updateScoreTotalDisplay() {
    var scoreDiv = document.getElementById('scoretotal-value');
    if (!scoreDiv) return;
    scoreDiv.textContent = '-';
    const userIdOrDeviceId = getCurrentUserIdOrDeviceId();
    if (!userIdOrDeviceId) return;
    // Essayer d'abord avec telegramId
    fetch('/api/users/telegram/' + userIdOrDeviceId)
        .then(r => {
            if (r.ok) return r.json();
            // Si 404, essayer deviceId
            if (r.status === 404) {
                return fetch('/api/users/device/' + userIdOrDeviceId)
                    .then(r2 => r2.ok ? r2.json() : null);
            }
            return null;
        })
        .then(data => {
            if (data && typeof data.scoretotal === 'number') {
                scoreDiv.textContent = Math.round(data.scoretotal).toLocaleString('en-US');
            }
        })
        .catch(() => { scoreDiv.textContent = '-'; });
}


// Affiche le scoretotal à chaque affichage de la page d'accueil
function observeHomeScreenDisplay() {
    var homeScreen = document.getElementById('home-screen');
    if (!homeScreen) return;
    var lastDisplay = homeScreen.style.display;
    setInterval(function() {
        if (homeScreen.style.display !== 'none' && lastDisplay === 'none') {
            updateScoreTotalDisplay();
        }
        lastDisplay = homeScreen.style.display;
    }, 400);
}

// Variable globale pour stocker le dernier score de partie
window.lastGameScore = 0;

// Détecte l'affichage de l'écran Game Over et stocke le score affiché
function observeGameOverDisplay() {
    var gameOver = document.getElementById('game-over');
    if (!gameOver) return;
    var lastDisplay = gameOver.style.display;
    setInterval(function() {
        if (gameOver.style.display !== 'none' && lastDisplay === 'none') {
            var score = parseInt(document.getElementById('score-display').textContent, 10) || 0;
            window.lastGameScore = score;
            if (score > 0) addScoreToScoreTotal(score);
        }
        lastDisplay = gameOver.style.display;
    }, 400);
}

document.addEventListener('DOMContentLoaded', function() {
    updateScoreTotalDisplay(); // Correction : affichage immédiat au chargement
    observeHomeScreenDisplay();
    observeGameOverDisplay();
    var homeBtn = document.getElementById('home-button');
    var playBtn = document.getElementById('play-again');
    // On ne fait plus rien ici, le scoretotal est ajouté dès le passage au Game Over

});

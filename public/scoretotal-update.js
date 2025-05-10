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
    fetch('/api/users/telegram/' + userIdOrDeviceId)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (data && typeof data.scoretotal === 'number') {
                scoreDiv.textContent = data.scoretotal;
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

// Ajout listeners sur HOME et PLAY (après DOMContentLoaded et création des boutons)
document.addEventListener('DOMContentLoaded', function() {
    observeHomeScreenDisplay();
    var homeBtn = document.getElementById('home-button');
    var playBtn = document.getElementById('play-again');
    if (homeBtn) {
        homeBtn.addEventListener('click', function() {
            var score = parseInt(document.getElementById('score-display').textContent, 10) || 0;
            if (score > 0) addScoreToScoreTotal(score);
        });
    }
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            var score = parseInt(document.getElementById('score-display').textContent, 10) || 0;
            if (score > 0) addScoreToScoreTotal(score);
        });
    }
});

// Script to increment the current user's total score when clicking on HOME or PLAY
// This script must be included in index.html after the main scripts

// Utility to get the userId (or deviceId) already used in the game
function getCurrentUserIdOrDeviceId() {
    let telegramId = null;
    let deviceId = null;
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        telegramId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    if (!telegramId) {
        // fallback deviceId (same logic as in initUserProfile)
        deviceId = getCookie && getCookie("tidashDeviceId");
    }
    return telegramId || deviceId;
}

// Function to send the score increment to the backend
function addScoreToScoreTotal(score) {
    const userIdOrDeviceId = getCurrentUserIdOrDeviceId();
    if (!userIdOrDeviceId) return;
    fetch('/api/users/add-scoretotal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userIdOrDeviceId, scoreToAdd: score })
    }).then(() => {
        // Optional : log, toast, etc.
    }).catch(() => {});
}

// Function to fetch the current user's total score and display it
function updateScoreTotalDisplay() {
    var scoreDiv = document.getElementById('scoretotal-value');
    if (!scoreDiv) return;
    scoreDiv.textContent = '-';
    const userIdOrDeviceId = getCurrentUserIdOrDeviceId();
    if (!userIdOrDeviceId) return;
    // Try first with telegramId
    fetch('/api/users/telegram/' + userIdOrDeviceId)
        .then(r => {
            if (r.ok) return r.json();
            // If 404, try deviceId
            if (r.status === 404) {
                return fetch('/api/users/device/' + userIdOrDeviceId)
                    .then(r2 => r2.ok ? r2.json() : null);
            }
            return null;
        })
        .then(data => {
            if (data && typeof data.scoretotal === 'number') {
                var value = (data.scoretotal * 0.05).toFixed(2);
                scoreDiv.textContent = value;
            }
        })
        .catch(() => { scoreDiv.textContent = '-'; });
}


// Display the scoretotal at each home screen display
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

// Global variable to store the last game score
window.lastGameScore = 0;

// Detect the Game Over screen display and store the displayed score
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
    updateScoreTotalDisplay(); // Display the scoretotal immediately on load
    observeHomeScreenDisplay();
    observeGameOverDisplay();
    var homeBtn = document.getElementById('home-button');
    var playBtn = document.getElementById('play-again');
    // Do nothing here, the scoretotal is added as soon as the Game Over screen is displayed

});

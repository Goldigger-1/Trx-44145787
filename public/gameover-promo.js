// Rich ad integration for Game Over page
// Handles displaying Rich ads in the Game Over screen

function loadRichAd() {
    const adContainer = document.getElementById('rich-ad-container');
    const adPlaceholder = document.getElementById('rich-ad-placeholder');
    
    if (!adContainer || !adPlaceholder) return;

    // Ensure the Rich ad script is loaded
    if (window.TelegramAdsController) {
        // Create a new ad
        window.TelegramAdsController.createAd({
            container: adPlaceholder,
            type: 'banner',
            width: 480,
            height: 150
        });
    }
}

// Call this when showing the Game Over screen
// This will be called whenever the Game Over screen is shown
function showGameOver() {
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
        // Show the Game Over screen
        gameOverDiv.style.display = 'block';
        
        // Load a new ad
        loadRichAd();
    }
}

// Export the showGameOver function for use in other scripts
window.showGameOver = showGameOver;

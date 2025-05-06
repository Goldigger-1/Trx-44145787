// RichAds ad logic for Game Over page
// Only show ad on Game Over, and regenerate ad each time screen is shown

function showGameOverAd() {
    const adContainer = document.getElementById('gameover-ad');
    if (adContainer && window.TelegramAdsController && typeof window.TelegramAdsController.showAd === 'function') {
        adContainer.innerHTML = '';
        // If your RichAds SDK supports specifying a container, pass it here. Otherwise, just call showAd().
        try {
            window.TelegramAdsController.showAd({ container: adContainer });
        } catch (e) {
            // fallback if container param is not supported
            window.TelegramAdsController.showAd();
        }
    }
}

// Call this when showing the Game Over screen
if (document.getElementById('gameover-ad')) {
    showGameOverAd();
}

// RichAds banner logic for Game Over page only
// This script ensures a RichAds banner is shown ONLY on the Game Over page
// and is regenerated every time that page is shown.

// Appeler cette fonction à chaque affichage de la page Game Over
function showRichAdsBanner() {
    if (window.TelegramAdsController && typeof window.TelegramAdsController.showBanner === 'function') {
        window.TelegramAdsController.showBanner({format: 'banner'});
    }
}

// Appeler cette fonction à chaque fois qu'on quitte la page Game Over
function hideRichAdsBanner() {
    if (window.TelegramAdsController && typeof window.TelegramAdsController.hideBanner === 'function') {
        window.TelegramAdsController.hideBanner();
    }
}

window.showRichAdsBanner = showRichAdsBanner;
window.hideRichAdsBanner = hideRichAdsBanner;

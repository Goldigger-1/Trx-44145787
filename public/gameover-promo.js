// RichAds banner logic for Game Over page only
// This script ensures a RichAds banner is shown ONLY on the Game Over page
// and is regenerated every time that page is shown.

// Appeler cette fonction à chaque affichage de la page Game Over
function showRichAdsBanner() {
    console.log('[RichAds DEBUG] Appel showRichAdsBanner');
    if (!window.TelegramAdsController) {
        console.error('[RichAds DEBUG] TelegramAdsController est introuvable sur window');
        return;
    }
    if (typeof window.TelegramAdsController.showBanner !== 'function') {
        console.error('[RichAds DEBUG] showBanner n\'est pas une fonction sur TelegramAdsController', window.TelegramAdsController);
        return;
    }
    try {
        window.TelegramAdsController.showBanner({format: 'banner'});
        console.log('[RichAds DEBUG] showBanner appelé avec succès');
    } catch (e) {
        console.error('[RichAds DEBUG] Erreur lors de l\'appel à showBanner', e);
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

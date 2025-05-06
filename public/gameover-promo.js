// RichAds Mybid.io banner logic for Game Over page
// Shows an integrated banner ad at the top of the Game Over page using RichAds SDK.
// This script must be called every time the Game Over page is shown.

function showGameOverRichAdsBanner() {
    console.log('[RichAds] Tentative d\'affichage de la bannière Game Over...');
    // Remove any previous ad if present
    const previous = document.getElementById('richads-banner-area');
    if (previous) {
        previous.remove();
        console.log('[RichAds] Ancienne bannière supprimée.');
    }

    // Find the Game Over page root
    const gameOverScreen = document.getElementById('game-over');
    if (!gameOverScreen) {
        console.warn('[RichAds] Élément #game-over introuvable.');
        return;
    }
    if (gameOverScreen.style.display === 'none' || getComputedStyle(gameOverScreen).display === 'none') {
        console.warn('[RichAds] #game-over est caché, bannière non injectée.');
        return;
    }
    if (!window.TelegramAdsController) {
        console.warn('[RichAds] TelegramAdsController non présent.');
        return;
    }
    if (typeof window.TelegramAdsController.showBanner !== 'function') {
        console.warn('[RichAds] showBanner n\'est pas une fonction.');
        return;
    }

    // Create a container for the RichAds banner
    const bannerContainer = document.createElement('div');
    bannerContainer.id = 'richads-banner-area';
    bannerContainer.style.width = '100%';
    bannerContainer.style.display = 'flex';
    bannerContainer.style.justifyContent = 'center';
    bannerContainer.style.alignItems = 'center';
    bannerContainer.style.position = 'absolute';
    bannerContainer.style.top = '0';
    bannerContainer.style.left = '0';
    bannerContainer.style.zIndex = '1001';
    // No extra custom styling to avoid blocking the ad

    // Insert at the very top of the Game Over page
    gameOverScreen.insertBefore(bannerContainer, gameOverScreen.firstChild);
    console.log('[RichAds] Conteneur de bannière injecté dans #game-over.');

    // Show the RichAds integrated banner (Mybid.io)
    window.TelegramAdsController.showBanner({
        container: bannerContainer,
        type: 'banner' // Forcer le type "banner" (Mybid.io)
    });
    console.log('[RichAds] showBanner appelé.');
}



// Appeler ceci UNIQUEMENT quand la page Game Over est visible !
// À placer dans showGameOverScreen après l'affichage
// (ici pour debug, mais à déplacer dans showGameOverScreen pour production)
function tryShowRichAdsBannerWhenGameOverVisible() {
    setTimeout(function() {
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen && (gameOverScreen.style.display !== 'none' && getComputedStyle(gameOverScreen).display !== 'none')) {
            if (typeof showGameOverRichAdsBanner === 'function') showGameOverRichAdsBanner();
        } else {
            console.log('[RichAds] #game-over pas encore visible, nouvelle tentative dans 100ms...');
            setTimeout(tryShowRichAdsBannerWhenGameOverVisible, 100);
        }
    }, 50);
}
// Pour debug immédiat (à déplacer dans showGameOverScreen)
tryShowRichAdsBannerWhenGameOverVisible();

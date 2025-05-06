// RichAds Mybid.io banner logic for Game Over page
// Shows an integrated banner ad at the top of the Game Over page using RichAds SDK.
// This script must be called every time the Game Over page is shown.

function showGameOverRichAdsBanner() {
    // Remove any previous ad if present
    const previous = document.getElementById('richads-banner-area');
    if (previous) previous.remove();

    // Find the Game Over page root
    const gameOverScreen = document.getElementById('game-over');
    if (!gameOverScreen || !window.TelegramAdsController || typeof window.TelegramAdsController.showBanner !== 'function') return;

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

    // Show the RichAds integrated banner (Mybid.io)
    // According to RichAds docs, "banner" type is for integrated banners
    window.TelegramAdsController.showBanner({
        container: bannerContainer,
        // type: 'banner' is default for integrated banners (Mybid.io)
        // No extra parameters to avoid blocking or customizing the ad
    });
}


// Call this when showing the Game Over screen
if (document.getElementById('game-over')) {
    showGameOverRichAdsBanner();
}

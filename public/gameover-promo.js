// RichAds banner logic for Game Over page only
// This script ensures a RichAds banner is shown ONLY on the Game Over page
// and is regenerated every time that page is shown.

(function () {
    const bannerAreaId = 'promo-banner-area';
    const bannerContainerId = 'richads-banner-container';

    function showRichAdsBanner() {
        const area = document.getElementById(bannerAreaId);
        if (!area) return;

        // Remove any previous ad container
        let old = document.getElementById(bannerContainerId);
        if (old) old.remove();

        // Make sure the area is visible
        area.style.display = 'flex';

        // Create a new container for the ad
        const adDiv = document.createElement('div');
        adDiv.id = bannerContainerId;
        adDiv.style.width = '100%';
        adDiv.style.display = 'flex';
        adDiv.style.justifyContent = 'center';
        area.appendChild(adDiv);

        // Show the RichAds banner inside the container
        if (window.TelegramAdsController && typeof window.TelegramAdsController.showBanner === 'function') {
            window.TelegramAdsController.showBanner({
                container: '#' + bannerContainerId,
                format: 'banner',
                // Add other options if required by SDK/FAQ
            });
        }
    }

    // Listen for custom event to show Game Over page
    // Replace 'showGameOver' with your actual event or call this function when you show Game Over
    window.showRichAdsBanner = showRichAdsBanner;

    // Optionally, if Game Over is shown on page load (for dev/debug)
    if (document.getElementById(bannerAreaId) && document.getElementById('game-over')?.style.display !== 'none') {
        showRichAdsBanner();
    }
})();

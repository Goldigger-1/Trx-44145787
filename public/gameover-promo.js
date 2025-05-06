// Promotion banner logic for Game Over page
// Fetches promo banner data from the server and renders it in the #promo-banner-area
// Requirements: image, link, "Sponsored" label, visually appealing, clickable, open link in default browser

async function renderGameOverPromoBanner() {
    const bannerArea = document.getElementById('promo-banner-area');
    if (!bannerArea) return;

    // Remove any previous RichAds banner instance
    const prevAd = bannerArea.querySelector('.richads-banner');
    if (prevAd) {
        prevAd.remove();
    }
    // Hide legacy promo image/banner if present
    const bannerImg = document.getElementById('promo-banner-img');
    const sponsoredLabel = document.getElementById('promo-sponsored-label');
    if (bannerImg) bannerImg.style.display = 'none';
    if (sponsoredLabel) sponsoredLabel.style.display = 'none';

    // Show the banner area (flex or block as needed for your layout)
    bannerArea.style.display = 'flex';

    // Create a container for the RichAds banner
    let adContainer = bannerArea.querySelector('.richads-banner');
    if (!adContainer) {
        adContainer = document.createElement('div');
        adContainer.className = 'richads-banner';
        adContainer.style.width = '100%';
        adContainer.style.height = bannerImg ? bannerImg.style.height || bannerImg.offsetHeight + 'px' : '150px';
        adContainer.style.minHeight = '100px'; // fallback
        adContainer.style.maxWidth = '480px';
        adContainer.style.margin = '0 auto';
        adContainer.style.display = 'block';
        adContainer.style.borderRadius = '8px';
        adContainer.style.overflow = 'hidden';
        adContainer.style.border = '1px solid #00FF9D';
        adContainer.style.boxSizing = 'border-box';
        bannerArea.appendChild(adContainer);
    }
    // Clear previous ad content
    adContainer.innerHTML = '';

    // Try to render the RichAds Telegram rectangle banner, retrying if needed
    function tryRenderRichAdsBanner(attempts = 0) {
        console.log('[RichAds] Attempt', attempts, 'TelegramAdsController:', window.TelegramAdsController);
        if (window.TelegramAdsController && typeof window.TelegramAdsController.showBanner === 'function') {
            window.TelegramAdsController.showBanner({
                type: 'telegram_rectangle',
                container: adContainer
            });
        } else if (attempts < 10) {
            setTimeout(() => tryRenderRichAdsBanner(attempts + 1), 150);
        } else {
            adContainer.innerHTML = '<div style="width:100%;height:100%;background:#222;color:#fff;display:flex;align-items:center;justify-content:center;">Ad unavailable</div>';
            console.warn('[RichAds] TelegramAdsController.showBanner unavailable after 10 attempts');
        }
    }
    tryRenderRichAdsBanner();
}

// Call this when showing the Game Over screen
if (document.getElementById('promo-banner-area')) {
    renderGameOverPromoBanner();
}


// Call this when showing the Game Over screen
if (document.getElementById('promo-banner-area')) {
    renderGameOverPromoBanner();
}

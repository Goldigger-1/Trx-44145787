// Promotion banner logic for Game Over page
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
// Fetches promo banner data from the server and renders it in the #promo-banner-area
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
// Requirements: image, link, "Sponsored" label, visually appealing, clickable, open link in default browser
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
async function renderGameOverPromoBanner() {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    const bannerArea = document.getElementById('promo-banner-area');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    if (!bannerArea) return;
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    // Remove any previous RichAds banner instance
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    const prevAd = bannerArea.querySelector('.richads-banner');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    if (prevAd) {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        prevAd.remove();
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    }
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    // Hide legacy promo image/banner if present
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    const bannerImg = document.getElementById('promo-banner-img');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    const sponsoredLabel = document.getElementById('promo-sponsored-label');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    if (bannerImg) bannerImg.style.display = 'none';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    if (sponsoredLabel) sponsoredLabel.style.display = 'none';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    // Show the banner area (flex or block as needed for your layout)
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    bannerArea.style.display = 'flex';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    // Create a container for the RichAds banner
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    let adContainer = bannerArea.querySelector('.richads-banner');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    if (!adContainer) {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer = document.createElement('div');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.className = 'richads-banner';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.width = '100%';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.height = bannerImg ? bannerImg.style.height || bannerImg.offsetHeight + 'px' : '150px';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.minHeight = '100px'; // fallback
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.maxWidth = '480px';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.margin = '0 auto';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.display = 'block';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.borderRadius = '8px';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.overflow = 'hidden';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.border = '1px solid #00FF9D';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        adContainer.style.boxSizing = 'border-box';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        bannerArea.appendChild(adContainer);
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    }
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    // Clear previous ad content
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    adContainer.innerHTML = '';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    // Try to render the RichAds Telegram rectangle banner, retrying if needed
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    function tryRenderRichAdsBanner(attempts = 0) {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        console.log('[RichAds] Attempt', attempts, 'TelegramAdsController:', window.TelegramAdsController);
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        if (window.TelegramAdsController && typeof window.TelegramAdsController.showBanner === 'function') {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
            window.TelegramAdsController.showBanner({
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
                type: 'telegram_rectangle',
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
                container: adContainer
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
            });
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        } else if (attempts < 10) {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
            setTimeout(() => tryRenderRichAdsBanner(attempts + 1), 150);
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        } else {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
            adContainer.innerHTML = '<div style="width:100%;height:100%;background:#222;color:#fff;display:flex;align-items:center;justify-content:center;">Ad unavailable</div>';
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
            console.warn('[RichAds] TelegramAdsController.showBanner unavailable after 10 attempts');
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
        }
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    }
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    tryRenderRichAdsBanner();
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
}
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
// Call this when showing the Game Over screen
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
if (document.getElementById('promo-banner-area')) {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    renderGameOverPromoBanner();
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
}
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
// Call this when showing the Game Over screen
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
if (document.getElementById('promo-banner-area')) {
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
    renderGameOverPromoBanner();
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}
}
// Debug: log available methods on TelegramAdsController after SDK initialization
if (window.TelegramAdsController) {
    console.log('TelegramAdsController keys:', Object.keys(window.TelegramAdsController));
}

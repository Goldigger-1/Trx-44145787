// Promotion banner logic for Game Over page
// Fetches promo banner data from the server and renders it in the #promo-banner-area
// Requirements: image, link, "Sponsored" label, visually appealing, clickable, open link in default browser

// --- RichAds dynamic SPA integration for Game Over only ---

function loadRichAdsSdkAndShowBanner() {
    const sdkId = 'richads-sdk-script';
    const bannerArea = document.getElementById('richads-banner-area');
    if (!bannerArea) return;

    // Remove previous ad if any
    bannerArea.innerHTML = '';
    bannerArea.style.display = 'block';

    // Remove any previous SDK script
    let prevScript = document.getElementById(sdkId);
    if (prevScript) prevScript.remove();
    // Remove any previous controller instance
    if (window.TelegramAdsController) {
        try { delete window.TelegramAdsController; } catch(e) {}
        window.TelegramAdsController = undefined;
    }

    // Dynamically load SDK
    const script = document.createElement('script');
    script.id = sdkId;
    script.src = 'https://richinfo.co/richpartners/telegram/js/tg-ob.js';
    script.onload = () => {
        setTimeout(() => {
            window.TelegramAdsController = new window.TelegramAdsController();
            window.TelegramAdsController.initialize({
                pubId: '971984',
                appId: '2266',
            });
            // The SDK will inject the banner automatically at the top of the page
        }, 0);
    };
    document.head.appendChild(script);
}

function unloadRichAdsSdkAndBanner() {
    // Remove SDK script
    let prevScript = document.getElementById('richads-sdk-script');
    if (prevScript) prevScript.remove();
    // Remove ad container
    const bannerArea = document.getElementById('richads-banner-area');
    if (bannerArea) {
        bannerArea.innerHTML = '';
        bannerArea.style.display = 'none';
    }
    // Remove controller
    if (window.TelegramAdsController) {
        try { delete window.TelegramAdsController; } catch(e) {}
        window.TelegramAdsController = undefined;
    }
}

// SPA: Listen for Game Over screen visibility
function observeGameOverForRichAds() {
    const gameOver = document.getElementById('game-over');
    if (!gameOver) return;
    let lastVisible = false;
    setInterval(() => {
        const isVisible = gameOver.style.display !== 'none' && gameOver.offsetParent !== null;
        if (isVisible && !lastVisible) {
            loadRichAdsSdkAndShowBanner();
        } else if (!isVisible && lastVisible) {
            unloadRichAdsSdkAndBanner();
        }
        lastVisible = isVisible;
    }, 300);
}

// Start observer on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeGameOverForRichAds);
} else {
    observeGameOverForRichAds();
}


// Call this when showing the Game Over screen
if (document.getElementById('promo-banner-area')) {
    renderGameOverPromoBanner();
}


// Call this when showing the Game Over screen
if (document.getElementById('promo-banner-area')) {
    renderGameOverPromoBanner();
}

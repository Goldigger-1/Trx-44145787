// Promotion banner logic for Game Over page
// Fetches promo banner data from the server and renders it in the #promo-banner-area
// Requirements: image, link, "Sponsored" label, visually appealing, clickable, open link in default browser

async function renderGameOverPromoBanner() {
    const bannerArea = document.getElementById('promo-banner-area');
    const bannerImg = document.getElementById('promo-banner-img');
    const sponsoredLabel = document.getElementById('promo-sponsored-label');
    if (!bannerArea || !bannerImg || !sponsoredLabel) return;

    try {
        const res = await fetch('/api/promo-banner');
        if (!res.ok) throw new Error('Could not fetch promo banner');
        const data = await res.json();
        if (data && data.imageUrl && data.link) {
            bannerImg.src = data.imageUrl;
            bannerImg.style.display = 'block';
            bannerArea.style.display = 'flex';
            sponsoredLabel.style.display = 'block';
            bannerImg.onclick = function() {
                // Try Telegram WebApp API if available
                if (window.Telegram && Telegram.WebApp && Telegram.WebApp.openLink) {
                    Telegram.WebApp.openLink(data.link);
                } else {
                    window.open(data.link, '_blank');
                }
            };
        } else {
            // Hide banner if no promo
            bannerArea.style.display = 'none';
        }
    } catch (err) {
        bannerArea.style.display = 'none';
    }
}

// Call this when showing the Game Over screen
if (document.getElementById('promo-banner-area')) {
    renderGameOverPromoBanner();
    initializeTelegramAd();
}

// Initialize Telegram ad only on Game Over page
function initializeTelegramAd() {
    // Initialize ad only if it hasn't been initialized yet
    if (!window.TelegramAdsController.isInitialized) {
        window.TelegramAdsController.initialize({
            pubId: "971984",
            appId: "2269"
        });
        window.TelegramAdsController.isInitialized = true;
    }
}

// Remove the ad when leaving Game Over page
function hideTelegramAd() {
    var adContainer = document.getElementById('telegram-ad-container');
    if (adContainer) {
        adContainer.remove();
    }
}

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
    showTelegramGameOverAd();
}

// Dynamically load and show Telegram ad only on Game Over page
function showTelegramGameOverAd() {
    // Remove any existing ad container
    var oldAd = document.getElementById('telegram-ad-container');
    if (oldAd) oldAd.remove();

    // Dynamically load the ad script
    var script = document.createElement('script');
    script.src = 'https://richinfo.co/richpartners/telegram/js/tg-ob.js';
    script.onload = function() {
        // Create ad container
        var adContainer = document.createElement('div');
        adContainer.id = 'telegram-ad-container';
        document.body.appendChild(adContainer);
        // Initialize ad in the new container
        window.TelegramAdsController = new TelegramAdsController();
        window.TelegramAdsController.initialize({
            pubId: "971984",
            appId: "2269"
        });
    };
    document.body.appendChild(script);
}

// Optionally, remove the ad when leaving Game Over page
function hideTelegramGameOverAd() {
    var oldAd = document.getElementById('telegram-ad-container');
    if (oldAd) oldAd.remove();
}

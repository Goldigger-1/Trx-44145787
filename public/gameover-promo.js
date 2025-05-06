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

// Show RichAds banner at the top and keep custom promo banner hidden
function showRichAdsBannerAndHidePromo() {
    const bannerArea = document.getElementById('promo-banner-area');
    if (bannerArea) {
        bannerArea.style.display = 'none'; // Always hide custom promo banner
    }
    if (window.TelegramAdsController && window.TelegramAdsController.showBanner) {
        window.TelegramAdsController.showBanner({
            position: 'top'
        });
    }
}

document.addEventListener('DOMContentLoaded', showRichAdsBannerAndHidePromo);

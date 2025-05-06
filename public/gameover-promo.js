// Promotion banner logic for Game Over page
// (Supprimé : gestion ancienne promo banner, remplacé par RichAds uniquement sur Game Over)
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
}

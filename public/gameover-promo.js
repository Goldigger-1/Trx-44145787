// Promotion banner logic for Game Over page
// Fetches promo banner data from the server and renders it in the #promo-banner-area
// Requirements: image, link, "Sponsored" label, visually appealing, clickable, open link in default browser

function renderGameOverPromoBanner() {
    var richBanner = document.getElementById('rich-telegram-banner');
    if (richBanner && window.TelegramAdsController && typeof window.TelegramAdsController.renderBanner === 'function') {
        // Nettoyer le contenu précédent pour forcer le refresh
        richBanner.innerHTML = '';
        // Afficher la bannière rich ads
        window.TelegramAdsController.renderBanner({
            container: richBanner
        });
    }
}

// Appeler ceci à chaque affichage du Game Over
if (document.getElementById('rich-telegram-banner')) {
    renderGameOverPromoBanner();
}

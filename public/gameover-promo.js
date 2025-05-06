// Promotion banner logic for Game Over page
// Displays a RichAds advertisement at the top of the Game Over screen
// Specifically a rectangular Telegram interstitial banner

function renderGameOverPromoBanner() {
    const bannerArea = document.getElementById('promo-banner-area');
    if (!bannerArea) return;

    try {
        // Clear any existing content in the banner area
        while (bannerArea.firstChild) {
            bannerArea.removeChild(bannerArea.firstChild);
        }

        // Create a container for the RichAds banner
        const adContainer = document.createElement('div');
        adContainer.id = 'richads-container';
        adContainer.style.width = '100%';
        adContainer.style.height = '150px'; // Match the height of your promo-banner-img
        adContainer.style.display = 'flex';
        adContainer.style.justifyContent = 'center';
        adContainer.style.alignItems = 'center';
        adContainer.style.margin = '0 10px'; // Match the margin of your promo-banner-img
        
        // Add the container to the banner area
        bannerArea.appendChild(adContainer);
        
        // Make the banner area visible
        bannerArea.style.display = 'flex';
        
        // Generate a new Telegram banner ad
        if (window.TelegramAdsController) {
            try {
                // Essayons d'abord de montrer une bannière standard
                console.log('Tentative d\'affichage d\'une bannière RichAds');
                
                // Vérifiez si la méthode showBanner existe
                if (typeof window.TelegramAdsController.showBanner === 'function') {
                    window.TelegramAdsController.showBanner({
                        containerId: 'richads-container'
                    });
                    console.log('Méthode showBanner appelée');
                } 
                // Si showBanner n'existe pas, essayons displayBanner
                else if (typeof window.TelegramAdsController.displayBanner === 'function') {
                    window.TelegramAdsController.displayBanner({
                        containerId: 'richads-container'
                    });
                    console.log('Méthode displayBanner appelée');
                }
                // Si aucune des méthodes n'existe, essayons showInterstitial
                else if (typeof window.TelegramAdsController.showInterstitial === 'function') {
                    window.TelegramAdsController.showInterstitial();
                    console.log('Méthode showInterstitial appelée');
                }
                else {
                    console.error('Aucune méthode d\'affichage de bannière disponible');
                    // Affichons les méthodes disponibles pour le débogage
                    console.log('Méthodes disponibles:', Object.keys(window.TelegramAdsController));
                }
            } catch (e) {
                console.error('Erreur lors de l\'affichage de la bannière:', e);
            }
        } else {
            console.error('TelegramAdsController n\'est pas disponible');
            bannerArea.style.display = 'none';
        }
    } catch (err) {
        console.error('Erreur lors de l\'affichage de la bannière RichAds:', err);
        bannerArea.style.display = 'none';
    }
}

// Cette fonction sera appelée lors de l'affichage de l'écran Game Over
// La fonction est appelée depuis showGameOverScreen() dans index.html

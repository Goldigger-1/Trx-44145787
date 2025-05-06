// Promotion banner logic for Game Over page
// Displays a RichAds advertisement at the top of the Game Over screen

function renderGameOverPromoBanner() {
    const bannerArea = document.getElementById('promo-banner-area');
    if (!bannerArea) return;

    try {
        // Rendre la zone de bannière visible
        bannerArea.style.display = 'flex';
        
        // Cacher l'image de promotion existante et le label
        const promoImg = document.getElementById('promo-banner-img');
        const sponsoredLabel = document.getElementById('promo-sponsored-label');
        
        if (promoImg) promoImg.style.display = 'none';
        if (sponsoredLabel) sponsoredLabel.style.display = 'none';
        
        // Créer un div pour l'annonce RichAds s'il n'existe pas déjà
        let adContainer = document.getElementById('richads-banner-container');
        if (!adContainer) {
            adContainer = document.createElement('div');
            adContainer.id = 'richads-banner-container';
            adContainer.style.width = '100%';
            adContainer.style.height = '150px'; // Même hauteur que promo-banner-img
            adContainer.style.margin = '0 10px';
            bannerArea.appendChild(adContainer);
        }
        
        // Forcer l'affichage d'une nouvelle annonce RichAds
        if (window.TelegramAdsController) {
            // Appeler la méthode showBanner avec le containerId
            if (typeof window.TelegramAdsController.showBanner === 'function') {
                window.TelegramAdsController.showBanner({
                    containerId: 'richads-banner-container'
                });
                console.log('Bannière RichAds demandée avec showBanner');
            } 
            // Alternative: essayer la méthode displayBanner
            else if (typeof window.TelegramAdsController.displayBanner === 'function') {
                window.TelegramAdsController.displayBanner({
                    containerId: 'richads-banner-container'
                });
                console.log('Bannière RichAds demandée avec displayBanner');
            }
            // Si aucune méthode spécifique n'est trouvée, essayer sans paramètres
            else {
                console.log('Aucune méthode spécifique trouvée, tentative sans paramètres');
                window.TelegramAdsController.showBanner();
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

// Cette fonction est appelée depuis showGameOverScreen() dans index.html

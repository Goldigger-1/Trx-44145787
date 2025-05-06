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
        adContainer.style.display = 'flex';
        adContainer.style.justifyContent = 'center';
        adContainer.style.alignItems = 'center';
        
        // Add the container to the banner area
        bannerArea.appendChild(adContainer);
        
        // Make the banner area visible
        bannerArea.style.display = 'flex';
        
        // Generate a new Telegram interstitial banner ad
        if (window.TelegramAdsController) {
            window.TelegramAdsController.displayBanner({
                containerId: 'richads-container',
                type: 'interstitial',
                onAdLoaded: () => {
                    console.log('RichAds banner loaded successfully');
                },
                onAdFailed: (error) => {
                    console.error('RichAds banner failed to load:', error);
                    bannerArea.style.display = 'none'; // Hide if ad fails to load
                }
            });
        } else {
            console.error('TelegramAdsController not available');
            bannerArea.style.display = 'none';
        }
    } catch (err) {
        console.error('Error displaying RichAds banner:', err);
        bannerArea.style.display = 'none';
    }
}

// This function will be called when showing the Game Over screen
// The function is called from showGameOverScreen() in index.html

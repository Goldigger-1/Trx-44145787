// Promotion banner logic for Game Over page
// Displays a RichAds advertisement at the top of the Game Over screen
// Specifically a rectangular Telegram banner

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
        adContainer.id = 'richads-banner-container';
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
        
        // Create a new script element to force re-initialization of the ad
        const adScript = document.createElement('script');
        adScript.textContent = `
            // Force a new ad to be generated each time the Game Over screen is shown
            if (window.TelegramAdsController) {
                try {
                    // Destroy any existing ad instance first
                    if (window.currentRichAdsInstance) {
                        window.currentRichAdsInstance = null;
                    }
                    
                    // Create a new banner ad
                    window.currentRichAdsInstance = window.TelegramAdsController.showBanner({
                        containerId: 'richads-banner-container',
                        type: 'banner', // Specify rectangular banner type
                        position: 'top'
                    });
                    
                    console.log('RichAds banner requested for Game Over screen');
                } catch (e) {
                    console.error('Error showing RichAds banner:', e);
                }
            } else {
                console.error('TelegramAdsController not available');
            }
        `;
        
        // Add the script to the banner area
        bannerArea.appendChild(adScript);
        
    } catch (err) {
        console.error('Error displaying RichAds banner:', err);
        bannerArea.style.display = 'none';
    }
}

// This function will be called when showing the Game Over screen
// The function is called from showGameOverScreen() in index.html

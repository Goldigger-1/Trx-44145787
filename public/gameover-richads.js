// RichAds rectangular banner logic for Game Over page only
// This script creates and manages the RichAds embed for the Game Over screen

const RICHADS_BANNER_ID = 'richads-rect-banner';
const RICHADS_CONTAINER_ID = 'richads-rect-banner-container';

function createRichAdsBanner() {
    // Remove any existing banner (if present)
    const old = document.getElementById(RICHADS_CONTAINER_ID);
    if (old) old.remove();

    // Create a container absolutely positioned at the top of #game-over
    const container = document.createElement('div');
    container.id = RICHADS_CONTAINER_ID;
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.pointerEvents = 'auto';
    container.style.background = 'transparent';

    // RichAds embed code (rectangular banner)
    const adDiv = document.createElement('div');
    adDiv.id = RICHADS_BANNER_ID;
    adDiv.style.width = '320px';
    adDiv.style.height = '100px';
    adDiv.style.margin = '12px auto 0 auto';
    adDiv.style.borderRadius = '10px';
    adDiv.style.overflow = 'hidden';
    adDiv.style.boxShadow = '0 4px 20px #00000022';
    adDiv.style.background = '#181818';

    // RichAds embed script (rectangular banner)
    adDiv.innerHTML = `
      <script type="application/javascript">
        if (window.TelegramAdsController && TelegramAdsController.createBanner) {
          TelegramAdsController.createBanner({
            containerId: '${RICHADS_BANNER_ID}',
            format: 'rectangle',
            width: 320,
            height: 100
          });
        }
      <\/script>
    `;

    container.appendChild(adDiv);

    // Insert into #game-over (before all children)
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
        gameOver.insertBefore(container, gameOver.firstChild);
    }
}

function removeRichAdsBanner() {
    const old = document.getElementById(RICHADS_CONTAINER_ID);
    if (old) old.remove();
}

// Expose for use in main logic
window.createRichAdsBanner = createRichAdsBanner;
window.removeRichAdsBanner = removeRichAdsBanner;

// Dynamically update season number and prize in the home screen (admin logic)
document.addEventListener('DOMContentLoaded', function() {
    const seasonCircleText = document.querySelector('.season-circle-text');
    const seasonPrizeText = document.querySelector('.season-prize');

    // Set default/fallback values
    if (seasonCircleText) seasonCircleText.textContent = 'S-';
    if (seasonPrizeText) seasonPrizeText.textContent = '- Prize';

    fetch('/api/active-season')
        .then(response => {
            if (response.status === 404) {
                // No active season
                if (seasonCircleText) seasonCircleText.textContent = '-';
                if (seasonPrizeText) seasonPrizeText.textContent = '$0 Prize';
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            if (seasonCircleText && data.seasonNumber !== undefined) {
                seasonCircleText.textContent = `S${data.seasonNumber}`;
            }
            if (seasonPrizeText && data.prizeMoney !== undefined) {
                seasonPrizeText.textContent = `+${data.prizeMoney} Pts`;
            }
        })
        .catch(() => {
            // On error, keep fallback values
        });
});

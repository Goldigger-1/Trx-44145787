// Sticky user row for Game Over page
// Optimized implementation that fetches user rank directly from server
// Expects <div class="leaderboard-user-row" id="gameover-user-row"></div> inside #game-over.

async function renderGameOverStickyUserRow() {
    // Get current user ID (robust)
    let userId = window.userId || localStorage.getItem('userId') || '';
    if (typeof userId !== 'string') {
        if (userId && userId.textContent) {
            userId = userId.textContent;
        } else {
            userId = '';
        }
    }
    userId = userId.trim();
    if (!/^[\w-]{6,}$/.test(userId)) {
        document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not determine your user ID. Please log in again. ⚠️</div>';
        return;
    }

    try {
        // Fetch active season
        let season;
        try {
            // Try the newer endpoint first
            let res = await fetch('/api/seasons/active');
            if (res.ok) {
                season = await res.json();
            } else {
                // Fallback
                res = await fetch('/api/active-season');
                if (res.ok) {
                    season = await res.json();
                } else {
                    throw new Error('Failed to fetch active season');
                }
            }
        } catch (e) {
            document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not load season info. ⚠️</div>';
            return;
        }

        // New optimized approach: Fetch user rank directly
        let rank = '-';
        let user;
        
        try {
            // First, get user data
            const userRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            if (!userRes.ok) throw new Error('Failed to fetch user data');
            user = await userRes.json();
            
            // Then, get user's rank in the season
            const rankRes = await fetch(`/api/seasons/${season.id}/users/${encodeURIComponent(userId)}/rank`);
            if (rankRes.ok) {
                const rankData = await rankRes.json();
                rank = rankData.rank || '-';
            } else {
                // Fallback if rank endpoint doesn't exist - use existing season score
                // This still avoids loading the entire leaderboard
                rank = '-';
            }
        } catch (err) {
            console.error('Error fetching user rank:', err);
            // Continue with user data if we have it, or use default values
        }

        // Set default values if user data is missing
        let bestScore = user?.bestScore || user?.seasonScore || 0;
        let username = user?.gameUsername || user?.username || 'You';
        let avatar = user?.avatarSrc || 'avatars/avatar_default.jpg';

        // Add cache buster to avatar
        if (avatar && !avatar.includes('?')) {
            avatar += '?t=' + new Date().getTime();
        }

        // Render sticky row (Game Over: with rank)
        const userRow = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-avatar"><img src="${avatar}" alt="${username}"></div>
            <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${bestScore}</div>
        `;
        document.getElementById('gameover-user-row').innerHTML = userRow;
    } catch (error) {
        console.error('Error rendering game over sticky row:', error);
        document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not load your rank. Please try again. ⚠️</div>';
    }
}

// Call this when showing the Game Over screen
if (document.getElementById('gameover-user-row')) {
    renderGameOverStickyUserRow();
}

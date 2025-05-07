// Sticky user row for Game Over page
// Optimized implementation that fetches user rank directly from server
// Expects <div class="leaderboard-user-row" id="gameover-user-row"></div> inside #game-over.

async function renderGameOverStickyUserRow() {
    // Get current user ID (robust)
    let userId = window.userId || localStorage.getItem('tidashUserId') || '';
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

        // Get user's rank in the season
        let rank = '-';
        let bestScore = 0;
        
        try {
            // Get user's rank in the season directly
            const rankRes = await fetch(`/api/seasons/${season.id}/users/${encodeURIComponent(userId)}/rank`);
            if (rankRes.ok) {
                const rankData = await rankRes.json();
                rank = rankData.rank || '-';
                
                // Use score from rank response if available (avoids additional requests)
                if (rankData.score !== undefined) {
                    bestScore = rankData.score;
                }
            }
        } catch (err) {
            console.error('Error fetching user rank:', err);
            // Continue with default values
        }
        
        // Use local storage or window variables for username and avatar when available
        // This avoids an unnecessary fetch to get user data we likely already have
        let username = window.username || localStorage.getItem('tidashUsername') || 'You';
        
        // For avatar, use the global variable or find it in the DOM as a last resort
        let avatar = window.avatarSrc || '';
        if (!avatar) {
            // Try to get the avatar from the existing avatar element in the DOM
            const avatarImg = document.getElementById('avatarImg');
            if (avatarImg && avatarImg.src) {
                avatar = avatarImg.src;
            } else {
                avatar = 'avatars/avatar_default.jpg';
            }
        }

        // Add cache buster to avatar if needed
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

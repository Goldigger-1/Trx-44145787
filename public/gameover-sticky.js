// Sticky user row for Game Over page - Optimized to load independently
// Injects user's season rank and best score into the sticky group on Game Over screen.
// Expects <div class="leaderboard-user-row" id="gameover-user-row"></div> inside #game-over.

async function renderGameOverStickyUserRow() {
    console.log("📊 Rendering game over sticky user row (optimized)");
    const userRowElement = document.getElementById('gameover-user-row');
    
    // Early return if element doesn't exist
    if (!userRowElement) return;
    
    // Show loading state
    userRowElement.innerHTML = '<div style="text-align:center;width:100%;"><img src="ressources/loading.svg" alt="Loading..." width="20" style="margin-right:8px;vertical-align:middle;">Loading your rank...</div>';
    
    // Get current user ID
    let userId = window.userId || localStorage.getItem('tidashUserId') || localStorage.getItem('userId') || '';
    if (typeof userId !== 'string') {
        if (userId && userId.textContent) {
            userId = userId.textContent;
        } else {
            userId = '';
        }
    }
    
    userId = userId.trim();
    if (!userId) {
        userRowElement.innerHTML = '<div style="color:orange;">Could not determine your user ID. Please log in again. ⚠️</div>';
        return;
    }
    
    try {
        // Fetch active season
        const seasonRes = await fetch('/api/seasons/active');
        if (!seasonRes.ok) {
            throw new Error('Failed to fetch active season');
        }
        const season = await seasonRes.json();
        
        // Get user info and ranking with a direct API call
        const userInfoPromise = fetch(`/api/users/${encodeURIComponent(userId)}`).then(r => r.ok ? r.json() : null);
        const userRankPromise = fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}/rank`).then(r => r.ok ? r.json() : null);
        
        // Use Promise.all to run both requests in parallel
        const [userInfo, userRank] = await Promise.all([userInfoPromise, userRankPromise]);
        
        if (!userInfo) {
            throw new Error('User not found');
        }
        
        // Get user's info
        const username = userInfo.gameUsername || userInfo.username || 'You';
        let bestScore = userInfo.seasonScore || userInfo.bestScore || 0;
        let avatar = userInfo.avatarSrc || 'avatars/avatar_default.jpg';
        let rank = userRank ? userRank.rank : '-';
        
        // Correct avatar path if needed
        if (avatar && !avatar.includes('/')) {
            avatar = `avatars/${avatar}`;
        }
        
        // Add cache buster to avatar
        if (avatar && !avatar.includes('?')) {
            avatar += '?t=' + new Date().getTime();
        }
        
        // If the user rank API failed but we have user's season score
        if (rank === '-' && userInfo.seasonScore) {
            // Try to get rank by checking the user's object directly
            try {
                const seasonScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
                if (seasonScoreRes.ok) {
                    const scoreData = await seasonScoreRes.json();
                    if (scoreData && scoreData.score !== undefined) {
                        bestScore = scoreData.score;
                    }
                }
            } catch (err) {
                console.warn("Failed to get user's score from season scores:", err);
            }
        }
        
        // Render the sticky row
        const userRow = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-avatar"><img src="${avatar}" alt="${username}"></div>
            <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${bestScore}</div>
        `;
        userRowElement.innerHTML = userRow;
        console.log("✅ Game over sticky user row rendered successfully");
        
    } catch (error) {
        console.error("❌ Error rendering game over sticky user row:", error);
        userRowElement.innerHTML = '<div style="color:orange;">Could not load your ranking data. ⚠️</div>';
    }
}

// Call this when showing the Game Over screen
if (document.getElementById('gameover-user-row')) {
    renderGameOverStickyUserRow();
}

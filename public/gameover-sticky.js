// Sticky user row for Game Over page (uses exact leaderboard logic)
// Injects user's season rank and best score into the sticky group on Game Over screen.
// Expects <div class="leaderboard-user-row" id="gameover-user-row"></div> inside #game-over.

async function renderGameOverStickyUserRow() {
    // Fetch active season (same as leaderboard)
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
        
        console.log(`✅ Active season found: ${season.id} (Season ${season.seasonNumber})`);
    } catch (e) {
        console.error('Error fetching active season:', e);
        document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not load season info. ⚠️</div>';
        return;
    }

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

    // Use the dedicated endpoint to get user rank
    try {
        console.log(`📊 Fetching rank for user ${userId} in season ${season.id}...`);
        const res = await fetch(`/api/seasons/${season.id}/user-rank/${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('Failed to fetch user rank');
        const userData = await res.json();
        
        // Add cache buster to avatar
        let avatar = userData.avatarSrc || 'avatars/avatar_default.jpg';
        if (avatar && !avatar.includes('?')) {
            avatar += '?t=' + new Date().getTime();
        }
        
        // Render sticky row (Game Over: with rank)
        const userRow = `
            <div class=\"leaderboard-rank\">${userData.rank || '-'}</div>
            <div class=\"leaderboard-avatar\"><img src=\"${avatar}\" alt=\"${userData.username || 'You'}\"></div>
            <div class=\"leaderboard-username\">${userData.username || 'You'} <span style=\"color:#00FF9D;\">(You)</span></div>
            <div class=\"leaderboard-score\"><img src=\"ressources/trophy.png\" alt=\"🏆\">${userData.score || 0}</div>
        `;
        document.getElementById('gameover-user-row').innerHTML = userRow;
    } catch (err) {
        console.error('Error fetching user rank:', err);
        // Fallback: try to get user data directly
        try {
            const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            const userData = res.ok ? await res.json() : { gameUsername: 'You', bestScore: 0 };
            
            // Add cache buster to avatar
            let avatar = userData.avatarSrc || 'avatars/avatar_default.jpg';
            if (avatar && !avatar.includes('?')) {
                avatar += '?t=' + new Date().getTime();
            }
            
            // Render sticky row without rank
            const userRow = `
                <div class=\"leaderboard-rank\">-</div>
                <div class=\"leaderboard-avatar\"><img src=\"${avatar}\" alt=\"${userData.gameUsername || 'You'}\"></div>
                <div class=\"leaderboard-username\">${userData.gameUsername || 'You'} <span style=\"color:#00FF9D;\">(You)</span></div>
                <div class=\"leaderboard-score\"><img src=\"ressources/trophy.png\" alt=\"🏆\">${userData.bestScore || 0}</div>
            `;
            document.getElementById('gameover-user-row').innerHTML = userRow;
        } catch (userErr) {
            document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not load your ranking. ⚠️</div>';
        }
    }
}

// Call this when showing the Game Over screen
if (document.getElementById('gameover-user-row')) {
    renderGameOverStickyUserRow();
}

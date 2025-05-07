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
    } catch (e) {
        document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not load season info. ⚠️</div>';
        return;
    }
    // Fetch ranking
    let ranking = [];
    try {
        const res = await fetch(`/api/seasons/${season.id}/ranking`);
        if (!res.ok) throw new Error('Failed to fetch season ranking');
        ranking = await res.json();
    } catch (e) {
        document.getElementById('gameover-user-row').innerHTML = '<div style="color:orange;">Could not load ranking. ⚠️</div>';
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
    // Sort and find user in ranking (exact leaderboard logic)
    let sortedRanking = [...ranking].sort((a, b) => (b.bestScore ?? b.score ?? 0) - (a.bestScore ?? a.score ?? 0));
    let userIndex = sortedRanking.findIndex(u => String(u.gameId ?? u.id ?? u.userId) === String(userId));
    let rank = userIndex !== -1 ? userIndex + 2 : '-';
    let user = sortedRanking[userIndex];
    let bestScore = 0;
    let username = '';
    let avatar = 'avatars/avatar_default.jpg';
    if (user) {
        bestScore = user.bestScore || user.score || 0;
        username = user.gameUsername || user.username || 'You';
        avatar = user.avatarSrc || 'avatars/avatar_default.jpg';
    } else {
        // Not ranked: fetch from server (/api/users/:id)
        try {
            const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            if (res.ok) {
                user = await res.json();
                bestScore = user.bestScore || user.score || 0;
                username = user.gameUsername || user.username || 'You';
                avatar = user.avatarSrc || 'avatars/avatar_default.jpg';
            } else {
                username = 'You';
                bestScore = 0;
                avatar = 'avatars/avatar_default.jpg';
            }
        } catch (err) {
            username = 'You';
            bestScore = 0;
            avatar = 'avatars/avatar_default.jpg';
        }
    }
    // Add cache buster to avatar
    if (avatar && !avatar.includes('?')) {
        avatar += '?t=' + new Date().getTime();
    }
    // Render sticky row (Game Over: with rank)
    const userRow = `
        <div class=\"leaderboard-rank\">${rank}</div>
        <div class=\"leaderboard-avatar\"><img src=\"${avatar}\" alt=\"${username}\"></div>
        <div class=\"leaderboard-username\">${username} <span style=\"color:#00FF9D;\">(You)</span></div>
        <div class=\"leaderboard-score\"><img src=\"ressources/trophy.png\" alt=\"🏆\">${bestScore}</div>
    `;
    document.getElementById('gameover-user-row').innerHTML = userRow;
}

// Call this when showing the Game Over screen
if (document.getElementById('gameover-user-row')) {
    renderGameOverStickyUserRow();
}

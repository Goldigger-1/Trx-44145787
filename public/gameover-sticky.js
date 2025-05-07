// Sticky user row for Game Over page (optimized version)
// Injects user's season rank and best score into the sticky group on Game Over screen.
// Expects <div class="leaderboard-user-row" id="gameover-user-row"></div> inside #game-over.

async function renderGameOverStickyUserRow() {
    // Get current user ID (robust) - enhanced version
    let userId = '';
    
    // Check global variables first (from index.html)
    if (window.userId) {
        userId = window.userId;
    } else {
        // Then try localStorage with multiple possible keys
        userId = localStorage.getItem('tidashUserId') || 
                 localStorage.getItem('userId') || '';
                 
        // If it's a DOM element or object, convert appropriately
        if (typeof userId !== 'string') {
            if (userId && userId.textContent) {
                userId = userId.textContent;
            } else {
                userId = '';
            }
        }
    }
    
    // Also check if we can get the ID from the DOM
    if (!userId && document.getElementById('userId')) {
        userId = document.getElementById('userId').textContent.trim();
    }
    
    // Last resort fallback - try to get current score if user ID is still missing
    if (!userId && window.score !== undefined) {
        // Show a simplified card with just the current score
        document.getElementById('gameover-user-row').innerHTML = `
            <div class="leaderboard-rank">-</div>
            <div class="leaderboard-avatar"><img src="avatars/avatar_default.jpg" alt="You"></div>
            <div class="leaderboard-username">You</div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.score || window.seasonScore || 0}</div>
        `;
        return;
    }
    
    userId = userId.trim();
    if (!/^[\w-]{1,}$/.test(userId)) {
        document.getElementById('gameover-user-row').innerHTML = `
            <div class="leaderboard-rank">-</div>
            <div class="leaderboard-avatar"><img src="avatars/avatar_default.jpg" alt="You"></div>
            <div class="leaderboard-username">You</div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
        `;
        return;
    }

    try {
        // Show loading state on the user row
        document.getElementById('gameover-user-row').innerHTML = '<div style="text-align:center;"><img src="ressources/Dual Ball@1x-1.0s-200px-200px.svg" alt="Loading..." style="width:30px;height:30px;" /></div>';
        
        // Fetch active season
        let season;
        try {
            const seasonRes = await fetch('/api/seasons/active');
            if (!seasonRes.ok) {
                throw new Error('Failed to fetch active season');
            }
            season = await seasonRes.json();
        } catch (seasonError) {
            console.error('Error fetching active season:', seasonError);
            // Fallback to simpler display if season fetch fails
            document.getElementById('gameover-user-row').innerHTML = `
                <div class="leaderboard-rank">-</div>
                <div class="leaderboard-avatar"><img src="avatars/avatar_default.jpg" alt="You"></div>
                <div class="leaderboard-username">You</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
            `;
            return;
        }
        
        // Get user data directly from API
        let userInfo;
        try {
            const userInfoRes = await fetch(`/api/seasons/${season.id}/userRank/${userId}`);
            if (!userInfoRes.ok) {
                throw new Error('Failed to fetch user rank information');
            }
            userInfo = await userInfoRes.json();
        } catch (userInfoError) {
            console.error('Error fetching user rank:', userInfoError);
            
            // Try alternative API to get basic user info
            try {
                const basicUserRes = await fetch(`/api/users/${userId}`);
                if (basicUserRes.ok) {
                    const basicUser = await basicUserRes.json();
                    // Create a simplified userInfo object
                    userInfo = {
                        rank: '-',
                        score: window.seasonScore || basicUser.bestScore || 0,
                        username: basicUser.gameUsername || 'You',
                        avatarSrc: basicUser.avatarSrc || 'avatars/avatar_default.jpg'
                    };
                } else {
                    throw new Error('Failed to fetch user info');
                }
            } catch (basicUserError) {
                console.error('Error fetching basic user info:', basicUserError);
                
                // Ultimate fallback - use window variables
                document.getElementById('gameover-user-row').innerHTML = `
                    <div class="leaderboard-rank">-</div>
                    <div class="leaderboard-avatar"><img src="avatars/avatar_default.jpg" alt="You"></div>
                    <div class="leaderboard-username">${window.username || 'You'}</div>
                    <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
                `;
                return;
            }
        }
        
        // Extract user data
        const rank = userInfo.rank || '-';
        const bestScore = userInfo.score || window.seasonScore || 0;
        const username = userInfo.username || window.username || 'You';
        
        // Add cache buster to avatar URL
        let avatar = userInfo.avatarSrc || window.avatarUrl || 'avatars/avatar_default.jpg';
        if (avatar && !avatar.includes('?')) {
            avatar += '?t=' + new Date().getTime();
        }
        
        // Render sticky row
        const userRow = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-avatar"><img src="${avatar}" alt="${username}"></div>
            <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${bestScore}</div>
        `;
        document.getElementById('gameover-user-row').innerHTML = userRow;
    } catch (error) {
        console.error('Error rendering game over sticky user row:', error);
        // Fallback to simpler display in case of error - never show "Failed to load your info"
        document.getElementById('gameover-user-row').innerHTML = `
            <div class="leaderboard-rank">-</div>
            <div class="leaderboard-avatar"><img src="avatars/avatar_default.jpg" alt="You"></div>
            <div class="leaderboard-username">${window.username || 'You'}</div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
        `;
    }
}

// Call this when showing the Game Over screen
if (document.getElementById('gameover-user-row')) {
    renderGameOverStickyUserRow();
}

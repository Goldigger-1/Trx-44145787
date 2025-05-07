// Leaderboard Page Logic
(function() {
    // Utility: Format number with leading zero
    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    // Utility: Calculate countdown from now to endDate (ISO string)
    function getCountdown(endDate) {
        const now = new Date();
        const end = new Date(endDate);
        let diff = Math.max(0, end - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const minutes = Math.floor(diff / (1000 * 60));
        return { days, hours, minutes };
    }

    // Fetch active season info
    async function fetchActiveSeason() {
        try {
            // Try the newer endpoint first
            const res = await fetch('/api/seasons/active');
            if (res.ok) {
                return res.json();
            }
            
            // Fall back to the older endpoint if the new one fails
            const fallbackRes = await fetch('/api/active-season');
            if (fallbackRes.ok) {
                return fallbackRes.json();
            }
            
            throw new Error('Failed to fetch active season');
        } catch (error) {
            console.error('Error fetching active season:', error);
            throw error;
        }
    }

    // Fetch leaderboard for season
    async function fetchSeasonRanking(seasonId) {
        const res = await fetch(`/api/seasons/${seasonId}/ranking`);
        if (!res.ok) throw new Error('Failed to fetch season ranking');
        return res.json();
    }

    // Utility: Robustly get and validate current user ID
    function getCurrentUserId() {
        let userId = window.userId || localStorage.getItem('userId') || '';
        // If it's a DOM element or object, return empty string
        if (typeof userId !== 'string') {
            if (userId && userId.textContent) {
                userId = userId.textContent;
            } else {
                return '';
            }
        }
        // Remove whitespace and validate
        userId = userId.trim();
        // Accept only non-empty strings of digits/letters (adjust regex as needed)
        if (/^[\w-]{6,}$/.test(userId)) {
            return userId;
        }
        return '';
    }

    // Get current user info (assume available globally or from localStorage)
    function getCurrentUser() {
        if (window.userId && window.username && window.avatarUrl) {
            return {
                gameId: window.userId,
                gameUsername: window.username,
                avatar: window.avatarUrl,
            };
        }
        return {
            gameId: localStorage.getItem('userId') || '',
            gameUsername: localStorage.getItem('username') || 'MainUser',
            avatar: localStorage.getItem('avatarUrl') || 'avatars/avatar_default.jpg',
        };
    }

    // Render countdown
    function renderCountdown(endDate) {
        function update() {
            const { days, hours, minutes } = getCountdown(endDate);
            document.getElementById('leaderboard-countdown-days').textContent = pad(days);
            document.getElementById('leaderboard-countdown-hours').textContent = pad(hours);
            document.getElementById('leaderboard-countdown-minutes').textContent = pad(minutes);
        }
        update();
        // Update every 20s
        setInterval(update, 20000);
    }

    // Render leaderboard
    function renderLeaderboard(ranking, currentUserId) {
        // Podium
        const podium = [ranking[0], ranking[1], ranking[2]];
        [1,2,3].forEach(i => {
            const user = podium[i-1];
            if (!user) return;
            document.getElementById(`podium-${i}-username`).textContent = user.gameUsername || user.username || `User${i}`;
            
            // Ensure we use avatarSrc when available
            const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
            document.getElementById(`podium-${i}-avatar`).src = avatarSrc;
            document.getElementById(`podium-${i}-avatar`).alt = user.gameUsername || user.username || `User${i}`;
            
            console.log(`[DEBUG] Podium ${i} avatar:`, avatarSrc);
        });
        // Prize for 1st
        if (podium[0]) {
            document.getElementById('podium-1-prize').textContent = podium[0].prize ? `$${podium[0].prize}` : '';
        }
        // List
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        ranking.forEach((user, idx) => {
            // Debug: Log avatarSrc and username for each user
            console.log('[AVATAR DEBUG]', {
                idx,
                username: user.gameUsername || user.username || 'Player',
                avatarSrc: user.avatarSrc
            });
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            
            // Use avatarSrc when available, otherwise use default
            const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
            
            row.innerHTML = `
                <div class="leaderboard-rank">${idx+1}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${user.gameUsername || user.username || 'Player'}"></div>
                <div class="leaderboard-username">${user.gameUsername || user.username || 'Player'}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${user.score || 0}</div>
            `;
            list.appendChild(row);
        });
        
        // Current user row (sticky) - Optimized implementation
        async function renderStickyUserRow(seasonId, currentUserId) {
            // If user ID is missing or invalid, show error
            if (!currentUserId) {
                document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:orange;">Could not determine your user ID. Please log in again. ⚠️</div>';
                return;
            }
            
            try {
                // Optimized: Get user data and rank in parallel
                const [userPromise, rankPromise] = await Promise.allSettled([
                    fetch(`/api/users/${encodeURIComponent(currentUserId)}`).then(r => r.ok ? r.json() : null),
                    fetch(`/api/seasons/${seasonId}/users/${encodeURIComponent(currentUserId)}/rank`).then(r => r.ok ? r.json() : { rank: '-' })
                ]);
                
                // Extract user data
                let user = userPromise.status === 'fulfilled' ? userPromise.value : null;
                let rank = rankPromise.status === 'fulfilled' ? rankPromise.value?.rank : '-';
                
                // Fallback for user data if needed
                if (!user) {
                    // Try to find user in ranking as fallback
                    user = ranking.find(u => String(u.gameId ?? u.id ?? u.userId) === String(currentUserId)) || {};
                }
                
                // Set data with fallbacks
                let bestScore = user?.bestScore || user?.score || 0;
                let username = user?.gameUsername || user?.username || 'You';
                let avatar = user?.avatarSrc || 'avatars/avatar_default.jpg';
                
                // Add cache buster to avatar
                if (avatar && !avatar.includes('?')) {
                    avatar += '?t=' + new Date().getTime();
                }
                
                console.log('[DEBUG] Current user avatar:', avatar);
                
                // Render sticky row
                const userRow = `
                    <div class="leaderboard-rank">${rank}</div>
                    <div class="leaderboard-avatar"><img src="${avatar}" alt="${username}"></div>
                    <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                    <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${bestScore}</div>
                `;
                console.log('[DEBUG sticky row]', {rank, bestScore, username, avatar, userRow});
                document.getElementById('leaderboard-user-row').innerHTML = userRow;
            } catch (e) {
                console.error('Error rendering sticky user row:', e);
                document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:red;">Failed to load your info. Please refresh. ❌</div>';
            }
        }
        
        // Call the async function to render sticky user row
        renderStickyUserRow(season.id, currentUserId).catch(e => {
            document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:red;">Failed to load your info. Please refresh. ❌</div>';
        });
    }

    // Show leaderboard page
    function showLeaderboard() {
        document.getElementById('leaderboard-screen').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    // Hide leaderboard page
    function hideLeaderboard() {
        document.getElementById('leaderboard-screen').style.display = 'none';
        document.body.style.overflow = '';
        // Return to home logic (customize as needed)
        if (typeof goToHome === 'function') goToHome();
    }

    // Attach close button event
    document.getElementById('close-leaderboard').onclick = hideLeaderboard;

    // Integration: Open leaderboard from home page (group element click)
    // Example: document.getElementById('season-container').onclick = showLeaderboard;

    // Main init
    async function initLeaderboard() {
        const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
        try {
            // Show loading overlay at the start
            if (loadingOverlay) loadingOverlay.style.display = 'flex';

            const season = await fetchActiveSeason();
            document.getElementById('leaderboard-season-title').textContent = `Season ${season.seasonNumber}`;
            renderCountdown(season.endDate);
            // Fetch ranking
            let ranking = await fetchSeasonRanking(season.id);
            
            // Log the entire ranking data for debugging
            console.log('[DEBUG] Full ranking data:', ranking);
            
            // Add prize to 1st place
            if (ranking[0]) ranking[0].prize = season.prizeMoney;
            // Get current user id robustly
            let currentUserId = getCurrentUserId();
            renderLeaderboard(ranking, currentUserId);

            // Hide loading overlay when done
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        } catch (error) {
            console.error('Error initializing leaderboard:', error);
            // Hide loading overlay on error
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            // Show error in leaderboard container
            const leaderboardList = document.getElementById('leaderboard-list');
            if (leaderboardList) {
                leaderboardList.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#FF3B30;">
                        <p>Error loading leaderboard data.</p>
                        <p>Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    // Make functions available globally
    window.showLeaderboard = showLeaderboard;
    window.hideLeaderboard = hideLeaderboard;
    window.initLeaderboard = initLeaderboard;
})();

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
        // Check global variables first (from index.html)
        if (window.userId) {
            return window.userId;
        }
        
        // Then try localStorage with multiple possible keys
        let userId = localStorage.getItem('tidashUserId') || 
                     localStorage.getItem('userId') || '';
        
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
        // Accept only non-empty strings of digits/letters
        if (/^[\w-]{1,}$/.test(userId)) {
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
            gameId: localStorage.getItem('tidashUserId') || '',
            gameUsername: localStorage.getItem('tidashUsername') || 'MainUser',
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
        
        // Current user row (sticky) - Optimized with direct API call
        renderStickyUserRow(currentUserId);
    }
    
    // Optimized: Render sticky user row with direct API call
    async function renderStickyUserRow(currentUserId) {
        try {
            // Enhanced currentUserId validation
            if (!currentUserId) {
                // Try to get ID from DOM elements if available
                if (document.getElementById('userId')) {
                    currentUserId = document.getElementById('userId').textContent.trim();
                } else {
                    // Fallback to a simple row with default values instead of showing an error
                    document.getElementById('leaderboard-user-row').innerHTML = `
                        <div class="leaderboard-rank">-</div>
                        <div class="leaderboard-avatar"><img src="${window.avatarUrl || 'avatars/avatar_default.jpg'}" alt="You"></div>
                        <div class="leaderboard-username">${window.username || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                        <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
                    `;
                    return;
                }
            }
            
            // Show loading state on the user row
            document.getElementById('leaderboard-user-row').innerHTML = '<div style="text-align:center;"><img src="ressources/Dual Ball@1x-1.0s-200px-200px.svg" alt="Loading..." style="width:30px;height:30px;" /></div>';
            
            // Get the active season with proper error handling
            let season;
            try {
                const seasonResponse = await fetchActiveSeason();
                season = seasonResponse;
            } catch (seasonError) {
                console.error('Error fetching active season:', seasonError);
                // Fallback to a simple row with default values
                document.getElementById('leaderboard-user-row').innerHTML = `
                    <div class="leaderboard-rank">-</div>
                    <div class="leaderboard-avatar"><img src="${window.avatarUrl || 'avatars/avatar_default.jpg'}" alt="You"></div>
                    <div class="leaderboard-username">${window.username || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                    <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
                `;
                return;
            }
            
            // Get user rank data with proper error handling
            let userInfo;
            try {
                const res = await fetch(`/api/seasons/${season.id}/userRank/${currentUserId}`);
                if (!res.ok) {
                    throw new Error('Failed to fetch user rank information');
                }
                userInfo = await res.json();
            } catch (userRankError) {
                console.error('Error fetching user rank:', userRankError);
                
                // Try alternative API to get basic user info
                try {
                    const basicUserRes = await fetch(`/api/users/${currentUserId}`);
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
                    
                    // Ultimate fallback - use window variables or defaults
                    document.getElementById('leaderboard-user-row').innerHTML = `
                        <div class="leaderboard-rank">-</div>
                        <div class="leaderboard-avatar"><img src="${window.avatarUrl || 'avatars/avatar_default.jpg'}" alt="You"></div>
                        <div class="leaderboard-username">${window.username || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                        <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
                    `;
                    return;
                }
            }
            
            // Extract user data with fallbacks to window variables
            const rank = userInfo.rank || '-';
            const bestScore = userInfo.score || window.seasonScore || 0;
            const username = userInfo.username || window.username || 'You';
            
            // Add cache buster to avatar URL
            let avatar = userInfo.avatarSrc || window.avatarUrl || 'avatars/avatar_default.jpg';
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
            document.getElementById('leaderboard-user-row').innerHTML = userRow;
        } catch (error) {
            console.error('Error rendering sticky user row:', error);
            // Never show error message - fallback to simple row with default values
            document.getElementById('leaderboard-user-row').innerHTML = `
                <div class="leaderboard-rank">-</div>
                <div class="leaderboard-avatar"><img src="${window.avatarUrl || 'avatars/avatar_default.jpg'}" alt="You"></div>
                <div class="leaderboard-username">${window.username || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${window.seasonScore || 0}</div>
            `;
        }
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
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            document.getElementById('leaderboard-list').innerHTML = '<div style="text-align:center;padding:20px;color:red;">Failed to load leaderboard. Please try again later.</div>';
        }
    }

    // Expose functions to global scope for external access
    window.showLeaderboard = showLeaderboard;
    window.hideLeaderboard = hideLeaderboard;
    window.initLeaderboard = initLeaderboard;
})();

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
        // Show loading overlay and initialize progress bar
        const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
        const progressBar = document.getElementById('loading-progress');
        
        if (!loadingOverlay || !progressBar) {
            console.error('Loading elements not found in DOM');
            return;
        }
        
        loadingOverlay.style.display = 'flex';
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
        
        // Create loading animation
        let currentWidth = 0;
        const animationInterval = setInterval(() => {
            if (currentWidth >= 100) {
                currentWidth = 0;
            }
            currentWidth += 2; // Increase by 2% per frame
            progressBar.style.width = currentWidth + '%';
        }, 50); // Update every 50ms
        
        // Podium
        const podium = [ranking[0], ranking[1], ranking[2]];
        [1,2,3].forEach(i => {
            const user = podium[i-1];
            if (!user) return;
            const usernameElement = document.getElementById(`podium-${i}-username`);
            const avatarElement = document.getElementById(`podium-${i}-avatar`);
            
            // Smooth update with fade
            usernameElement.style.opacity = '0';
            avatarElement.style.opacity = '0';
            
            usernameElement.textContent = user.gameUsername || user.username || `User${i}`;
            const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
            avatarElement.src = avatarSrc;
            avatarElement.alt = user.gameUsername || user.username || `User${i}`;
            
            // Fade in after update
            setTimeout(() => {
                usernameElement.style.opacity = '1';
                avatarElement.style.opacity = '1';
            }, 100);
        });
        
        // Prize for 1st
        if (podium[0]) {
            const prizeElement = document.getElementById('podium-1-prize');
            prizeElement.style.opacity = '0';
            prizeElement.textContent = podium[0].prize ? `$${podium[0].prize}` : '';
            setTimeout(() => {
                prizeElement.style.opacity = '1';
            }, 100);
        }
        
        // List
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        
        // Create rows with fade-in effect and update progress
        const totalUsers = ranking.length;
        let loadedUsers = 0;
        
        ranking.forEach((user, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.style.opacity = '0';
            
            const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
            
            row.innerHTML = `
                <div class="leaderboard-rank">${idx+1}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${user.gameUsername || user.username || 'Player'}"></div>
                <div class="leaderboard-username">${user.gameUsername || user.username || 'Player'}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${user.score || 0}</div>
            `;
            
            // Add row with fade-in animation
            list.appendChild(row);
            setTimeout(() => {
                row.style.opacity = '1';
                loadedUsers++;
                // Update progress based on number of users loaded
                const progress = (loadedUsers / totalUsers) * 100;
                progressBar.style.width = progress + '%';
                console.log('Progress:', progress + '%'); // Debug
            }, 100 * (idx % 5)); // Staggered fade-in
        });
        
        // Hide loading overlay after all animations
        const hideLoading = () => {
            clearInterval(animationInterval);
            loadingOverlay.style.display = 'none';
        };
        
        // Hide loading overlay after all animations
        setTimeout(hideLoading, 1000);
        
        // Animate progress bar from 0 to 100% over 1 second
        const progressInterval = setInterval(() => {
            const currentWidth = parseFloat(progressBar.style.width.replace('%', ''));
            if (currentWidth < 100) {
                progressBar.style.width = (currentWidth + 1) + '%';
            } else {
                clearInterval(progressInterval);
            }
        }, 10);
        // Current user row (sticky)
        // --- Robust sticky user row rendering: always use server data ---
        async function renderStickyUserRow(ranking, currentUserId) {
            // If user ID is missing or invalid, show error
            if (!currentUserId) {
                document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:orange;">Could not determine your user ID. Please log in again. ⚠️</div>';
                return;
            }
            // Deep fix: Always sort the ranking array by bestScore (or score) descending before finding the user's position
            let sortedRanking = [...ranking].sort((a, b) => (b.bestScore ?? b.score ?? 0) - (a.bestScore ?? a.score ?? 0));
            let userIndex = sortedRanking.findIndex(u => String(u.gameId ?? u.id ?? u.userId) === String(currentUserId));
            let rank = userIndex !== -1 ? userIndex + 1 : '-';
            let user = sortedRanking[userIndex];
            let bestScore = 0;
            let username = '';
            let avatar = 'avatars/avatar_default.jpg';
            if (user) {
                // User is ranked
                bestScore = user.bestScore || user.score || 0;
                username = user.gameUsername || user.username || 'You';
                avatar = user.avatarSrc || 'avatars/avatar_default.jpg';
            } else {
                // Not ranked: fetch from server
                try {
                    const res = await fetch(`/api/users/${encodeURIComponent(currentUserId)}`);
                    if (res.ok) {
                        user = await res.json();
                        bestScore = user.bestScore || user.score || 0;
                        username = user.gameUsername || user.username || 'You';
                        avatar = user.avatarSrc || 'avatars/avatar_default.jpg';
                    } else {
                        // User not found on server
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
            
            console.log('[DEBUG] Current user avatar:', avatar);
            
            // Render sticky row
            const userRow = `
                <div class="leaderboard-rank">${rank}</div>
                <div class="leaderboard-avatar"><img src="${avatar}" alt="${username}"></div>
                <div class="leaderboard-username">${username} <span style=\"color:#00FF9D;\">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${bestScore}</div>
            `;
            console.log('[DEBUG sticky row]', {rank, bestScore, username, avatar, userRow});
            document.getElementById('leaderboard-user-row').innerHTML = userRow;
        }
        // Call the async function and handle errors
        renderStickyUserRow(ranking, currentUserId).catch(e => {
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
        } catch (e) {
            // Hide loading overlay on error as well
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            alert('Failed to load leaderboard. Please try again later.');
            console.error(e);
        }
    }

    // Expose showLeaderboard globally for integration
    window.showLeaderboard = showLeaderboard;
    // Initialize leaderboard on page load (or call when opening)
    // initLeaderboard(); // Uncomment if you want auto-load
    window.initLeaderboard = initLeaderboard;

})();

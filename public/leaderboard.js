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

    // Fetch leaderboard for season with pagination
    async function fetchSeasonRanking(seasonId, limit = 50, offset = 0) {
        const res = await fetch(`/api/seasons/${seasonId}/ranking?limit=${limit}&offset=${offset}`);
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

    // Render leaderboard with append option for infinite scroll
    function renderLeaderboard(ranking, currentUserId, {append = false, offset = 0} = {}) {
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
        if (!append || offset === 0) list.innerHTML = '';
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
            
            // Calcul du rang global
            const globalRank = offset + idx + 1;
            row.innerHTML = `
                <div class="leaderboard-rank">${globalRank}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${user.gameUsername || user.username || 'Player'}"></div>
                <div class="leaderboard-username">${user.gameUsername || user.username || 'Player'}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${user.score || 0}</div>
            `;
            list.appendChild(row);
        });
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

            // Infinite scroll state
            let offset = 0;
            const limit = 50;
            let allLoaded = false;
            let isLoading = false;
            let currentUserId = getCurrentUserId();
            let seasonId = season.id;
            let loadedRanking = [];

            // Podium: always load first 3 (top)
            let podiumLoaded = false;

            async function loadNextPage() {
                if (isLoading || allLoaded) return;
                isLoading = true;
                if (loadingOverlay) loadingOverlay.style.display = 'flex';
                try {
                    let rankingPage = await fetchSeasonRanking(seasonId, limit, offset);
                    if (!Array.isArray(rankingPage) || rankingPage.length === 0) {
                        allLoaded = true;
                        if (loadingOverlay) loadingOverlay.style.display = 'none';
                        return;
                    }
                    // Podium: charger une seule fois les 3 premiers
                    if (!podiumLoaded && rankingPage.length > 0) {
                        // On passe la page complète pour le podium (au cas où il y a moins de 3)
                        renderLeaderboard(rankingPage.slice(0, 3), currentUserId, {append: false, offset: 0});
                        podiumLoaded = true;
                    }
                    // Ajouter les utilisateurs (hors podium) à la suite
                    let startIdx = podiumLoaded ? 3 : 0;
                    if (rankingPage.length > startIdx) {
                        renderLeaderboard(rankingPage.slice(startIdx), currentUserId, {append: true, offset: offset + startIdx});
                        loadedRanking = loadedRanking.concat(rankingPage);
                    }
                    offset += rankingPage.length;
                    if (rankingPage.length < limit) allLoaded = true;
                } catch (e) {
                    allLoaded = true;
                    alert('Failed to load leaderboard page.');
                    console.error(e);
                } finally {
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    isLoading = false;
                }
            }

            // Initial load
            await loadNextPage();

            // Infinite scroll handler
            const list = document.getElementById('leaderboard-list');
            let scrollContainer = list.parentElement; // suppose que le parent est scrollable
            if (!scrollContainer) scrollContainer = window;
            function onScroll() {
                let scrollBottom;
                if (scrollContainer === window) {
                    scrollBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
                } else {
                    scrollBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 100;
                }
                if (scrollBottom) {
                    loadNextPage();
                }
            }
            scrollContainer.addEventListener('scroll', onScroll);

            // Optionnel: retirer le listener à la fermeture du leaderboard (non destructif ici)

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

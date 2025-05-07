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
    async function fetchSeasonRanking(seasonId, page = 0) {
        // Fetch only the requested batch of data
        const ITEMS_PER_PAGE = 15;
        const res = await fetch(`/api/seasons/${seasonId}/ranking?page=${page}&limit=${ITEMS_PER_PAGE}`);
        if (!res.ok) throw new Error('Failed to fetch season ranking');
        const data = await res.json();
        
        return data;
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

    // Global variables for progressive loading
    let currentPage = 0;
    let isLoading = false;
    let hasMoreUsers = true;
    let seasonId = null;
    
    // Render leaderboard with progressive loading
    function renderLeaderboard(ranking, currentUserId, isInitialLoad = true) {
        const list = document.getElementById('leaderboard-list');
        
        // If this is the initial load, clear the list and render the podium
        if (isInitialLoad) {
            // Clear list but keep loading indicator if present
            const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
            if (loadingIndicator) {
                // Store loading indicator temporarily
                const tempIndicator = loadingIndicator.cloneNode(true);
                list.innerHTML = '';
                list.appendChild(tempIndicator);
            } else {
                list.innerHTML = '';
            }
            
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
            });
            
            // Prize for 1st
            if (podium[0]) {
                document.getElementById('podium-1-prize').textContent = podium[0].prize ? `$${podium[0].prize}` : '';
            }
        }
        
        // Calculate starting index based on initial load or append
        const startIdx = isInitialLoad ? 0 : list.children.length;
        
        // Always render a maximum of 15 items at a time
        const maxItems = Math.min(ranking.length, 15);
        
        // Create new fragment to append all items at once
        const fragment = document.createDocumentFragment();
        
        // Append new rows to the fragment
        for (let i = 0; i < maxItems; i++) {
            const user = ranking[i];
            const actualIdx = startIdx + i;
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            
            // Use avatarSrc when available, otherwise use default
            const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
            
            row.innerHTML = `
                <div class="leaderboard-rank">${actualIdx+1}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${user.gameUsername || user.username || 'Player'}"></div>
                <div class="leaderboard-username">${user.gameUsername || user.username || 'Player'}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${user.score || 0}</div>
            `;
            fragment.appendChild(row);
        }
        
        // Append all items at once
        list.appendChild(fragment);
        
        // Add loading indicator at the end if there might be more users
        if (hasMoreUsers) {
            addLoadingIndicator();
        }
        
        // Only render the sticky user row on initial load
        if (isInitialLoad) {
            // Current user row (sticky)
            // --- Robust sticky user row rendering: always use server data ---
            renderStickyUserRow(ranking, currentUserId).catch(e => {
                document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:red;">Failed to load your info. Please refresh. ❌</div>';
            });
        }
    }
    
    // Add loading indicator at bottom of list
    function addLoadingIndicator() {
        const list = document.getElementById('leaderboard-list');
        
        // Remove any existing loading indicator
        const existingIndicator = document.getElementById('leaderboard-loading-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create and add new loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'leaderboard-loading-indicator';
        loadingIndicator.className = 'leaderboard-loading-indicator';
        loadingIndicator.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        list.appendChild(loadingIndicator);
        
        // Set up intersection observer for this indicator
        setupIntersectionObserver();
    }
    
    // Set up intersection observer to detect when user scrolls to loading indicator
    function setupIntersectionObserver() {
        const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
        if (!loadingIndicator) return;
        
        // Remove any existing observer
        if (window.leaderboardObserver) {
            window.leaderboardObserver.disconnect();
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading && hasMoreUsers) {
                    // Add a small delay to prevent multiple triggers
                    setTimeout(() => {
                        if (!isLoading && hasMoreUsers) {
                            loadMoreUsers();
                        }
                    }, 100);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(loadingIndicator);
        window.leaderboardObserver = observer;
    }
    
    // Load more users when user scrolls to bottom
    async function loadMoreUsers() {
        if (isLoading || !hasMoreUsers) return;
        
        isLoading = true;
        try {
            const ranking = await fetchSeasonRanking(seasonId, currentPage);
            
            // Check if we have more users
            if (ranking.length < 15) {
                hasMoreUsers = false;
            } else {
                currentPage++;
            }
            
            // Only render new items, don't re-render existing ones
            const existingCount = document.querySelectorAll('.leaderboard-row').length;
            const newItems = ranking.slice(existingCount);
            
            // If we have new items to render
            if (newItems.length > 0) {
                renderLeaderboard(newItems, getCurrentUserId(), false);
            } else {
                console.log('No new items to render');
            }
        } catch (error) {
            console.error('Error loading more users:', error);
            // Show error in loading indicator
            const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.innerHTML = '<div style="color:orange;">Failed to load more users. Tap to retry.</div>';
                loadingIndicator.style.cursor = 'pointer';
                loadingIndicator.onclick = loadMoreUsers;
            }
        } finally {
            isLoading = false;
        }
    }
    
    // Current user row (sticky) - separated into its own function
    async function renderStickyUserRow(ranking, currentUserId) {
        // If user ID is missing or invalid, show error
        if (!currentUserId) {
            document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:orange;">Could not determine your user ID. Please log in again. ⚠️</div>';
            return;
        }

        // Find user in current ranking first
        let userIndex = ranking.findIndex(u => String(u.gameId ?? u.id ?? u.userId) === String(currentUserId));
        let rank = userIndex !== -1 ? userIndex + 1 : '-';
        let user = ranking[userIndex];
        let bestScore = 0;
        let username = '';
        let avatar = 'avatars/avatar_default.jpg';

        if (user) {
            // User is in current ranking
            bestScore = user.bestScore || user.score || 0;
            username = user.gameUsername || user.username || 'You';
            avatar = user.avatarSrc || 'avatars/avatar_default.jpg';
        } else {
            // Not in current ranking: fetch user's position
            try {
                const res = await fetch(`/api/seasons/${seasonId}/user-rank/${encodeURIComponent(currentUserId)}`);
                if (res.ok) {
                    const userData = await res.json();
                    rank = userData.rank || '-';
                    bestScore = userData.bestScore || userData.score || 0;
                    username = userData.gameUsername || userData.username || 'You';
                    avatar = userData.avatarSrc || 'avatars/avatar_default.jpg';
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

        // Render sticky row
        const userRow = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-avatar"><img src="${avatar}" alt="${username}"></div>
            <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${bestScore}</div>
        `;
        document.getElementById('leaderboard-user-row').innerHTML = userRow;
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
            // Reset pagination variables
            currentPage = 0;
            isLoading = false;
            hasMoreUsers = true;
            
            // Clear any existing ranking cache when (re)initializing
            window.fullRankingCache = {};
            
            // Show loading overlay at the start
            if (loadingOverlay) loadingOverlay.style.display = 'flex';

            const season = await fetchActiveSeason();
            if (!season) {
                throw new Error('No active season found');
            }
            
            seasonId = season.id;
            document.getElementById('leaderboard-season-title').textContent = `Season ${season.seasonNumber}`;
            renderCountdown(season.endDate);
            
            // Fetch first page of ranking
            const ranking = await fetchSeasonRanking(season.id, currentPage);
            if (ranking.length < 15) {
                hasMoreUsers = false;
            } else {
                currentPage++;
            }
            
            // Add loading indicator before rendering
            addLoadingIndicator();
            
            // Setup intersection observer before rendering
            setupIntersectionObserver();
            
            // Render initial data
            renderLeaderboard(ranking, getCurrentUserId(), true);
            
            // If we got fewer users than requested, we've reached the end
            hasMoreUsers = initialRanking.length === 15;
            
            // Add prize to 1st place
            if (initialRanking[0]) initialRanking[0].prize = season.prizeMoney;
            
            // Get current user id robustly
            let currentUserId = getCurrentUserId();
            renderLeaderboard(initialRanking, currentUserId, true);

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

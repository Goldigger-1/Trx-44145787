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
    async function fetchSeasonRanking(seasonId, page = 0, limit = 10) {
        // First fetch all data (server might not support pagination)
        if (!window.fullRankingCache || !window.fullRankingCache[seasonId]) {
            // If we don't have the data cached for this season, fetch it all
            const res = await fetch(`/api/seasons/${seasonId}/ranking`);
            if (!res.ok) throw new Error('Failed to fetch season ranking');
            const fullData = await res.json();
            
            // Cache the full data for this season
            window.fullRankingCache = window.fullRankingCache || {};
            window.fullRankingCache[seasonId] = fullData;
        }
        
        // Get the cached full data
        const fullData = window.fullRankingCache[seasonId];
        
        // Implement client-side pagination
        const start = page * limit;
        const end = start + limit;
        
        // Return the requested slice of data
        return fullData.slice(start, end);
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
    let allRanking = [];
    
    // Render leaderboard with progressive loading
    function renderLeaderboard(ranking, currentUserId, isInitialLoad = true) {
        const list = document.getElementById('leaderboard-list');
        
        // If this is the initial load, clear the list and render the podium
        if (isInitialLoad) {
            list.innerHTML = '';
            
            // Store the ranking data for the sticky user row
            allRanking = [...ranking];
            
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
            
            // Use the game over sticky row renderer
            renderGameOverStickyUserRow();
        } else {
            // For subsequent loads, append the new ranking data to our stored array
            allRanking = [...allRanking, ...ranking];
        }
        
        // Calculate starting index based on initial load or append
        const startIdx = isInitialLoad ? 0 : list.children.length;
        
        // Append new rows to the list
        ranking.forEach((user, idx) => {
            const actualIdx = startIdx + idx;
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
            list.appendChild(row);
        });
        
        // Add loading indicator at the end if there might be more users
        if (hasMoreUsers) {
            addLoadingIndicator();
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
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading && hasMoreUsers) {
                    loadMoreUsers();
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(loadingIndicator);
    }
    
    // Load more users when user scrolls to bottom
    async function loadMoreUsers() {
        if (isLoading || !hasMoreUsers || !seasonId) return;
        
        isLoading = true;
        currentPage++;
        
        try {
            const USERS_PER_PAGE = 10;
            const newUsers = await fetchSeasonRanking(seasonId, currentPage, USERS_PER_PAGE);
            
            // Check if we've loaded all users
            if (window.fullRankingCache && window.fullRankingCache[seasonId]) {
                const fullLength = window.fullRankingCache[seasonId].length;
                hasMoreUsers = (currentPage + 1) * USERS_PER_PAGE < fullLength;
            } else if (newUsers.length < USERS_PER_PAGE) {
                // If we received fewer users than requested, we've reached the end
                hasMoreUsers = false;
            }
            
            // If we got some users, render them
            if (newUsers.length > 0) {
                renderLeaderboard(newUsers, getCurrentUserId(), false);
            } else {
                // No more users, remove loading indicator
                const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
                if (loadingIndicator) loadingIndicator.remove();
                hasMoreUsers = false;
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
            seasonId = season.id; // Store for later use with pagination
            document.getElementById('leaderboard-season-title').textContent = `Season ${season.seasonNumber}`;
            renderCountdown(season.endDate);
            
            // Fetch first page of ranking
            const USERS_PER_PAGE = 10;
            let initialRanking = await fetchSeasonRanking(season.id, 0, USERS_PER_PAGE);
            
            // If we have the full data cached, check if there are more users
            if (window.fullRankingCache && window.fullRankingCache[season.id]) {
                hasMoreUsers = initialRanking.length < window.fullRankingCache[season.id].length;
            } else if (initialRanking.length < USERS_PER_PAGE) {
                // If we received fewer users than requested, we've reached the end
                hasMoreUsers = false;
            }
            
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

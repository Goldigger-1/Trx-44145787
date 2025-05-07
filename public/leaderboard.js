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
        try {
            // Fetch only the requested page of data
            const res = await fetch(`/api/seasons/${seasonId}/ranking?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch season ranking');
            const data = await res.json();
            
            // If this is the first page, initialize the cache
            if (page === 0) {
                window.fullRankingCache = window.fullRankingCache || {};
                window.fullRankingCache[seasonId] = {
                    total: data.total || 0,
                    pages: data.pages || 0,
                    currentPage: page,
                    data: data.ranking || []
                };
            } else {
                // For subsequent pages, append to the cache
                if (window.fullRankingCache && window.fullRankingCache[seasonId]) {
                    window.fullRankingCache[seasonId].data = [
                        ...window.fullRankingCache[seasonId].data,
                        ...(data.ranking || [])
                    ];
                    window.fullRankingCache[seasonId].currentPage = page;
                }
            }
            
            return data.ranking || [];
        } catch (error) {
            console.error('Error fetching season ranking:', error);
            throw error;
        }
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
    
    // Render leaderboard with pagination
    async function renderLeaderboard(seasonId) {
        try {
            const leaderboardList = document.getElementById('leaderboard-list');
            if (!leaderboardList) return;

            // Clear existing content
            leaderboardList.innerHTML = '';
            
            // Show loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div>';
            leaderboardList.appendChild(loadingIndicator);

            // Initial load of first page
            let currentPage = 0;
            const limit = 10;
            let hasMore = true;

            // Function to load next page
            const loadNextPage = async () => {
                if (!hasMore) return;
                
                try {
                    const ranking = await fetchSeasonRanking(seasonId, currentPage, limit);
                    
                    // Remove loading indicator
                    const existingIndicator = leaderboardList.querySelector('.loading-indicator');
                    if (existingIndicator) {
                        existingIndicator.remove();
                    }

                    if (ranking.length === 0) {
                        hasMore = false;
                        return;
                    }

                    // Render the new batch of users
                    ranking.forEach(user => {
                        const userRow = document.createElement('div');
                        userRow.className = 'leaderboard-row';
                        userRow.innerHTML = `
                            <div class="rank">${user.rank}</div>
                            <div class="user-info">
                                <img src="${user.avatar}?v=${Date.now()}" alt="${user.username}" class="avatar">
                                <span class="username">${user.username}</span>
                            </div>
                            <div class="score">${user.score}</div>
                        `;
                        leaderboardList.appendChild(userRow);
                    });

                    currentPage++;
                    
                    // Check if we have more pages
                    if (window.fullRankingCache && window.fullRankingCache[seasonId]) {
                        hasMore = currentPage < window.fullRankingCache[seasonId].pages;
                    }

                    // Add loading indicator for next page if there's more data
                    if (hasMore) {
                        leaderboardList.appendChild(loadingIndicator);
                    }
                } catch (error) {
                    console.error('Error loading next page:', error);
                    hasMore = false;
                }
            };

            // Initial load
            await loadNextPage();

            // Set up intersection observer for infinite scroll
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && hasMore) {
                        loadNextPage();
                    }
                });
            }, {
                root: null,
                rootMargin: '100px',
                threshold: 0.1
            });

            // Observe the loading indicator
            observer.observe(loadingIndicator);

        } catch (error) {
            console.error('Error rendering leaderboard:', error);
            const leaderboardList = document.getElementById('leaderboard-list');
            if (leaderboardList) {
                leaderboardList.innerHTML = '<div class="error">Failed to load leaderboard</div>';
            }
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
            renderLeaderboard(season.id);

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

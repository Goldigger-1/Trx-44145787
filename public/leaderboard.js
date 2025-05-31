// Leaderboard Page Logic
// Minimal reimplementation to display only the user row

// Variables for infinite scrolling
let currentPage = 0;
let isLoadingMore = false;
let hasMoreData = true;
let activeSeason = null;

// Function to show/hide the leaderboard
function showLeaderboard() {
    console.log('START LEADERBOARD');
    
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (!leaderboardScreen) {
        console.error('Leaderboard screen element not found in DOM');
        return;
    }
    
    leaderboardScreen.style.display = 'flex';
    console.log('Leaderboard displayed (display: flex)');
    
    // Reset pagination variables
    currentPage = 0;
    isLoadingMore = false;
    hasMoreData = true;
    activeSeason = null; // Reset season to force reload
    console.log('Pagination variables reset');
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        console.log('Loading overlay displayed');
    } else {
        console.warn('Loading overlay not found');
    }
    
    // Make sure the leaderboard list has proper styling for scrolling
    const leaderboardList = document.getElementById('leaderboard-list');
    if (leaderboardList) {
        // Ensure the list is scrollable
        leaderboardList.style.overflowY = 'auto';
        leaderboardList.style.maxHeight = '100%';
        leaderboardList.style.height = '100%';
        leaderboardList.innerHTML = ''; // Clear old content
        console.log('Scroll styles applied to #leaderboard-list');
    } else {
        console.error('Leaderboard list element not found in DOM');
    }
    
    console.log('Loading data...');
    
    // Get active season and then load only the first page of data
    getActiveSeason().then(season => {
        console.log(`Active season retrieved: ID=${season.id}, Numéro=${season.seasonNumber}`);
        
        // Set active season
        activeSeason = season;
        
        // Load only first page (15 users)
        console.log('Loading first page of data (15 users max)...');
        return loadLeaderboardPageData(0);
    }).then(data => {
        console.log(`First page loaded successfully: ${data ? data.length : 0} users`);
        
        // Hide loading overlay after initial load
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('Loading overlay hidden');
        }
        
        // Set up scroll listener for infinite scrolling
        setupInfiniteScroll();
    }).catch(error => {
        console.error('ERROR during leaderboard initialization:', error);
        if (error.stack) console.error(`STACK TRACE: ${error.stack}`);
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('Loading overlay hidden (after error)');
        }
        
        // Display error message in the list
        if (leaderboardList) {
            leaderboardList.innerHTML = `
                <div style="color:red; padding:20px; text-align:center;">
                    An error occurred while loading the leaderboard.<br>
                    Details: ${error.message || 'Unknown error'}
                </div>`;
            console.log('Error message displayed in the list');
        }
    });
    
    // Update user row and initialize countdown
    console.log('Loading user row...');
    renderLeaderboardUserRow();
    
    console.log('END LEADERBOARD INIT');
}

// Function to hide the leaderboard
function hideLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'none';
        
        // Remove scroll listener when leaderboard is hidden
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
            leaderboardList.removeEventListener('scroll', handleScroll);
        }
    }
}

// Function to get active season
async function getActiveSeason() {
    console.log('START ACTIVE SEASON RETRIEVAL');
    
    try {
        console.log('Sending request to /api/active-season...');
        // Use the correct working endpoint for active season
        const res = await fetch('/api/active-season');
        
        console.log(`Response status: ${res.status} ${res.statusText}`);
        console.log(`Headers: ${JSON.stringify(Object.fromEntries([...res.headers]))}`);
        
        if (!res.ok) {
            console.error(`Failed to fetch active season: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch active season: ${res.status}`);
        }
        
        const responseText = await res.text();
        console.log(`Response text: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
        let season;
        try {
            season = JSON.parse(responseText);
        } catch (e) {
            console.error(`Error parsing JSON:`, e);
            console.error(`Unparsable content: ${responseText}`);
            throw new Error('Invalid JSON response from season endpoint');
        }
        
        console.log(`Season data: ${JSON.stringify(season)}`);
        
        if (!season || !season.id) {
            console.error(`Season data invalid: missing ID`);
            throw new Error('Invalid season data: missing ID');
        }
        
        console.log(`Season active found: ${season.id} (Season ${season.seasonNumber})`);
        
        // Update podium prizes
        updatePrizeDisplay(season.prizeMoney, 1);
        updatePrizeDisplay(season.secondPrize, 2);
        updatePrizeDisplay(season.thirdPrize, 3);
        
        // Update season title
        const titleElement = document.getElementById('leaderboard-season-title');
        if (titleElement) {
            titleElement.textContent = `Season ${season.seasonNumber}`;
            console.log(`Season title updated: Season ${season.seasonNumber}`);
        } else {
            console.warn('Element #leaderboard-season-title not found');
        }
        
        // Initialize countdown with end date
        updateCountdown(season.endDate);
        
        console.log('END ACTIVE SEASON RETRIEVAL');
        return season;
    } catch (error) {
        console.error('ERROR during active season retrieval:', error);
        if (error.stack) console.error(`STACK TRACE: ${error.stack}`);
        throw error;
    }
}

// Function to load a specific page of leaderboard data
async function loadLeaderboardPageData(page) {
    console.log(`START PAGE ${page} LOADING`);
    
    if (!activeSeason) {
        console.error('No active season found');
        throw new Error('No active season found');
    }
    
    console.log(`Loading UNIQUELY page ${page} (limit 15) for season ${activeSeason.id}`);
    
    try {
        // Use existing API that supports pagination
        // But it's possible it ignores pagination parameters and returns everything
        const apiUrl = `/api/seasons/${activeSeason.id}/ranking?page=${page}&limit=15`;
        console.log(`API URL: ${apiUrl}`);
        
        // Register start time to measure performance
        const startTime = Date.now();
        
        // Use existing API with pagination
        console.log('Sending request to existing API...');
        const rankingRes = await fetch(apiUrl);
        
        // Calculate response time
        const responseTime = Date.now() - startTime;
        console.log(`Response time: ${responseTime}ms`);
        
        // Check response status
        console.log(`Response status: ${rankingRes.status} ${rankingRes.statusText}`);
        console.log(`Headers: ${JSON.stringify(Object.fromEntries([...rankingRes.headers]))}`);
        
        if (!rankingRes.ok) {
            console.error(`Request failed: ${rankingRes.status} ${rankingRes.statusText}`);
            
            // Try to retrieve error body for more details
            try {
                const errorText = await rankingRes.text();
                console.error(`Error body: ${errorText}`);
            } catch (e) {
                console.error('Failed to read error body');
            }
            
            throw new Error(`Failed to fetch leaderboard data: ${rankingRes.status}`);
        }
        
        // Get response body
        const responseText = await rankingRes.text();
        
        // Display first characters of the body (to avoid too long logs)
        console.log(`Response body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
        let rankingData;
        try {
            rankingData = JSON.parse(responseText);
        } catch (e) {
            console.error(`Error parsing JSON:`, e);
            console.error(`Unparsable content: ${responseText}`);
            throw new Error('Invalid JSON response from leaderboard endpoint');
        }
        
        // Direct use of paginated data from backend
        const paginatedData = rankingData.items || [];
        const totalCount = rankingData.pagination ? rankingData.pagination.totalCount : undefined;
        
        console.log(`Total count: ${totalCount}`);
        console.log(`Page size: ${paginatedData.length}`);
        
        // hasMoreData determined from backend pagination
        hasMoreData = rankingData.pagination ? rankingData.pagination.hasMore : false;
        console.log(`More data available: ${hasMoreData}`);
        
        // Update the leaderboard UI
        renderLeaderboardItems(paginatedData, page === 0);
        
        // Update podium if this is the first page
        if (page === 0 && paginatedData.length > 0) {
            // Use the first 3 users from the received page for the podium
            updatePodium(paginatedData.slice(0, 3));
        }
        
        console.log(`END OF PAGE LOADING ${page}`);
        return paginatedData;
    } catch (error) {
        console.error(`ERROR during page ${page} loading:`, error);
        if (error.stack) console.error(`STACK TRACE: ${error.stack}`);
        throw error;
    }
}

// Function to load next page of leaderboard data (used by infinite scroll)
async function loadNextLeaderboardPage() {
    if (isLoadingMore || !hasMoreData) return;
    
    try {
        isLoadingMore = true;
        
        // Show loading indicator at the bottom of the list
        showLoadingIndicator();
        
        await loadLeaderboardPageData(currentPage);
        
        // Increment page for next fetch
        currentPage++;
        
        // Hide loading indicator
        hideLoadingIndicator();
    } catch (error) {
        console.error('Error loading next leaderboard page:', error);
        hideLoadingIndicator();
    } finally {
        isLoadingMore = false;
    }
}

// Function to show loading indicator at the bottom of the list
function showLoadingIndicator() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Check if the indicator already exists
    if (document.getElementById('leaderboard-loading-indicator')) return;
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'leaderboard-loading-indicator';
    loadingIndicator.className = 'leaderboard-loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-dots">
            <span class="dot dot1"></span>
            <span class="dot dot2"></span>
            <span class="dot dot3"></span>
        </div>
    `;
    
    // Add the loading indicator to the bottom of the list
    leaderboardList.appendChild(loadingIndicator);
    
    // Add CSS for the loading dots animation if not already in the page
    if (!document.getElementById('loading-dots-style')) {
        const style = document.createElement('style');
        style.id = 'loading-dots-style';
        style.textContent = `
            .loading-dots {
                display: flex;
                justify-content: center;
                padding: 15px 0;
                width: 100%;
            }
            .dot {
                background-color: #00FF9D;
                border-radius: 50%;
                display: inline-block;
                height: 8px;
                margin: 0 4px;
                width: 8px;
                opacity: 0.6;
                animation: dot-pulse 1.4s infinite ease-in-out;
            }
            .dot1 { animation-delay: 0s; }
            .dot2 { animation-delay: 0.2s; }
            .dot3 { animation-delay: 0.4s; }
            @keyframes dot-pulse {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.6; }
                40% { transform: scale(1.2); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Function to render leaderboard items
function renderLeaderboardItems(items, clearList) {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Clear the list if this is the first page
    if (clearList) {
        leaderboardList.innerHTML = '';
    }
    
    // Exit if no items
    if (!Array.isArray(items) || items.length === 0) {
        if (clearList) {
            // Show empty state if this is the first load and no data
            leaderboardList.innerHTML = `
                <div class="leaderboard-empty-message">
                    <img src="ressources/empty-ranking.png" alt="Empty ranking">
                    <p>No players in this season yet.<br>Be the first to score!</p>
                </div>`;
        }
        return;
    }
    
    // Add each item to the list
    items.forEach((item, index) => {
        // Calculate the actual rank based on the current page
        // For page 0, ranks start at 1
        // For page 1, ranks start at 16
        // For page 2, ranks start at 31, etc.
        const rank = currentPage * 15 + index + 1;
        
        // Ensure avatar path is properly formatted
        let avatarSrc = item.avatarSrc || 'avatars/avatar_default.jpg';
        if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
            avatarSrc = '/avatars/' + avatarSrc;
        }
        
        // Create the row element
        const rowElement = document.createElement('div');
        rowElement.className = 'leaderboard-row';
        rowElement.innerHTML = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${item.username}"></div>
            <div class="leaderboard-username">${item.username}</div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${item.score}</div>
        `;
        
        leaderboardList.appendChild(rowElement);
    });
}

// Function to update podium with top 3 players
function updatePodium(rankingData) {
    // Get the top 3 players
    const topPlayers = rankingData.slice(0, 3);
    
    // Update each podium position
    for (let i = 0; i < 3; i++) {
        const position = i + 1;
        const player = topPlayers[i] || null;
        
        // Elements for this position
        const avatarElement = document.getElementById(`podium-${position}-avatar`);
        const usernameElement = document.getElementById(`podium-${position}-username`);
        
        if (player) {
            // Ensure avatar path is properly formatted
            let avatarSrc = player.avatarSrc || 'avatars/avatar_default.jpg';
            if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
                avatarSrc = '/avatars/' + avatarSrc;
            }
            
            // Update elements
            if (avatarElement) avatarElement.src = avatarSrc;
            if (usernameElement) usernameElement.textContent = player.username;
        } else {
            // No player for this position
            if (avatarElement) avatarElement.src = 'avatars/avatar_default.jpg';
            if (usernameElement) usernameElement.textContent = '-';
        }
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Remove existing scroll listener if any
    leaderboardList.removeEventListener('scroll', handleScroll);
    
    // Add scroll listener
    leaderboardList.addEventListener('scroll', handleScroll);
    
    // Add touch events for mobile devices
    leaderboardList.addEventListener('touchmove', handleMobileScroll);
    leaderboardList.addEventListener('touchend', handleMobileScroll);
    
    // Detect iOS specifically for better handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        // Add additional event listener specifically for iOS to improve first scroll detection
        leaderboardList.addEventListener('touchend', function(event) {
            // Force immediate check after touch end on iOS
            setTimeout(function() {
                handleMobileScroll(event);
            }, 100); // Short delay to ensure scroll position is updated
        });
    }
}

// Handle mobile-specific scroll events
function handleMobileScroll(event) {
    // Use a lower threshold for mobile to make first scroll more responsive
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Check if we're near the bottom of the scroll area - use a lower threshold for mobile
    const scrollPosition = leaderboardList.scrollTop;
    const visibleHeight = leaderboardList.clientHeight;
    const totalHeight = leaderboardList.scrollHeight;
    
    // Use 50% threshold for mobile instead of 65% to load earlier on first scroll - improved for iOS
    const scrollPercentage = (scrollPosition + visibleHeight) / totalHeight;
    
    if (scrollPercentage > 0.5 && !isLoadingMore && hasMoreData) {
        loadNextLeaderboardPage();
    }
}

// Handle scroll event for infinite loading
function handleScroll(event) {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Check if we're near the bottom of the scroll area
    const scrollPosition = leaderboardList.scrollTop;
    const visibleHeight = leaderboardList.clientHeight;
    const totalHeight = leaderboardList.scrollHeight;
    
    // Calculate how close we are to the bottom (as a percentage)
    const scrollPercentage = (scrollPosition + visibleHeight) / totalHeight;
    
    // For desktop, use 75% threshold
    if (scrollPercentage > 0.75 && !isLoadingMore && hasMoreData) {
        loadNextLeaderboardPage();
    }
}

// Function to get the current user ID
function getCurrentUserId() {
    // Try first the global variable
    let userId = window.userId || '';
    
    // If userId is not a string, try other methods
    if (typeof userId !== 'string') {
        userId = '';
    }
    
    // Try to get from localStorage
    if (!userId) {
        userId = localStorage.getItem('tidashUserId') || '';
    }
    
    return userId.trim();
}

// Function to update the end of season countdown
function updateCountdown(endDateStr) {
    // Countdown elements
    const daysElement = document.getElementById('leaderboard-countdown-days');
    const hoursElement = document.getElementById('leaderboard-countdown-hours');
    const minutesElement = document.getElementById('leaderboard-countdown-minutes');
    
    if (!daysElement || !hoursElement || !minutesElement) {
        console.error('Countdown elements not found in the DOM');
        return;
    }
    
    try {
        // Convert the end date to a Date object
        const endDate = new Date(endDateStr);
        
        // Check if the date is valid
        if (isNaN(endDate.getTime())) {
            console.error('Invalid end of season date:', endDateStr);
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            return;
        }
        
        console.log(`Countdown to end date: ${endDate.toLocaleString()}`);
        
        // Function to update the countdown timer
        const updateTimer = () => {
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();
            
            // If the date is passed, display 00:00:00
            if (diff <= 0) {
                daysElement.textContent = '00';
                hoursElement.textContent = '00';
                minutesElement.textContent = '00';
                return;
            }
            
            // Calculate days, hours, minutes
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            // Update elements with padding
            daysElement.textContent = days.toString().padStart(2, '0');
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            
            // Debug logs
            console.log(`Countdown: ${days}D ${hours}H ${minutes}M`);
        };
        
        // Update immediately
        updateTimer();
        
        // Update every minute
        const timerId = setInterval(updateTimer, 60000);
        
        // Clear interval when the leaderboard is closed
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            clearInterval(timerId);
        });
        
    } catch (error) {
        console.error('Error updating countdown:', error);
        daysElement.textContent = '00';
        hoursElement.textContent = '00';
        minutesElement.textContent = '00';
    }
}

// Main function to update the user row in the leaderboard
async function renderLeaderboardUserRow() {
    const userRowElement = document.getElementById('leaderboard-user-row');
    if (!userRowElement) return;
    
    try {
        // 1. Get the active season
        let season;
        try {
            // Try the main endpoint first
            const res = await fetch('/api/seasons/active');
            if (res.ok) {
                season = await res.json();
                // Store the season in the global variable for later use
                activeSeason = season;
            } else {
                // Fallback solution
                const fallbackRes = await fetch('/api/active-season');
                if (!fallbackRes.ok) {
                    throw new Error('Failed to retrieve active season');
                }
                season = await fallbackRes.json();
                // Store the season in the global variable for later use
                activeSeason = season;
            }
            
            console.log(`Active season found: ${season.id} (Season ${season.seasonNumber})`);
            console.log(`End date of season: ${season.endDate}`);
            
            // Update the season title
            const titleElement = document.getElementById('leaderboard-season-title');
            if (titleElement) {
                titleElement.textContent = `Season ${season.seasonNumber}`;
            }
            
            // Update the countdown with the end date
            updateCountdown(season.endDate);
            
            // Update the prize display
            updatePrizeDisplay(season.prizeMoney);
                
        } catch (error) {
            console.error('Error retrieving active season:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Unable to load season information.</div>';
            return;
        }
            
        // 2. Get the user ID
        const userId = getCurrentUserId();
        if (!userId) {
            userRowElement.innerHTML = '<div style="color:orange;">Unable to determine your user ID.</div>';
            return;
        }
        
        // 3. Use the most simple existing endpoint to retrieve user data
        try {
            console.log(`Retrieving data for user ${userId} in season ${season.id}...`);
            
            // Use the existing API to retrieve user data + their position
            const userDataRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            let username = 'You';
            let avatarImgSrc = '';
            
            if (userDataRes.ok) {
                const userData = await userDataRes.json();
                username = userData.gameUsername || 'You';
                
                // Use the avatar from the user data or the one already loaded
                if (window.avatarSrc) {
                    avatarImgSrc = window.avatarSrc;
                } else {
                    avatarImgSrc = userData.avatarSrc || 'avatars/avatar_default.jpg';
                    if (!avatarImgSrc.startsWith('http') && !avatarImgSrc.startsWith('/')) {
                        avatarImgSrc = 'avatars/' + avatarImgSrc;
                            }
                }
            } else {
                // Fallback for the avatar if user data is not available
                const profileAvatarImg = document.getElementById('avatarImg');
                if (profileAvatarImg && profileAvatarImg.src) {
                    avatarImgSrc = profileAvatarImg.src;
        } else {
                    avatarImgSrc = 'avatars/avatar_default.jpg';
                }
                }
                
            // Retrieve the user's season score with the existing endpoint
            const seasonScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
            let userSeasonScore = 0;
            
            if (seasonScoreRes.ok) {
                const scoreData = await seasonScoreRes.json();
                userSeasonScore = scoreData.score || 0;
                console.log(`Score of season retrieved: ${userSeasonScore}`);
    }

            // Retrieve the user's rank with the new API
            let userRank = '-';
            
            try {
                console.log(`Retrieving rank for ${userId} in season ${season.id}...`);
                
                // Determine the base URL with the correct path
                let baseUrl = window.location.origin;
                
                // Check if we are in the /test path
                const pathname = window.location.pathname;
                const basePathMatch = pathname.match(/^\/([^\/]+)/);
                const basePath = basePathMatch ? basePathMatch[1] : '';
                
                if (basePath) {
                    console.log(`Base path detected: /${basePath}`);
                    // Add the base path to the URL
                    baseUrl = `${baseUrl}/${basePath}`;
                }
                
                console.log(`Base URL determined: ${baseUrl}`);
                
                // Complete URL with the correct base path
                const apiUrl = `${baseUrl}/api/seasons/${season.id}/user-position?userId=${encodeURIComponent(userId)}`;
                console.log(`Complete API URL: ${apiUrl}`);
                
                console.log(`Sending request...`);
                const userPositionRes = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                console.log(`Response status: ${userPositionRes.status} ${userPositionRes.statusText}`);
                console.log(`Response headers:`, Object.fromEntries([...userPositionRes.headers.entries()]));
                
                // If the response is OK, try to retrieve the JSON
                if (userPositionRes.ok) {
                    const responseText = await userPositionRes.text(); // First retrieve the raw text
                    console.log(`Raw response: ${responseText}`);
                    
                    let positionData;
                    try {
                        positionData = JSON.parse(responseText);
                        console.log(`User rank retrieved:`, positionData);
                        
                        if (positionData && positionData.position) {
                            userRank = positionData.position;
                            console.log(`User rank: ${userRank}`);
                        }
                    } catch (jsonError) {
                        console.error(`Error parsing JSON for user rank:`, jsonError);
                        console.log(`Response that caused the error:`, responseText);
                    }
                } else {
                    console.error(`Failed to retrieve user rank: HTTP ${userPositionRes.status}`);
                }
                
            } catch (posError) {
                console.error(`Error retrieving user rank:`, posError);
            }
            
            // Display a dash for the rank if the score is 0
            let displayRank = userSeasonScore === 0 ? '-' : userRank;
            // Generate the HTML for the user row
            userRowElement.innerHTML = `
                <div class="leaderboard-rank">${displayRank}</div>
                <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
                <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userSeasonScore}</div>
            `;
            
        } catch (error) {
            console.error('Error retrieving user data:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Error loading your data.</div>';
        }
        
    } catch (error) {
        console.error('Global error in renderLeaderboardUserRow:', error);
        if (userRowElement) {
            userRowElement.innerHTML = '<div style="color:orange;">Error loading your data.</div>';
        }
    }
}

// Function to update prize display
function updatePrizeDisplay(prizeMoney, position = 1) {
    const prizeElement = document.getElementById(`podium-${position}-prize`);
    if (prizeElement) {
        const formattedPrize = Number.isInteger(prizeMoney) ? 
            `+${prizeMoney}` : 
            `+${parseFloat(prizeMoney).toFixed(2)}`;
        prizeElement.textContent = formattedPrize;
    }
}

// Export functions for global access
window.showLeaderboard = showLeaderboard;
window.hideLeaderboard = hideLeaderboard;

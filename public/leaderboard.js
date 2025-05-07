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
            console.log('🔍 Fetching active season info...');
            
            // Ajouter un timeout pour éviter que la requête ne reste bloquée
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
            
            try {
                // Try the newer endpoint first
                console.log('🌐 Trying primary endpoint: /api/seasons/active');
                const res = await fetch('/api/seasons/active', { 
                    signal: controller.signal,
                    headers: { 'Cache-Control': 'no-cache' } // Éviter le cache
                });
                
                console.log(`🔄 Primary endpoint response: ${res.status} - ${res.statusText}`);
                
                if (res.ok) {
                    // Effacer le timeout
                    clearTimeout(timeoutId);
                    
                    const data = await res.json();
                    console.log(`✅ Active season found: ${data.id} (Season ${data.seasonNumber})`);
                    return data;
                }
                
                // Fall back to the older endpoint if the new one fails
                console.log('⚠️ Primary endpoint failed, trying fallback: /api/active-season');
                const fallbackRes = await fetch('/api/active-season', { 
                    signal: controller.signal,
                    headers: { 'Cache-Control': 'no-cache' } // Éviter le cache
                });
                
                console.log(`🔄 Fallback endpoint response: ${fallbackRes.status} - ${fallbackRes.statusText}`);
                
                // Effacer le timeout
                clearTimeout(timeoutId);
                
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    console.log(`✅ Active season found from fallback: ${data.id} (Season ${data.seasonNumber})`);
                    return data;
                }
                
                // If we get here, both endpoints failed
                console.error('❌ Both endpoints failed to fetch active season');
                throw new Error('Failed to fetch active season - both endpoints failed');
            } catch (fetchError) {
                // Effacer le timeout
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    console.error('🕒 Fetch request timed out after 10 seconds');
                    throw new Error('Request for active season timed out. Please try again later.');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('❌ Error fetching active season:', error);
            throw error;
        }
    }

    // Fetch leaderboard for season with pagination
    async function fetchSeasonRanking(seasonId, page = 0) {
        try {
            // Fetch only the requested batch of data
            const ITEMS_PER_PAGE = 15;
            console.log(`🔍 Fetching ranking page ${page} for season ${seasonId} with limit ${ITEMS_PER_PAGE}`);
            
            // Vérification de l'ID de saison
            if (!seasonId || seasonId <= 0) {
                console.error(`❌ Invalid season ID: ${seasonId}`);
                throw new Error(`Invalid season ID: ${seasonId}`);
            }
            
            // Utiliser l'endpoint avec des paramètres de pagination clairs
            const url = `/api/seasons/${seasonId}/ranking?page=${page}&limit=${ITEMS_PER_PAGE}`;
            console.log(`🌐 Request URL: ${url}`);
            
            // Ajouter un cache buster pour éviter les problèmes de cache
            const cacheBuster = new Date().getTime();
            const finalUrl = `${url}&_=${cacheBuster}`;
            
            // Ajouter un timeout pour éviter que la requête ne reste bloquée
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
            
            try {
                const res = await fetch(finalUrl, { 
                    signal: controller.signal,
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });
                // Effacer le timeout
                clearTimeout(timeoutId);
                
                console.log(`🔄 Response status: ${res.status} - ${res.statusText}`);
                
                if (!res.ok) {
                    console.error(`❌ Fetch failed with status: ${res.status} - ${res.statusText}`);
                    if (res.status === 404) {
                        // Si la saison n'est pas trouvée (404), retourner un tableau vide plutôt que de lancer une erreur
                        console.log('⚠️ Season not found, returning empty array');
                        return [];
                    }
                    throw new Error(`Failed to fetch season ranking: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                if (!Array.isArray(data)) {
                    console.error('❌ API response is not an array:', data);
                    // Retourner un tableau vide en cas de réponse mal formée
                    return [];
                }
                
                console.log(`📦 Received ${data.length} items for page ${page}`);
                return data;
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    console.error('🕒 Fetch request timed out after 10 seconds');
                    throw new Error('Request timed out. Please try again later.');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('💥 Error in fetchSeasonRanking:', error);
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
    
    // Render leaderboard with progressive loading
    async function renderLeaderboard(ranking, currentUserId, isInitialLoad = true) {
        const list = document.getElementById('leaderboard-list');
        
        // Vérifier que ranking est un tableau
        if (!ranking || !Array.isArray(ranking)) {
            console.error('❌ Invalid ranking data provided:', ranking);
            ranking = [];
        }
        
        console.log(`🎬 Rendering leaderboard (initialLoad: ${isInitialLoad}, items: ${ranking.length})`);
        
        // If this is the initial load, clear the list and render the podium
        if (isInitialLoad) {
            console.log('🧹 Initial load - clearing list');
            
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
            
            // Si aucune donnée, afficher un message
            if (ranking.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'leaderboard-empty-message';
                emptyMessage.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: #888;">
                        <img src="ressources/trophy.png" style="width: 40px; opacity: 0.5; margin-bottom: 15px;">
                        <p>Aucun participant dans ce classement pour le moment.</p>
                        <p>Soyez le premier à jouer !</p>
                    </div>
                `;
                list.appendChild(emptyMessage);
                
                // Ne pas continuer le rendu du podium
                return;
            }
            
            // Podium
            console.log('🏆 Setting up podium with top 3 users');
            const podium = [ranking[0], ranking[1], ranking[2]];
            [1,2,3].forEach(i => {
                const user = podium[i-1];
                if (!user) return;
                
                const podiumElement = document.getElementById(`podium-${i}-username`);
                if (podiumElement) {
                    podiumElement.textContent = user.gameUsername || user.username || `User${i}`;
                }
                
                // Ensure we use avatarSrc when available
                const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
                const avatarElement = document.getElementById(`podium-${i}-avatar`);
                if (avatarElement) {
                    avatarElement.src = avatarSrc;
                    avatarElement.alt = user.gameUsername || user.username || `User${i}`;
                }
            });
            
            // Prize for 1st
            if (podium[0]) {
                // Get the season prize money
                const season = await fetchActiveSeason();
                if (season && season.prizeMoney) {
                    const prizeElement = document.getElementById('podium-1-prize');
                    if (prizeElement) {
                        prizeElement.textContent = `$${season.prizeMoney}`;
                    }
                }
            }
        }
        
        // Si aucune donnée et ce n'est pas le chargement initial, on ne fait rien
        if (ranking.length === 0 && !isInitialLoad) {
            console.log('📋 No items to render for additional page');
            hasMoreUsers = false;
            return;
        }
        
        // Calculate starting index based on initial load or append
        // Pour le chargement initial, on commence à l'index 0
        // Pour les chargements suivants, on calcule en fonction de la page actuelle
        const startIdx = isInitialLoad ? 0 : (currentPage * 15);
        console.log(`📊 Starting index for new items: ${startIdx}`);
        
        // Always render a maximum of 15 items at a time
        const maxItems = Math.min(ranking.length, 15);
        console.log(`📋 Rendering ${maxItems} items`);
        
        // Create new fragment to append all items at once
        const fragment = document.createDocumentFragment();
        
        // Append new rows to the fragment
        for (let i = 0; i < maxItems; i++) {
            const user = ranking[i];
            if (!user) {
                console.warn(`⚠️ Missing user data at index ${i}`);
                continue;
            }
            
            // Dans la première page, on affiche les rangs 1-15
            // Dans la deuxième page (page=1), on affiche les rangs 16-30, etc.
            const actualRank = startIdx + i + 1;
            console.log(`👤 Adding user ${user.username || 'Unknown'} at rank ${actualRank}`);
            
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.dataset.rank = actualRank; // Stocker le rang dans l'attribut data
            
            // Use avatarSrc when available, otherwise use default
            const avatarSrc = user.avatarSrc || 'avatars/avatar_default.jpg';
            
            row.innerHTML = `
                <div class="leaderboard-rank">${actualRank}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${user.gameUsername || user.username || 'Player'}"></div>
                <div class="leaderboard-username">${user.gameUsername || user.username || 'Player'}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${user.score || 0}</div>
            `;
            fragment.appendChild(row);
        }
        
        // Append all items at once
        list.appendChild(fragment);
        console.log(`✅ Appended ${maxItems} items to the list`);
        
        // Add loading indicator at the end if there might be more users
        if (hasMoreUsers && ranking.length >= 15) {
            console.log('🔄 Adding loading indicator for more users');
            addLoadingIndicator();
        } else {
            console.log('🛑 No more users available, not adding loading indicator');
            hasMoreUsers = false;
        }
        
        // Only render the sticky user row on initial load
        if (isInitialLoad) {
            console.log('👤 Rendering sticky user row');
            // --- Robust sticky user row rendering: always use server data ---
            renderStickyUserRow(ranking, currentUserId).catch(e => {
                console.error('❌ Error rendering sticky user row:', e);
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
        console.log(`⏬ Loading more users, current page: ${currentPage}`);
        
        try {
            // Utiliser la page suivante pour charger de nouvelles données
            const nextPage = currentPage + 1;
            console.log(`📊 Fetching page ${nextPage}`);
            
            // Vérifier le nombre actuel d'éléments pour détecter les doublons
            const currentRowCount = document.querySelectorAll('.leaderboard-row').length;
            console.log(`📏 Current row count before loading more: ${currentRowCount}`);
            
            const ranking = await fetchSeasonRanking(seasonId, nextPage);
            
            // Detailed log of what we received
            console.log(`📋 Received ${ranking.length} items for page ${nextPage}`);
            
            // Si on a reçu des données
            if (ranking.length > 0) {
                // Mettre à jour currentPage uniquement si on a reçu des données
                currentPage = nextPage;
                console.log(`📊 Page actuelle mise à jour: ${currentPage}`);
                
                // Afficher les nouveaux éléments
                console.log(`🧩 Rendering ${ranking.length} new items`);
                renderLeaderboard(ranking, getCurrentUserId(), false);
                
                // Vérifier si le nombre d'éléments a réellement augmenté
                const newRowCount = document.querySelectorAll('.leaderboard-row').length;
                console.log(`📏 New row count after loading more: ${newRowCount}`);
                
                if (newRowCount <= currentRowCount) {
                    console.warn(`⚠️ Row count did not increase (${currentRowCount} → ${newRowCount}), may have loaded duplicates`);
                    hasMoreUsers = false;
                }
                
                // Check if we have more users
                if (ranking.length < 15) {
                    console.log(`🛑 No more users to fetch (received < 15 items)`);
                    hasMoreUsers = false;
                }
            } else {
                console.log('❌ No items to render, all users may have been fetched');
                hasMoreUsers = false;
                
                // Remove loading indicator if no more users
                const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
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

        // First, try to find user in the current page of the ranking
        let userIndex = ranking.findIndex(u => String(u.gameId ?? u.id ?? u.userId) === String(currentUserId));
        
        if (userIndex !== -1) {
            // User is in current ranking page - use that data
            const user = ranking[userIndex];
            const rank = userIndex + 1;
            const bestScore = user.bestScore || user.score || 0;
            const username = user.gameUsername || user.username || 'You';
            let avatar = user.avatarSrc || 'avatars/avatar_default.jpg';
            
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
        } else {
            // User not in current ranking page - use the dedicated API endpoint
            try {
                const res = await fetch(`/api/seasons/${seasonId}/user-rank/${encodeURIComponent(currentUserId)}`);
                if (!res.ok) throw new Error('Failed to fetch user rank');
                const userData = await res.json();
                
                // Add cache buster to avatar
                let avatar = userData.avatarSrc || 'avatars/avatar_default.jpg';
                if (avatar && !avatar.includes('?')) {
                    avatar += '?t=' + new Date().getTime();
                }
                
                // Render sticky row
                const userRow = `
                    <div class="leaderboard-rank">${userData.rank || '-'}</div>
                    <div class="leaderboard-avatar"><img src="${avatar}" alt="${userData.username || 'You'}"></div>
                    <div class="leaderboard-username">${userData.username || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                    <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userData.score || 0}</div>
                `;
                document.getElementById('leaderboard-user-row').innerHTML = userRow;
            } catch (err) {
                console.error('Error fetching user rank:', err);
                // Fallback to basic user info
                try {
                    const res = await fetch(`/api/users/${encodeURIComponent(currentUserId)}`);
                    const userData = res.ok ? await res.json() : { gameUsername: 'You', bestScore: 0 };
                    
                    // Add cache buster to avatar
                    let avatar = userData.avatarSrc || 'avatars/avatar_default.jpg';
                    if (avatar && !avatar.includes('?')) {
                        avatar += '?t=' + new Date().getTime();
                    }
                    
                    // Render sticky row without rank
                    const userRow = `
                        <div class="leaderboard-rank">-</div>
                        <div class="leaderboard-avatar"><img src="${avatar}" alt="${userData.gameUsername || 'You'}"></div>
                        <div class="leaderboard-username">${userData.gameUsername || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                        <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userData.bestScore || 0}</div>
                    `;
                    document.getElementById('leaderboard-user-row').innerHTML = userRow;
                } catch (userErr) {
                    document.getElementById('leaderboard-user-row').innerHTML = '<div style="color:orange;">Could not load your ranking. ⚠️</div>';
                }
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

    // Main init - simplifier pour isoler le problème
    async function initLeaderboard() {
        const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
        try {
            console.log('🚀 Initializing leaderboard...');
            
            // Reset pagination variables - IMPORTANT
            currentPage = 0;
            isLoading = false;
            hasMoreUsers = true;
            seasonId = null;
            
            // Supprimer toutes les lignes existantes pour éviter les doublons
            const listElement = document.getElementById('leaderboard-list');
            if (listElement) {
                console.log('🧹 Clearing existing list');
                listElement.innerHTML = '';
            }
            
            // Show loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }

            console.log('🔍 Step 1: Fetching active season...');
            // Get active season FIRST
            const activeSeason = await fetchActiveSeason();
            if (!activeSeason) {
                throw new Error('No active season found');
            }
            console.log(`✅ Active season found: ${activeSeason.id} (Season ${activeSeason.seasonNumber})`);
            
            // Vérifier que l'ID de saison est valide
            if (!activeSeason.id || isNaN(parseInt(activeSeason.id)) || parseInt(activeSeason.id) <= 0) {
                console.error(`❌ Invalid season ID: ${activeSeason.id}`);
                throw new Error(`Invalid season ID: ${activeSeason.id}`);
            }
            
            // Set season ID
            seasonId = parseInt(activeSeason.id);
            
            // Update title if element exists
            const titleElement = document.getElementById('leaderboard-season-title');
            if (titleElement) {
                titleElement.textContent = `Season ${activeSeason.seasonNumber}`;
            }
            
            // Initialiser le compte à rebours avec la date de fin de saison
            if (activeSeason.endDate) {
                console.log(`⏰ Initializing countdown with end date: ${activeSeason.endDate}`);
                renderCountdown(activeSeason.endDate);
            }
            
            console.log(`🔍 Step 2: Fetching first page of ranking for season ${seasonId}...`);
            // Fetch first page
            const rankingData = await fetchSeasonRanking(seasonId, 0);
            
            // Si on reçoit un tableau vide, ce n'est pas forcément une erreur (peut-être pas de participants)
            if (!rankingData || rankingData.length === 0) {
                console.log('⚠️ No ranking data found for this season');
            } else {
                console.log(`✅ Step 2 complete: Received ${rankingData.length} items`);
            }
            
            console.log(`🔍 Step 3: Rendering leaderboard...`);
            // Render data (même avec un tableau vide pour afficher le tableau vide)
            const userIdForSticky = getCurrentUserId();
            renderLeaderboard(rankingData || [], userIdForSticky, true);
            console.log(`✅ Step 3 complete: Leaderboard rendered`);
            
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            console.log(`✅ Leaderboard initialization complete`);
        } catch (error) {
            console.error('❌ Error in initLeaderboard:', error);
            
            // Show detailed error to help debugging
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Add more details to the alert for debug
            const errorMessage = error.message || 'Unknown error';
            const errorDetails = error.stack ? `\n\nDetails: ${error.stack.split('\n')[0]}` : '';
            alert(`Failed to load leaderboard: ${errorMessage}${errorDetails}`);
        }
    }

    // Expose showLeaderboard globally for integration
    window.showLeaderboard = showLeaderboard;
    // Initialize leaderboard on page load (or call when opening)
    // initLeaderboard(); // Uncomment if you want auto-load
    window.initLeaderboard = initLeaderboard;

})();

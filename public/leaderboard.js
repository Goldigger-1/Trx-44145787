// Leaderboard Page Logic
// Réimplémentation minimale pour afficher seulement la rangée utilisateur

// Variables for infinite scrolling
let currentPage = 0;
let isLoadingMore = false;
let hasMoreData = true;
let activeSeason = null;

// Fonction pour afficher/masquer le leaderboard
function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        console.log('📌 Opening leaderboard view');
        leaderboardScreen.style.display = 'flex';
        
        // Reset pagination variables
        currentPage = 0;
        isLoadingMore = false;
        hasMoreData = true;
        activeSeason = null; // Reset season to force reload
        
        // Show loading overlay
        const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
        if (loadingOverlay) {
            console.log('⏳ Showing loading overlay');
            loadingOverlay.style.display = 'flex';
        }
        
        // Clear existing leaderboard data
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
            // Clear content
            leaderboardList.innerHTML = '';
            
            // Ensure proper height and scroll behavior
            leaderboardList.style.height = '400px';
            leaderboardList.style.maxHeight = '400px';
            leaderboardList.style.overflowY = 'auto';
        }
        
        // First get the active season
        console.log('🔍 Fetching active season info...');
        fetch('/api/active-season')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch active season');
                return response.json();
            })
            .then(season => {
                console.log(`✅ Active season found: ${season.id} (Season ${season.seasonNumber})`);
                activeSeason = season;
                
                // Update season info in UI
                updateSeasonInfo(season);
                
                // Load first batch of leaderboard data (just 15 records)
                return fetchLeaderboardPage(0);
            })
            .then(() => {
                console.log('✅ Initial leaderboard data loaded');
                
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                // Add scroll event listener
                setupInfiniteScroll();
            })
            .catch(error => {
                console.error('❌ Error loading leaderboard:', error);
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                if (leaderboardList) {
                    leaderboardList.innerHTML = '<div class="leaderboard-error">Failed to load leaderboard data</div>';
                }
            });
        
        // User row can load in parallel
        renderLeaderboardUserRow();
    }
}

// Fonction pour cacher le leaderboard
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

// Update season info in the UI
function updateSeasonInfo(season) {
    // Update title
    const titleElement = document.getElementById('leaderboard-season-title');
    if (titleElement) {
        titleElement.textContent = `Season ${season.seasonNumber}`;
    }
    
    // Update prize display
    updatePrizeDisplay(season.prizeMoney);
    
    // Update countdown
    updateCountdown(season.endDate);
}

// Function to fetch a specific page of leaderboard data
function fetchLeaderboardPage(page) {
    if (!activeSeason) {
        console.error('❌ No active season found for fetching leaderboard');
        return Promise.reject(new Error('No active season'));
    }
    
    if (isLoadingMore) {
        console.log('⏳ Already loading data, ignoring request');
        return Promise.resolve(); // Already loading
    }
    
    if (!hasMoreData && page > 0) {
        console.log('ℹ️ No more data to load');
        return Promise.resolve(); // No more data
    }
    
    console.log(`🔄 Fetching ONLY page ${page} (limit 15) for season ${activeSeason.id}`);
    isLoadingMore = true;
    
    return fetch(`/api/seasons/${activeSeason.id}/ranking?page=${page}&limit=15`)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch page ${page}: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log(`✅ Got ${data.length} items for page ${page}`);
            
            // Check if we've reached the end
            if (!Array.isArray(data) || data.length < 15) {
                console.log('🏁 Reached end of data (received less than 15 items)');
                hasMoreData = false;
            }
            
            // Render the items
            renderLeaderboardItems(data, page === 0);
            
            // Update podium if this is first page
            if (page === 0 && data.length > 0) {
                updatePodium(data);
            }
            
            // Update page counter for next time
            if (page === currentPage) {
                currentPage++;
            }
            
            return data;
        })
        .finally(() => {
            isLoadingMore = false;
        });
}

// Function to render leaderboard items
function renderLeaderboardItems(items, clearList) {
    console.log(`⚡ Rendering ${items?.length || 0} leaderboard items to the DOM, clearList: ${clearList}`);
    
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) {
        console.error('❌ Leaderboard list element not found');
        return;
    }
    
    // Important: Set max height to enforce scroll behavior
    leaderboardList.style.maxHeight = '400px';
    leaderboardList.style.overflowY = 'auto';
    
    // Clear the list if this is the first page
    if (clearList) {
        console.log('🗑️ Clearing existing leaderboard content');
        leaderboardList.innerHTML = '';
    }
    
    // Exit if no items
    if (!Array.isArray(items) || items.length === 0) {
        if (clearList) {
            // Show empty state if this is the first load and no data
            console.log('⚠️ No items to display, showing empty state');
            leaderboardList.innerHTML = `
                <div class="leaderboard-empty-message">
                    <img src="ressources/empty-ranking.png" alt="Empty ranking">
                    <p>No players in this season yet.<br>Be the first to score!</p>
                </div>`;
        }
        return;
    }
    
    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();
    
    // Add each item to the fragment
    items.forEach((item, index) => {
        // Calculate the actual rank
        const rank = currentPage > 0 ? (currentPage - 1) * 15 + index + 1 : index + 1;
        
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
        
        // Add to fragment instead of directly to DOM
        fragment.appendChild(rowElement);
    });
    
    // Add all rows to the DOM in one operation
    leaderboardList.appendChild(fragment);
    console.log(`✅ Added ${items.length} items to leaderboard`);
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

// Setup infinite scroll properly
function setupInfiniteScroll() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    console.log('📜 Setting up infinite scroll event listener');
    
    // Remove any existing listeners to prevent duplicates
    leaderboardList.removeEventListener('scroll', handleScroll);
    
    // Add the scroll listener
    leaderboardList.addEventListener('scroll', handleScroll);
    console.log('✅ Scroll listener attached');
}

// Handle scroll event
function handleScroll() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Calculate scroll position
    const scrollPosition = leaderboardList.scrollTop;
    const visibleHeight = leaderboardList.clientHeight;
    const totalHeight = leaderboardList.scrollHeight;
    
    // Calculate percentage scrolled
    const scrolledPercentage = (scrollPosition + visibleHeight) / totalHeight;
    
    // Only load more if we're not already loading and have more data
    if (scrolledPercentage > 0.70 && !isLoadingMore && hasMoreData) {
        console.log(`📊 Scroll at ${(scrolledPercentage * 100).toFixed(1)}% - loading next page ${currentPage}`);
        fetchLeaderboardPage(currentPage);
    }
}

// Fonction pour obtenir l'ID utilisateur actuel
function getCurrentUserId() {
    // Essayer d'abord la variable globale
    let userId = window.userId || '';
    
    // Si userId n'est pas une chaîne, essayer d'autres méthodes
    if (typeof userId !== 'string') {
        userId = '';
    }
    
    // Essayer de récupérer du localStorage
    if (!userId) {
        userId = localStorage.getItem('tidashUserId') || '';
    }
    
    return userId.trim();
}

// Fonction pour mettre à jour le compte à rebours de fin de saison
function updateCountdown(endDateStr) {
    // Éléments du compte à rebours
    const daysElement = document.getElementById('leaderboard-countdown-days');
    const hoursElement = document.getElementById('leaderboard-countdown-hours');
    const minutesElement = document.getElementById('leaderboard-countdown-minutes');
    
    if (!daysElement || !hoursElement || !minutesElement) {
        console.error('❌ Éléments de compte à rebours non trouvés dans le DOM');
        return;
    }
    
    try {
        // Convertir la date de fin en objet Date
        const endDate = new Date(endDateStr);
        
        // Vérifier si la date est valide
        if (isNaN(endDate.getTime())) {
            console.error('❌ Date de fin de saison invalide:', endDateStr);
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            return;
        }
        
        console.log(`⏱️ Calcul du compte à rebours pour la date de fin: ${endDate.toLocaleString()}`);
        
        // Fonction de mise à jour du compte à rebours
        const updateTimer = () => {
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();
            
            // Si la date est passée, afficher 00:00:00
            if (diff <= 0) {
                daysElement.textContent = '00';
                hoursElement.textContent = '00';
                minutesElement.textContent = '00';
                return;
            }
            
            // Calculer jours, heures, minutes
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            // Mettre à jour les éléments avec padding
            daysElement.textContent = days.toString().padStart(2, '0');
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            
            // Logs pour débogage
            console.log(`⏱️ Compte à rebours: ${days}D ${hours}H ${minutes}M`);
        };
        
        // Mettre à jour immédiatement
        updateTimer();
        
        // Configurer la mise à jour chaque minute
        const timerId = setInterval(updateTimer, 60000);
        
        // Nettoyer l'intervalle quand le composant est caché
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            clearInterval(timerId);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du compte à rebours:', error);
        daysElement.textContent = '00';
        hoursElement.textContent = '00';
        minutesElement.textContent = '00';
    }
}

// Fonction principale pour mettre à jour la rangée utilisateur dans le leaderboard
async function renderLeaderboardUserRow() {
    const userRowElement = document.getElementById('leaderboard-user-row');
    if (!userRowElement) return;
    
    try {
        // 1. Récupérer la saison active
        let season;
        try {
            // Essayer d'abord l'endpoint principal
            const res = await fetch('/api/seasons/active');
            if (res.ok) {
                season = await res.json();
                // Store the season in the global variable for later use
                activeSeason = season;
            } else {
                // Solution de secours
                const fallbackRes = await fetch('/api/active-season');
                if (!fallbackRes.ok) {
                    throw new Error('Impossible de récupérer la saison active');
                }
                season = await fallbackRes.json();
                // Store the season in the global variable for later use
                activeSeason = season;
            }
            
            console.log(`✅ Saison active trouvée: ${season.id} (Saison ${season.seasonNumber})`);
            console.log(`📅 Date de fin de saison: ${season.endDate}`);
            
            // Mettre à jour le titre de la saison
            const titleElement = document.getElementById('leaderboard-season-title');
            if (titleElement) {
                titleElement.textContent = `Season ${season.seasonNumber}`;
            }
            
            // Initialiser le compte à rebours avec la date de fin
            updateCountdown(season.endDate);
            
            // Afficher le prix pour le premier du podium
            updatePrizeDisplay(season.prizeMoney);
                
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la saison active:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Impossible de charger les informations de saison. ⚠️</div>';
            return;
        }
            
        // 2. Récupérer l'ID utilisateur
        const userId = getCurrentUserId();
        if (!userId) {
            userRowElement.innerHTML = '<div style="color:orange;">Impossible de déterminer votre identifiant. ⚠️</div>';
            return;
        }
        
        // 3. Utiliser l'endpoint le plus simple existant pour récupérer les données utilisateur
        try {
            console.log(`📊 Récupération des données pour l'utilisateur ${userId} dans la saison ${season.id}...`);
            
            // Utiliser l'API existante pour récupérer les données utilisateur + sa position
            const userDataRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            let username = 'You';
            let avatarImgSrc = '';
            
            if (userDataRes.ok) {
                const userData = await userDataRes.json();
                username = userData.gameUsername || 'You';
                
                // Utiliser l'avatar depuis les données utilisateur ou celui déjà chargé
                if (window.avatarSrc) {
                    avatarImgSrc = window.avatarSrc;
                } else {
                    avatarImgSrc = userData.avatarSrc || 'avatars/avatar_default.jpg';
                    if (!avatarImgSrc.startsWith('http') && !avatarImgSrc.startsWith('/')) {
                        avatarImgSrc = 'avatars/' + avatarImgSrc;
                            }
                }
            } else {
                // Fallback pour l'avatar si les données utilisateur ne sont pas disponibles
                const profileAvatarImg = document.getElementById('avatarImg');
                if (profileAvatarImg && profileAvatarImg.src) {
                    avatarImgSrc = profileAvatarImg.src;
        } else {
                    avatarImgSrc = 'avatars/avatar_default.jpg';
                }
                }
                
            // Récupérer le score de saison de l'utilisateur avec l'endpoint existant
            const seasonScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
            let userSeasonScore = 0;
            
            if (seasonScoreRes.ok) {
                const scoreData = await seasonScoreRes.json();
                userSeasonScore = scoreData.score || 0;
                console.log(`✅ Score de saison récupéré: ${userSeasonScore}`);
    }

            // SOLUTION OPTIMISÉE: Récupérer la position de l'utilisateur avec la nouvelle API
            let userRank = '-';
            
            try {
                console.log(`🔍 Tentative de récupération du rang pour ${userId} dans la saison ${season.id}...`);
                
                // Déterminer la base de l'URL avec le bon chemin
                let baseUrl = window.location.origin;
                
                // Vérifier si nous sommes dans le chemin /test
                const pathname = window.location.pathname;
                const basePathMatch = pathname.match(/^\/([^\/]+)/);
                const basePath = basePathMatch ? basePathMatch[1] : '';
                
                if (basePath) {
                    console.log(`🌐 Détection d'un chemin de base: /${basePath}`);
                    // Ajouter le chemin de base à l'URL
                    baseUrl = `${baseUrl}/${basePath}`;
                }
                
                console.log(`🌐 URL de base déterminée: ${baseUrl}`);
                
                // URL complète avec le chemin de base correct
                const apiUrl = `${baseUrl}/api/seasons/${season.id}/user-position?userId=${encodeURIComponent(userId)}`;
                console.log(`🔗 URL complète de l'API: ${apiUrl}`);
                
                console.log(`⏳ Envoi de la requête...`);
                const userPositionRes = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                console.log(`📊 Statut de la réponse: ${userPositionRes.status} ${userPositionRes.statusText}`);
                console.log(`📋 En-têtes de la réponse:`, Object.fromEntries([...userPositionRes.headers.entries()]));
                
                // Si la réponse est OK, essayer de récupérer le JSON
                if (userPositionRes.ok) {
                    const responseText = await userPositionRes.text(); // D'abord récupérer le texte brut
                    console.log(`📄 Réponse brute: ${responseText}`);
                    
                    let positionData;
                    try {
                        positionData = JSON.parse(responseText);
                        console.log(`✅ Rang utilisateur récupéré:`, positionData);
                        
                        if (positionData && positionData.position) {
                            userRank = positionData.position;
                            console.log(`🏆 Position finale de l'utilisateur: ${userRank}`);
                        }
                    } catch (jsonError) {
                        console.error(`❌ Erreur lors du parsing JSON pour le rang utilisateur:`, jsonError);
                        console.log(`📄 Réponse qui a causé l'erreur:`, responseText);
                    }
                } else {
                    console.error(`❌ Échec de récupération du rang: HTTP ${userPositionRes.status}`);
                }
                
            } catch (posError) {
                console.error(`❌ Erreur lors de la récupération du rang utilisateur:`, posError);
            }
            
            // Génération du HTML de la ligne utilisateur
            userRowElement.innerHTML = `
                <div class="leaderboard-rank">${userRank}</div>
                <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
                <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userSeasonScore}</div>
            `;
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Erreur lors du chargement de vos données. ⚠️</div>';
        }
        
    } catch (error) {
        console.error('❌ Erreur globale dans renderLeaderboardUserRow:', error);
        if (userRowElement) {
            userRowElement.innerHTML = '<div style="color:orange;">Une erreur est survenue. ⚠️</div>';
        }
    }
}

// Function to update prize display
function updatePrizeDisplay(prizeMoney) {
    const prizeElement = document.getElementById('podium-1-prize');
    if (prizeElement) {
        // Format prize money nicely with 2 decimal places if it's not a whole number
        const formattedPrize = Number.isInteger(prizeMoney) ? 
            `$${prizeMoney}` : 
            `$${parseFloat(prizeMoney).toFixed(2)}`;
        
        prizeElement.textContent = formattedPrize;
    }
}

// Export functions for global access
window.showLeaderboard = showLeaderboard;
window.hideLeaderboard = hideLeaderboard;

// Leaderboard Page Logic
// Réimplémentation minimale pour afficher seulement la rangée utilisateur

// Variables for infinite scrolling
let currentPage = 0;
let isLoadingMore = false;
let hasMoreData = true;
let activeSeason = null;

// Fonction pour afficher/masquer le leaderboard
function showLeaderboard() {
    console.log('🔄🔄🔄 DÉBUT AFFICHAGE LEADERBOARD 🔄🔄🔄');
    
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (!leaderboardScreen) {
        console.error('❌ Élément #leaderboard-screen non trouvé dans le DOM');
        return;
    }
    
    leaderboardScreen.style.display = 'flex';
    console.log('✅ Leaderboard affiché (display: flex)');
    
    // Reset pagination variables
    currentPage = 0;
    isLoadingMore = false;
    hasMoreData = true;
    activeSeason = null; // Reset season to force reload
    console.log('✅ Variables de pagination réinitialisées');
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        console.log('✅ Overlay de chargement affiché');
    } else {
        console.warn('⚠️ Élément #leaderboard-loading-overlay non trouvé');
    }
    
    // Make sure the leaderboard list has proper styling for scrolling
    const leaderboardList = document.getElementById('leaderboard-list');
    if (leaderboardList) {
        // Ensure the list is scrollable
        leaderboardList.style.overflowY = 'auto';
        leaderboardList.style.maxHeight = '100%';
        leaderboardList.style.height = '100%';
        leaderboardList.innerHTML = ''; // Clear old content
        console.log('✅ Styles de scroll appliqués à #leaderboard-list');
    } else {
        console.error('❌ Élément #leaderboard-list non trouvé dans le DOM');
    }
    
    console.log('⏳ Initialisation du chargement des données...');
    
    // Get active season and then load only the first page of data
    getActiveSeason().then(season => {
        console.log(`✅ Saison active récupérée: ID=${season.id}, Numéro=${season.seasonNumber}`);
        
        // Set active season
        activeSeason = season;
        
        // Load only first page (15 users)
        console.log('⏳ Chargement de la première page de données (15 utilisateurs max)...');
        return loadLeaderboardPageData(0);
    }).then(data => {
        console.log(`✅ Première page chargée avec succès: ${data ? data.length : 0} utilisateurs`);
        
        // Hide loading overlay after initial load
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('✅ Overlay de chargement masqué');
        }
        
        // Set up scroll listener for infinite scrolling
        setupInfiniteScroll();
    }).catch(error => {
        console.error('❌❌❌ ERREUR pendant initialisation du leaderboard:', error);
        if (error.stack) console.error(`🔍 STACK TRACE: ${error.stack}`);
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('✅ Overlay de chargement masqué (après erreur)');
        }
        
        // Afficher un message d'erreur dans la liste
        if (leaderboardList) {
            leaderboardList.innerHTML = `
                <div style="color:red; padding:20px; text-align:center;">
                    Une erreur est survenue lors du chargement du classement.<br>
                    Détails: ${error.message || 'Erreur inconnue'}
                </div>`;
            console.log('✅ Message d\'erreur affiché dans la liste');
        }
    });
    
    // Mettre à jour la rangée utilisateur et initialiser le compte à rebours
    console.log('⏳ Chargement de la ligne utilisateur...');
    renderLeaderboardUserRow();
    
    console.log('🔄🔄🔄 FIN INITIALISATION LEADERBOARD 🔄🔄🔄');
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

// Function to get active season
async function getActiveSeason() {
    console.log('🔍🔍🔍 DÉBUT RÉCUPÉRATION SAISON ACTIVE 🔍🔍🔍');
    
    try {
        console.log('⏳ Envoi requête à /api/active-season...');
        // Use the correct working endpoint for active season
        const res = await fetch('/api/active-season');
        
        console.log(`🔍 Statut réponse: ${res.status} ${res.statusText}`);
        console.log(`🔍 Headers: ${JSON.stringify(Object.fromEntries([...res.headers]))}`);
        
        if (!res.ok) {
            console.error(`❌ Échec requête saison active: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch active season: ${res.status}`);
        }
        
        const responseText = await res.text();
        console.log(`🔍 Réponse brute: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
        let season;
        try {
            season = JSON.parse(responseText);
        } catch (e) {
            console.error(`❌ Erreur parsing JSON:`, e);
            console.error(`🔍 Contenu non parsable: ${responseText}`);
            throw new Error('Invalid JSON response from season endpoint');
        }
        
        console.log(`✅ Données saison: ${JSON.stringify(season)}`);
        
        if (!season || !season.id) {
            console.error(`❌ Données saison invalides: ID manquant`);
            throw new Error('Invalid season data: missing ID');
        }
        
        console.log(`✅ Saison active trouvée: ${season.id} (Saison ${season.seasonNumber})`);
        
        // Update podium prize
        updatePrizeDisplay(season.prizeMoney);
        
        // Update season title
        const titleElement = document.getElementById('leaderboard-season-title');
        if (titleElement) {
            titleElement.textContent = `Season ${season.seasonNumber}`;
            console.log(`✅ Titre de saison mis à jour: Season ${season.seasonNumber}`);
        } else {
            console.warn('⚠️ Élément #leaderboard-season-title non trouvé');
        }
        
        // Initialize countdown with end date
        updateCountdown(season.endDate);
        
        console.log('🔍🔍🔍 FIN RÉCUPÉRATION SAISON ACTIVE 🔍🔍🔍');
        return season;
    } catch (error) {
        console.error('❌❌❌ ERREUR lors de la récupération de la saison active:', error);
        if (error.stack) console.error(`🔍 STACK TRACE: ${error.stack}`);
        throw error;
    }
}

// Function to load a specific page of leaderboard data
async function loadLeaderboardPageData(page) {
    console.log(`🔎🔎🔎 DÉBUT CHARGEMENT PAGE ${page} 🔎🔎🔎`);
    
    if (!activeSeason) {
        console.error('❌ Aucune saison active trouvée');
        throw new Error('No active season found');
    }
    
    console.log(`🔍 Chargement UNIQUEMENT de la page ${page} (limite 15) pour la saison ${activeSeason.id}`);
    
    try {
        // Utiliser l'API de pagination qui fonctionne
        const apiUrl = `/api/leaderboard/paginated/${activeSeason.id}?page=${page}&limit=15`;
        console.log(`🔍 URL API PAGINATION: ${apiUrl}`);
        
        // Enregistrer le temps de début pour mesurer la performance
        const startTime = Date.now();
        
        // Utiliser l'API paginée
        console.log('⏳ Envoi de la requête à l\'API de pagination...');
        const rankingRes = await fetch(apiUrl);
        
        // Calculer le temps de réponse
        const responseTime = Date.now() - startTime;
        console.log(`⏱️ Temps de réponse: ${responseTime}ms`);
        
        // Vérifier le statut de la réponse
        console.log(`🔍 Statut de la réponse: ${rankingRes.status} ${rankingRes.statusText}`);
        
        if (!rankingRes.ok) {
            console.error(`❌ Échec de la requête: ${rankingRes.status} ${rankingRes.statusText}`);
            throw new Error(`Failed to fetch leaderboard data: ${rankingRes.status}`);
        }
        
        // Récupérer le corps de la réponse
        const responseText = await rankingRes.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.error(`❌ Erreur parsing JSON:`, e);
            throw new Error('Invalid JSON response from leaderboard endpoint');
        }
        
        // Vérifier la structure de la réponse
        if (!responseData || !responseData.items || !Array.isArray(responseData.items)) {
            console.error('❌ Format de réponse invalide de l\'API paginée:', JSON.stringify(responseData));
            throw new Error('Invalid response format from server');
        }
        
        console.log(`📊 Reçu ${responseData.items.length} éléments pour la page ${page}`);
        
        // Utiliser les métadonnées de pagination pour savoir s'il y a plus de données
        hasMoreData = responseData.pagination && responseData.pagination.hasMore;
        console.log(`📊 A plus de données: ${hasMoreData}`);
        
        if (responseData.pagination && responseData.pagination.totalCount) {
            console.log(`📊 Nombre total d'utilisateurs: ${responseData.pagination.totalCount}`);
        }
        
        // Utiliser les items de la réponse
        const rankingData = responseData.items;
        
        // Update the leaderboard UI
        renderLeaderboardItems(rankingData, page === 0);
        
        // Update podium if this is the first page
        if (page === 0 && rankingData.length > 0) {
            updatePodium(rankingData);
        }
        
        console.log(`🔎🔎🔎 FIN CHARGEMENT PAGE ${page} 🔎🔎🔎`);
        return rankingData;
    } catch (error) {
        console.error(`❌❌❌ ERREUR lors du chargement de la page ${page}:`, error);
        throw error;
    }
}

// Function to load next page of leaderboard data (used by infinite scroll)
async function loadNextLeaderboardPage() {
    if (isLoadingMore || !hasMoreData) return;
    
    try {
        isLoadingMore = true;
        console.log(`📊📊📊 CHARGEMENT PAGE SUIVANTE ${currentPage} (infinite scroll) 📊📊📊`);
        
        // Ajouter un indicateur visuel de chargement à la fin de la liste
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.className = 'leaderboard-row loading-indicator';
            loadingIndicator.innerHTML = '<div style="width:100%; text-align:center; padding:10px;">Chargement...</div>';
            leaderboardList.appendChild(loadingIndicator);
        }
        
        // Charger la page suivante
        await loadLeaderboardPageData(currentPage);
        
        // Supprimer l'indicateur de chargement
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        
        // Increment page for next fetch
        currentPage++;
    } catch (error) {
        console.error('❌ Error loading leaderboard data:', error);
        
        // Supprimer l'indicateur de chargement en cas d'erreur
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    } finally {
        isLoadingMore = false;
    }
}

// Function to render leaderboard items
function renderLeaderboardItems(items, clearList) {
    console.log(`🖌️🖌️🖌️ DÉBUT RENDU LISTE (${items ? items.length : 0} éléments, clearList=${clearList}) 🖌️🖌️🖌️`);
    
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) {
        console.error('❌ Élément #leaderboard-list non trouvé dans le DOM');
        return;
    }
    
    // Mesurer taille initiale de la liste
    const initialHeight = leaderboardList.scrollHeight;
    console.log(`📏 Hauteur initiale de la liste: ${initialHeight}px`);
    
    // Clear the list if this is the first page
    if (clearList) {
        console.log('🧹 Effacement de la liste existante');
        leaderboardList.innerHTML = '';
    }
    
    // Exit if no items
    if (!Array.isArray(items) || items.length === 0) {
        console.log('⚠️ Aucun élément à afficher');
        
        if (clearList) {
            console.log('🖌️ Affichage du message "liste vide"');
            // Show empty state if this is the first load and no data
            leaderboardList.innerHTML = `
                <div class="leaderboard-empty-message">
                    <img src="ressources/empty-ranking.png" alt="Empty ranking">
                    <p>No players in this season yet.<br>Be the first to score!</p>
                </div>`;
        }
        return;
    }
    
    console.log(`⏳ Ajout de ${items.length} éléments à la liste`);
    
    // Add each item to the list
    items.forEach((item, index) => {
        // Calculate the actual rank (page * limit + index + 1)
        // For page 0, ranks are 1-15, for page 1, ranks are 16-30, etc.
        const rank = currentPage > 0 ? (currentPage - 1) * 15 + index + 1 : index + 1;
        
        // Include all players in the list, including top 3
        
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
    
    // Mesurer la nouvelle taille après ajout
    const newHeight = leaderboardList.scrollHeight;
    console.log(`📏 Nouvelle hauteur après ajout: ${newHeight}px (différence: ${newHeight - initialHeight}px)`);
    
    console.log(`🖌️🖌️🖌️ FIN RENDU LISTE 🖌️🖌️🖌️`);
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
    
    console.log('📜 Setting up infinite scroll event listener');
    
    // Remove existing scroll listener if any
    leaderboardList.removeEventListener('scroll', handleScroll);
    
    // Add scroll listener
    leaderboardList.addEventListener('scroll', handleScroll);
    
    // Log to confirm the setup
    console.log('✅ Infinite scroll event listener attached to leaderboard-list');
}

// Handle scroll event for infinite loading
function handleScroll(event) {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    // Check if we're near the bottom of the scroll area
    const scrollPosition = leaderboardList.scrollTop;
    const visibleHeight = leaderboardList.clientHeight;
    const totalHeight = leaderboardList.scrollHeight;
    
    // Log scroll information for debugging, but only occasionally to avoid flooding the console
    if (Math.random() < 0.1) { // Log only ~10% of scroll events
        console.log(`📊 INFO SCROLL - position: ${scrollPosition}, visible: ${visibleHeight}, total: ${totalHeight}`);
        
        // Calculate how close we are to the bottom (as a percentage)
        const scrollPercentage = (scrollPosition + visibleHeight) / totalHeight;
        console.log(`📊 Pourcentage de défilement: ${(scrollPercentage * 100).toFixed(2)}%`);
    }
    
    // Calculate how close we are to the bottom (as a percentage)
    const scrollPercentage = (scrollPosition + visibleHeight) / totalHeight;
    
    // Load more data when user scrolls to 75% of the list
    if (scrollPercentage > 0.75 && !isLoadingMore && hasMoreData) {
        console.log(`📜📜📜 DÉCLENCHEMENT CHARGEMENT PAGE ${currentPage} (scroll=${scrollPercentage.toFixed(2)})`);
        loadNextLeaderboardPage();
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

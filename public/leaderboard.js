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
        // Utiliser l'API existante qui supporte la pagination
        // Mais il est possible qu'elle ignore les paramètres de pagination et renvoie tout
        const apiUrl = `/api/seasons/${activeSeason.id}/ranking?page=${page}&limit=15`;
        console.log(`🔍 URL API EXISTANTE: ${apiUrl}`);
        
        // Enregistrer le temps de début pour mesurer la performance
        const startTime = Date.now();
        
        // Utiliser l'API existante avec pagination
        console.log('⏳ Envoi de la requête à l\'API existante...');
        const rankingRes = await fetch(apiUrl);
        
        // Calculer le temps de réponse
        const responseTime = Date.now() - startTime;
        console.log(`⏱️ Temps de réponse: ${responseTime}ms`);
        
        // Vérifier le statut de la réponse
        console.log(`🔍 Statut de la réponse: ${rankingRes.status} ${rankingRes.statusText}`);
        console.log(`🔍 Headers: ${JSON.stringify(Object.fromEntries([...rankingRes.headers]))}`);
        
        if (!rankingRes.ok) {
            console.error(`❌ Échec de la requête: ${rankingRes.status} ${rankingRes.statusText}`);
            
            // Tenter de récupérer le corps d'erreur pour plus de détails
            try {
                const errorText = await rankingRes.text();
                console.error(`🔍 Corps de l'erreur: ${errorText}`);
            } catch (e) {
                console.error('❌ Impossible de lire le corps de l\'erreur');
            }
            
            throw new Error(`Failed to fetch leaderboard data: ${rankingRes.status}`);
        }
        
        // Récupérer le corps de la réponse
        const responseText = await rankingRes.text();
        
        // Afficher les premiers caractères du corps (pour éviter des logs trop longs)
        console.log(`🔍 Début de la réponse: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
        let rankingData;
        try {
            rankingData = JSON.parse(responseText);
        } catch (e) {
            console.error(`❌ Erreur parsing JSON:`, e);
            console.error(`🔍 Contenu non parsable: ${responseText}`);
            throw new Error('Invalid JSON response from leaderboard endpoint');
        }
        
        // SIMULATION DE PAGINATION CÔTÉ CLIENT
        // Même si l'API renvoie tout, on ne prend que 15 éléments à la fois
        console.log(`📊 Nombre total d'éléments reçus: ${rankingData.length}`);
        
        if (rankingData.length > 500) {
            console.warn(`⚠️⚠️⚠️ ALERTE: L'API a renvoyé ${rankingData.length} éléments - Probable qu'elle ignore la pagination`);
        }
        
        // PAGINATION MANUELLE: prendre une tranche de 15 éléments correspondant à la page demandée
        const startIndex = page * 15;
        const paginatedData = Array.isArray(rankingData) 
            ? rankingData.slice(startIndex, startIndex + 15) 
            : [];
        
        console.log(`📊 Simulation pagination: page ${page}, indices ${startIndex} à ${startIndex + 15}`);
        console.log(`📊 Éléments conservés après pagination manuelle: ${paginatedData.length}`);
        
        // Déterminer s'il y a plus de données basé sur la pagination manuelle
        hasMoreData = startIndex + 15 < rankingData.length;
        console.log(`📊 A plus de données: ${hasMoreData} (${startIndex + 15} < ${rankingData.length})`);
        
        // Update the leaderboard UI
        renderLeaderboardItems(paginatedData, page === 0);
        
        // Update podium if this is the first page
        if (page === 0 && rankingData.length > 0) {
            // Pour le podium, utiliser les 3 premiers de la liste complète
            updatePodium(rankingData.slice(0, 3));
        }
        
        console.log(`🔎🔎🔎 FIN CHARGEMENT PAGE ${page} 🔎🔎🔎`);
        return paginatedData;
    } catch (error) {
        console.error(`❌❌❌ ERREUR lors du chargement de la page ${page}:`, error);
        if (error.stack) console.error(`🔍 STACK TRACE: ${error.stack}`);
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
        console.error('❌ Error loading next leaderboard page:', error);
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
    
    // Use a lower threshold on mobile devices to trigger loading earlier
    // This helps with the first load after the initial 15 items
    const isMobile = window.innerWidth <= 768;
    const threshold = isMobile ? 0.65 : 0.75;
    
    // Load more data when user scrolls to threshold % of the list
    if (scrollPercentage > threshold && !isLoadingMore && hasMoreData) {
        // Use a small timeout to prevent rapid triggering on fast scrolls
        // This is especially important on mobile where scroll events can fire rapidly
        setTimeout(() => {
            // Check again if we're still loading or if someone else triggered loading
            // during the timeout
            if (!isLoadingMore && hasMoreData) {
                loadNextLeaderboardPage();
            }
        }, 50);
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
    
    // Force an initial check in case the content doesn't fill the screen
    // This handles the case where all 15 items don't fill the viewport,
    // so no scroll event would be triggered
    setTimeout(() => {
        handleScroll();
    }, 500);
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

// Leaderboard Page Logic
// Réimplémentation minimale pour afficher seulement la rangée utilisateur

// Variables globales pour l'infinite scroll
let currentPage = 0;
let isLoading = false;
let hasMoreData = true;
let currentSeasonId = null;

// Fonction pour afficher/masquer le leaderboard
function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'flex';
        
        // Réinitialiser les variables d'infinite scroll
        currentPage = 0;
        isLoading = false;
        hasMoreData = true;
        
        // Vider la liste de classement existante
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
        }
        
        // Mettre à jour la rangée utilisateur et initialiser le compte à rebours
        renderLeaderboardUserRow();
        
        // Charger la première page du classement
        loadLeaderboardPage();
        
        // Configurer l'infinite scroll pour le conteneur de la liste
        setupInfiniteScroll();
    }
}

// Fonction pour cacher le leaderboard
function hideLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'none';
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

// Fonction pour configurer l'infinite scroll
function setupInfiniteScroll() {
    const container = document.querySelector('.leaderboard-list-container');
    if (!container) return;
    
    // Nettoyer les écouteurs existants pour éviter les doublons
    container.removeEventListener('scroll', handleScroll);
    container.addEventListener('scroll', handleScroll);
    
    console.log('🔄 Configuration de l\'infinite scroll activée');
}

// Gestionnaire d'événement de défilement
function handleScroll(event) {
    const container = event.target;
    
    // Calculer la distance jusqu'à la fin du conteneur
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollThreshold = container.scrollHeight - 100; // Charger quand on est à 100px de la fin
    
    // Si on approche de la fin et qu'on n'est pas déjà en train de charger et qu'il y a plus de données
    if (scrollPosition > scrollThreshold && !isLoading && hasMoreData) {
        console.log('🔄 Déclenchement du chargement de plus de données');
        loadLeaderboardPage();
    }
}

// Fonction pour charger une page de classement
async function loadLeaderboardPage() {
    if (isLoading || !hasMoreData) return;
    
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
    try {
        isLoading = true;
        
        // Indicateur de chargement
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'leaderboard-loading';
        loadingIndicator.textContent = 'Chargement...';
        leaderboardList.appendChild(loadingIndicator);
        
        // Si c'est la première page, charger aussi le podium
        if (currentPage === 0) {
            try {
                // Récupérer la saison active
                const res = await fetch('/api/seasons/active');
                if (!res.ok) {
                    // Solution de secours
                    const fallbackRes = await fetch('/api/active-season');
                    if (!fallbackRes.ok) {
                        throw new Error('Impossible de récupérer la saison active');
                    }
                    season = await fallbackRes.json();
                } else {
                    season = await res.json();
                }
                
                currentSeasonId = season.id;
                console.log(`✅ Saison active trouvée: ${season.id} (Saison ${season.seasonNumber})`);
                
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
                leaderboardList.innerHTML = '<div style="color:orange;">Impossible de charger les informations de saison. ⚠️</div>';
                isLoading = false;
                return;
            }
        }
        
        // Récupérer la page actuelle du classement
        const apiUrl = `/api/seasons/${currentSeasonId}/ranking?page=${currentPage}&limit=15`;
        console.log(`🔍 Chargement de la page ${currentPage} du classement: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Analyser les données
        const seasonScores = await response.json();
        console.log(`✅ ${seasonScores.length} entrées récupérées pour la page ${currentPage}`);
        
        // Supprimer l'indicateur de chargement
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        // Si c'est la première page, mettre à jour le podium
        if (currentPage === 0 && seasonScores.length > 0) {
            updatePodium(seasonScores);
        }
        
        // Calculer le rang de départ pour cette page
        const startRank = currentPage * 15 + 1;
        
        // Générer les entrées HTML pour chaque score (sauf le podium pour la première page)
        let startIndex = currentPage === 0 ? 3 : 0; // Ignorer les 3 premiers utilisateurs à la page 0
        
        if (seasonScores.length > startIndex) {
            for (let i = startIndex; i < seasonScores.length; i++) {
                const user = seasonScores[i];
                const rank = startRank + i;
                
                // Créer l'élément de rangée
                const rankElement = document.createElement('div');
                rankElement.className = 'leaderboard-rank-item';
                rankElement.innerHTML = `
                    <div class="leaderboard-rank">${rank}</div>
                    <div class="leaderboard-avatar"><img src="${user.avatarSrc}" alt="${user.username}"></div>
                    <div class="leaderboard-username">${user.username}</div>
                    <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${user.score}</div>
                `;
                
                leaderboardList.appendChild(rankElement);
            }
            
            // Incrémenter la page pour le prochain chargement
            currentPage++;
        }
        
        // Déterminer s'il y a plus de données
        hasMoreData = seasonScores.length >= 15;
        
        if (!hasMoreData) {
            console.log('🏁 Plus de données à charger');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données de classement:', error);
        
        // Créer un message d'erreur
        const errorElement = document.createElement('div');
        errorElement.style.color = 'orange';
        errorElement.textContent = 'Impossible de charger le classement. ⚠️';
        leaderboardList.appendChild(errorElement);
        
    } finally {
        isLoading = false;
    }
}

// Fonction pour mettre à jour le podium avec les trois premiers utilisateurs
function updatePodium(topUsers) {
    try {
        // Vérifier s'il y a suffisamment d'utilisateurs
        if (!topUsers || topUsers.length === 0) {
            console.log('⚠️ Pas de données pour le podium');
            return;
        }
        
        // Mettre à jour le premier utilisateur
        if (topUsers.length >= 1) {
            const user1 = topUsers[0];
            document.getElementById('podium-1-avatar').src = user1.avatarSrc;
            document.getElementById('podium-1-username').textContent = user1.username;
        }
        
        // Mettre à jour le deuxième utilisateur
        if (topUsers.length >= 2) {
            const user2 = topUsers[1];
            document.getElementById('podium-2-avatar').src = user2.avatarSrc;
            document.getElementById('podium-2-username').textContent = user2.username;
        }
        
        // Mettre à jour le troisième utilisateur
        if (topUsers.length >= 3) {
            const user3 = topUsers[2];
            document.getElementById('podium-3-avatar').src = user3.avatarSrc;
            document.getElementById('podium-3-username').textContent = user3.username;
        }
        
        console.log('✅ Podium mis à jour avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du podium:', error);
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
            } else {
                // Solution de secours
                const fallbackRes = await fetch('/api/active-season');
                if (!fallbackRes.ok) {
                    throw new Error('Impossible de récupérer la saison active');
                }
                season = await fallbackRes.json();
            }
            
            console.log(`✅ Saison active trouvée: ${season.id} (Saison ${season.seasonNumber})`);
            console.log(`📅 Date de fin de saison: ${season.endDate}`);
            
            // Stocker l'ID de saison pour l'infinite scroll
            currentSeasonId = season.id;
            
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
                        console.log(`🔄 Données JSON parsées:`, positionData);
                    } catch (parseError) {
                        console.error(`❌ Erreur de parsing JSON:`, parseError);
                        console.log(`⚠️ La réponse n'est pas un JSON valide`);
                        userRank = '-';
                        throw new Error('Réponse non-JSON: ' + responseText);
                    }
                    
                    // Vérifier si la position est bien présente dans la réponse
                    if (positionData && positionData.hasOwnProperty('position')) {
                        userRank = positionData.position;
                        console.log(`✅ Position utilisateur récupérée: ${userRank}`);
                    } else {
                        console.warn(`⚠️ La réponse ne contient pas de propriété 'position':`, positionData);
                        userRank = '-';
                    }
                } else {
                    // Essayer de récupérer le message d'erreur pour diagnostiquer
                    try {
                        const errorText = await userPositionRes.text();
                        console.error(`❌ Erreur de l'API (${userPositionRes.status}): ${errorText}`);
                    } catch (e) {
                        console.error(`❌ Erreur HTTP: ${userPositionRes.status} ${userPositionRes.statusText}`);
                    }
                    
                    console.log(`⚠️ Impossible de récupérer la position utilisateur, utilisation de la valeur par défaut`);
                }
            } catch (positionError) {
                console.error('❌ Erreur lors de la récupération de la position utilisateur:', positionError);
            }
            
            // S'assurer que userRank est toujours une valeur valide pour l'affichage
            if (userRank === undefined || userRank === null) {
                console.warn('⚠️ userRank est undefined ou null, utilisation de la valeur par défaut');
                userRank = '-';
            }
            
            // Forcer le type de userRank en string pour l'affichage
            userRank = String(userRank);
            
            console.log(`🏆 Valeur finale de userRank pour affichage: "${userRank}"`);
            
            // Écrire également la valeur dans la console du navigateur en gros pour vérification
            console.log('%c RANG UTILISATEUR: ' + userRank, 'font-size: 24px; color: red; background-color: yellow;');
            
            // 4. Construire la rangée HTML avec le rang et le score
            const userRow = `
                <div class="leaderboard-rank">${userRank}</div>
                <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
                <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userSeasonScore}</div>
            `;
            
            // 5. Insérer dans le DOM
            userRowElement.innerHTML = userRow;
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Impossible de charger votre classement. ⚠️</div>';
            }
            
    } catch (error) {
        console.error('❌ Erreur globale dans renderLeaderboardUserRow:', error);
        userRowElement.innerHTML = '<div style="color:orange;">Une erreur s\'est produite. ⚠️</div>';
        }
    }

// Exposer les fonctions nécessaires globalement
    window.showLeaderboard = showLeaderboard;
window.hideLeaderboard = hideLeaderboard;

// Fonction pour afficher le prix de la saison pour le gagnant (1er du podium)
function updatePrizeDisplay(prizeMoney) {
    const prizeElement = document.getElementById('podium-1-prize');
    if (!prizeElement) {
        console.error('❌ Élément de prix du podium non trouvé dans le DOM');
        return;
    }
    
    try {
        // Vérifier si prizeMoney est valide
        if (prizeMoney === undefined || prizeMoney === null) {
            console.warn('⚠️ Montant du prix non défini, utilisation de la valeur par défaut');
            prizeElement.textContent = '$0';
            return;
        }
        
        // Convertir en nombre si c'est une chaîne
        const prizeValue = typeof prizeMoney === 'string' ? parseFloat(prizeMoney) : prizeMoney;
        
        // Vérifier si le montant est un nombre valide
        if (isNaN(prizeValue)) {
            console.error('❌ Montant du prix invalide:', prizeMoney);
            prizeElement.textContent = '$0';
            return;
        }
        
        // Formater le montant avec le symbole $ sans décimales
        const formattedPrize = `$${Math.floor(prizeValue)}`;
        console.log(`💰 Prix de la saison formaté: ${formattedPrize}`);
        
        // Mettre à jour l'élément dans le DOM
        prizeElement.textContent = formattedPrize;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage du prix:', error);
        prizeElement.textContent = '$0';
    }
}

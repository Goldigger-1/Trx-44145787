// Leaderboard Page Logic
// Réimplémentation minimale pour afficher seulement la rangée utilisateur

// Variables pour la pagination du leaderboard
let currentPage = 0;
let isLoadingMore = false;
let hasMoreEntries = true;
const ENTRIES_PER_PAGE = 15;

// Fonction pour afficher/masquer le leaderboard
function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'flex';
                
        // Réinitialiser les variables de pagination
        currentPage = 0;
        isLoadingMore = false;
        hasMoreEntries = true;
        
        // Vider la liste existante
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
        }
        
        // Afficher l'overlay de chargement
        const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Mettre à jour la rangée utilisateur et initialiser le compte à rebours
        renderLeaderboardUserRow();
        
        // Charger le leaderboard initial
        loadLeaderboardEntries();
        
        // Ajouter un écouteur d'événements pour le défilement
        setupInfiniteScroll();
    }
}

// Fonction pour cacher le leaderboard
function hideLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'none';
        
        // Supprimer l'écouteur d'événements pour le défilement
        const listContainer = document.querySelector('.leaderboard-list-container');
        if (listContainer) {
            listContainer.removeEventListener('scroll', handleScroll);
        }
    }
}

// Configurer le défilement infini
function setupInfiniteScroll() {
    const listContainer = document.querySelector('.leaderboard-list-container');
    if (listContainer) {
        listContainer.addEventListener('scroll', handleScroll);
    }
}

// Gestionnaire d'événements pour le défilement
function handleScroll(event) {
    if (isLoadingMore || !hasMoreEntries) return;
    
    const container = event.target;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollThreshold = container.scrollHeight - 200; // Charger plus lorsqu'il reste 200px
    
    if (scrollPosition >= scrollThreshold) {
        loadLeaderboardEntries();
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
            
            // Mettre à jour le titre de la saison
            const titleElement = document.getElementById('leaderboard-season-title');
            if (titleElement) {
                titleElement.textContent = `Season ${season.seasonNumber}`;
            }
            
            // Initialiser le compte à rebours avec la date de fin
            updateCountdown(season.endDate);
            
            // Afficher le prix pour le premier du podium
            updatePrizeDisplay(season.prizeMoney);
            
            // Stocker l'ID de la saison active pour le chargement du leaderboard
            window.activeSeasonId = season.id;
                
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

// Fonction pour charger les entrées du leaderboard par lots
async function loadLeaderboardEntries() {
    if (isLoadingMore || !hasMoreEntries) return;
    
    isLoadingMore = true;
    console.log(`🔍 DÉBUT loadLeaderboardEntries - page ${currentPage}, hasMoreEntries: ${hasMoreEntries}`);
    
    try {
        // Récupérer l'ID de la saison active
        const seasonId = window.activeSeasonId;
        
        console.log(`📌 activeSeasonId: ${seasonId || 'NON DÉFINI'}`);
        
        if (!seasonId) {
            console.error('❌ ID de saison active non disponible');
            // Tentative de récupération de la saison active directement
            try {
                console.log('🔄 Tentative de récupération directe de la saison active...');
                const res = await fetch('/api/seasons/active');
                if (res.ok) {
                    const season = await res.json();
                    console.log(`✅ Saison active récupérée directement: ${season.id} (Saison ${season.seasonNumber})`);
                    window.activeSeasonId = season.id;
                } else {
                    throw new Error(`Échec de récupération de saison active: ${res.status}`);
                }
            } catch (seasonError) {
                console.error('❌ Impossible de récupérer la saison active:', seasonError);
                throw new Error('ID de saison indisponible');
            }
        }
        
        // Déterminer la base de l'URL avec le bon chemin
        let baseUrl = window.location.origin;
        
        // Vérifier si nous sommes dans le chemin /test
        const pathname = window.location.pathname;
        const basePathMatch = pathname.match(/^\/([^\/]+)/);
        const basePath = basePathMatch ? basePathMatch[1] : '';
        
        if (basePath) {
            console.log(`🌐 Détection d'un chemin de base: /${basePath}`);
            baseUrl = `${baseUrl}/${basePath}`;
        }
        
        // URL complète pour l'API de ranking
        const apiUrl = `${baseUrl}/api/seasons/${window.activeSeasonId}/ranking?page=${currentPage}&limit=${ENTRIES_PER_PAGE}`;
        console.log(`🔗 URL de l'API: ${apiUrl}`);
        
        // Effectuer la requête
        console.log(`⏳ Envoi de la requête GET vers ${apiUrl}...`);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log(`📊 Statut de la réponse: ${response.status} ${response.statusText}`);
        console.log(`📋 En-têtes de la réponse:`, Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur de l'API (${response.status}): ${errorText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Récupérer les données
        const responseText = await response.text();
        console.log(`📄 Réponse brute: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log(`🔄 Données JSON parsées (${Array.isArray(data) ? data.length : 'non tableau'} éléments)`, data);
        } catch (parseError) {
            console.error(`❌ Erreur de parsing JSON:`, parseError);
            console.log(`⚠️ La réponse n'est pas un JSON valide`);
            throw new Error('Réponse non-JSON: ' + responseText.substring(0, 100));
        }
        
        if (!Array.isArray(data)) {
            console.error('❌ Les données reçues ne sont pas un tableau:', data);
            data = [];
        }
        
        console.log(`✅ ${data.length} entrées récupérées pour la page ${currentPage}`);
        
        // Si nous recevons moins d'entrées que la limite, il n'y a plus de données
        if (data.length < ENTRIES_PER_PAGE) {
            hasMoreEntries = false;
            console.log('🏁 Fin des entrées du leaderboard atteinte');
        }
        
        // Si c'est la première page, mettre à jour le podium avec les 3 premiers
        if (currentPage === 0 && data.length > 0) {
            console.log('🥇 Mise à jour du podium avec les premiers joueurs');
            updatePodium(data.slice(0, Math.min(3, data.length)));
        } else if (currentPage === 0) {
            console.warn('⚠️ Aucune donnée disponible pour le podium');
        }
        
        // Ajouter les entrées à la liste
        console.log(`🧩 Rendu de ${data.length} entrées dans la liste`);
        renderLeaderboardEntries(data);
        
        // Incrémenter la page pour la prochaine requête
        currentPage++;
        console.log(`📈 Page incrémentée à ${currentPage}`);
        
        // Masquer l'overlay de chargement après le chargement initial
        if (currentPage === 1) {
            console.log('🎭 Masquage de l\'overlay de chargement');
            const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            } else {
                console.warn('⚠️ Élément loadingOverlay non trouvé');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur détaillée lors du chargement des entrées du leaderboard:', error);
        console.error('Stack trace:', error.stack);
        
        // Masquer l'overlay de chargement en cas d'erreur
        const loadingOverlay = document.getElementById('leaderboard-loading-overlay');
        if (loadingOverlay && currentPage === 0) {
            console.log('🎭 Masquage de l\'overlay de chargement suite à une erreur');
            loadingOverlay.style.display = 'none';
        }
        
        // Afficher un message d'erreur si c'est le premier chargement
        if (currentPage === 0) {
            const leaderboardList = document.getElementById('leaderboard-list');
            if (leaderboardList) {
                leaderboardList.innerHTML = `<div class="leaderboard-empty-message"><p>Impossible de charger le classement. ⚠️</p><p>Erreur: ${error.message}</p></div>`;
                console.log('📝 Message d\'erreur affiché dans la liste');
            } else {
                console.warn('⚠️ Élément leaderboardList non trouvé pour afficher l\'erreur');
            }
        }
        
        hasMoreEntries = false;
    } finally {
        isLoadingMore = false;
        console.log(`🔍 FIN loadLeaderboardEntries - page ${currentPage}, hasMoreEntries: ${hasMoreEntries}`);
    }
}

// Fonction pour mettre à jour le podium avec les 3 premiers joueurs
function updatePodium(topPlayers) {
    console.log(`🏆 Mise à jour du podium avec les ${topPlayers.length} premiers joueurs:`, topPlayers);
    
    // Positions du podium (1 = premier, 2 = deuxième, 3 = troisième)
    const podiumPositions = [1, 2, 3];
    
    // Pour chaque position du podium
    podiumPositions.forEach(position => {
        // Obtenir les éléments correspondants
        const avatarElement = document.getElementById(`podium-${position}-avatar`);
        const usernameElement = document.getElementById(`podium-${position}-username`);
        
        // Vérifier si les éléments existent
        if (!avatarElement || !usernameElement) {
            console.error(`❌ Éléments du podium ${position} non trouvés dans le DOM`);
            return;
        }
        
        // Indice pour accéder au joueur (1er joueur = indice 0, 2ème = indice 1, etc.)
        const playerIndex = position - 1;
        
        // Si nous avons un joueur pour cette position
        if (playerIndex < topPlayers.length) {
            const player = topPlayers[playerIndex];
            const username = player.gameUsername || `Player ${position}`;
            
            console.log(`🥇 Podium position ${position}: ${username}`);
            
            // Mettre à jour le nom d'utilisateur
            usernameElement.textContent = username;
            
            // Mettre à jour l'avatar
            let avatarSrc = player.avatarSrc || 'avatars/avatar_default.jpg';
            if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
                avatarSrc = 'avatars/' + avatarSrc;
            }
            avatarElement.src = avatarSrc;
            avatarElement.alt = username;
            
            console.log(`🖼️ Avatar pour position ${position}: ${avatarSrc}`);
        } else {
            // Si nous n'avons pas de joueur pour cette position, afficher des valeurs par défaut
            console.log(`⚠️ Aucun joueur pour la position ${position} du podium`);
            usernameElement.textContent = '-';
            avatarElement.src = 'avatars/avatar_default.jpg';
            avatarElement.alt = 'User' + position;
        }
    });
}

// Fonction pour rendre les entrées du leaderboard
function renderLeaderboardEntries(entries) {
    console.log(`🎨 DÉBUT renderLeaderboardEntries avec ${entries.length} entrées`);
    
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) {
        console.error('❌ Élément leaderboardList non trouvé dans le DOM');
        return;
    }
    
    // Si c'est le premier chargement et qu'il n'y a pas d'entrées, afficher un message
    if (currentPage === 0 && entries.length === 0) {
        console.log('📝 Aucune entrée disponible, affichage du message vide');
        leaderboardList.innerHTML = '<div class="leaderboard-empty-message"><p>Aucune donnée de classement disponible.</p></div>';
        return;
    }
    
    console.log(`🔍 Génération du HTML pour ${entries.length} entrées`);
    
    // Créer les rangées HTML pour chaque entrée
    const entriesHTML = entries.map((entry, index) => {
        const rank = (currentPage * ENTRIES_PER_PAGE) + index + 1;
        const username = entry.gameUsername || 'Joueur';
        const score = entry.score || 0;
        
        // Déterminer l'avatar
        let avatarSrc = entry.avatarSrc || 'avatars/avatar_default.jpg';
        if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
            avatarSrc = 'avatars/' + avatarSrc;
        }
        
        console.log(`👤 Entrée #${rank}: ${username}, Score: ${score}, Avatar: ${avatarSrc}`);
        
        // Créer la rangée HTML
        return `
            <div class="leaderboard-row">
                <div class="leaderboard-rank">${rank}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${username}"></div>
                <div class="leaderboard-username">${username}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${score}</div>
            </div>
        `;
    }).join('');
    
    // Ajouter les nouvelles entrées à la liste existante
    if (currentPage === 0) {
        console.log('📝 Premier chargement, remplacement complet du contenu');
        leaderboardList.innerHTML = entriesHTML;
    } else {
        console.log('📝 Chargement supplémentaire, ajout au contenu existant');
        leaderboardList.innerHTML += entriesHTML;
    }
    
    // Si nous avons plus d'entrées à charger, ajouter un indicateur de chargement
    if (hasMoreEntries) {
        // Vérifier si un indicateur de chargement existe déjà
        let loadingIndicator = document.getElementById('leaderboard-loading-indicator');
        
        if (!loadingIndicator) {
            console.log('🔄 Ajout de l\'indicateur de chargement');
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'leaderboard-loading-indicator';
            loadingIndicator.className = 'leaderboard-loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            leaderboardList.appendChild(loadingIndicator);
        } else {
            console.log('🔄 Indicateur de chargement déjà présent');
        }
    } else {
        // Supprimer l'indicateur de chargement s'il n'y a plus d'entrées
        const loadingIndicator = document.getElementById('leaderboard-loading-indicator');
        if (loadingIndicator) {
            console.log('🔄 Suppression de l\'indicateur de chargement');
            loadingIndicator.remove();
        }
    }
    
    console.log(`🎨 FIN renderLeaderboardEntries - ${entries.length} entrées rendues`);
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

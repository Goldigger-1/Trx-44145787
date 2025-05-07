// Leaderboard Page Logic
// Réimplémentation minimale pour afficher seulement la rangée utilisateur

// Variables globales pour le chargement progressif
let currentSeasonId = null;
let isLoadingScores = false;
let currentPage = 0;
let hasMoreScores = true;
const SCORES_PER_PAGE = 15;

// Fonction pour afficher/masquer le leaderboard
function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'flex';
        
        // Réinitialiser les variables de pagination
        currentPage = 0;
        hasMoreScores = true;
        
        // Vider le conteneur de scores existant
        const scoresContainer = document.getElementById('leaderboard-scores-container');
        if (scoresContainer) {
            scoresContainer.innerHTML = '';
        }
                
        // Mettre à jour la rangée utilisateur et initialiser le compte à rebours
        renderLeaderboardUserRow()
            .then(() => {
                // Charger les premiers scores après avoir récupéré les données de saison
                loadLeaderboardScores();
            });
            
        // Configurer l'écouteur d'événements pour le défilement
        setupInfiniteScroll();
    }
}

// Fonction pour configurer le défilement infini
function setupInfiniteScroll() {
    const scoresContainer = document.getElementById('leaderboard-scores-container');
    if (!scoresContainer) return;
    
    // Vérifier si un écouteur existe déjà et le supprimer
    if (scoresContainer._scrollListener) {
        scoresContainer.removeEventListener('scroll', scoresContainer._scrollListener);
    }
    
    // Créer un nouvel écouteur d'événements
    scoresContainer._scrollListener = function() {
        // Déterminer si l'utilisateur est proche du bas
        if (scoresContainer.scrollHeight - scoresContainer.scrollTop <= scoresContainer.clientHeight * 1.5) {
            // Charger plus de scores si nécessaire et pas déjà en cours de chargement
            if (hasMoreScores && !isLoadingScores) {
                loadLeaderboardScores();
            }
        }
    };
    
    // Ajouter l'écouteur d'événements
    scoresContainer.addEventListener('scroll', scoresContainer._scrollListener);
}

// Fonction pour charger les scores du leaderboard progressivement
async function loadLeaderboardScores() {
    // Vérifier si le conteneur existe
    const scoresContainer = document.getElementById('leaderboard-scores-container');
    if (!scoresContainer) {
        console.error('❌ Conteneur de scores non trouvé dans le DOM');
        return;
    }
    
    // Vérifier si on a déjà atteint la fin des scores ou si un chargement est en cours
    if (!hasMoreScores || isLoadingScores) return;
    
    // Marquer comme en cours de chargement
    isLoadingScores = true;
    
    try {
        // Si c'est la première page, afficher un indicateur de chargement
        if (currentPage === 0) {
            scoresContainer.innerHTML = '<div class="leaderboard-loading">Chargement...</div>';
        }
        
        // Calculer les paramètres de pagination
        const limit = SCORES_PER_PAGE;
        const offset = currentPage * SCORES_PER_PAGE;
        
        // Obtenir l'ID de la saison active si pas déjà récupéré
        if (!currentSeasonId) {
            try {
                const res = await fetch('/api/seasons/active');
                if (res.ok) {
                    const season = await res.json();
                    currentSeasonId = season.id;
                } else {
                    // Solution de secours
                    const fallbackRes = await fetch('/api/active-season');
                    if (fallbackRes.ok) {
                        const season = await fallbackRes.json();
                        currentSeasonId = season.id;
                    } else {
                        throw new Error('Impossible de récupérer la saison active');
                    }
                }
            } catch (error) {
                console.error('❌ Erreur lors de la récupération de l\'ID de saison:', error);
                scoresContainer.innerHTML = '<div style="color:orange;">Impossible de charger le classement. ⚠️</div>';
                isLoadingScores = false;
                return;
            }
        }
        
        // URL de l'API pour obtenir les scores paginés
        let baseUrl = window.location.origin;
        const pathname = window.location.pathname;
        const basePathMatch = pathname.match(/^\/([^\/]+)/);
        const basePath = basePathMatch ? basePathMatch[1] : '';
        
        if (basePath) {
            baseUrl = `${baseUrl}/${basePath}`;
        }
        
        const apiUrl = `${baseUrl}/api/seasons/${currentSeasonId}/scores?limit=${limit}&offset=${offset}`;
        console.log(`📊 Chargement des scores: page ${currentPage + 1}, offset ${offset}, limit ${limit}`);
        
        // Faire la requête API
        const response = await fetch(apiUrl);
        
        // Si la réponse n'est pas OK, afficher une erreur
        if (!response.ok) {
            console.error(`❌ Erreur API: ${response.status} ${response.statusText}`);
            
            if (currentPage === 0) {
                scoresContainer.innerHTML = '<div style="color:orange;">Impossible de charger le classement. ⚠️</div>';
            }
            
            isLoadingScores = false;
            return;
        }
        
        // Récupérer les données de score
        const data = await response.json();
        
        // Vérifier si nous avons des scores
        if (!Array.isArray(data.scores) || data.scores.length === 0) {
            console.log('ℹ️ Aucun score supplémentaire disponible');
            hasMoreScores = false;
            
            // Si c'est la première page et qu'il n'y a pas de scores, afficher un message
            if (currentPage === 0) {
                scoresContainer.innerHTML = '<div class="leaderboard-no-scores">Aucun score disponible pour cette saison.</div>';
            }
            
            isLoadingScores = false;
            return;
        }
        
        // Supprimer l'indicateur de chargement si c'est la première page
        if (currentPage === 0) {
            scoresContainer.innerHTML = '';
        }
        
        // Ajouter chaque score au conteneur
        data.scores.forEach((scoreData, index) => {
            // Calculer le rang global
            const rank = offset + index + 1;
            
            // Créer l'élément de ligne
            const scoreRow = document.createElement('div');
            scoreRow.className = 'leaderboard-row';
            
            // Déterminer si c'est un podium (top 3)
            const isPodium = rank <= 3;
            if (isPodium) {
                scoreRow.classList.add('leaderboard-podium');
                scoreRow.classList.add(`leaderboard-rank-${rank}`);
            }
            
            // Obtenir l'URL de l'avatar ou utiliser l'avatar par défaut
            const avatarSrc = scoreData.avatarSrc || 'avatars/avatar_default.jpg';
            
            // Construire le contenu HTML de la ligne
            scoreRow.innerHTML = `
                <div class="leaderboard-rank">${rank}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${scoreData.username}"></div>
                <div class="leaderboard-username">${scoreData.username}</div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${scoreData.score}</div>
            `;
            
            // Ajouter la ligne au conteneur
            scoresContainer.appendChild(scoreRow);
        });
        
        // Mettre à jour la page courante
        currentPage++;
        
        // Vérifier si nous avons atteint la fin des données
        if (data.scores.length < SCORES_PER_PAGE) {
            console.log('ℹ️ Fin des scores atteinte');
            hasMoreScores = false;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des scores:', error);
        
        // Afficher un message d'erreur seulement si c'est la première page
        if (currentPage === 0) {
            scoresContainer.innerHTML = '<div style="color:orange;">Erreur lors du chargement du classement. ⚠️</div>';
        }
    } finally {
        // Marquer comme plus en cours de chargement
        isLoadingScores = false;
    }
}

// Fonction pour cacher le leaderboard
function hideLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'none';
        
        // Supprimer l'écouteur d'événements de défilement
        const scoresContainer = document.getElementById('leaderboard-scores-container');
        if (scoresContainer && scoresContainer._scrollListener) {
            scoresContainer.removeEventListener('scroll', scoresContainer._scrollListener);
            scoresContainer._scrollListener = null;
        }
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
                // Stocker l'ID de la saison pour le chargement des scores
                currentSeasonId = season.id;
            } else {
                // Solution de secours
                const fallbackRes = await fetch('/api/active-season');
                if (!fallbackRes.ok) {
                    throw new Error('Impossible de récupérer la saison active');
                }
                season = await fallbackRes.json();
                // Stocker l'ID de la saison pour le chargement des scores
                currentSeasonId = season.id;
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

// Leaderboard Page Logic
// Réimplémentation minimale pour afficher seulement la rangée utilisateur

// Fonction pour afficher/masquer le leaderboard
function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.style.display = 'flex';
                
        // Mettre à jour la rangée utilisateur
        renderLeaderboardUserRow();
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
            
            // Mettre à jour le titre de la saison
            const titleElement = document.getElementById('leaderboard-season-title');
            if (titleElement) {
                titleElement.textContent = `Season ${season.seasonNumber}`;
                }
                
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

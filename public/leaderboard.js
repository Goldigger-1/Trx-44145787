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
            
            // Utiliser l'API existante pour récupérer les données utilisateur
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
            
            // Calculer la position de l'utilisateur dans le classement en utilisant l'endpoint de classement
            // qui existe déjà dans l'API
            let userRank = 0; // 0 signifie non classé
            
            try {
                // Récupérer les premiers du classement (limités à 50 par exemple)
                // Cet endpoint devrait exister car utilisé pour afficher le classement complet
                const rankingsRes = await fetch(`/api/seasons/${season.id}/rankings`);
                
                if (rankingsRes.ok) {
                    const rankings = await rankingsRes.json();
                    
                    // D'abord vérifier si l'utilisateur est dans les premiers du classement
                    const userEntry = rankings.find(entry => entry.userId === userId);
                    if (userEntry) {
                        // Si l'utilisateur est dans les premiers, récupérer son index + 1
                        userRank = rankings.findIndex(entry => entry.userId === userId) + 1;
                        console.log(`✅ Rang trouvé dans le top du classement: ${userRank}`);
                    } else if (userSeasonScore > 0) {
                        // Si l'utilisateur n'est pas dans les premiers mais a un score > 0
                        // Compter combien d'utilisateurs ont un score supérieur
                        // Utiliser un endpoint existant et optimisé pour cette requête
                        const countRes = await fetch(`/api/seasons/${season.id}/count-higher-scores?score=${userSeasonScore}`);
                        
                        if (countRes.ok) {
                            const countData = await countRes.json();
                            userRank = (countData.count || 0) + 1;
                            console.log(`✅ Rang calculé via count-higher-scores: ${userRank}`);
                        } else {
                            // Si cet endpoint n'existe pas non plus, on utilise une valeur approximative
                            // basée sur la dernière position dans le classement récupéré
                            if (rankings.length > 0 && rankings[rankings.length - 1].score > userSeasonScore) {
                                userRank = rankings.length + 1;
                                console.log(`⚠️ Rang estimé (après le dernier du top): ${userRank}`);
                            } else {
                                // Si le score est meilleur que le dernier du classement visible mais pas dans le top,
                                // c'est une incohérence de données - utiliser une valeur par défaut
                                userRank = 1; // Valeur par défaut
                                console.log(`⚠️ Incohérence de données de classement, rang par défaut: ${userRank}`);
                            }
                        }
                    } else {
                        // Si score = 0, l'utilisateur n'est pas classé
                        userRank = 0;
                        console.log(`ℹ️ Utilisateur non classé (score = 0)`);
                    }
                } else {
                    // Si l'API de classement n'est pas accessible, utiliser une valeur par défaut
                    userRank = userSeasonScore > 0 ? 1 : 0;
                    console.log(`⚠️ Impossible d'accéder au classement, rang par défaut: ${userRank}`);
                }
            } catch (rankError) {
                console.error('❌ Erreur lors du calcul du rang:', rankError);
                userRank = userSeasonScore > 0 ? 1 : 0;
            }
            
            // Gérer le cas où l'utilisateur n'est pas classé (score = 0)
            const rankDisplay = userRank > 0 ? userRank.toString() : '-';
            
            // 4. Construire la rangée HTML avec le rang et le score
            const userRow = `
                <div class="leaderboard-rank">${rankDisplay}</div>
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

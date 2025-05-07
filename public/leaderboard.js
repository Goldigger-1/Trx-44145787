// Leaderboard Page Logic
// Ce fichier a été complètement vidé pour réimplémenter à zéro la logique du leaderboard
// Toutes les fonctions précédentes de chargement des utilisateurs ont été supprimées

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
        
        // 3. Calculer le rang de l'utilisateur et récupérer son score de saison
        try {
            console.log(`📊 Récupération du rang et score pour l'utilisateur ${userId} dans la saison ${season.id}...`);
            
            // Requête optimisée pour obtenir le score de saison pour l'utilisateur
            const scoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
            if (!scoreRes.ok) {
                throw new Error('Impossible de récupérer le score de saison');
            }
            
            const scoreData = await scoreRes.json();
            const userScore = scoreData.score || 0;
            
            // Requête optimisée pour calculer le rang (nombre d'utilisateurs avec un score supérieur + 1)
            const rankRes = await fetch(`/api/seasons/${season.id}/rank?score=${userScore}&userId=${encodeURIComponent(userId)}`);
            let rank = 0;
            
            if (rankRes.ok) {
                const rankData = await rankRes.json();
                rank = rankData.rank || 0;
            } else {
                // Méthode alternative pour calculer le rang si l'endpoint n'existe pas
                // Cette requête devrait être implémentée côté serveur, mais nous pouvons fournir une solution frontend
                // qui peut fonctionner avec l'API existante
                console.log('⚠️ Endpoint de rang non disponible, tentative de calcul alternatif...');
                
                // Récupérer le score de l'utilisateur
                const userScoreResponse = await fetch(`/api/seasons/${season.id}/scores/count?greaterThan=${userScore}`);
                if (userScoreResponse.ok) {
                    const countData = await userScoreResponse.json();
                    rank = (countData.count || 0) + 1;
                } else {
                    // Dernier recours - utiliser un endpoint qui renvoie une liste paginée des scores
                    // et compter les scores supérieurs à celui de l'utilisateur
                    console.log('⚠️ Méthode alternative 1 échoue, essai dernière méthode...');
                    
                    // Définir un rang par défaut si tout échoue
                    rank = '-';
                }
            }
            
            // 4. Utiliser l'avatar global déjà chargé pour la page d'accueil
            // Récupérer l'avatar directement de la variable globale ou de l'élément d'image du profil
            let avatarImgSrc;
            if (window.avatarSrc) {
                avatarImgSrc = window.avatarSrc;
                console.log('✅ Utilisation de l\'avatar global:', avatarImgSrc);
            } else {
                const profileAvatarImg = document.getElementById('avatarImg');
                if (profileAvatarImg && profileAvatarImg.src) {
                    avatarImgSrc = profileAvatarImg.src;
                    console.log('✅ Utilisation de l\'avatar du profil:', avatarImgSrc);
                } else {
                    // Fallback si aucun avatar n'est disponible
                    avatarImgSrc = 'avatars/avatar_default.jpg';
                    console.log('⚠️ Fallback sur l\'avatar par défaut');
                }
            }
            
            // 5. Récupérer le nom d'utilisateur (réutiliser la variable globale)
            const username = window.username || document.getElementById('username')?.textContent || 'You';
            
            // 6. Construire la rangée HTML avec le score de la saison et le rang calculé
            const userRow = `
                <div class="leaderboard-rank">${rank}</div>
                <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
                <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userScore}</div>
            `;
            
            // 7. Insérer dans le DOM
            userRowElement.innerHTML = userRow;
        } catch (error) {
            console.error('❌ Erreur lors du calcul du rang utilisateur:', error);
            
            // Fallback: afficher une rangée utilisateur simplifiée sans rang
            try {
                // Récupérer le score de saison directement
                const seasonScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
                let seasonScore = 0;
                
                if (seasonScoreRes.ok) {
                    const seasonScoreData = await seasonScoreRes.json();
                    seasonScore = seasonScoreData.score || 0;
                }
                
                // Utiliser l'avatar global déjà chargé pour la page d'accueil
                let avatarImgSrc;
                if (window.avatarSrc) {
                    avatarImgSrc = window.avatarSrc;
                } else {
                    const profileAvatarImg = document.getElementById('avatarImg');
                    if (profileAvatarImg && profileAvatarImg.src) {
                        avatarImgSrc = profileAvatarImg.src;
                    } else {
                        // Fallback si aucun avatar n'est disponible
                        avatarImgSrc = 'avatars/avatar_default.jpg';
                    }
                }
                
                // Récupérer le nom d'utilisateur (réutiliser la variable globale)
                const username = window.username || document.getElementById('username')?.textContent || 'You';
                
                // Construire la rangée sans le rang mais avec le score de saison spécifique
                const userRow = `
                    <div class="leaderboard-rank">-</div>
                    <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
                    <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                    <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${seasonScore}</div>
                `;
                
                userRowElement.innerHTML = userRow;
            } catch (fallbackError) {
                console.error('❌ Erreur lors de la récupération des données utilisateur:', fallbackError);
                userRowElement.innerHTML = '<div style="color:orange;">Impossible de charger votre classement. ⚠️</div>';
            }
        }
    } catch (error) {
        console.error('❌ Erreur globale dans renderLeaderboardUserRow:', error);
        userRowElement.innerHTML = '<div style="color:orange;">Une erreur s\'est produite. ⚠️</div>';
    }
}

// Exposer les fonctions nécessaires globalement
window.showLeaderboard = showLeaderboard;
window.hideLeaderboard = hideLeaderboard;

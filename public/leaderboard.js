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
        
        // 3. Utiliser l'endpoint optimisé pour récupérer le rang de l'utilisateur
        try {
            console.log(`📊 Récupération du rang pour l'utilisateur ${userId} dans la saison ${season.id}...`);
            const res = await fetch(`/api/seasons/${season.id}/user-rank/${encodeURIComponent(userId)}`);
            
            if (!res.ok) {
                throw new Error('Impossible de récupérer le rang utilisateur');
            }
            
            const userData = await res.json();
            
            // 4. Préparer l'avatar avec un cache-buster
            let avatarSrc = userData.avatarSrc || 'avatars/avatar_default.jpg';
            if (avatarSrc && !avatarSrc.includes('?')) {
                avatarSrc += '?t=' + new Date().getTime();
            }
            
            // 5. Construire la rangée HTML avec le score de la saison, et non le score global
            const userRow = `
                <div class="leaderboard-rank">${userData.rank || '-'}</div>
                <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${userData.username || 'You'}"></div>
                <div class="leaderboard-username">${userData.username || 'You'} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userData.score || 0}</div>
            `;
            
            // 6. Insérer dans le DOM
            userRowElement.innerHTML = userRow;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du rang utilisateur:', error);
            
            // Fallback: essayer de récupérer les informations de score directement depuis la table SeasonScores
            try {
                // D'abord récupérer les données utilisateur de base
                const userRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
                if (!userRes.ok) {
                    throw new Error('Impossible de récupérer les données utilisateur');
                }
                
                const userData = await userRes.json();
                
                // Ensuite récupérer le score de saison spécifique
                const seasonScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
                let seasonScore = 0;
                
                if (seasonScoreRes.ok) {
                    const seasonScoreData = await seasonScoreRes.json();
                    seasonScore = seasonScoreData.score || 0;
                }
                
                // Préparer l'avatar
                let avatarSrc = userData.avatarSrc || 'avatars/avatar_default.jpg';
                if (avatarSrc && !avatarSrc.includes('?')) {
                    avatarSrc += '?t=' + new Date().getTime();
                }
                
                // Construire la rangée sans le rang mais avec le score de saison spécifique
                const userRow = `
                    <div class="leaderboard-rank">-</div>
                    <div class="leaderboard-avatar"><img src="${avatarSrc}" alt="${userData.gameUsername || 'You'}"></div>
                    <div class="leaderboard-username">${userData.gameUsername || 'You'} <span style="color:#00FF9D;">(You)</span></div>
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

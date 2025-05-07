// Sticky user row for Game Over page
// Ce fichier gère l'affichage de la ligne utilisateur dans l'écran de game over

// Fonction principale pour afficher la rangée utilisateur dans l'écran de game over
async function renderGameOverStickyUserRow() {
    // Récupérer l'élément qui contiendra la rangée utilisateur
    const userRowElement = document.getElementById('gameover-user-row');
    if (!userRowElement) return;

    try {
        // 1. Récupérer la saison active - réutiliser l'appel existant
        let season;
        try {
            // Essayer d'abord l'endpoint principal
            const res = await fetch('/api/seasons/active');
            if (res.ok) {
                season = await res.json();
            } else {
                // Solution de secours si l'endpoint principal échoue
                const fallbackRes = await fetch('/api/active-season');
                if (!fallbackRes.ok) {
                    throw new Error('Impossible de récupérer la saison active');
                }
                season = await fallbackRes.json();
            }
            
            console.log(`✅ Saison active trouvée: ${season.id} (Saison ${season.seasonNumber})`);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la saison active:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Impossible de charger les informations de saison. ⚠️</div>';
            return;
        }
        
        // 2. Récupérer l'ID utilisateur actuel (robuste)
        let userId = window.userId || '';
        
        // Si userId n'est pas une chaîne mais un objet, essayer de le récupérer autrement
        if (typeof userId !== 'string') {
            userId = '';
        }
        
        // Si toujours pas d'ID utilisateur, essayer de le récupérer du localStorage
        if (!userId) {
            userId = localStorage.getItem('tidashUserId') || '';
        }
        
        userId = userId.trim();
        
        // Vérifier la validité de l'ID
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
        console.error('❌ Erreur globale dans renderGameOverStickyUserRow:', error);
        userRowElement.innerHTML = '<div style="color:orange;">Une erreur s\'est produite. ⚠️</div>';
    }
}

// Exposer la fonction pour qu'elle soit appelée depuis index.html
window.renderGameOverStickyUserRow = renderGameOverStickyUserRow;

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
            
            // Maintenant, récupérer directement la position de l'utilisateur dans le classement
            let userRank = 1; // Valeur par défaut si aucun calcul n'est possible
            
            // Essayer d'abord l'API standard
            const userRankRes = await fetch(`/api/users/${encodeURIComponent(userId)}/rank?seasonId=${season.id}`);
            
            if (userRankRes.ok) {
                const rankData = await userRankRes.json();
                userRank = rankData.rank || 1;
                console.log(`✅ Rang récupéré depuis l'API: ${userRank}`);
            } else {
                // Si l'API standard ne fonctionne pas, essayer une autre API
                console.log("⚠️ Impossible d'utiliser l'API standard pour le rang, utilisation d'une autre API...");
                const alternativeRankRes = await fetch(`/api/seasons/${season.id}/user-position/${encodeURIComponent(userId)}`);
                
                if (alternativeRankRes.ok) {
                    const altRankData = await alternativeRankRes.json();
                    userRank = altRankData.position || 1;
                    console.log(`✅ Rang récupéré depuis l'API alternative: ${userRank}`);
                } else {
                    // Dernière tentative: utiliser une API qui retourne les classements et trouver l'utilisateur
                    console.log("⚠️ Impossible d'utiliser l'API alternative pour le rang, calcul manuel...");
                    
                    // Sur les petits jeux, cette approche reste performante
                    const rankingsRes = await fetch(`/api/seasons/${season.id}/rankings`);
                    
                    if (rankingsRes.ok) {
                        const rankings = await rankingsRes.json();
                        // Chercher l'utilisateur dans les classements
                        const userIndex = rankings.findIndex(item => item.userId === userId);
                        if (userIndex !== -1) {
                            userRank = userIndex + 1;
                            console.log(`✅ Rang calculé manuellement: ${userRank}`);
                        }
                    }
                }
            }
            
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
        console.error('❌ Erreur globale dans renderGameOverStickyUserRow:', error);
        userRowElement.innerHTML = '<div style="color:orange;">Une erreur s\'est produite. ⚠️</div>';
    }
}

// Exposer la fonction pour qu'elle soit appelée depuis index.html
window.renderGameOverStickyUserRow = renderGameOverStickyUserRow;

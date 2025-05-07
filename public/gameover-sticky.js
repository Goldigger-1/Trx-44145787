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

        // 3. Récupérer à la fois le score et le rang de l'utilisateur dans la saison active
        let userData = null;
        let userRank = null;
        let userSeasonScore = 0;
        let username = '';
        
        try {
            // Récupérer d'abord le score de l'utilisateur dans la saison
            console.log(`📊 Récupération du score pour l'utilisateur ${userId} dans la saison ${season.id}...`);
            const scoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
            
            if (scoreRes.ok) {
                const scoreData = await scoreRes.json();
                userSeasonScore = scoreData.score || 0;
                console.log(`✅ Score de saison récupéré: ${userSeasonScore}`);
                
                // Méthode directe: calculer le rang avec une requête SQL count(*) + 1 
                // où score > userScore dans la saison active
                console.log(`🔢 Calcul du rang pour le score ${userSeasonScore} dans la saison ${season.id}...`);
                
                // Utiliser l'endpoint qui exécute: SELECT COUNT(*) + 1 FROM SeasonScores WHERE seasonId = seasonId AND score > userSeasonScore
                const rankingRes = await fetch(`/api/seasons/${season.id}/rank-by-score/${userSeasonScore}`);
                
                if (rankingRes.ok) {
                    const rankingData = await rankingRes.json();
                    userRank = rankingData.rank;
                    console.log(`✅ Rang calculé avec COUNT(*) + 1: ${userRank}`);
                } else {
                    // Si l'endpoint spécifique n'existe pas, utiliser une méthode alternative
                    const countAboveRes = await fetch(`/api/count-season-scores-above?seasonId=${season.id}&score=${userSeasonScore}`);
                    
                    if (countAboveRes.ok) {
                        const countAboveData = await countAboveRes.json();
                        userRank = countAboveData.count + 1;
                        console.log(`✅ Rang calculé avec méthode alternative: ${userRank}`);
                    } else {
                        // Dernier recours: endpoint générique avec query params
                        const genericRankRes = await fetch(`/api/sql-query?q=SELECT COUNT(*) + 1 AS rank FROM SeasonScores WHERE seasonId = ${season.id} AND score > ${userSeasonScore}`);
                        
                        if (genericRankRes.ok) {
                            const genericRankData = await genericRankRes.json();
                            userRank = genericRankData.rank || 1;
                            console.log(`✅ Rang calculé avec requête SQL générique: ${userRank}`);
                        } else {
                            // Si tout échoue, afficher un tiret
                            userRank = '-';
                            console.log(`⚠️ Impossible de calculer le rang, utilisation d'un tiret`);
                        }
                    }
                }
            }
            
            // Récupérer les informations de profil de l'utilisateur
            const userDataRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            if (userDataRes.ok) {
                userData = await userDataRes.json();
                username = userData.gameUsername || 'You';
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du calcul du rang:', error);
            userRank = '-';
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
        
        // 5. Construire la rangée HTML avec le rang et le score de saison
        const userRow = `
            <div class="leaderboard-rank">${userRank}</div>
            <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
            <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
            <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userSeasonScore}</div>
        `;
        
        // 6. Insérer dans le DOM
        userRowElement.innerHTML = userRow;
        
    } catch (error) {
        console.error('❌ Erreur globale dans renderGameOverStickyUserRow:', error);
        userRowElement.innerHTML = '<div style="color:orange;">Une erreur s\'est produite. ⚠️</div>';
    }
}

// Exposer la fonction pour qu'elle soit appelée depuis index.html
window.renderGameOverStickyUserRow = renderGameOverStickyUserRow;

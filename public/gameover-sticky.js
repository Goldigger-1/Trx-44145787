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

        // 3. Récupérer le rang de l'utilisateur directement depuis la table SeasonScores
        let userRank = '-';
        let userSeasonScore = 0;
        let username = 'You';

        try {
            // 3.1 D'abord, récupérer le username pour l'affichage
            const userRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            if (userRes.ok) {
                const userData = await userRes.json();
                username = userData.gameUsername || 'You';
            }
            
            // 3.2 Utiliser un endpoint direct qui calcule le rang dans la table SeasonScores
            // Cet endpoint spécial doit utiliser une requête SQL comme:
            // SELECT COUNT(*) + 1 FROM SeasonScores WHERE seasonId = ? AND score > (SELECT score FROM SeasonScores WHERE seasonId = ? AND userId = ?)
            console.log(`🔢 Calcul du rang direct pour l'utilisateur ${userId} dans la saison ${season.id}...`);
            
            // Option 1: Tenter d'utiliser une API directe qui calcule le rang avec un seul appel
            const rankingRes = await fetch(`/api/season-ranking/${season.id}/user-rank/${encodeURIComponent(userId)}`);
            
            if (rankingRes.ok) {
                const rankData = await rankingRes.json();
                userRank = rankData.rank || '-';
                userSeasonScore = rankData.score || 0;
                console.log(`✅ Rang calculé par l'API: ${userRank}, Score: ${userSeasonScore}`);
            } else {
                // Option 2: Méthode alternative - prendre le tableau des top scores et chercher la position
                console.log(`⚠️ API de rang direct non disponible, tentative de méthode de secours...`);
                
                // D'abord, récupérer le score de l'utilisateur
                const userScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
                if (userScoreRes.ok) {
                    const userScoreData = await userScoreRes.json();
                    userSeasonScore = userScoreData.score || 0;
                    console.log(`✅ Score récupéré: ${userSeasonScore}`);
                    
                    // Ensuite, demander le nombre d'utilisateurs ayant un score supérieur
                    // URL formatée pour l'API qui exécute: SELECT COUNT(*) + 1 FROM SeasonScores WHERE seasonId = :seasonId AND score > :userScore
                    const countAboveRes = await fetch(`/api/seasons/${season.id}/count-scores-above/${userSeasonScore}`);
                    if (countAboveRes.ok) {
                        const countData = await countAboveRes.json();
                        userRank = countData.rank || '-';
                        console.log(`✅ Rang calculé: ${userRank}`);
                    } else {
                        // Option 3: Dernière tentative - créer un calcul direct basé sur une mini-liste
                        console.log(`⚠️ Comptage d'utilisateurs supérieurs non disponible, dernière tentative...`);
                        
                        // Récupérer le top 100 (limité) pour trouver le rang approximatif
                        // Cette requête devrait être limitée pour éviter de charger trop de données
                        const topScoresRes = await fetch(`/api/seasons/${season.id}/scores?limit=100`);
                        if (topScoresRes.ok) {
                            const topScores = await topScoresRes.json();
                            // Chercher la position de l'utilisateur dans cette liste partielle
                            const userIndex = topScores.findIndex(score => score.userId === userId);
                            if (userIndex !== -1) {
                                userRank = userIndex + 1;
                                console.log(`✅ Rang trouvé dans la liste partielle: ${userRank}`);
                            } else if (topScores.length > 0 && userSeasonScore > 0) {
                                // Si l'utilisateur n'est pas dans le top 100 mais a un score
                                userRank = topScores.length + "+";
                                console.log(`✅ Utilisateur hors liste partielle: ${userRank}`);
                            }
                        }
                    }
                }
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
        } else {
            const profileAvatarImg = document.getElementById('avatarImg');
            if (profileAvatarImg && profileAvatarImg.src) {
                avatarImgSrc = profileAvatarImg.src;
            } else {
                // Fallback si aucun avatar n'est disponible
                avatarImgSrc = 'avatars/avatar_default.jpg';
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

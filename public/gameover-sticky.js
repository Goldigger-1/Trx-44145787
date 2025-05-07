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

        // 3. Récupérer les données de classement de l'utilisateur
        let userRank = '-';
        let userSeasonScore = 0;
        let username = '';

        try {
            // Récupérer directement le classement et le score de l'utilisateur dans la saison active
            // Cette requête doit être exécutée côté serveur pour éviter de charger toute la liste
            console.log(`📊 Récupération du classement pour l'utilisateur ${userId} dans la saison ${season.id}...`);
            
            // Utiliser l'API user-ranking pour obtenir directement le classement
            const rankRes = await fetch(`/api/seasons/${season.id}/user-ranking/${encodeURIComponent(userId)}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (rankRes.ok) {
                const rankData = await rankRes.json();
                // Si un rang est fourni directement, l'utiliser
                if (rankData && rankData.rank) {
                    userRank = rankData.rank;
                    userSeasonScore = rankData.score || 0;
                    console.log(`✅ Classement récupéré: ${userRank}, Score: ${userSeasonScore}`);
                } else {
                    // Si seul le score est fourni, le rang doit être calculé
                    userSeasonScore = rankData.score || 0;
                    
                    // Exécuter une requête spécifique pour obtenir le nombre d'utilisateurs ayant un meilleur score
                    const betterScoresRes = await fetch(`/api/seasons/${season.id}/better-scores/${userSeasonScore}`);
                    if (betterScoresRes.ok) {
                        const betterScoresData = await betterScoresRes.json();
                        // Le classement est égal au nombre d'utilisateurs ayant un meilleur score + 1
                        userRank = (betterScoresData.count + 1) || '-';
                        console.log(`✅ Classement calculé: ${userRank} (${betterScoresData.count} utilisateurs ont un meilleur score)`);
                    }
                }
            } else if (rankRes.status === 404) {
                // Si l'utilisateur n'a pas de score dans cette saison
                console.log(`⚠️ L'utilisateur ${userId} n'a pas de score dans la saison ${season.id}`);
                userRank = '-';
                userSeasonScore = 0;
            } else {
                throw new Error(`Erreur lors de la récupération du classement: ${rankRes.status}`);
            }
            
            // Récupérer le nom d'utilisateur
            // Utiliser le nom d'utilisateur global s'il est disponible
            if (window.username) {
                username = window.username;
            } else {
                // Sinon, faire une requête pour obtenir les informations de l'utilisateur
                const userRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    username = userData.gameUsername || 'You';
                } else {
                    username = 'You';
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du classement:', error);
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

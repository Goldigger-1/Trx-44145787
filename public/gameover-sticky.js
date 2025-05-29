// Sticky user row for Game Over page
// This file handles displaying the user row on the game over screen

// Main function to display the user row on the game over screen
async function renderGameOverStickyUserRow() {
    // Get the element that will contain the user row
    const userRowElement = document.getElementById('gameover-user-row');
    if (!userRowElement) return;

    try {
        // 1. Get the active season - reuse the existing call
        let season;
        try {
            // Try the main endpoint first
            const res = await fetch('/api/seasons/active');
            if (res.ok) {
                season = await res.json();
            } else {
                // Fallback if the main endpoint fails
                const fallbackRes = await fetch('/api/active-season');
                if (!fallbackRes.ok) {
                    throw new Error('Unable to retrieve active season');
                }
                season = await fallbackRes.json();
            }
        
            console.log(`Active season found: ${season.id} (Season ${season.seasonNumber})`);
        } catch (error) {
            console.error('Error retrieving active season:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Unable to load season information.</div>';
            return;
        }

        // 2. Get the current user ID (robust)
        let userId = window.userId || '';
        
        // If userId is not a string but an object, try to retrieve it another way
        if (typeof userId !== 'string') {
            userId = '';
        }
        
        // If still no user ID, try to retrieve it from localStorage
        if (!userId) {
            userId = localStorage.getItem('tidashUserId') || '';
        }
        
        userId = userId.trim();
        
        // Verify the validity of the ID
        if (!userId) {
            userRowElement.innerHTML = '<div style="color:orange;">Unable to determine your identifier.</div>';
            return;
        }

        // 3. Use the most simple existing endpoint to retrieve user data
        try {
            console.log(`Retrieving data for user ${userId} in season ${season.id}...`);
            
            // Use the existing API to retrieve user data + their position
            const userDataRes = await fetch(`/api/users/${encodeURIComponent(userId)}`);
            let username = 'You';
            let avatarImgSrc = '';
            
            if (userDataRes.ok) {
                const userData = await userDataRes.json();
                username = userData.gameUsername || 'You';
                
                // Use the avatar from the user data or the one already loaded
                if (window.avatarSrc) {
                    avatarImgSrc = window.avatarSrc;
                } else {
                    avatarImgSrc = userData.avatarSrc || 'avatars/avatar_default.jpg';
                    if (!avatarImgSrc.startsWith('http') && !avatarImgSrc.startsWith('/')) {
                        avatarImgSrc = 'avatars/' + avatarImgSrc;
                    }
                }
            } else {
                // Fallback for the avatar if user data is not available
                const profileAvatarImg = document.getElementById('avatarImg');
                if (profileAvatarImg && profileAvatarImg.src) {
                    avatarImgSrc = profileAvatarImg.src;
                } else {
                    avatarImgSrc = 'avatars/avatar_default.jpg';
                }
            }
            
            // Retrieve the user's season score with the existing endpoint
            const seasonScoreRes = await fetch(`/api/seasons/${season.id}/scores/${encodeURIComponent(userId)}`);
            let userSeasonScore = 0;
            
            if (seasonScoreRes.ok) {
                const scoreData = await seasonScoreRes.json();
                userSeasonScore = scoreData.score || 0;
                console.log(`Score of season retrieved: ${userSeasonScore}`);
            }
            
            // Optimized solution: Retrieve the user's position with the new API
            let userRank = '-';
            
            try {
                console.log(`Attempting to retrieve the rank for ${userId} in season ${season.id}...`);
                
                // Determine the base URL with the correct path
                let baseUrl = window.location.origin;
                
                // Verify if we are in the /test path
                const pathname = window.location.pathname;
                const basePathMatch = pathname.match(/^\/([^\/]+)/);
                const basePath = basePathMatch ? basePathMatch[1] : '';
                
                if (basePath) {
                    console.log(`Detected base path: /${basePath}`);
                    // Add the base path to the URL
                    baseUrl = `${baseUrl}/${basePath}`;
                }
                
                console.log(`Base URL determined: ${baseUrl}`);
                
                // Complete URL with the correct base path
                const apiUrl = `${baseUrl}/api/seasons/${season.id}/user-position?userId=${encodeURIComponent(userId)}`;
                console.log(`API URL: ${apiUrl}`);
                
                console.log(`Sending request...`);
                const userPositionRes = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                console.log(`Response status: ${userPositionRes.status} ${userPositionRes.statusText}`);
                console.log(`Response headers:`, Object.fromEntries([...userPositionRes.headers.entries()]));
                
                // If the response is OK, try to retrieve the JSON
                if (userPositionRes.ok) {
                    const responseText = await userPositionRes.text(); // First retrieve the raw text
                    console.log(`Raw response: ${responseText}`);
                    
                    let positionData;
                    try {
                        positionData = JSON.parse(responseText);
                        console.log(`JSON parsed:`, positionData);
                    } catch (parseError) {
                        console.error(`JSON parsing error:`, parseError);
                        console.log(`The response is not valid JSON`);
                        userRank = '-';
                        throw new Error('Response is not valid JSON: ' + responseText);
                    }
                    
                    // Verify if the position is present in the response
                    if (positionData && positionData.hasOwnProperty('position')) {
                        userRank = positionData.position;
                        console.log(`User position retrieved: ${userRank}`);
                    } else {
                        console.warn(`The response does not contain a 'position' property:`, positionData);
                        userRank = '-';
                    }
                } else {
                    // Try to retrieve the error message for diagnosis
                    try {
                        const errorText = await userPositionRes.text();
                        console.error(`API error (${userPositionRes.status}): ${errorText}`);
                    } catch (e) {
                        console.error(`HTTP error: ${userPositionRes.status} ${userPositionRes.statusText}`);
                    }
                    
                    console.log(`Unable to retrieve user position, using default value`);
                }
            } catch (positionError) {
                console.error('Error retrieving user position:', positionError);
            }
            
            // Ensure that userRank is always a valid value for display
            if (userRank === undefined || userRank === null) {
                console.warn('userRank is undefined or null, using default value');
                userRank = '-';
            }
            
            // Force userRank type to string for display
            userRank = String(userRank);
            
            console.log(`Final userRank value for display: "${userRank}"`);
            
            // Write the value in the browser console in big letters for verification
            console.log('%c User rank: ' + userRank, 'font-size: 24px; color: red; background-color: yellow;');
            
            // Display a dash for the rank if the score is 0
            let displayRank = userSeasonScore === 0 ? '-' : userRank;
            // Generate the HTML for the user row
            userRowElement.innerHTML = `
                <div class="leaderboard-rank">${displayRank}</div>
                <div class="leaderboard-avatar"><img src="${avatarImgSrc}" alt="${username}"></div>
                <div class="leaderboard-username">${username} <span style="color:#00FF9D;">(You)</span></div>
                <div class="leaderboard-score"><img src="ressources/trophy.png" alt="🏆">${userSeasonScore}</div>
            `;
            

            
        } catch (error) {
            console.error('Error retrieving user data:', error);
            userRowElement.innerHTML = '<div style="color:orange;">Unable to load your ranking. ⚠️</div>';
        }
        
    } catch (error) {
        console.error('Error in renderGameOverStickyUserRow:', error);
        userRowElement.innerHTML = '<div style="color:orange;">An error occurred. ⚠️</div>';
    }
}

// Expose the function so it can be called from index.html
window.renderGameOverStickyUserRow = renderGameOverStickyUserRow;

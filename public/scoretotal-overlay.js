// Overlay for scoretotal info (TiPoints)
// Only handles overlay creation, display, and data fetch. No other logic is touched.

(function() {
    // Display the scoretotal overlay
    function showScoretotalOverlay() {
        const overlay = document.getElementById('scoretotal-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            fetchScoretotalAndUpdate();
        }
    }
    // Hide the scoretotal overlay
    function hideScoretotalOverlay() {
        const overlay = document.getElementById('scoretotal-overlay');
        if (overlay) overlay.style.display = 'none';
    }
    // Inject the overlay content into the div #scoretotal-overlay already present in the DOM
    function injectScoretotalOverlayContent() {
        const overlay = document.getElementById('scoretotal-overlay');
        if (!overlay) return;
        if (overlay.dataset.filled === '1') return; // already injected
        overlay.innerHTML = '';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = '#101010';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'none';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'flex-start';
        overlay.style.fontFamily = "'Orbitron', sans-serif";
        overlay.dataset.filled = '1';

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.width = '100%';
        header.style.display = 'flex';
        header.style.flexDirection = 'row';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.padding = '18px 12px 5px 18px';
        header.style.position = 'relative';
        header.style.zIndex = '10';

        const title = document.createElement('div');
        title.textContent = '$TID Balance';
        title.className = 'settings-title';
        title.style.fontSize = '1.1rem';
        title.style.fontWeight = 'bold';
        title.style.color = '#fff';
        title.style.letterSpacing = '0.04em';
        title.style.textAlign = 'left';
        title.style.margin = '0';
        title.style.padding = '0';
        header.appendChild(title);

        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-button';
        closeBtn.id = 'close-scoretotal-overlay';
        closeBtn.innerHTML = '<span class="close-icon">✕</span>';
        closeBtn.onclick = function() {
            hideScoretotalOverlay();
        };
        header.appendChild(closeBtn);
        overlay.appendChild(header);

        // === Scrollable content container ===
        const scrollContainer = document.createElement('div');
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.maxHeight = '100vh';
        scrollContainer.style.width = '100vw';
        scrollContainer.style.display = 'flex';
        scrollContainer.style.flexDirection = 'column';
        scrollContainer.style.alignItems = 'stretch';
        scrollContainer.style.flex = '1 1 auto';
        scrollContainer.style.paddingBottom = '100px';
        // Score row (diamond + value)
        const scoreRow = document.createElement('div');
        scoreRow.style.display = 'flex';
        scoreRow.style.alignItems = 'center';
        scoreRow.style.justifyContent = 'flex-start';
        scoreRow.style.margin = '36px 0 18px 18px';
        scoreRow.style.gap = '18px';
        scoreRow.style.width = 'unset';
        scoreRow.style.alignSelf = 'flex-start';
        scoreRow.style.paddingRight = '0';

        const coinSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        coinSvg.setAttribute('width', '32');
        coinSvg.setAttribute('height', '32');
        coinSvg.setAttribute('viewBox', '0 0 24 24');
        coinSvg.style.verticalAlign = 'middle';
        coinSvg.innerHTML = '<circle cx="12" cy="12" r="11" fill="#FFD700" stroke="#E6B800" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Arial" fill="#fff" font-weight="bold">$</text>';
        scoreRow.appendChild(coinSvg);

        const scoreValue = document.createElement('div');
        scoreValue.id = 'scoretotal-overlay-value';
        scoreValue.style.fontFamily = "'Orbitron', sans-serif";
        scoreValue.style.fontSize = '1.45rem';
        scoreValue.style.color = '#fff';
        scoreValue.style.fontWeight = 'bold';
        scoreValue.style.letterSpacing = '0.5px';
        scoreValue.style.textShadow = 'none';
        scoreValue.textContent = '-';
        scoreRow.appendChild(scoreValue);

        scrollContainer.appendChild(scoreRow);

        // Text content (info blocks)
        const textBlock = document.createElement('div');
        textBlock.style.margin = '32px 0 0 0';
        textBlock.style.padding = '0 18px 0 18px';
        textBlock.style.display = 'flex';
        textBlock.style.flexDirection = 'column';
        textBlock.style.gap = '22px';

        // Ajout du lien cliquable Market Data
        const marketDataLink = document.createElement('a');
        marketDataLink.href = 'https://gaspump.tg/#/token/trade?token_address=EQAicv6F5s9rTPSt3l2BzpwzkCxBnnvnYmbpPYL8WvfawSNy';
        marketDataLink.target = '_blank';
        marketDataLink.textContent = 'Check $TID Market Data →';
        marketDataLink.style.display = 'block';
        marketDataLink.style.marginTop = '8px';
        marketDataLink.style.color = '#00c853';
        marketDataLink.style.fontWeight = '600';
        marketDataLink.style.textDecoration = 'underline';
        marketDataLink.style.textAlign = 'left';
        marketDataLink.style.fontSize = '0.90rem';
        marketDataLink.style.maxWidth = '100%';
        marketDataLink.style.width = 'auto';
        marketDataLink.style.overflowWrap = 'break-word';
        marketDataLink.style.whiteSpace = 'normal';
        textBlock.appendChild(marketDataLink);

        function infoSection(title, body) {
            const section = document.createElement('div');
            const t = document.createElement('div');
            t.textContent = title;
            t.style.fontWeight = '600';
            t.style.fontSize = '0.90rem';
            t.style.color = '#fff';
            t.style.marginBottom = '2px';
            section.appendChild(t);
            const b = document.createElement('div');
            b.textContent = body;
            b.style.fontSize = '0.81rem';
            b.style.color = '#aaa';
            b.style.fontWeight = '400';
            b.style.lineHeight = '1.5';
            b.style.marginBottom = '8px';
            section.appendChild(b);
            return section;
        }

        // Crée un bouton stylé qui ouvre le chat Telegram avec @TID_Support
        function telegramButton(label) {
            const btn = document.createElement('a');
            btn.href = 'https://t.me/TID_Support';
            btn.target = '_blank';
            btn.textContent = label;
            btn.style.display = 'inline-block';
            btn.style.background = '#0088cc';
            btn.style.color = '#fff';
            btn.style.fontWeight = '600';
            btn.style.border = 'none';
            btn.style.borderRadius = '8px';
            btn.style.padding = '10px 22px';
            btn.style.margin = '6px 0 0 0';
            btn.style.fontSize = '0.81rem';
            btn.style.cursor = 'pointer';
            btn.style.textAlign = 'center';
            btn.style.textDecoration = 'none';
            btn.style.transition = 'background 0.2s';
            btn.onmouseover = function() { btn.style.background = '#005f8c'; };
            btn.onmouseout = function() { btn.style.background = '#0088cc'; };
            return btn;
        }

        // Crée un bouton stylé qui ouvre le site web
        function websiteButton(label) {
            const btn = document.createElement('a');
            btn.href = 'https://tid-universe.framer.wiki/#divider-characters';
            btn.target = '_blank';
            btn.textContent = label;
            btn.style.display = 'inline-block';
            btn.style.background = '#fff';
            btn.style.color = '#0088cc';
            btn.style.fontWeight = '600';
            btn.style.border = 'none';
            btn.style.borderRadius = '8px';
            btn.style.padding = '10px 22px';
            btn.style.margin = '6px 0 0 0';
            btn.style.fontSize = '0.81rem';
            btn.style.cursor = 'pointer';
            btn.style.textAlign = 'center';
            btn.style.textDecoration = 'none';
            btn.style.transition = 'background 0.2s';
            btn.onmouseover = function() { btn.style.background = '#fafafa'; };
            btn.onmouseout = function() { btn.style.background = '#fff'; };
            return btn;
        }


        textBlock.appendChild(infoSection('Step 1: Play & Earn', 'Collect green squares in the game to earn $TID.'));        
        textBlock.appendChild(infoSection('Step 2: Get Your Revenue NFT', 'Every "Revenue NFT" gives you a share of the game’s revenue and is delivered straight to your TON wallet through Getgems.io.'));
        textBlock.appendChild(infoSection('Step 3: Monthly Revenue Sharing', '50% of the game’s ad revenue is distributed to all NFT holders — the more NFTs you own, the more you earn.'));
        
        // Ajout du lien cliquableWatch Tutorial Video
        const tutoDataLink = document.createElement('a');
        tutoDataLink.href = 'https://youtu.be/x0uQdNLLBKY';
        tutoDataLink.target = '_blank';
        tutoDataLink.textContent = 'Watch the Tutorial Video →';
        tutoDataLink.style.display = 'block';
        tutoDataLink.style.marginTop = '0px';
        tutoDataLink.style.color = '#00c853';
        tutoDataLink.style.fontWeight = '600';
        tutoDataLink.style.textDecoration = 'underline';
        tutoDataLink.style.textAlign = 'left';
        tutoDataLink.style.fontSize = '0.90rem';
        tutoDataLink.style.maxWidth = '100%';
        tutoDataLink.style.width = 'auto';
        tutoDataLink.style.overflowWrap = 'break-word';
        tutoDataLink.style.whiteSpace = 'normal';
        textBlock.appendChild(tutoDataLink);        

        // Ajout du bouton Mint NFT sous "Daily Spotlight"
        textBlock.appendChild(telegramButton('Get Revenue NFT - 500 $TID'));
        textBlock.appendChild(websiteButton('Community Revenue NFTs'));

        textBlock.appendChild(infoSection('Withdraw Your Tokens', 'Transfer your $TID to your TON wallet.'));
        // Ajout du bouton Withdraw sous "Withdraw Your Tokens"
        textBlock.appendChild(telegramButton('Withdraw - 300 $TID min'));
        scrollContainer.appendChild(textBlock);

        overlay.appendChild(scrollContainer);

        document.body.appendChild(overlay);
    }

    // Fetch user scoretotal (logic identical to updateScoreTotalDisplay)
    function fetchScoretotalAndUpdate() {
        const userIdOrDeviceId = (window.getCurrentUserIdOrDeviceId && window.getCurrentUserIdOrDeviceId()) || null;
        // Always display the overlay with default values if no data
        function showFallback() {
            document.getElementById('scoretotal-overlay-value').textContent = '-';
            document.getElementById('scoretotal-overlay-percent').textContent = '0%';
            document.getElementById('scoretotal-overlay-bar').style.width = '0%';
            document.getElementById('scoretotal-overlay-score').textContent = '-';
            // Explicit fallback message
            let fallbackMsg = document.getElementById('scoretotal-overlay-fallback-msg');
            if (!fallbackMsg) {
                fallbackMsg = document.createElement('div');
                fallbackMsg.id = 'scoretotal-overlay-fallback-msg';
                fallbackMsg.style.color = '#FFA500';
                fallbackMsg.style.fontSize = '1.05rem';
                fallbackMsg.style.margin = '16px 0 0 0';
                fallbackMsg.style.textAlign = 'center';
                fallbackMsg.textContent = 'No score data available for this account.';
                document.getElementById('scoretotal-overlay').appendChild(fallbackMsg);
            } else {
                fallbackMsg.style.display = 'block';
            }
        }
        fetch('/api/users/telegram/' + userIdOrDeviceId)
            .then(r => {
                if (r.ok) return r.json();
                if (r.status === 404) {
                    return fetch('/api/users/device/' + userIdOrDeviceId)
                        .then(r2 => r2.ok ? r2.json() : null);
                }
                return null;
            })
            .then(data => {
                // Hide the fallback message if we have data
                let fallbackMsg = document.getElementById('scoretotal-overlay-fallback-msg');
                if (fallbackMsg) fallbackMsg.style.display = 'none';
                if (data && typeof data.scoretotal === 'number') {
                    var value = (data.scoretotal * 0.05).toFixed(2);
                    document.getElementById('scoretotal-overlay-value').textContent = value;
                } else {
                    showFallback();
                }
            })
            .catch(() => {
                showFallback();
            });
    }

    // Bind open event à diamond et value
    function bindScoretotalOverlayTriggers() {
    function openOverlay() {
        showScoretotalOverlay();
    }
    // Bind click on the whole group
    const area = document.getElementById('scoretotal-area');
    if (area) {
        area.style.cursor = 'pointer';
        area.addEventListener('click', openOverlay);
    }
}

    // New binding logic
    window.addEventListener('DOMContentLoaded', function() {
        injectScoretotalOverlayContent();
        bindScoretotalOverlayTriggers();
    });
})();

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
        title.textContent = 'TiPoints';
        title.className = 'settings-title';
        title.style.fontSize = '1.45rem';
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

        const diamond = document.createElement('div');
        diamond.id = 'scoretotal-overlay-diamond';
        diamond.style.width = '32px';
        diamond.style.height = '32px';
        diamond.style.background = 'linear-gradient(135deg, #00ff9d 0%, #00c97b 100%)';
        diamond.style.borderRadius = '12px';
        diamond.style.transform = 'rotate(45deg)';
        diamond.style.boxShadow = '0 0 18px 4px #00FF9D44';
        diamond.style.marginBottom = '0';
        diamond.style.animation = 'diamondPulse 2s infinite ease-in-out';
        scoreRow.appendChild(diamond);

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

        // Progress group
        const progressGroup = document.createElement('div');
        progressGroup.style.width = '100%';
        progressGroup.style.padding = '0 18px';
        progressGroup.style.margin = '32px 0 70px 0';
        progressGroup.style.display = 'flex';
        progressGroup.style.flexDirection = 'column';
        progressGroup.style.gap = '6px';

        // First line: % and 10.00 $TID
        const progressTop = document.createElement('div');
        progressTop.style.display = 'flex';
        progressTop.style.justifyContent = 'space-between';
        progressTop.style.alignItems = 'center';
        progressTop.style.fontSize = '1.08rem';
        progressTop.style.fontWeight = '600';
        progressTop.style.color = '#fff';
        progressTop.style.letterSpacing = '0.02em';

        const percentLabel = document.createElement('div');
        percentLabel.id = 'scoretotal-overlay-percent';
        percentLabel.textContent = '0%';
        percentLabel.style.fontSize = '0.81rem';
        percentLabel.style.fontWeight = '600';
        percentLabel.style.color = '#aaa';
        progressTop.appendChild(percentLabel);

        const cashLabel = document.createElement('div');
        cashLabel.textContent = '10.00 $TID';
        cashLabel.style.color = '#00FF9D';
        cashLabel.style.fontSize = '0.92rem';
        cashLabel.style.fontWeight = '600';
        progressTop.appendChild(cashLabel);
        progressGroup.appendChild(progressTop);

        // Progress bar
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.height = '12px';
        progressBarContainer.style.width = '100%';
        progressBarContainer.style.background = 'rgba(255,255,255,0.08)';
        progressBarContainer.style.borderRadius = '10px';
        progressBarContainer.style.overflow = 'hidden';
        progressBarContainer.style.boxShadow = '0 2px 8px #00FF9D22';

        const progressBar = document.createElement('div');
        progressBar.id = 'scoretotal-overlay-bar';
        progressBar.style.height = '100%';
        progressBar.style.width = '0%';
        progressBar.style.background = 'linear-gradient(90deg, #00FF9D 0%, #00C853 100%)';
        progressBar.style.borderRadius = '10px';
        progressBar.style.transition = 'width 0.7s cubic-bezier(.7,.2,.3,1)';
        progressBarContainer.appendChild(progressBar);
        progressGroup.appendChild(progressBarContainer);

        // Third line: scoretotal and 100,000
        const progressBottom = document.createElement('div');
        progressBottom.style.display = 'flex';
        progressBottom.style.justifyContent = 'space-between';
        progressBottom.style.alignItems = 'center';
        progressBottom.style.fontSize = '0.81rem';
        progressBottom.style.fontWeight = '400';
        progressBottom.style.color = '#aaa';
        progressBottom.style.marginTop = '3px';
        progressBottom.style.letterSpacing = '0.01em';

        const scoreLabel = document.createElement('div');
        scoreLabel.id = 'scoretotal-overlay-score';
        scoreLabel.textContent = '-';
        progressBottom.appendChild(scoreLabel);

        const maxLabel = document.createElement('div');
        maxLabel.textContent = '100,000';
        progressBottom.appendChild(maxLabel);
        progressGroup.appendChild(progressBottom);

        scrollContainer.appendChild(progressGroup);

        // Text content (info blocks)
        const textBlock = document.createElement('div');
        textBlock.style.margin = '32px 0 0 0';
        textBlock.style.padding = '0 18px 0 18px';
        textBlock.style.display = 'flex';
        textBlock.style.flexDirection = 'column';
        textBlock.style.gap = '22px';

        function infoSection(title, body) {
            const section = document.createElement('div');
            const t = document.createElement('div');
            t.textContent = title;
            t.style.fontWeight = '600';
            t.style.fontSize = '0.92rem';
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
        textBlock.appendChild(infoSection('Earn tokens with TiDash!', 'Hunt green squares, collect TiDash tokens, and prepare for TiDash ECO!'));
        textBlock.appendChild(infoSection('How It Works', 'Collect green squares in tidash to earn tidash tokens. Use them in the upcoming TiDash ECO Game, launching in 2026, where you can buy items, trade, and live in an immersive world. You can also exchange your tokens for real cash! — Two great reasons to play!'));
        textBlock.appendChild(infoSection('TiDash ECO', 'Without tokens, you cannot join TiDash ECO, so this is your key to accessing this exciting project. Ready to Play?'));
        textBlock.appendChild(infoSection('How to Withdraw', 'Contact our admin at @TiDash_Support to verify and process your withdrawal.'));
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
                    const score = Math.round(data.scoretotal);
                    document.getElementById('scoretotal-overlay-value').textContent = score.toLocaleString('en-US');
                    let percent = (score / 100000 * 100);
                    let percentStr = percent.toFixed(3).replace(/\.0{1,3}$/, '');
                    document.getElementById('scoretotal-overlay-percent').textContent = percentStr + '%';
                    document.getElementById('scoretotal-overlay-bar').style.width = (Math.max(0.01, Math.min(100, percent))) + '%';
                    document.getElementById('scoretotal-overlay-score').textContent = score.toLocaleString('en-US');
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
        // Diamond
        const diamond = document.getElementById('scoretotal-diamond');
        if (diamond) {
            diamond.style.cursor = 'pointer';
            diamond.addEventListener('click', openOverlay);
        }
        // Value
        const value = document.getElementById('scoretotal-value');
        if (value) {
            value.style.cursor = 'pointer';
            value.addEventListener('click', openOverlay);
        }
    }

    // New binding logic
    window.addEventListener('DOMContentLoaded', function() {
        injectScoretotalOverlayContent();
        bindScoretotalOverlayTriggers();
    });
})();

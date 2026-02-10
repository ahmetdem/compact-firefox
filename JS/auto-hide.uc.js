(function() {
    const TRIGGER_HEIGHT = 5;
    const HIDE_OFFSET = '-50px';
    const toolbox = document.getElementById('navigator-toolbox');

    if (!toolbox) return;

    // Apply initial hide
    toolbox.style.marginTop = HIDE_OFFSET;

    function hideToolbar() {
        toolbox.style.marginTop = HIDE_OFFSET;
    }

    function showToolbar() {
        toolbox.style.marginTop = '0';
    }

    function isSidebar(target) {
        return target.closest('#sidebar-main') || target.id === 'sidebar-main';
    }

    document.addEventListener('mousemove', (e) => {
        if (window.fullScreen) return;

        // Only show if mouse is at top AND not over the sidebar
        if (e.clientY <= TRIGGER_HEIGHT && !isSidebar(e.target)) {
            showToolbar();
        }

        // Hide if mouse moves down, unless hovering/focusing the toolbox
        if (e.clientY > 50 && !toolbox.matches(':hover') && !toolbox.matches(':focus-within')) {
            hideToolbar();
        }
    });

    toolbox.addEventListener('mouseleave', (e) => {
        if (e.clientY > TRIGGER_HEIGHT) hideToolbar();
    });
})();

(function() {
    const mainWindow = document.getElementById('main-window');
    
    // Toggle Zen Mode function
    function toggleZenMode() {
        if (mainWindow.hasAttribute('zen-mode')) {
            mainWindow.removeAttribute('zen-mode');
        } else {
            mainWindow.setAttribute('zen-mode', 'true');
        }
    }

    // Shortcut: Ctrl + Shift + Z
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyZ') {
            e.preventDefault();
            toggleZenMode();
        }
    }, true);
})();

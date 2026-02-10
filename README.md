# compact-firefox

Zen Browser's compact mode with toolbar hidden was my favorite ui for a browser so i made simple tweaks to Firefox to make it more compact and tidy, also inspired by GNOME-like layout.

## Video

[Direct link](https://github.com/user-attachments/assets/8437e5fd-6dba-469e-8992-d69edf32509c)

## Features

- Auto-hide toolbar: The top toolbar stays hidden and reveals when the cursor touches the top edge.
- Command palette (Alt+Q): Quick overlay to open sites, go to URLs/domains, or search.
  - Enter: Open best match (URL/domain or lucky result)
  - Shift+Enter: Force a normal web search
  - Ctrl/Cmd+Enter: “I’m feeling lucky” open
  - Alt+Enter: Search with DuckDuckGo
  - Tab: Autocomplete from frequently used sites/tokens
- Smooth, GPU-friendly animations for sidebar and layout changes.

## Install

1) Install the Firefox GNOME Theme

- https://github.com/rafaelmardojai/firefox-gnome-theme
- Ensure the `@import "firefox-gnome-theme/userChrome.css";` line in this repo’s `userChrome.css` resolves. The simplest way is to place the theme folder under your profile’s `chrome/` as `chrome/firefox-gnome-theme/`.

2) Enable custom JS via fx-autoconfig

- https://github.com/MrOtherGuy/fx-autoconfig
- Follow its instructions to allow loading `.uc.js` scripts.

3) Copy these files into your Firefox profile

- `userChrome.css` → `<your-profile>/chrome/userChrome.css`
- `JS/*.uc.js` → `<your-profile>/chrome/JS/` (create the `JS` folder if it doesn’t exist)

4) Enable userChrome in Firefox

- In `about:config`, set `toolkit.legacyUserProfileCustomizations.stylesheets` to `true`.
- Clear firefox startup cache after copying files and restart.

That’s it, you’ll have the compact layout, auto‑hide toolbar, and the Alt+Q command palette.

# <img src="img/safari-icon.png" alt="Alfred Safari Window Workflow" align="center" width="45"/> Safari Control | Alfred Workflow

Open new Safari windows anywhere, sneak into private browsing, switch profiles like you’re hiding something, and zip through tabs like your boss is walking in.

## Download

- Get the latest release on GitHub [here](https://github.com/vanstrouble/new-safari-window-alfred-workflow/releases).

## Usage

### New window (sw)

<img src="img/sw.png" alt="Alfred new Safari window" width="570"/>

Opens a new Safari window in the current space. By default, pressing the **Command** key will open a **new private window**.

#### Examples:

| Command         | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `sw`            | Opens a new Safari window in the current space.                            |
| `sw x3`         | Opens 3 new Safari windows in the current space.                           |
| `sw URL`        | Opens a new Safari window with the specified URL.                          |
| `sw + Command (⌘)`  | Opens a new tab in the current Safari window instead of creating a window. |

### Open Safari window profiles (swp)

<img src="img/swp.png" alt="Alfred Safari profiles" width="570"/>

List and open Safari windows using up to 3 customizable profiles (e.g., work, personal, testing). Use `sw p[number]` to instantly open a new Safari window with the selected profile.

#### Examples:

| Command         | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `swp`           | Lists available profiles (Profile 1, Profile 2, Profile 3).                |
| `sw p1`        | Opens a new Safari window using Profile 1.                                 |
| `sw p2`        | Opens a new Safari window using Profile 2.                                 |
| `sw p3`        | Opens a new Safari window using Profile 3.                                 |

### List Safari tabs (swt)

<img src="img/swt.png" alt="Alfred Safari tabs" width="570"/>

Browse all open Safari tabs and search by title or URL to instantly bring the one you need into focus.

### Open current tab in private mode (stp)

<img src="img/stp.png" alt="Alfred Safari private tab" width="570"/>

Extracts the current tab (the one you are currently viewing) and opens it in a new private browsing window.

## Customization

Customize the workflow to fit your style: change the default keywords, assign hotkeys to trigger actions instantly, and rename the default profiles to match your Safari setup. All settings can be adjusted directly in Alfred during or after installation.

## Acknowledgments

- This workflow is inspired in [Caio Gondim's one](https://github.com/caiogondim/alfred-chrome-window-workflow?tab=readme-ov-file)

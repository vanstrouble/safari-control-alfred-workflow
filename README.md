# <img src="img/safari-icon.png" alt="Alfred Safari Window Workflow" align="center" width="45"/> Safari Control | Alfred Workflow

Open Safari windows from anywhere, jump into private browsing, switch between profiles, browse your history, and move through tabs instantly, right from Alfred.

## Download

- Available on the Alfred Gallery. [Get it here](https://alfred.app/workflows/vanstrouble/safari-control/).
- You can also download it directly [from GitHub here](https://github.com/vanstrouble/new-safari-window-alfred-workflow/releases/latest).

## Usage

### New window (sw)

<img src="img/sw.png" alt="Alfred new Safari window" width="570"/>

Opens a new Safari window in the current space.

- **Keyword:** `sw`
  - `⌘` `↩` Open a new private window

#### Examples:

| Command         | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `sw`            | Opens a new Safari window in the current space.                            |
| `sw x3`         | Opens 3 new Safari windows in the current space.                           |
| `sw URL`        | Opens a new Safari window with the specified URL.                          |
| `sw + Command (⌘)`  | Opens a new tab in the current Safari window instead of creating a window. |

### Copy current tab URL (swc)

<img src="img/swc.png" alt="Alfred Safari copy URL" width="570"/>

Copies the URL of the currently focused Safari tab directly to your clipboard, allowing for quick sharing or referencing.

- **Keyword:** `swc`
  - `⇧` `⌘` `↩` Copy the URL using Markdown format.

### Open current tab in private mode (stp)

<img src="img/stp.png" alt="Alfred Safari private tab" width="570"/>

Extracts the current tab (the one you are currently viewing) and opens it in a new private browsing window.

- **Keyword:** `stp`
  - `⌘` `↩` Close the tab in the normal browsing windows.

### List Safari tabs (swt)

<img src="img/swt.png" alt="Alfred Safari tabs" width="570"/>

Browse all open Safari tabs and search by title or URL to instantly bring the one you need into focus.

- **Keyword:** `swt`
  - `↩` Switch to the selected tab in Safari
  - `⇧` `⌘` `↩` Copy the URL using Markdown format.
  - `⌘` `↩` Copy the URL of the tab
  - `⌥` `↩` Modify the URL
  - `⌃` `↩` Close the tab


### List Safari history (shi)

<img src="img/shi.png" alt="Alfred Safari history" width="570"/>

Browse your recent Safari browsing history and search by title or URL.

- **Keyword:** `shi`
  - `↩` Open the selected history item in Safari
  - `⇧` `⌘` `↩` Copy the URL using Markdown format.
  - `⌘` `↩` Copy the URL to the clipboard
  - `⌥` `↩` Modify the URL

### Open Safari window profiles (swp)

<img src="img/swp.png" alt="Alfred Safari profiles" width="570"/>

Lists the profiles currently available in Safari. Profile names do not need to be added to the workflow configuration.

- **Keyword:** `swp`
  - `↩` Open the selected profile in a new Safari window

Type to filter the list, then press `↩` to open the selected profile.

The list is cached for five minutes so it opens quickly on repeated use.

**Note:** Alfred needs Accessibility permission to read and open items from Safari's profile menu.

## Customization

Keywords and hotkeys can be customized directly in Alfred. Profile names are read from Safari.

## Acknowledgments

- This workflow is inspired in [Caio Gondim's one](https://github.com/caiogondim/alfred-chrome-window-workflow?tab=readme-ov-file)

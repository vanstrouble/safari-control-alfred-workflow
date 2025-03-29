#!/bin/zsh --no-rcs

# Get URL if provided
URL=""
if [[ $# -gt 0 ]]; then
    URL="$1"
    # Add http:// if it doesn't start with http:// or https://
    if [[ ! "$URL" =~ ^https?:// ]]; then
        URL="http://$URL"
    fi
fi

# Get user language
USER_LANG=$(defaults read -g AppleLocale | cut -d '_' -f 1)

# Set menu items based on language
if [[ "$USER_LANG" == "es" ]]; then
    NEW_PRIVATE_WINDOW="Nueva ventana privada"
    FILE_MENU="Archivo"
else
    NEW_PRIVATE_WINDOW="New Private Window"
    FILE_MENU="File"
fi

# Check if Safari is running
SAFARI_RUNNING=$(pgrep -q "Safari" && echo "true" || echo "false")

if [[ "$SAFARI_RUNNING" == "false" ]]; then
    # Safari is not running, start it
    open -a "Safari"
    # Wait for Safari to start
    sleep 1

    # Handle potential startup dialog
    osascript <<EOD
    tell application "System Events"
        tell process "Safari"
            try
                set frontmost to true
                click button 1 of window 1
            end try
        end tell
    end tell
EOD

    sleep 0.5
fi

# Click the menu item to open a private window
osascript <<EOD
tell application "System Events"
    tell process "Safari"
        click menu item "$NEW_PRIVATE_WINDOW" of menu "$FILE_MENU" of menu bar 1
    end tell
end tell
EOD

# Bring Safari to the front
osascript -e 'tell application "Safari" to activate'

# If URL was provided, set it in the front document
if [[ -n "$URL" ]]; then
    # Give a moment for the window to open
    sleep 0.3

    osascript <<EOD
    tell application "Safari"
        set URL of front document to "$URL"
    end tell
EOD
fi

#!/bin/zsh --no-rcs

# Function to validate URLs more rigorously but accept simple domains
validate_url() {
    local input="$1"
    local url="$input"

    # If empty, return invalid
    if [[ -z "$url" ]]; then
        return 1
    fi

    # Check for spaces in the input (invalid for domains)
    if [[ "$url" =~ [[:space:]] ]]; then
        return 1
    fi

    # Add http:// if no protocol specified
    if [[ ! "$url" =~ ^https?:// ]]; then
        url="http://$url"
    fi

    # Extract domain (everything after protocol and before first slash or end)
    domain=$(echo "$url" | sed -E 's|^https?://([^/]+).*|\1|')

    # Basic domain validation: must contain at least one dot and some alphanumeric chars
    if [[ ! "$domain" =~ [[:alnum:]]+\.[[:alnum:]]+ ]]; then
        return 1
    fi

    # If we get here, URL seems valid
    echo "$url"
    return 0
}

# Check if a URL was provided and validate it
URL=""
if [[ $# -gt 0 ]]; then
    input_url="$1"
    valid_url=$(validate_url "$input_url")

    if [[ $? -eq 0 ]]; then
        URL="$valid_url"
    else
        # URL is invalid, but continue without URL
        echo "Invalid URL format: '$input_url'. Opening Safari without URL." >&2
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

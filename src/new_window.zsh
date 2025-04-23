#!/bin/zsh --no-rcs

# Function to validate URLs more rigorously but accept simple domains
validate_url() {
    local input="$1"
    local url="$(echo "$input" | tr -d '\n\r' | xargs)"

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

# Function to open Safari with a specific profile
open_safari_with_profile() {
    local profile_num="$1"
    local url="$2"
    local window_count="$3"

    # Ensure profile number is valid (1-3)
    if [[ ! "$profile_num" =~ ^[1-3]$ ]]; then
        echo "Invalid profile number: $profile_num. Must be 1, 2, or 3." >&2
        return 1
    fi

    # Check if Safari is running
    local safari_running=false
    if ps -e | grep -q "[S]afari$"; then
        safari_running=true
    fi

    # If Safari is not running, start it
    if ! $safari_running; then
        open -a "Safari"
        sleep 0.5
    fi

    # Activate Safari and bring it to the foreground
    osascript -e 'tell application "Safari" to activate'
    sleep 0.2

    # Open the requested number of windows with the selected profile
    for ((i=1; i<=window_count; i++)); do
        # Use keyboard shortcut to switch to the selected profile
        # Option + Shift + Command + n where n is the profile number
        osascript <<EOD
        tell application "System Events"
            tell process "Safari"
                set frontmost to true
                keystroke "$profile_num" using {option down, shift down, command down}
                delay 0.3
            end tell
        end tell
EOD

        # If URL was provided, set it in the newly created window
        if [[ -n "$url" ]]; then
            sleep 0.3
            osascript <<EOD
            tell application "Safari"
                set URL of front document to "$url"
            end tell
EOD
        fi

        # If we're creating multiple windows, add a small delay
        if [[ $window_count -gt 1 ]]; then
            sleep 0.3
        fi
    done

    return 0
}

# Initialize variables
URL=""
WINDOW_COUNT=1
PROFILE=""

# Check if multiple windows are requested (x2, x3, etc.)
if [[ $# -gt 0 && "$1" =~ ^x[0-9]+$ ]]; then
    # Extract number after 'x'
    WINDOW_COUNT=${1#x}

    # Validate it's a positive number
    if [[ ! "$WINDOW_COUNT" =~ ^[0-9]+$ || "$WINDOW_COUNT" -lt 1 ]]; then
        echo "Invalid window count: $WINDOW_COUNT. Using 1 instead." >&2
        WINDOW_COUNT=1
    elif [ "$WINDOW_COUNT" -gt 10 ]; then
        echo "Window count too high: $WINDOW_COUNT. Using 10 instead." >&2
        WINDOW_COUNT=10
    fi

    # Remove the window count parameter
    shift
fi

# Check if a profile was requested (p1, p2, p3)
if [[ $# -gt 0 && "$1" =~ ^p[1-3]$ ]]; then
    # Extract profile number
    PROFILE=${1#p}
    shift
fi

# Check if a URL was provided and validate it
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

# If a profile was specified, use that function
if [[ -n "$PROFILE" ]]; then
    open_safari_with_profile "$PROFILE" "$URL" "$WINDOW_COUNT"
    exit $?
fi

# Otherwise, continue with the existing functionality
SAFARI_IS_RUNNING=false
if ps -e | grep -q "[S]afari$"; then
    SAFARI_IS_RUNNING=true
fi

# If Safari is not running, we need to handle it differently
if ! $SAFARI_IS_RUNNING; then
    # Open Safari (which creates the first window)
    if [[ -n "$URL" ]]; then
        open -a "Safari" "$URL"
    else
        open -a "Safari"
    fi

    # Wait a moment for Safari to start
    sleep 0.5

    # Create additional windows (one less since Safari already opened one)
    if [[ $WINDOW_COUNT -gt 1 ]]; then
        for ((i=2; i<=WINDOW_COUNT; i++)); do
            if [[ -n "$URL" ]]; then
                osascript -e "tell application \"Safari\" to make new document with properties {URL:\"$URL\"}"
            else
                osascript -e 'tell application "Safari" to make new document'
            fi
        done
    fi
else
    # Safari is already running, create the requested number of windows
    for ((i=1; i<=WINDOW_COUNT; i++)); do
        if [[ -n "$URL" ]]; then
            osascript -e "tell application \"Safari\" to make new document with properties {URL:\"$URL\"}"
        else
            osascript -e 'tell application "Safari" to make new document'
        fi
    done
fi

# Ensure Safari is in the foreground
osascript -e 'tell application "Safari" to activate'

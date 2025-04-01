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

# Initialize variables
URL=""
WINDOW_COUNT=1

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

# Check if Safari is running
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

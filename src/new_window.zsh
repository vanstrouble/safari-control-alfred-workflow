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

# Check if Safari is running (more reliable check)
if ! ps -e | grep -q "[S]afari$"; then
    # Safari is not running
    if [[ -n "$URL" ]]; then
        # Open Safari with the URL
        open -a "Safari" "$URL"
    else
        # Just open Safari (which opens a window by default)
        open -a "Safari"
    fi
else
    # Safari is already running, create a new window
    if [[ -n "$URL" ]]; then
        osascript -e "tell application \"Safari\" to make new document with properties {URL:\"$URL\"}"
    else
        osascript -e 'tell application "Safari" to make new document'
    fi
fi

# Ensure Safari is in the foreground
osascript -e 'tell application "Safari" to activate'

#!/bin/zsh --no-rcs

# Check if a URL was provided
URL=""
if [[ $# -gt 0 ]]; then
    URL="$1"
    # Add http:// if it doesn't start with http:// or https://
    if [[ ! "$URL" =~ ^https?:// ]]; then
        URL="http://$URL"
    fi
fi

# Check if Safari is running
if ! pgrep -q "Safari"; then
    # Safari is not running, start it
    open -a "Safari"
    # If there's no URL, exit here
    if [[ -z "$URL" ]]; then
        exit 0
    fi
    # Wait a moment for Safari to start
    sleep 0.5
fi

# Open a new window with or without a URL
if [[ -z "$URL" ]]; then
    # Without URL, just open a new window
    osascript -e 'tell application "Safari" to make new document'
else
    # With URL, open a new window with that URL
    osascript -e "tell application \"Safari\" to make new document with properties {URL:\"$URL\"}"
fi

# Ensure Safari is in the foreground
osascript -e 'tell application "Safari" to activate'

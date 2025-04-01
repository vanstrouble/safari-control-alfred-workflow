#!/bin/zsh --no-rcs

# Check if Safari is running
if ! pgrep -q "Safari"; then
    echo "Safari is not running."
    exit 1
fi

# Get the URL of the active tab using AppleScript
CURRENT_URL=$(osascript <<EOF
try
    tell application "Safari"
        if not (exists window 1) then
            return "no_window"
        end if

        if (URL of current tab of window 1) is missing value then
            return "no_url"
        end if

        return URL of current tab of window 1
    end tell
on error
    return "error"
end try
EOF
)

# Check the result
case "$CURRENT_URL" in
    "no_window")
        echo "There are no open windows in Safari."
        exit 1
        ;;
    "no_url")
        echo "The current tab has no URL (it may be a new empty tab)."
        exit 1
        ;;
    "error")
        echo "Error retrieving the URL from Safari."
        exit 1
        ;;
    "")
        echo "Could not retrieve the URL."
        exit 1
        ;;
    *)
        # If we reach here, we have a valid URL
        echo "$CURRENT_URL"
        exit 0
        ;;
esac

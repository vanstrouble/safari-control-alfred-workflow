#!/bin/zsh --no-rcs

# Check if Safari is running
if ! pgrep -q "Safari"; then
    # Return JSON for Alfred with an error message
    echo '{"items":[{"title":"Error","subtitle":"Safari is not running","valid":false}]}'
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

# Trim whitespace including newlines from the URL
CURRENT_URL=$(echo "$CURRENT_URL" | tr -d '\n')

# Check the result
case "$CURRENT_URL" in
    "no_window")
        echo '{"items":[{"title":"Error","subtitle":"There are no open windows in Safari","valid":false}]}'
        exit 1
        ;;
    "no_url")
        echo '{"items":[{"title":"Error","subtitle":"The current tab has no URL (may be a new empty tab)","valid":false}]}'
        exit 1
        ;;
    "error")
        echo '{"items":[{"title":"Error","subtitle":"Error retrieving the URL from Safari","valid":false}]}'
        exit 1
        ;;
    "")
        echo '{"items":[{"title":"Error","subtitle":"Could not retrieve the URL","valid":false}]}'
        exit 1
        ;;
    *)
        # Para URLs válidas, solo emitimos la URL directamente para que Alfred la pase
        echo -n "$CURRENT_URL"  # -n evita añadir un salto de línea adicional
        exit 0
        ;;
esac

#!/bin/zsh --no-rcs

# Function to generate Alfred JSON output
generate_output() {
    local items_array="$1"
    echo '{"items":['"$items_array"']}'
}

# Function to get Safari tabs
get_safari_tabs() {
    osascript <<EOF
    set output to ""
    tell application "Safari"
        repeat with w in windows
            set windowIndex to index of w

            repeat with t in tabs of w
                set tabName to name of t
                set tabURL to URL of t
                if tabURL is missing value then
                    set tabURL to "about:blank"
                end if

                # Format: windowIndex tabName tabURL
                set output to output & windowIndex & " \"" & tabName & "\" \"" & tabURL & "\"\n"
            end repeat
        end repeat
    end tell
    return output
EOF
}

# Función para crear una cadena de coincidencia (match string) para Alfred
create_match_string() {
    local title="$1"
    local url="$2"

    # Eliminar protocolo para el match (como en list-tabs-webkit.js)
    local match_url=$(echo "$url" | sed -E 's|^(https?:)?//||')

    # Decodificar URL para mejor coincidencia
    local decoded_url=$(python3 -c "import sys, urllib.parse; print(urllib.parse.unquote('$match_url'))" 2>/dev/null || echo "$match_url")

    # Reemplazar caracteres no alfanuméricos con espacios (como en list-tabs-webkit.js)
    local clean_url=$(echo "$decoded_url" | sed -E 's/[^a-zA-Z0-9]/ /g')

    # Combinar título y URL para la coincidencia
    echo "${title} ${clean_url}"
}

# Function to format tab items for Alfred JSON
format_tab_items() {
    local tabs_list="$1"
    local items=""
    local first=true

    echo "$tabs_list" | while IFS= read -r line; do
        # Skip empty lines
        [[ -z "$line" ]] && continue

        # Extract window index, tab name, and URL
        local windowIndex=$(echo "$line" | cut -d' ' -f1)
        local tabName=$(echo "$line" | awk -F'"' '{print $2}')
        local tabURL=$(echo "$line" | awk -F'"' '{print $4}')

        # Create match string for Alfred filtering
        local match_string=$(create_match_string "$tabName" "$tabURL")

        # Escape JSON special characters
        tabName=$(echo "$tabName" | sed 's/\\/\\\\/g; s/"/\\"/g')
        tabURL=$(echo "$tabURL" | sed 's/\\/\\\\/g; s/"/\\"/g')
        match_string=$(echo "$match_string" | sed 's/\\/\\\\/g; s/"/\\"/g')

        # Add comma before item if not the first one
        if [ "$first" = true ]; then
            first=false
        else
            echo -n ","
        fi

        # Output item JSON with match property and quicklookurl like in list-tabs-webkit.js
        echo -n '{
            "uid": "'"$windowIndex"'",
            "title": "'"$tabName"'",
            "subtitle": "'"$tabURL"'",
            "arg": "'"$windowIndex,$tabURL"'",
            "icon": {"path": "./icon.png"},
            "match": "'"$match_string"'",
            "quicklookurl": "'"$tabURL"'"
        }'
    done
}

# Main function
main() {
    # Check if Safari is running
    if ! pgrep -q "Safari"; then
        # Return error message
        generate_output '{"title":"Error","subtitle":"Safari is not running","valid":false}'
        return 0
    fi

    # Get all Safari windows and tabs
    local tabs_list=$(get_safari_tabs)

    # Process the output and format for Alfred
    if [[ -z "$tabs_list" ]]; then
        generate_output '{"title":"No tabs found","subtitle":"No open tabs in Safari","valid":false}'
    else
        local formatted_items=$(format_tab_items "$tabs_list")
        generate_output "$formatted_items"
    fi
}

# Run the main function
main

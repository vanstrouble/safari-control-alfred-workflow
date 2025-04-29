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

# Function to create a match string for Alfred
create_match_string() {
    local title="$1"
    local url="$2"
    local match_url=$(echo "$url" | sed -E 's|^(https?:)?//||')

    # Basic URL decoding (replace %20 with space, etc.)
    # This is not as complete as Python but covers the most common cases
    local decoded_url=$(echo "$match_url" |
        sed -e 's/%20/ /g' \
            -e 's/%21/!/g' \
            -e 's/%22/"/g' \
            -e 's/%23/#/g' \
            -e 's/%24/$/g' \
            -e 's/%25/%/g' \
            -e 's/%26/\&/g' \
            -e "s/%27/'/g" \
            -e 's/%28/(/g' \
            -e 's/%29/)/g' \
            -e 's/%2[aA]/*/g' \
            -e 's/%2[bB]/+/g' \
            -e 's/%2[cC]/,/g' \
            -e 's/%2[dD]/-/g' \
            -e 's/%2[eE]/./g' \
            -e 's/%2[fF]/\//g' \
            -e 's/%3[aA]/:/g' \
            -e 's/%3[bB]/;/g' \
            -e 's/%3[cC]/</g' \
            -e 's/%3[dD]/=/g' \
            -e 's/%3[eE]/>/g' \
            -e 's/%3[fF]/?/g' \
            -e 's/%40/@/g')

    # Replace non-alphanumeric characters with spaces (as in list-tabs-webkit.js)
    local clean_url=$(echo "$decoded_url" | sed -E 's/[^a-zA-Z0-9]/ /g')

    # Combine title and URL for the match
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

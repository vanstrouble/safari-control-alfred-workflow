#!/bin/zsh

/usr/bin/sqlite3 \
    "${HOME}/Library/Safari/History.db" \
    ".parameter set :max_items '${max_items}'" \
    "SELECT JSON_OBJECT(
        'cache', JSON_OBJECT('seconds', 5, 'loosereload', true),
        'items', JSON_GROUP_ARRAY(
            JSON_OBJECT(
                'title', IIF(title IS NULL OR title IS '', url, title),
                'subtitle', url,
                'autocomplete', IIF(title IS NULL OR title IS '', url, title),
                'match', title || ' ' || url,
                'arg', url,
                'quicklookurl', url,
                'mods', JSON_OBJECT(
                    'cmd', JSON_OBJECT(
                        'subtitle', '⌘ Copy URL to clipboard'
                    ),
                    'alt', JSON_OBJECT(
                        'subtitle', '⌥ Edit URL'
                    ),
                    'cmd+shift', JSON_OBJECT(
                        'subtitle', '⇧⌘ Copy markdown URL to clipboard',
                        'arg', JSON_OBJECT('url', url, 'title', IIF(title IS NULL OR title IS '', url, title))
                    )
                )
            )
        )
    ) AS JSON_RESULT
    FROM (
        SELECT DISTINCT url, title
        FROM history_items
        INNER JOIN history_visits ON history_visits.history_item = history_items.id
        ORDER BY visit_time DESC
        LIMIT (:max_items * 100)
    )"

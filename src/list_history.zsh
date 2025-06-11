#!/bin/zsh

/usr/bin/sqlite3 \
    "${HOME}/Library/Safari/History.db" \
    ".parameter set :alfred_cache '${alfred_workflow_cache}'" \
    ".parameter set :max_items '${max_items}'" \
    "SELECT JSON_OBJECT(
        'cache', JSON_OBJECT('seconds', 5, 'loosereload', true),
        'items', JSON_GROUP_ARRAY(
            JSON_OBJECT(
                'title', IIF(title IS NULL OR title IS '', url, title),
                'subtitle', url,
                'arg', url,
                'match', title || ' ' || url,
                'icon', JSON_OBJECT(
                    'path', './icon.png'
                )
            )
        )
    ) AS JSON_RESULT
    FROM (
        SELECT url, title
        FROM history_items
        INNER JOIN history_visits ON history_visits.history_item = history_items.id
        GROUP BY url
        ORDER BY visit_time DESC
        LIMIT 30000
    )"

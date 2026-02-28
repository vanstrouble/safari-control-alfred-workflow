function run(argv) {
    const query = argv[0];

    const createLink = (title, url) => `[${title}](${url})`;
    const createListItem = (title, url) => `- ${createLink(title, url)}`;

    const processItems = (items) => {
        if (!Array.isArray(items)) return null;
        const links = items
            .filter(item => item.url && item.title)
            .map(item => createListItem(item.title, item.url));
        return links.length > 0 ? links.join('\n') : null;
    };

    try {
        const data = JSON.parse(query);

        if (data.url && data.title) {
            return createLink(data.title, data.url);
        }

        if (Array.isArray(data)) {
            return processItems(data) || query;
        }

        if (data.items && Array.isArray(data.items)) {
            return processItems(data.items) || query;
        }

        return query;
    } catch {
        if (query.includes('=') && query.includes(';')) {
            const titleMatch = query.match(/title\s*=\s*"([^"]+)"/);
            const urlMatch = query.match(/url\s*=\s*"([^"]+)"/);

            if (titleMatch && urlMatch) {
                const title = titleMatch[1].replace(/\\U([0-9A-Fa-f]{4})/g,
                    (_, code) => String.fromCharCode(parseInt(code, 16)));
                return createLink(title, urlMatch[1]);
            }
        }

    }
}

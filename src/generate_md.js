function run(argv) {
    let query = argv[0];

    try {
        // Parse the JSON input
        const data = JSON.parse(query);

        // If it's a single item with url and title
        if (data.url && data.title) {
            return `[${data.title}](${data.url})`;
        }

        // If it's an array of items
        if (Array.isArray(data)) {
            const links = data.map(item => {
                if (item.url && item.title) {
                    return `- [${item.title}](${item.url})`;
                }
                return '';
            }).filter(link => link !== '');

            return links.join('\n');
        }

        // If data has items array (Alfred format)
        if (data.items && Array.isArray(data.items)) {
            const links = data.items.map(item => {
                if (item.url && item.title) {
                    return `- [${item.title}](${item.url})`;
                }
                return '';
            }).filter(link => link !== '');

            return links.join('\n');
        }

        // Fallback: return original query if can't process
        return query;

    } catch (e) {
        // If JSON parsing fails, return original query
        return query;
    }
}

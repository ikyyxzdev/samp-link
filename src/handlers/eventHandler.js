const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    console.log('[SYSTEM] Initializing Event Handler...');
    const eventsPath = path.join(__dirname, '..', 'events');
    
    // Defensive check: Ensure the events directory exists
    if (!fs.existsSync(eventsPath)) {
        console.warn('[WARNING] Events directory not found. Skipping event initialization.');
        return;
    }

    const eventFolders = fs.readdirSync(eventsPath);
    let eventCount = 0;

    for (const folder of eventFolders) {
        const folderPath = path.join(eventsPath, folder);
        
        // Skip files that might be in the root of the events directory
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(folderPath, file);
            const event = require(filePath);

            // Validate that the event module has the required properties
            if (event.name && event.execute) {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                eventCount++;
            } else {
                console.warn(`[WARNING] The event at ${filePath} is missing the required "name" or "execute" property.`);
            }
        }
    }
    console.log(`[SYSTEM] Successfully loaded ${eventCount} events.`);
};
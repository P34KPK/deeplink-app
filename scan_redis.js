
const { Redis } = require('@upstash/redis');
// Using the RedisLabs URL from .env.local
const redis = new Redis({
    url: 'https://redis-14545.c81.us-east-1-2.ec2.cloud.redislabs.com:14545',
    token: 'Nni0IR5Uzu5boz45iHHGwDVbyLFN8o04',
});

// Wait, @upstash/redis client usually expects an HTTP-based Upstash URL/Token.
// If the user is using a STANDARD Redis connection string (redis://...), 
// the @upstash/redis HTTP client might NOT work if the server isn't Upstash HTTP compatible.
// However, the project package.json has "ioredis" (seen in previous turn 235: package.json analysis).
// I should use 'ioredis' for a standard connection string.

const RedisIO = require('ioredis');
const client = new RedisIO('redis://default:Nni0IR5Uzu5boz45iHHGwDVbyLFN8o04@redis-14545.c81.us-east-1-2.ec2.cloud.redislabs.com:14545');

async function scan() {
    console.log('Scanning Redis (via ioredis)...');
    try {
        const keys = await client.keys('*');
        console.log('Found keys:', keys);

        if (keys.includes('deeplink_history_v1')) {
            const dataStr = await client.get('deeplink_history_v1');
            const data = JSON.parse(dataStr);

            console.log('History Size:', Array.isArray(data) ? data.length : 0);

            if (Array.isArray(data)) {
                const unassigned = data.filter(i => !i.userId);
                const assigned = data.filter(i => i.userId);
                const p34kLinks = data.filter(i => i.userEmail && i.userEmail.includes('p34k'));

                console.log(`Total: ${data.length}`);
                console.log(`Assigned items: ${assigned.length}`);
                console.log(`Unassigned items (Orphans): ${unassigned.length}`);
                console.log(`Items explicitly for 'p34k': ${p34kLinks.length}`);

                // Show a sample p34k link if exists
                if (p34kLinks.length > 0) {
                    console.log('Sample P34K Link:', JSON.stringify(p34kLinks[0], null, 2));
                } else if (unassigned.length > 0) {
                    console.log('Sample Orphan Link:', JSON.stringify(unassigned[0], null, 2));
                }
            }
        }
        client.disconnect();
    } catch (e) {
        console.error(e);
        client.disconnect();
    }
}

scan();

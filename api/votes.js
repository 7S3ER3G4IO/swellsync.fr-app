// Vercel Serverless — Roadmap Votes API
// Uses Supabase REST API directly (no SDK needed)

const SB_URL = 'https://bxudysseskfpmlpagoid.supabase.co';
const SB_KEY = 'sb_publishable_8UPKYf9eOQjX9-5bBGl1CA_XRu8ZkiU';

const headers = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET — fetch all vote counts
    if (req.method === 'GET') {
        try {
            const r = await fetch(`${SB_URL}/rest/v1/roadmap_votes?select=feature_id,count&order=feature_id`, { headers });
            const data = await r.json();
            return res.status(200).json(data);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // POST — cast a vote
    if (req.method === 'POST') {
        const { feature_id } = req.body || {};
        if (feature_id === undefined) return res.status(400).json({ error: 'feature_id required' });

        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';

        try {
            // Check duplicate
            const checkR = await fetch(
                `${SB_URL}/rest/v1/roadmap_voter_log?feature_id=eq.${feature_id}&voter_ip=eq.${encodeURIComponent(ip)}&limit=1`,
                { headers }
            );
            const existing = await checkR.json();
            if (existing && existing.length > 0) {
                return res.status(409).json({ error: 'already_voted' });
            }

            // Get current count
            const countR = await fetch(
                `${SB_URL}/rest/v1/roadmap_votes?feature_id=eq.${feature_id}&limit=1`,
                { headers }
            );
            const current = await countR.json();
            const newCount = (current && current.length > 0 ? current[0].count : 0) + 1;

            // Upsert count
            await fetch(`${SB_URL}/rest/v1/roadmap_votes`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
                body: JSON.stringify({ feature_id: String(feature_id), count: newCount })
            });

            // Log voter IP
            await fetch(`${SB_URL}/rest/v1/roadmap_voter_log`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ feature_id: String(feature_id), voter_ip: ip })
            });

            return res.status(200).json({ feature_id, count: newCount });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

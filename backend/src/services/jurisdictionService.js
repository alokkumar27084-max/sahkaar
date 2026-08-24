// ─────────────────────────────────────────────────────────
// jurisdictionService.js — Nationwide Geographic Society & Federation Router
// ─────────────────────────────────────────────────────────
const db = require('../config/db');

/**
 * Resolves the jurisdictional Primary Cooperative Society & State Federation
 * based on provided location text, district, state, or coordinates.
 */
async function resolveJurisdiction({ locationText = '', district = '', state = '', lat = null, lng = null }) {
  try {
    const rawText = `${locationText} ${district} ${state}`.toLowerCase();

    // 1. Try matching district in cooperative_societies jurisdiction_districts or district field
    const socQuery = `
      SELECT cs.*, f.name AS federation_name, f.state AS federation_state
      FROM cooperative_societies cs
      LEFT JOIN federations f ON cs.federation_id = f.id
      WHERE cs.is_active = true
    `;
    const socRes = await db.query(socQuery);
    const allSocieties = socRes.rows;

    let matchedSociety = null;

    // Check exact district match in text
    for (const soc of allSocieties) {
      if (soc.district && rawText.includes(soc.district.toLowerCase())) {
        matchedSociety = soc;
        break;
      }
      if (Array.isArray(soc.jurisdiction_districts)) {
        for (const dist of soc.jurisdiction_districts) {
          if (rawText.includes(dist.toLowerCase())) {
            matchedSociety = soc;
            break;
          }
        }
      }
      if (matchedSociety) break;
    }

    // 2. If no direct district match, match by state
    if (!matchedSociety) {
      for (const soc of allSocieties) {
        if (soc.jurisdiction_state && rawText.includes(soc.jurisdiction_state.toLowerCase())) {
          matchedSociety = soc;
          break;
        }
      }
    }

    // 3. Fallback to default Bhopal society or first active society
    if (!matchedSociety && allSocieties.length > 0) {
      matchedSociety = allSocieties.find(s => s.district === 'Bhopal') || allSocieties[0];
    }

    // Resolve matching federation
    let federationId = matchedSociety?.federation_id;
    if (!federationId) {
      const fedRes = await db.query(
        "SELECT id FROM federations WHERE is_national = true LIMIT 1"
      );
      federationId = fedRes.rows[0]?.id;
    }

    return {
      society_id: matchedSociety?.id || null,
      society_name: matchedSociety?.name || 'Primary Labour Cooperative Society',
      district: matchedSociety?.district || 'General Jurisdiction',
      federation_id: federationId,
      federation_name: matchedSociety?.federation_name || 'National Apex Labour Cooperative Federation',
    };
  } catch (err) {
    console.error('Jurisdiction Resolution Error:', err);
    return {
      society_id: null,
      society_name: 'General Cooperative Society',
      federation_id: null,
      federation_name: 'National Federation',
    };
  }
}

module.exports = { resolveJurisdiction };

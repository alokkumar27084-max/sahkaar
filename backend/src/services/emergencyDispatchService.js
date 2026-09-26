const db = require('../config/db');

async function offerNextWorker(client, bookingId) {
  const bookingRes = await client.query(`
    SELECT b.*, c.society_id AS original_society_id, s.federation_id, f.razorpay_linked_account_id AS original_linked_account
    FROM bookings b
    JOIN contractors c ON c.id = b.contractor_id
    LEFT JOIN cooperative_societies s ON s.id = c.society_id
    LEFT JOIN federations f ON f.id = s.federation_id
    WHERE b.id = $1 FOR UPDATE OF b`, [bookingId]);
  const booking = bookingRes.rows[0];
  if (!booking || !booking.is_emergency || booking.payment_status !== 'IN_ESCROW' || !['matching', 'offered', 'created'].includes(booking.workflow_status)) return null;
  if (!booking.federation_id || !booking.original_linked_account) {
    await client.query(`UPDATE bookings SET workflow_status='dispatch_escalated', status='PENDING', updated_at=NOW() WHERE id=$1`, [bookingId]);
    return { status: 'federation_payout_not_configured' };
  }

  const candidateRes = await client.query(`
    SELECT c.id, c.user_id, c.society_id, s.name AS society_name
    FROM contractors c
    JOIN cooperative_societies s ON s.id = c.society_id AND s.is_active = true
    WHERE s.federation_id = $1
      AND (c.is_verified = true OR c.verification_status = 'verified')
      AND c.is_available = true
      AND (lower(COALESCE(c.category,'')) = lower($2) OR lower($2) = ANY(SELECT lower(x) FROM unnest(COALESCE(c.categories,'{}')) x))
      AND ($3::text IS NULL OR COALESCE(cardinality(s.jurisdiction_districts),0) = 0 OR EXISTS (
        SELECT 1 FROM unnest(s.jurisdiction_districts) AS district_name WHERE lower(district_name) = lower($3)
      ))
      AND ($4::float8 IS NULL OR $5::float8 IS NULL OR (
        COALESCE(c.lat,c.latitude) IS NOT NULL AND COALESCE(c.lng,c.longitude) IS NOT NULL
        AND earth_distance(ll_to_earth($4::float8,$5::float8), ll_to_earth(COALESCE(c.lat,c.latitude)::float8,COALESCE(c.lng,c.longitude)::float8))
          <= LEAST(COALESCE(c.service_radius_km,15),100) * 1000
      ))
      AND NOT EXISTS (SELECT 1 FROM workforce_dispatch_offers old WHERE old.booking_id=$6 AND old.worker_id=c.id)
    ORDER BY CASE WHEN COALESCE(c.lat,c.latitude) IS NULL OR COALESCE(c.lng,c.longitude) IS NULL THEN 1 ELSE 0 END,
      earth_distance(ll_to_earth(COALESCE($4::float8,0),COALESCE($5::float8,0)),ll_to_earth(COALESCE(c.lat,c.latitude)::float8,COALESCE(c.lng,c.longitude)::float8)) ASC NULLS LAST,
      c.rating DESC NULLS LAST, c.response_time_minutes ASC NULLS LAST
    LIMIT 1`, [booking.federation_id, booking.service_category, booking.service_locality, booking.service_lat, booking.service_lng, bookingId]);
  const worker = candidateRes.rows[0];
  if (!worker) {
    await client.query(`UPDATE bookings SET workflow_status='dispatch_escalated', status='PENDING', updated_at=NOW() WHERE id=$1`, [bookingId]);
    const admins = await client.query(`SELECT id FROM users WHERE role='society_admin' AND society_id=$1`, [booking.original_society_id]);
    for (const admin of admins.rows) {
      await client.query(`INSERT INTO notifications (user_id,message,type) VALUES ($1,$2,'dispatch')`, [admin.id, `Emergency ${booking.service_category} request in ${booking.service_locality || 'your area'} needs dispatcher attention; no eligible worker accepted.`]).catch(() => {});
    }
    return { status: 'dispatch_escalated' };
  }

  const offerRes = await client.query(`
    INSERT INTO workforce_dispatch_offers (worker_id, booking_id, locality, service_category, priority, notes, expires_at)
    VALUES ($1,$2,$3,$4,'emergency',$5,NOW() + INTERVAL '60 seconds')
    RETURNING *`, [worker.id, bookingId, booking.service_locality || 'Local service area', booking.service_category, `Urgent customer booking expires in 60 seconds`]);
  await client.query(`UPDATE bookings SET contractor_id=$1, workflow_status='offered', status='PENDING', dispatch_attempts=dispatch_attempts+1, updated_at=NOW() WHERE id=$2`, [worker.id, bookingId]);
  await client.query(`INSERT INTO notifications (user_id,message,type) VALUES ($1,$2,'dispatch')`, [worker.user_id, `Emergency ${booking.service_category} request in ${booking.service_locality || 'your area'}. Accept within 60 seconds.`]).catch(() => {});
  return { status: 'offered', offer: offerRes.rows[0] };
}

async function start(bookingId) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE bookings SET workflow_status='matching', updated_at=NOW() WHERE id=$1 AND workflow_status='created'`, [bookingId]);
    const result = await offerNextWorker(client, bookingId);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Emergency dispatch start failed:', error);
    return { status: 'failed' };
  } finally {
    client.release();
  }
}

async function respond(offerId, userId, response) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const offerRes = await client.query(`
      SELECT o.*, c.user_id FROM workforce_dispatch_offers o
      JOIN contractors c ON c.id=o.worker_id
      WHERE o.id=$1 AND c.user_id=$2 AND o.status='offered'
      FOR UPDATE OF o`, [offerId, userId]);
    const offer = offerRes.rows[0];
    if (!offer || new Date(offer.expires_at) <= new Date()) {
      if (offer) await client.query(`UPDATE workforce_dispatch_offers SET status='expired', responded_at=NOW() WHERE id=$1`, [offerId]);
      await client.query('ROLLBACK');
      return { status: 'not_found' };
    }
    const updated = await client.query(`UPDATE workforce_dispatch_offers SET status=$1, responded_at=NOW() WHERE id=$2 RETURNING *`, [response, offerId]);
    if (response === 'accepted' && offer.booking_id) {
      const booking = await client.query(`UPDATE bookings SET workflow_status='accepted', status='IN_PROGRESS', accepted_at=NOW(), updated_at=NOW()
        WHERE id=$1 AND workflow_status='offered' AND contractor_id=$2 AND payment_status='IN_ESCROW' RETURNING id`, [offer.booking_id, offer.worker_id]);
      if (!booking.rows[0]) {
        await client.query('ROLLBACK');
        return { status: 'not_found' };
      }
    } else if (response === 'declined' && offer.booking_id) {
      await client.query(`UPDATE bookings SET workflow_status='matching', updated_at=NOW() WHERE id=$1 AND workflow_status='offered'`, [offer.booking_id]);
      await offerNextWorker(client, offer.booking_id);
    }
    await client.query('COMMIT');
    return { status: response, offer: updated.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Emergency dispatch response failed:', error);
    return { status: 'failed' };
  } finally {
    client.release();
  }
}

async function processExpired() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const expired = await client.query(`SELECT id, booking_id FROM workforce_dispatch_offers
      WHERE status='offered' AND expires_at <= NOW() AND booking_id IS NOT NULL
      ORDER BY expires_at ASC LIMIT 20 FOR UPDATE SKIP LOCKED`);
    for (const offer of expired.rows) {
      await client.query(`UPDATE workforce_dispatch_offers SET status='expired', responded_at=NOW() WHERE id=$1`, [offer.id]);
      const booking = await client.query(`UPDATE bookings SET workflow_status='matching', updated_at=NOW()
        WHERE id=$1 AND workflow_status='offered' RETURNING id`, [offer.booking_id]);
      if (booking.rows[0]) await offerNextWorker(client, offer.booking_id);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Emergency offer expiry failed:', error);
  } finally {
    client.release();
  }
}

function startExpiryWorker() {
  const timer = setInterval(processExpired, 5000);
  timer.unref?.();
}

module.exports = { start, respond, startExpiryWorker, processExpired };

# User acceptance testing (UAT) checklist

Use this before go-live after staging rehearsal. Record pass/fail and owner.

## Environment

- [ ] Staging URL(s) and credentials documented
- [ ] `GET /health` returns `200` with `db: ok`
- [ ] HTTPS and `FRONTEND_URL` / CORS match actual origins

## Customer

- [ ] Register / login / logout
- [ ] Search and open contractor profile
- [ ] Service detail → request flow (quick service)
- [ ] Booking checkout → payment (test mode or small real txn)
- [ ] Chat: open thread, send message, receive (two browsers or devices)
- [ ] Notifications: new booking/message visible; mark read
- [ ] Profile page (`/profile`) save and avatar (if used)

## Contractor

- [ ] Register as contractor with profile
- [ ] Dashboard shows incoming bookings
- [ ] Chat with customer
- [ ] Availability / profile edits as applicable

## Admin

- [ ] Admin login (seeded or invited admin only)
- [ ] Verify pending contractor
- [ ] Resolve a report (if applicable)

## Go / no-go

- [ ] No open P0 security or data-integrity issues
- [ ] Rollback steps in [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) understood
- [ ] On-call contact for first 48h after launch

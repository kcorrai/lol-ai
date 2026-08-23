# TASK-015 — Beta Launch Preparation & Production Checklist

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 1 day

---

## Objective

Complete all pre-launch checks before opening the beta to real users. This task is not about building features — it's about ensuring the product is safe, stable, and professional enough to put in front of real players.

---

## Acceptance Criteria

### Security

- [ ] All environment variables set in Vercel (production)
- [ ] No secrets in source code or git history (run `git log -S "sk_" --all` to verify)
- [ ] CSP headers configured in `next.config.js`
- [ ] Rate limiting active on all API routes (Upstash Ratelimit or custom Redis)
- [ ] Input validation (Zod) on all API route handlers
- [ ] Auth middleware covers all `(app)/` routes

### Performance

- [ ] Lighthouse score ≥ 90 on landing page
- [ ] P95 API response time < 2s on match history endpoint (test with k6 or similar)
- [ ] No N+1 queries (verify with Prisma query logging enabled in dev)

### Monitoring

- [ ] Sentry configured (frontend + backend error tracking)
- [ ] Vercel Analytics enabled
- [ ] AI cost tracking dashboard query working (admin page)

### Legal / Compliance

- [ ] Privacy policy page exists at `/privacy`
- [ ] Terms of service page exists at `/terms`
- [ ] Riot Games Legal Jibber Jabber compliance notice on landing page footer
  - Required text: "LoL AI Coach isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties."
- [ ] Cookie consent banner (if analytics cookies used)

### Error Handling

- [ ] 404 page (`not-found.tsx`) exists and is styled
- [ ] 500 error page (`error.tsx`) exists and is styled
- [ ] Riot API down → user sees friendly message, not a 500
- [ ] AI provider down → user sees friendly message, report marked `failed`

### Quality

- [ ] All 13 previous tasks have passing CI
- [ ] Beta tested internally with 5 real Riot accounts on different servers
- [ ] AI report tested on at least 20 real player accounts, avg rating ≥ 3.8/5
- [ ] No console errors in browser on any page

---

## Checklist for Deployment

```
1. Set all production env vars in Vercel dashboard
2. Run prisma migrate deploy on production DB
3. Run npm run sync:champions on production
4. Verify Stripe webhook endpoint registered in Stripe dashboard
5. Verify Riot API production key (if obtained; use dev key if not)
6. Test full user journey in production:
   Register → Connect Riot → Sync → View matches → Generate report → Subscribe
7. Monitor Sentry for first 24 hours post-launch
```

---

## Dependencies

All previous tasks (TASK-001 through TASK-014).

---

## Notes

Beta launch = invite-only (limited sign-ups via waitlist or direct invite). This is intentional: it allows monitoring the system under real load before opening to everyone. Collect feedback from beta users before Phase 2 prioritization.

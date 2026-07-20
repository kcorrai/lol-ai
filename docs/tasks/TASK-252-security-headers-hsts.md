# TASK-252 — Missing HSTS and Permissions-Policy headers

## Problem
`next.config.mjs` `headers()` sets four security headers and is missing two:

| Header | Status |
|---|---|
| Content-Security-Policy | ✅ set (reasonable, scoped allowlists) |
| X-Content-Type-Options | ✅ `nosniff` |
| X-Frame-Options | ✅ `DENY` |
| Referrer-Policy | ✅ `strict-origin-when-cross-origin` |
| **Strict-Transport-Security** | ❌ **missing** |
| **Permissions-Policy** | ❌ **missing** |

Without HSTS, a user who reaches the site over plain `http://` on an untrusted network can be held
on HTTP by an active MITM (sslstrip) and their session cookie captured on that first request, before
any redirect to HTTPS happens. HSTS instructs the browser to refuse plaintext for the whole domain on
every subsequent visit.

Without `Permissions-Policy` the browser grants the origin default access to camera, microphone and
geolocation — powers this app never uses. Denying them removes the surface entirely and blocks a
compromised third-party script or injected iframe from prompting the user for them.

## Change
`next.config.mjs` — two entries added to the existing `headers()` array:

```js
{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
```

`max-age` is two years, the value required for [hstspreload.org](https://hstspreload.org) submission.
`includeSubDomains` is safe here: the app is served from a single apex domain with no plaintext-only
subdomain.

## Why HSTS is safe to send in development
Vercel serves preview and production over HTTPS only, so the header never strands a deployment. It is
emitted on `localhost` too, but browsers ignore HSTS on `localhost` and on bare IPs, so local HTTP
development is unaffected.

## Verification
`curl -sI https://<deployment>/ | grep -i "strict-transport\|permissions-policy"` returns both
headers. Rerun after deploy; headers are set by the framework, not the CDN, so they apply to every
route matched by the existing `/(.*)` source.

refs TASK-252

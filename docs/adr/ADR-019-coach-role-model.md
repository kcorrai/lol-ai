# ADR-019: Being a coach is a row, not a role

## Status: Accepted

## Context

The coach marketplace (LA-19) introduces a second kind of participant. The
obvious modelling is a `role` column on `users`, or a roles table.

Two things make that wrong here.

**The NextAuth contract.** `users` is the adapter's table and its field names
are an exact contract (ADR-003) — the credentials-password-in-`Account`
arrangement already shows how little slack there is. CLAUDE.md §8.2 also flags
any change to authentication or authorization as needing explicit review, and a
role column is exactly that.

**One person is usually both.** A coach queues too. They have a rank, a match
history, an AI report and a dashboard, and they are also selling sessions. A
role column forces a choice that the product does not want anybody to make, and
the alternative — a set of roles — is a permission framework this codebase does
not otherwise have and does not need.

## Decision

**Being a coach is having an approved `coach_profiles` row.** There is no role
column and no roles table.

- `ownCoachProfileId(userId)` gates the coach-side writes.
- `approvedCoachProfileId(userId)` gates anything a student can see.
- The storefront filters on `coach_profiles.status`, so nothing a coach
  prepares before approval is visible.
- Admin remains the existing single `ADMIN_EMAIL` check (`withAdminAuth`).

## Consequences

**Positive.** The NextAuth tables are untouched. One account can be a student
and a coach at once, which is the common case rather than an edge one. There is
no permission system to keep in sync with anything — "is this user a coach" is a
row lookup with an obvious answer.

**Negative.** Every coach-side service starts with the same lookup, which is one
more query per write. The alternative was putting the coach profile id in the
JWT, which would have made suspending a coach take effect only on their next
login — a bad trade for a marketplace where suspension is a safety tool.

A third participant type (an agency, say) would need this revisited. Nothing
here generalises to N roles, deliberately.

# Meta App Review — submission notes

This is the actual blocker for multi-tenant, not anything in the code. Right now the Meta app is
in Development mode, so Instagram OAuth only completes for accounts added as **testers** — that's
a manual, one-by-one process (see README's "New client setup"). Going **Live** removes that gate
and lets any Instagram Business/Creator account connect through self-serve OAuth. The review
itself typically takes **2-4 weeks** and can't be sped up by writing more code, so submit it as
early as possible — everything else (billing, onboarding polish) can build in parallel, it just
won't be reachable by real strangers until this clears.

## Permissions to request

Exactly what `app/api/instagram/login/route.ts` requests today — request Advanced Access for all
three, nothing more:

| Permission | What it's for in this app |
|---|---|
| `instagram_business_basic` | Read the connecting account's username and profile picture to identify them and show it in the sidebar/header. |
| `instagram_business_manage_messages` | Send and receive DMs — auto-reply to DM keywords, the live inbox (manual replies + read receipts + typing indicator), and Instagram's native ice-breaker DM entry points. |
| `instagram_business_manage_comments` | Read comments on the account's own posts/reels and post automated public replies — the comment-to-DM funnel feature. |

Don't request `instagram_business_content_publish` — nothing in the current code path uses it
(the reel-scheduling tables in `schema.sql` are unused leftovers, per the README).

## Per-permission justification text (draft — paste into the App Review form)

**instagram_business_basic:**
> Wingman lets an Instagram Business or Creator account owner connect their account and set up
> automated replies. We use this permission to read the connected account's username and profile
> picture so the dashboard can identify which account is connected and display it in the UI.

**instagram_business_manage_messages:**
> Wingman automates a business's Instagram DMs on their own behalf, after they connect their own
> account. This permission is used to (1) send automated DM replies when a configured keyword or
> trigger fires, (2) let the account owner view and manually reply to their own conversations in a
> live inbox, and (3) set the account's ice-breaker questions, Instagram's native DM entry point.
> All messages are sent only in response to a genuine incoming action (a DM, comment, or story
> interaction) from the business's own audience — never unsolicited or bulk.

**instagram_business_manage_comments:**
> Used to let the connected account owner configure automated public replies to comments on their
> own posts/reels (e.g. replying "Sent you a DM!" when someone comments a keyword), and to read
> comment content so trigger keywords can be matched.

## Other required fields

- **Privacy Policy URL**: `https://<domain>/privacy`
- **Data Deletion Instructions URL**: `https://<domain>/privacy#data-deletion` (added this
  session — self-service disconnect clears the token immediately, full data deletion by email
  request within 30 days).
- **App icon**, **category**, **business verification**: not code-related, need your own assets/
  business details in the Meta dashboard. Business verification in particular can itself take
  1-2 weeks and may be requested before Advanced Access is granted for `manage_messages` — worth
  starting that in parallel with the review submission, not after.

## Screencast

Meta requires a screen recording per permission showing the real user flow end to end — connect
account, trigger the feature, show the result **in the actual Instagram app**, not just this
dashboard. [`tests/automations-demo.spec.ts`](tests/automations-demo.spec.ts) (built earlier this
project) already scripts a full walkthrough of the dashboard side — comment/DM/story automation
setup — and can be recorded as the base for the dashboard portion. It doesn't show the Instagram
app receiving the message, though; you'll still need a short phone-screen recording of a real
comment/DM landing and the automated reply arriving, since reviewers specifically check for that.

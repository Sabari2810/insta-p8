import { test, expect, type Locator, type Page } from "@playwright/test"
import { clickWithCursor, installCursor } from "./utils/cursor"

/**
 * Single scripted walkthrough for screen-recording a demo video.
 * Mirrors wingman-automations-demo-script.md scene for scene — narrate that
 * script over this recording and the beats line up.
 *
 * Before recording: restart `npm run dev` so the demo-mode mock database is
 * empty (it's in-memory and persists across runs on the same server process —
 * re-running this test without restarting will pile up duplicate rules).
 *
 * Speed knob: DEMO_PACE=2 npm run demo slows every pause down further if you
 * want more breathing room for narration; DEMO_PACE=0.7 speeds it back up.
 * Default is already paced for recording, not test-speed.
 */

const PACE = process.env.DEMO_PACE ? Number(process.env.DEMO_PACE) : 1.5
const beat = (page: Page, ms: number) => page.waitForTimeout(ms * PACE)
const click = (page: Page, locator: Locator) => clickWithCursor(page, locator)

test("Wingman demo — comment, DM, and story automations", async ({ page }) => {
  test.setTimeout(10 * 60 * 1000)
  await installCursor(page)

  // ---------- Scene 0: landing + dev login ----------
  await page.goto("/")
  await beat(page, 1800)
  await click(page, page.getByRole("button", { name: "Dev Login" }))
  await page.waitForURL("**/dashboard")
  await beat(page, 2200)

  // ---------- Scene 1: Automations page ----------
  await page.goto("/automations")
  await expect(page.getByRole("heading", { name: "Automations" })).toBeVisible()
  await beat(page, 2500)

  // ================= Scene 2-4: COMMENT AUTOMATION =================
  await click(page, page.getByRole("button", { name: "New Rule" }))
  await beat(page, 1000)

  await click(page, page.getByRole("button", { name: "All Posts & Reels" }))
  await beat(page, 900)

  const commentKeyword = page.getByPlaceholder("type keyword, press Enter (e.g. guide)")
  await click(page, commentKeyword)
  await commentKeyword.pressSequentially("sale", { delay: 110 })
  await beat(page, 400)
  await commentKeyword.press("Enter")
  await beat(page, 1500)

  await click(page, page.getByRole("button", { name: "Continue" }))
  await beat(page, 1100)

  const commentMessage = page.getByPlaceholder("Type the message to send in DMs...")
  await click(page, commentMessage)
  await commentMessage.pressSequentially(
    "Here's 20% off — sale ends Friday! Use code SALE20 at checkout.",
    { delay: 32 },
  )
  await beat(page, 1800)

  await click(page, page.getByRole("button", { name: "Continue" }))
  await beat(page, 1300)

  await click(page, page.getByRole("button", { name: "Go Live" }))
  await beat(page, 2800)

  // ================= Scene 5-6: DM AUTOMATION =================
  await click(page, page.getByRole("button", { name: /^DMs\b/ }))
  await beat(page, 1300)

  await click(page, page.getByRole("button", { name: "New Rule" }))
  await beat(page, 1000)

  const dmKeyword = page.getByPlaceholder("type keyword, press Enter (e.g. price)")
  await click(page, dmKeyword)
  await dmKeyword.pressSequentially("bundle", { delay: 110 })
  await beat(page, 400)
  await dmKeyword.press("Enter")
  await beat(page, 1500)

  await click(page, page.getByRole("button", { name: "Continue" }))
  await beat(page, 1100)

  const dmMessage = page.getByPlaceholder("Type the message to send in DMs...")
  await click(page, dmMessage)
  await dmMessage.pressSequentially(
    "Here's our bundle deal — 3 products, one price. Want the link?",
    { delay: 32 },
  )
  await beat(page, 1800)

  await click(page, page.getByRole("button", { name: "Continue" }))
  await beat(page, 1300)

  await click(page, page.getByRole("button", { name: "Go Live" }))
  await beat(page, 2800)

  // ================= Scene 7-8: STORY AUTOMATION =================
  await click(page, page.getByRole("button", { name: /^Stories\b/ }))
  await beat(page, 1300)

  await click(page, page.getByRole("button", { name: "New Rule" }))
  await beat(page, 1000)

  await click(page, page.getByRole("button", { name: "Reacts" }))
  await beat(page, 1000)

  const storyEmoji = page.getByPlaceholder("e.g. ❤️, 🔥, 👍")
  await click(page, storyEmoji)
  await storyEmoji.pressSequentially("⭐", { delay: 110 })
  await beat(page, 400)
  await storyEmoji.press("Enter")
  await beat(page, 1500)

  await click(page, page.getByRole("button", { name: "Continue" }))
  await beat(page, 1100)

  const storyMessage = page.getByPlaceholder("Type the message to send in DMs...")
  await click(page, storyMessage)
  await storyMessage.pressSequentially(
    "Thanks for the reaction! Here's something for you 👇",
    { delay: 32 },
  )
  await beat(page, 1800)

  await click(page, page.getByRole("button", { name: "Continue" }))
  await beat(page, 1300)

  await click(page, page.getByRole("button", { name: "Go Live" }))
  await beat(page, 2800)

  // ---------- Scene 9: the finished list ----------
  await click(page, page.getByRole("button", { name: /^Comments\b/ }))
  await expect(page.getByText('Reply to "sale"')).toBeVisible()
  await beat(page, 3200)
})

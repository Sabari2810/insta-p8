import { test, expect, type Page } from "@playwright/test"

/**
 * Single scripted walkthrough for screen-recording a demo video.
 * Mirrors wingman-automations-demo-script.md scene for scene — narrate that
 * script over this recording and the beats line up.
 *
 * Before recording: restart `npm run dev` so the demo-mode mock database is
 * empty (it's in-memory and persists across runs on the same server process —
 * re-running this test without restarting will pile up duplicate rules).
 *
 * Speed knob: DEMO_PACE=1.5 npm run demo slows every pause down by 1.5x if you
 * want more breathing room for narration; DEMO_PACE=0.5 speeds it up.
 */

const PACE = process.env.DEMO_PACE ? Number(process.env.DEMO_PACE) : 1
const beat = (page: Page, ms: number) => page.waitForTimeout(ms * PACE)

test("Wingman demo — comment, DM, and story automations", async ({ page }) => {
  test.setTimeout(5 * 60 * 1000)

  // ---------- Scene 0: landing + dev login ----------
  await page.goto("/")
  await beat(page, 1500)
  await page.getByRole("button", { name: "Dev Login" }).click()
  await page.waitForURL("**/dashboard")
  await beat(page, 1800)

  // ---------- Scene 1: Automations page ----------
  await page.goto("/automations")
  await expect(page.getByRole("heading", { name: "Automations" })).toBeVisible()
  await beat(page, 2000)

  // ================= Scene 2-4: COMMENT AUTOMATION =================
  await page.getByRole("button", { name: "New Rule" }).click()
  await beat(page, 800)

  await page.getByRole("button", { name: "All Posts & Reels" }).click()
  await beat(page, 700)

  const commentKeyword = page.getByPlaceholder("type keyword, press Enter (e.g. guide)")
  await commentKeyword.click()
  await commentKeyword.pressSequentially("sale", { delay: 70 })
  await commentKeyword.press("Enter")
  await beat(page, 1200)

  await page.getByRole("button", { name: "Continue" }).click()
  await beat(page, 900)

  const commentMessage = page.getByPlaceholder("Type the message to send in DMs...")
  await commentMessage.click()
  await commentMessage.pressSequentially(
    "Here's 20% off — sale ends Friday! Use code SALE20 at checkout.",
    { delay: 18 },
  )
  await beat(page, 1400)

  await page.getByRole("button", { name: "Continue" }).click()
  await beat(page, 1000)

  await page.getByRole("button", { name: "Go Live" }).click()
  await beat(page, 2200)

  // ================= Scene 5-6: DM AUTOMATION =================
  await page.getByRole("button", { name: /^DMs\b/ }).click()
  await beat(page, 1000)

  await page.getByRole("button", { name: "New Rule" }).click()
  await beat(page, 800)

  const dmKeyword = page.getByPlaceholder("type keyword, press Enter (e.g. price)")
  await dmKeyword.click()
  await dmKeyword.pressSequentially("bundle", { delay: 70 })
  await dmKeyword.press("Enter")
  await beat(page, 1200)

  await page.getByRole("button", { name: "Continue" }).click()
  await beat(page, 900)

  const dmMessage = page.getByPlaceholder("Type the message to send in DMs...")
  await dmMessage.click()
  await dmMessage.pressSequentially(
    "Here's our bundle deal — 3 products, one price. Want the link?",
    { delay: 18 },
  )
  await beat(page, 1400)

  await page.getByRole("button", { name: "Continue" }).click()
  await beat(page, 1000)

  await page.getByRole("button", { name: "Go Live" }).click()
  await beat(page, 2200)

  // ================= Scene 7-8: STORY AUTOMATION =================
  await page.getByRole("button", { name: /^Stories\b/ }).click()
  await beat(page, 1000)

  await page.getByRole("button", { name: "New Rule" }).click()
  await beat(page, 800)

  await page.getByRole("button", { name: "Reacts" }).click()
  await beat(page, 800)

  const storyEmoji = page.getByPlaceholder("e.g. ❤️, 🔥, 👍")
  await storyEmoji.click()
  await storyEmoji.pressSequentially("⭐", { delay: 70 })
  await storyEmoji.press("Enter")
  await beat(page, 1200)

  await page.getByRole("button", { name: "Continue" }).click()
  await beat(page, 900)

  const storyMessage = page.getByPlaceholder("Type the message to send in DMs...")
  await storyMessage.click()
  await storyMessage.pressSequentially(
    "Thanks for the reaction! Here's something for you 👇",
    { delay: 18 },
  )
  await beat(page, 1400)

  await page.getByRole("button", { name: "Continue" }).click()
  await beat(page, 1000)

  await page.getByRole("button", { name: "Go Live" }).click()
  await beat(page, 2200)

  // ---------- Scene 9: the finished list ----------
  await page.getByRole("button", { name: /^Comments\b/ }).click()
  await expect(page.getByText('Reply to "sale"')).toBeVisible()
  await beat(page, 2500)
})

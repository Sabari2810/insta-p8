import type { Locator, Page } from "@playwright/test"

/**
 * Playwright drives the browser through CDP input events — it never moves the
 * real OS cursor sprite, so a screen recording of a headed run shows elements
 * reacting with no visible pointer. This injects a fake cursor into the page
 * itself (a styled div that tracks real mousemove events) so clicks are
 * visible on recording.
 */
const CURSOR_INIT_SCRIPT = `
(() => {
  if (window.__demoCursor) return;
  const el = document.createElement('div');
  el.id = '__demo_cursor__';
  Object.assign(el.style, {
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '22px',
    height: '22px',
    marginTop: '-11px',
    marginLeft: '-11px',
    borderRadius: '50%',
    background: 'rgba(91,70,242,0.55)',
    border: '2px solid rgba(255,255,255,0.95)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
    pointerEvents: 'none',
    zIndex: '2147483647',
    transition: 'transform 380ms cubic-bezier(.2,.7,.2,1), width 120ms ease, height 120ms ease, margin 120ms ease, background 120ms ease',
    willChange: 'transform',
  });
  document.documentElement.appendChild(el);
  window.__demoCursor = el;
  window.addEventListener('mousemove', (e) => {
    el.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
  }, true);
  window.addEventListener('mousedown', () => {
    el.style.width = '15px';
    el.style.height = '15px';
    el.style.marginTop = '-7.5px';
    el.style.marginLeft = '-7.5px';
    el.style.background = 'rgba(91,70,242,0.95)';
  }, true);
  window.addEventListener('mouseup', () => {
    el.style.width = '22px';
    el.style.height = '22px';
    el.style.marginTop = '-11px';
    el.style.marginLeft = '-11px';
    el.style.background = 'rgba(91,70,242,0.55)';
  }, true);
})();
`

/** Registers the fake-cursor injection for every navigation in this page's lifetime. Call once, before the first goto(). */
export async function installCursor(page: Page) {
  await page.addInitScript(CURSOR_INIT_SCRIPT)
}

/**
 * Moves the fake cursor to the center of `locator`, pauses so the glide is
 * visible, presses down, pauses again, releases — instead of an instant
 * teleport-and-click. Use this in place of locator.click() throughout the demo.
 */
export async function clickWithCursor(
  page: Page,
  locator: Locator,
  opts?: { arrive?: number; settle?: number },
) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) throw new Error("clickWithCursor: element has no bounding box (not visible?)")
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2

  await page.mouse.move(x, y, { steps: 20 })
  await page.waitForTimeout(opts?.arrive ?? 500) // let the glide animation finish before pressing
  await page.mouse.down()
  await page.waitForTimeout(100)
  await page.mouse.up()
  await page.waitForTimeout(opts?.settle ?? 200)
}

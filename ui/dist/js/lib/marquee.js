// Continuous marquee for single-line text that overflows its container —
// used for now-playing artist/title lines that can't be widened (fixed hero
// width, mini-player width). Only ever scrolls when the text actually
// overflows; short text renders as a normal static line.
//
// Standard "duplicate track" technique: the text is rendered twice back to
// back, the track is animated left by exactly one copy's width (+ gap), so
// the loop point is invisible — the moment the first copy scrolls fully out,
// the second copy is sitting exactly where the first one started.

const GAP_PX = 40;
const SPEED_PX_PER_SEC = 34;

function ensureStructure(container) {
    if (container._marqueeReady) return;
    container._marqueeReady = true;
    container.classList.add("marquee");

    const track = document.createElement("div");
    track.className = "marquee-track";
    const primary = document.createElement("span");
    primary.className = "marquee-item";
    const clone = document.createElement("span");
    clone.className = "marquee-item";
    clone.setAttribute("aria-hidden", "true");
    track.append(primary, clone);
    container.replaceChildren(track);

    container._marqueePrimary = primary;

    // clientWidth/scrollWidth aren't reliable until layout has settled after
    // a text or size change — ResizeObserver's callback already runs after
    // layout, so it's the one measurement path that's actually trustworthy.
    const ro = new ResizeObserver(() => measure(container));
    ro.observe(container);
}

function measure(container) {
    const primary = container._marqueePrimary;
    if (!primary) return;
    const containerWidth = container.clientWidth;
    const textWidth = primary.scrollWidth;
    const overflowing = textWidth > containerWidth + 1;
    container.classList.toggle("is-overflowing", overflowing);
    if (!overflowing) return;

    const distance = textWidth + GAP_PX;
    container.style.setProperty("--marquee-distance", `${distance}px`);
    container.style.setProperty("--marquee-gap", `${GAP_PX}px`);
    container.style.setProperty("--marquee-duration", `${(distance / SPEED_PX_PER_SEC).toFixed(2)}s`);
}

/**
 * Sets the text of a marquee-enabled container, scrolling it continuously if
 * (and only if) it overflows the container's current width. Safe to call on
 * every render tick — it no-ops when the text hasn't changed, and re-measures
 * on its own whenever the container is resized (font load, window resize,
 * responsive breakpoints, sidebar toggles, …).
 *
 * @param {HTMLElement} container - an empty, block-level element with a
 *   bounded width (the marquee measures against its own clientWidth).
 * @param {string} text
 */
export function setMarqueeText(container, text) {
    if (!container) return;
    const value = String(text ?? "");
    ensureStructure(container);
    if (container._marqueeText === value) return;
    container._marqueeText = value;

    const [primary, clone] = container.querySelectorAll(".marquee-item");
    primary.textContent = value;
    clone.textContent = value;

    // Reset first so a long->short->long text change can't get stuck
    // reporting the old overflow state before the new size is measured.
    container.classList.remove("is-overflowing");
    requestAnimationFrame(() => measure(container));
}

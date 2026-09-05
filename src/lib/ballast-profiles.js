// Measured profiles of real sites, so this test page can be made to behave like them.
//
// Every same-paint number this project produced was measured on this site as it normally is:
// 592 DOM nodes, 3 long tasks, 262 ms of main-thread blocking. That is a fraction of any real
// page, so "it paints in the same frame here" never licensed "it will paint in the same frame
// on your site". These profiles exist so that claim can be tested rather than asserted.
//
// Captured 2026-08-27, headless Chromium 1440x900, cold profile per run, from India:
//
//   site                nodes  scripts  longTasks>=50ms  blocked   FCP(no Preta)
//   amazon.in           1,937      142                6    593ms       488-536ms
//   flipkart.com        2,003       19                5    815ms             680
//   bankofamerica.com   2,811       59               13  2,119ms           1,568
//   boat-lifestyle.com  5,473      142               19  1,688ms       896-1,032
//   saas-nextjs-flax      592       28                3    262ms       680-1,828
//
// TWO OF THESE FIGURES ARE NOT TRUSTWORTHY AND ARE NOT MODELLED. flipkart and BoA both
// reported 0 KB of script bytes, which is not possible — their scripts are cross-origin without
// `Timing-Allow-Origin`, so the browser zeroes transferSize on the timing entry. Masked, not
// absent. (Preta's own worker sets that header for exactly this reason.) So bytes are ignored
// here and the profiles are matched on node count, script count, and blocking time, which were
// all read directly.
//
// THE SHAPE OF THE BLOCKING MATTERS AS MUCH AS THE TOTAL. Amazon runs 142 scripts but only SIX
// tasks over 50 ms, totalling 593 ms — about 99 ms each. It is not 142 small costs, it is a
// handful of expensive third parties inside a crowd of cheap ones. A model that spread 593 ms
// evenly over 142 files would produce zero long tasks and would not reproduce the contention
// being tested at all. So each profile declares how many HEAVY scripts it has and how long each
// one runs; the rest are cheap.
export const PROFILES = {
    // The hardest case for us, and the reason it is the default: heavy AND fast to paint.
    // Its own content is on screen at ~490 ms, which is about when our config and bundle
    // finish. Every profile below paints later than this one and is therefore easier.
    amazon: { nodes: 1937, scripts: 142, heavy: 6, heavyMs: 99, blocked: 593 },
    flipkart: { nodes: 2003, scripts: 19, heavy: 5, heavyMs: 163, blocked: 815 },
    boa: { nodes: 2811, scripts: 59, heavy: 13, heavyMs: 163, blocked: 2119 },
    boat: { nodes: 5473, scripts: 142, heavy: 19, heavyMs: 89, blocked: 1688 },
    // The page as it was before any of this — kept so the light baseline is reproducible from
    // the same code rather than from memory of an earlier measurement.
    none: { nodes: 592, scripts: 28, heavy: 0, heavyMs: 0, blocked: 262 },
};

// This page's own weight with no ballast, subtracted so a profile's totals are absolute
// targets rather than additions.
export const BASE_NODES = 592;
export const BASE_SCRIPTS = 28;

// Calibrated on this machine, in two corrected steps: PASSES=12 gave 3 ms per file and
// PASSES=240 gave 22-25 ms, so it is ~0.1 ms per pass, not the 0.25 first extrapolated.
// Measured at ROWS_AT_CALIBRATION rows per file; the cost of a pass is linear in the row count,
// so both move together below.
export const MS_PER_PASS = 0.1015;
export const ROWS_AT_CALIBRATION = 140;

// Total download the vendor stack should add, kept inside the real band (amazon 451 KB, boAt
// 753 KB). This has to be a budget rather than a per-file constant: a fixed 140 rows per file
// was fine at 24 files (624 KB) and produced 3.2 MB at amazon's 114 — five times the real band,
// which would have added bandwidth contention the real sites do not have and measured that
// instead of hydration.
export const TARGET_VENDOR_BYTES = 600 * 1024;
export const BYTES_PER_ROW = 180; // measured: ~25 KB for 140 rows

// ~14 DOM nodes per rendered card, measured: 300 cards took the page from 592 to 4,816.
export const NODES_PER_CARD = 14;

export function planFor(name) {
    const p = PROFILES[name] || PROFILES.none;
    // Never negative: flipkart runs FEWER scripts than this page already has, so it gets none
    // added rather than a nonsensical negative count. (Which is also why flipkart's 815 ms of
    // blocking cannot be reproduced by this model — its cost is its own framework, not third
    // parties. Measured at 305 ms and reported as a miss rather than smoothed over.)
    const vendors = Math.max(0, p.scripts - BASE_SCRIPTS);
    // Split the byte budget across however many files this profile calls for, so the download
    // stays in band whether that is 31 files or 116.
    const rows = vendors > 0
        ? Math.min(200, Math.max(10, Math.round(TARGET_VENDOR_BYTES / vendors / BYTES_PER_ROW)))
        : 0;
    // A pass costs less when there are fewer rows to walk, so the calibration has to travel
    // with the row count or the heavy scripts silently stop clearing the 50 ms threshold that
    // the target figures are counted at.
    const msPerPass = MS_PER_PASS * (rows / ROWS_AT_CALIBRATION);
    return {
        name,
        cards: Math.max(0, Math.round((p.nodes - BASE_NODES) / NODES_PER_CARD)),
        vendors,
        rows,
        heavy: p.heavy,
        heavyPasses: msPerPass > 0 ? Math.round(p.heavyMs / msPerPass) : 0,
        target: p,
    };
}

// Default is 'amazon', not the heaviest profile, and that choice is the opposite of flattering.
//
// Heavy pages are the EASY case for us: more weight pushes the customer's own first paint later,
// which widens the margin our chain has to land inside. The case that actually beats us is a page
// that paints FAST — the only late run ever observed (+162 ms, 1 of 22) was the run where the
// page's own content appeared earliest, at 449 ms against 509-1,360 ms elsewhere.
//
// Amazon is the one profile in the set that is heavy AND fast: 142 scripts and 593 ms of blocking,
// with its own content on screen at 488-536 ms. boAt is bigger but paints at 896-1,032 ms, so
// deploying that would be picking the kinder test.
export const ACTIVE = process.env.NEXT_PUBLIC_BALLAST || 'amazon';

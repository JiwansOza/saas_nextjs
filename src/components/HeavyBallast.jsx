"use client";

import { useState } from "react";
import { ACTIVE, planFor } from "@/lib/ballast-profiles";

// Which real site this page is currently pretending to be. Set at BUILD time:
//
//   NEXT_PUBLIC_BALLAST=amazon npm run build
//
// Build time, not a query parameter, and the reason is worth knowing: reading a search param
// would force this route out of static prerendering, and that alone is a large timing change on
// this site — removing cookies() from the layout once moved /boot's start from 270 ms to 49 ms
// purely by letting the routes prerender again. A profile switch that quietly changed how the
// page is delivered would be measuring itself.
//
// It also means only ONE profile can be live at a time. Element scope is an exact pathname
// match (pathAllowsScope in the loader: `current === required`, no patterns), the live element
// is scoped to "/", so per-profile routes would each need their own element. Profiles are
// therefore swept locally and one is deployed.
const plan = planFor(ACTIVE);

// The vendor scripts are rendered as plain async <script> tags, which React 19 hoists into
// <head> during SSR — so they are in the initial HTML and execute DURING load, contending with
// Preta's bundle, which is the whole point. Loading them from a useEffect instead would run
// them after hydration, far too late to contend with anything.

// Weight ballast — a measurement instrument, not a feature.
//
// Every same-paint number this project has ever produced was measured on this site, and this
// site is far lighter than the pages Preta is meant to run on. Measured the same afternoon,
// homepage against the real thing:
//
//   site                  DOM nodes   long tasks >=50ms   main thread blocked
//   amazon.in                 1,937                   6               593 ms
//   flipkart.com              2,003                   5               815 ms
//   bankofamerica.com         2,811                  13             2,119 ms
//   boat-lifestyle.com        5,473                  19             1,688 ms
//   saas-nextjs-flax            592                   3               262 ms
//
// So "it paints in the same frame" had only ever been shown on a page with a third of the DOM
// and a fraction of the hydration cost of the smallest real site in that list. The open
// question is specifically whether armParseWaiters still places our node in the same frame as
// the customer's content when React is busy hydrating a real number of components — and that
// cannot be answered on a 592-node page.
//
// WHERE THIS IS MOUNTED MATTERS. It goes LAST inside <main>. The live element anchors on a
// structural selector:
//
//   body > div:nth-of-type(2) > main > section:nth-of-type(1) > div > ...
//
// Anything inserted before that first <section> renumbers it and the selector matches nothing,
// which would look like "Preta broke under load" when in fact the test broke. Appending after
// the existing sections leaves every index intact.
//
// Deliberately no images and no network of any kind: this is here to cost DOM and main-thread
// time, and adding requests would confound that with bandwidth contention we already know how
// to measure separately.
// Tuned against the table above, not guessed. A first pass rendered 130 cards from a single
// component: it reached 1,892 nodes (right at amazon/flipkart) but only 306 ms of blocking,
// barely above this page's own 262 ms — because DOM size is not what costs the main thread.
// Hydration cost scales with the number of COMPONENTS React has to wire up, not with the
// number of elements it prints, so each card is its own component with its own hooks.
const TAGS = ["New", "Sale", "Popular", "Limited"];

// One component per card, each with its own state and handlers — this is the shape real
// framework-rendered pages have, and it is what makes hydration expensive.
function Card({ i }) {
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState(false);
    const [qty, setQty] = useState(1);

    return (
        <article
            className="rounded-lg border border-gray-200 bg-white p-4"
            data-card={i}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div className="mb-3 h-32 rounded bg-gradient-to-br from-gray-100 to-gray-200" />
            <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {TAGS[i % TAGS.length]}
                </span>
                <span className="text-xs text-gray-400">#{i + 1}</span>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Item number {i + 1}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                A short description that exists to add text nodes and a little layout work.
            </p>
            <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                    ${(19 + (i % 40)).toFixed(2)}
                </span>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="rounded border border-gray-300 px-1.5 text-xs text-gray-700">−</button>
                    <span className="w-4 text-center text-xs text-gray-700">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => q + 1)}
                        className="rounded border border-gray-300 px-1.5 text-xs text-gray-700">+</button>
                    <button type="button" onClick={() => setOpen((o) => !o)}
                        className="ml-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700">
                        {open ? "Hide" : "Details"}
                    </button>
                </div>
            </div>
            {open && <p className="mt-2 text-xs text-gray-500">Expanded detail for item {i + 1}.</p>}
            {hover && <span className="sr-only">hovered</span>}
        </article>
    );
}

export default function HeavyBallast() {
    return (
        <section aria-hidden="true" data-ballast="true" className="border-t border-gray-100 bg-gray-50 py-16">
            {Array.from({ length: plan.vendors }, (_, i) => (
                <script key={i} async src={`/vendor/v${i}.js`} />
            ))}
            <div className="mx-auto max-w-7xl px-4">
                <h2 className="mb-8 text-2xl font-semibold text-gray-900">More from us</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: plan.cards }, (_, i) => <Card key={i} i={i} />)}
                </div>
            </div>
        </section>
    );
}

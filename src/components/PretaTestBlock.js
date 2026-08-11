"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * A fixed, identical block rendered on Home / Features / Testimonials / Pricing so the
 * Swap and Image Replacement elements can be tested against "Sync across all pages".
 *
 * Testing that toggle needs two things the rest of this site did not have:
 *
 *   1. The SAME markup on several pages. An element saved with pathname '*' is only
 *      visible where its target selector also exists, so without shared markup a
 *      site-wide swap has nothing to attach to and the test proves nothing.
 *   2. Stable, human-readable selectors. The extension builds a selector from what it
 *      finds; hashed or index-based classes can differ per page and would fail for a
 *      reason that has nothing to do with the toggle. The ids below are explicit and
 *      identical everywhere, so a selector captured on one page matches on all of them.
 *
 * The page name is printed inside the block, so a screenshot alone tells you which page
 * you were on when the change appeared.
 */

const PAGE_LABELS = {
  "/": "Home",
  "/features": "Features",
  "/testimonials": "Testimonials",
  "/pricing": "Pricing",
};

export default function PretaTestBlock() {
  const pathname = usePathname();
  const pageLabel = PAGE_LABELS[pathname] || pathname;

  return (
    <section
      id="preta-test-block"
      className="w-full border-y bg-muted/20 py-12"
      data-preta-test="block"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Preta test block
          </p>
          <h2 className="mt-1 text-2xl font-bold">
            Currently on:{" "}
            <span id="preta-current-page" className="text-primary">
              {pageLabel}
            </span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This block is identical on Home, Features, Testimonials and Pricing.
          </p>
        </div>

        {/* ── SWAP PAIR ────────────────────────────────────────────────────
            Two siblings that are easy to tell apart at a glance, so a swap is
            obvious without reading the DOM. Pick #preta-swap-a as target A and
            #preta-swap-b as target B. */}
        <div className="mb-10">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Swap test — these two should trade places
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div
              id="preta-swap-a"
              className="rounded-xl border-2 border-blue-500 bg-blue-50 p-8 text-center dark:bg-blue-950/30"
            >
              <div className="text-4xl font-black text-blue-600">A</div>
              <div className="mt-2 text-lg font-semibold">Card A — Starter</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Left card. If the swap worked, this moves right.
              </p>
            </div>

            <div
              id="preta-swap-b"
              className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-8 text-center dark:bg-emerald-950/30"
            >
              <div className="text-4xl font-black text-emerald-600">B</div>
              <div className="mt-2 text-lg font-semibold">Card B — Pro</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Right card. If the swap worked, this moves left.
              </p>
            </div>
          </div>
        </div>

        {/* ── IMAGE TARGETS ────────────────────────────────────────────────
            Two separate images rather than one: replacing image 1 while image 2
            stays put is what proves the selector matched the intended element and
            not "every image on the page". */}
        <div>
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Image test — replace one, the other should stay unchanged
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <figure className="flex flex-col items-center gap-3 rounded-xl border bg-background p-6">
              {/* Deliberately NOT /meta-logo.png: that file is also used five times by
                  LogoSection on the home page, so a src-based match could not tell them
                  apart and the test would not show whether the replacement hit one element
                  or every copy of the asset. */}
              <Image
                id="preta-image-1"
                src="/blog2.jpg"
                alt="Preta test image one"
                width={160}
                height={80}
                className="h-20 w-auto rounded object-cover"
              />
              <figcaption className="text-sm text-muted-foreground">
                Image 1 — unique to this block
              </figcaption>
            </figure>

            <figure className="flex flex-col items-center gap-3 rounded-xl border bg-background p-6">
              <Image
                id="preta-image-2"
                src="/blog1.jpg"
                alt="Preta test image two"
                width={160}
                height={80}
                className="h-20 w-auto rounded object-cover"
              />
              <figcaption className="text-sm text-muted-foreground">
                Image 2 — photo
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

/*
 * The link-preview card for every page (WhatsApp, Instagram, Google):
 * the mascot, the name and what College Bites is on ivory. Built once at build time — nothing here depends on the
 * request. Served at /opengraph-image, which src/proxy.ts lets through
 * signed out (link-preview bots never sign in).
 */

export const alt = "College Bites — food delivery for SRM University AP students, pickup at Gate 3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLUM = "#552C4A";
const IVORY = "#f5eae1";
const AMBER = "#A25E1D";

const dataUri = (data: Buffer, type: string) => `data:${type};base64,${data.toString("base64")}`;

export default async function OpengraphImage() {
  // Literal path (not a helper taking a path) so the build only bundles
  // this file. The dish-photo column comes back once College Bites has
  // its own photos.
  const markData = await readFile(join(process.cwd(), "public/brand/mark.png"));
  const mark = dataUri(markData, "image/png");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: IVORY, color: PLUM }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", width: 580 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} alt="" width={150} height={120} />
          <div style={{ marginTop: 28, fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>College Bites</div>
          <div style={{ marginTop: 8, fontSize: 36 }}>Crave. Click. Campus.</div>
          <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.35, maxWidth: 560 }}>
            Your campus food delivery partner at SRM University AP. Pickup at Gate 3, cash on delivery.
          </div>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignSelf: "flex-start",
              background: AMBER,
              color: "#fff8f0",
              fontSize: 26,
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: 999,
            }}
          >
            {new URL(SITE_URL).host}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

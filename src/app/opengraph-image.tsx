import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

/*
 * The link-preview card for every page (WhatsApp, Instagram, Google): on
 * the Vice dusk ground with neon magenta and cyan glows, the navy logo tile
 * on the left, then the name, tagline and pitch, with a few real dishes
 * on the right. Built once at build time — nothing here depends on the
 * request. Served at /opengraph-image, which src/proxy.ts lets through
 * signed out (link-preview bots never sign in).
 */

export const alt = "College Bites: food delivery for SRM University AP students, pickup at Gate 3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Vice Dusk × Leonida Gold (see globals.css).
const DUSK = "#0e0a24";
const TEXT = "#fff0f6";
const GOLD = "#ffc857";
const MUTED = "#bfb4e8";

const dataUri = (data: Buffer, type: string) => `data:${type};base64,${data.toString("base64")}`;

export default async function OpengraphImage() {
  // Literal paths (not a helper taking a path) so the build only bundles
  // these files. Renaming one of these photos means updating it here.
  const [markData, biryaniData, noodlesData, chilliData] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/mark.png")),
    readFile(join(process.cwd(), "public/photos/dishes/mixed-chicken-biryani.jpg")),
    readFile(join(process.cwd(), "public/photos/dishes/chicken-noodles.jpg")),
    readFile(join(process.cwd(), "public/photos/dishes/chilli-chicken.jpg")),
  ]);
  const mark = dataUri(markData, "image/png");
  const photo = (data: Buffer, w: number, h: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUri(data, "image/jpeg")} alt="" width={w} height={h} style={{ objectFit: "cover", borderRadius: 32 }} />
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          color: TEXT,
          background: `radial-gradient(60% 80% at 100% 0%, rgba(255,46,136,0.38) 0%, rgba(255,46,136,0) 70%), radial-gradient(50% 70% at 0% 0%, rgba(34,221,235,0.22) 0%, rgba(34,221,235,0) 70%), radial-gradient(70% 50% at 40% 100%, rgba(255,122,47,0.22) 0%, rgba(255,122,47,0) 70%), ${DUSK}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", width: 640 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} alt="" width={140} height={140} style={{ borderRadius: 32, background: "#012141", boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 24px 60px -16px rgba(255,46,136,0.7)" }} />
          <div style={{ marginTop: 28, fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>College Bites</div>
          <div style={{ marginTop: 6, fontSize: 34, color: GOLD, fontWeight: 700 }}>Crave. Click. Campus.</div>
          <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.35, maxWidth: 560, color: MUTED }}>
            Your campus food delivery partner at SRM University AP. Pickup at Gate 3, pay on delivery (cash or UPI).
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignSelf: "flex-start",
              background: "linear-gradient(90deg, #ff2e88, #ff7a2f)",
              color: DUSK,
              fontSize: 26,
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: 999,
            }}
          >
            {new URL(SITE_URL).host}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "center", paddingRight: 48 }}>
          {photo(biryaniData, 460, 250)}
          <div style={{ display: "flex", gap: 20 }}>
            {photo(noodlesData, 220, 250)}
            {photo(chilliData, 220, 250)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

/*
 * The link-preview card for every page (WhatsApp, Instagram, Google), in
 * Electric Sunrise (the default palette): cream ground with a peach dawn
 * glow and a lilac one, the navy logo tile
 * on the left, then the name, tagline and pitch, with a few real dishes
 * on the right. Built once at build time — nothing here depends on the
 * request. Served at /opengraph-image, which src/proxy.ts lets through
 * signed out (link-preview bots never sign in).
 */

export const alt = "College Bites: food delivery for SRM University AP students, pickup at Gate 3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Electric Sunrise (see globals.css, [data-palette="sunrise"]).
const CREAM = "#fff8f0";
const INK = "#221433";
const PURPLE = "#6a0dad";
const MUTED = "#5e5070";

const dataUri = (data: Buffer, type: string) => `data:${type};base64,${data.toString("base64")}`;

export default async function OpengraphImage() {
  // Literal paths (not a helper taking a path) so the build only bundles
  // these files. Renaming one of these photos means updating it here.
  const [markData, biryaniData, noodlesData, chilliData] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/mark-v2-1.png")),
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
          color: INK,
          background: `radial-gradient(70% 90% at 100% 100%, rgba(255,158,128,0.55) 0%, rgba(255,158,128,0) 70%), radial-gradient(55% 75% at 0% 0%, rgba(231,198,255,0.6) 0%, rgba(231,198,255,0) 70%), radial-gradient(60% 50% at 45% 100%, rgba(245,209,160,0.5) 0%, rgba(245,209,160,0) 70%), ${CREAM}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", width: 640 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} alt="" width={140} height={140} style={{ borderRadius: 32, background: "#012141", boxShadow: "0 24px 60px -16px rgba(106,13,173,0.45)" }} />
          <div style={{ marginTop: 28, fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>College Bites</div>
          <div style={{ marginTop: 6, fontSize: 34, color: PURPLE, fontWeight: 700 }}>Crave. Click. Campus.</div>
          <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.35, maxWidth: 560, color: MUTED }}>
            Biryani, fried rice, noodles and starters from kitchens near SRM University AP. Collect at Gate 3, pay on delivery.
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignSelf: "flex-start",
              background: `linear-gradient(115deg, ${PURPLE}, #a81f6c)`,
              color: "#ffffff",
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

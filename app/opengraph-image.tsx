import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ScaleSage — Your business is leaking. We find it. Fix it. Prove it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card for link previews (LinkedIn, X, WhatsApp, Slack…).
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/scalesage-mark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0A1628",
          backgroundImage:
            "radial-gradient(900px 620px at 82% -5%, rgba(61,217,208,0.18), rgba(10,22,40,0) 60%)",
          color: "#F4F6F9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logoSrc} width={72} height={72} alt="" style={{ borderRadius: 999 }} />
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>ScaleSage</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 22,
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Your business is</span>
            <span style={{ color: "#3DD9D0", fontStyle: "italic" }}>leaking.</span>
          </div>
          <div style={{ marginTop: 20, fontSize: 42, fontWeight: 600, color: "#FFFFFF" }}>
            We find it. Fix it. Prove it.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ display: "flex", width: 12, height: 12, borderRadius: 999, backgroundColor: "#3DD9D0" }} />
          <span style={{ fontSize: 22, letterSpacing: "0.24em", color: "#A8B2C0", fontWeight: 600 }}>
            DIAGNOSE · BUILD · PROVE
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

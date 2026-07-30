import BlueprintFrame from "@/components/mechanism/BlueprintFrame";
import MechanismDemo from "@/components/mechanism/MechanismDemo";

/**
 * "How the systems actually work" — a mechanism pass (Cy motion brief): each
 * service section carries a moving mini-demo of what it does, framed in the
 * blueprint aesthetic (mono micro-labels over a grid). Demos are library-free
 * and reduced-motion safe; copy stays process-descriptive (no unverifiable
 * claims — brand promise is under-promise/over-deliver).
 *
 * Copy: JW to approve.
 */
export default function MechanismShowcase() {
  return (
    <section className="section">
      <div className="inner">
        <div className="section-head" data-reveal="" style={{ marginBottom: 34 }}>
          <div className="eyebrow">How it actually works</div>
          <h2 className="h2">Not slides. The mechanism, moving.</h2>
          <p className="lead">
            Each system does one job and shows its working. Here is what that motion
            looks like before we ever install it in your business.
          </p>
        </div>

        <div className="grid-3" style={{ alignItems: "stretch" }}>
          <BlueprintFrame
            label="SEC.01"
            fig="FIG.A — OUTREACH"
            title="Outreach that reaches a booked call"
            caption="Every lead is captured, answered, and moved toward a booked call — step by step, no drop-off."
          >
            <MechanismDemo variant="pipeline" />
          </BlueprintFrame>

          <BlueprintFrame
            label="SEC.02"
            fig="FIG.B — AUTOMATION"
            title="Agents that hand off cleanly"
            caption="Specialised agents pass each task down the line, so work keeps moving and nothing stalls between hands."
          >
            <MechanismDemo variant="handoff" />
          </BlueprintFrame>

          <BlueprintFrame
            label="SEC.03"
            fig="FIG.C — BUILDS"
            title="Builds that prove themselves"
            caption="Every system ships with its checks passing before it goes live, so you see it working, not just promised."
          >
            <MechanismDemo variant="terminal" />
          </BlueprintFrame>
        </div>
      </div>
    </section>
  );
}

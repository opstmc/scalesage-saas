import JourneyButton from "./JourneyButton";

const INDUSTRIES: { name: string; leaks: [string, string, string] }[] = [
  { name: "Plumbers", leaks: ["Missed emergency calls", "Quotes never chased", "No review engine"] },
  { name: "Electricians", leaks: ["After-hours calls lost", "Slow quote follow-up", "Invisible in local AI search"] },
  { name: "Gas engineers", leaks: ["Missed booking calls", "No service reminders", "Lapsed annual customers"] },
  { name: "Tree surgeons", leaks: ["Seasonal calls missed", "Quotes go cold", "Few reviews captured"] },
  { name: "Builders", leaks: ["Slow to quote", "No follow-up sequence", "Word-of-mouth not captured"] },
  { name: "Estate agents", leaks: ["Portal leads called too late", "Cold vendors not nurtured", "Reviews under-asked"] },
  { name: "Property mgmt", leaks: ["Tenant calls missed", "Maintenance admin drag", "Manual renewal reminders"] },
  { name: "Salons", leaks: ["No-shows & gaps", "No rebooking prompts", "Lapsed clients ignored"] },
  { name: "Pet services", leaks: ["Booking calls missed", "No repeat reminders", "Reviews not requested"] },
  { name: "Auto repair", leaks: ["Service calls missed", "Manual MOT reminders", "Quotes not followed up"] },
  { name: "Clinics", leaks: ["Reception overwhelmed", "Manual recall reminders", "Invisible in health search"] },
  { name: "Hospitality", leaks: ["Booking enquiries missed", "No win-back for regulars", "Reviews not prompted"] },
  { name: "Accountants", leaks: ["Enquiries slow to answer", "Deadlines chased manually", "Referrals not captured"] },
  { name: "Solicitors", leaks: ["Intake calls missed", "Slow enquiry follow-up", "Invisible in AI search"] },
  { name: "Recruitment", leaks: ["Candidate replies slow", "Pipeline admin drag", "Lapsed clients dormant"] },
  { name: "E-commerce", leaks: ["Abandoned carts", "No post-purchase flow", "Support tickets pile up"] },
  { name: "Fitness & gyms", leaks: ["Trial leads not called", "No win-back for cancels", "Reviews under-asked"] },
  { name: "Cleaning", leaks: ["Quote calls missed", "No recurring reminders", "Manual follow-up"] },
];

export default function Industries() {
  return (
    <section id="industries" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Industries</div>
          <h2 className="h2">We&rsquo;ve mapped the leak patterns across 18 SME industries.</h2>
          <p className="lead">Find yours — hover to see the three biggest leaks we see in your sector.</p>
        </div>
        <div className="ind-grid">
          {INDUSTRIES.map((ind) => (
            <div key={ind.name} data-reveal="" className="glass glass-hover ind-card">
              <div className="ind-name">{ind.name}</div>
              <div className="ind-leaks">
                {ind.leaks.map((l) => (
                  <span key={l} className="ind-leak">
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", flex: "none", marginTop: 6 }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <JourneyButton className="glass glass-hover ind-card card-link">
            <span className="ind-name" style={{ color: "var(--accent-primary)" }}>Don&rsquo;t see yours?</span>
            <span className="small" style={{ marginTop: 8, color: "var(--text-muted)" }}>Run the scan — Sage knows it too →</span>
          </JourneyButton>
        </div>
      </div>
    </section>
  );
}

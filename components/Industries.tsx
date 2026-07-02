"use client";

import { useCallback, useRef, useState } from "react";
import JourneyButton from "./JourneyButton";
import IndustryModal, { type Industry } from "./IndustryModal";

const INDUSTRIES: Industry[] = [
  {
    name: "Plumbers",
    leaks: ["Missed emergency calls", "Quotes never chased", "No review engine"],
    pattern:
      "The work is never the problem — the phone is. Emergency calls hit while you're under a sink, quotes sent from the van go cold, and the five-star jobs never get asked for a review.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI answers every emergency call and books it — mid-job or after hours." },
      { system: "Convert every quote", closes: "Every quote enters a sequenced chase until it's won or closed." },
      { system: "Be findable everywhere", closes: "Automated review requests turn finished jobs into proof that wins the next call." },
    ],
    fixFirst:
      "Start with the missed calls. A plumbing emergency goes to whoever answers first, so every unanswered ring is a booked job handed to a competitor.",
  },
  {
    name: "Electricians",
    leaks: ["After-hours calls lost", "Slow quote follow-up", "Invisible in local AI search"],
    pattern:
      "Demand doesn't keep office hours. After-hours calls go to voicemail, quotes sit while you're on the tools, and when someone asks ChatGPT for a local electrician, you're not in the answer.",
    installs: [
      { system: "Capture every enquiry", closes: "After-hours voice AI captures and books the calls that used to hit voicemail." },
      { system: "Convert every quote", closes: "Follow-up sequences chase every quote so none goes cold on the job." },
      { system: "Be findable everywhere", closes: "AEO/GEO visibility puts you in the answer when buyers ask AI for a local electrician." },
    ],
    fixFirst:
      "Plug the after-hours calls first — that's where the emergency-premium work is, and it's leaking straight to voicemail every night.",
  },
  {
    name: "Gas engineers",
    leaks: ["Missed booking calls", "No service reminders", "Lapsed annual customers"],
    pattern:
      "Boiler work is repeat business you're treating as one-off. Booking calls slip, annual services never get a reminder, and last year's customers quietly book with someone else.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI answers and slots every service and booking call." },
      { system: "Bring back every customer", closes: "Automated annual-service reminders keep every boiler on the calendar." },
      { system: "Bring back every customer", closes: "Database reactivation wins back last year's customers before they switch." },
    ],
    fixFirst:
      "Turn on service reminders first. A gas customer who lapses one year rarely comes back, so protecting the annual repeat is the fastest money.",
  },
  {
    name: "Tree surgeons",
    leaks: ["Seasonal calls missed", "Quotes go cold", "Few reviews captured"],
    pattern:
      "Your year comes in waves — and when the storm-season calls land all at once, most go unanswered. The quotes you do send cool off, and dramatic before-and-after jobs never turn into reviews.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI absorbs the seasonal call spikes so no enquiry is lost to a busy week." },
      { system: "Convert every quote", closes: "Sequenced follow-up keeps every quote warm until the job is booked." },
      { system: "Be findable everywhere", closes: "Automated review requests capture the proof from every big job." },
    ],
    fixFirst:
      "Fix seasonal call capture first — in a trade this spiky, the busiest weeks are exactly when the most calls go unanswered.",
  },
  {
    name: "Builders",
    leaks: ["Slow to quote", "No follow-up sequence", "Word-of-mouth not captured"],
    pattern:
      "The pipeline is real but leaky. Quotes take days while the client's ready now, nothing chases them, and the referrals that should compound are never captured as reviews.",
    installs: [
      { system: "Run without you", closes: "Automated quoting workflows get proposals out same-day, not next week." },
      { system: "Convert every quote", closes: "Every proposal enters a sequenced chase until it's won or closed." },
      { system: "Be findable everywhere", closes: "Review systems turn happy clients into the proof that wins the next build." },
    ],
    fixFirst:
      "Speed up the quote first. On a big build the client is comparing three firms, and the fastest credible quote usually wins the job.",
  },
  {
    name: "Estate agents",
    leaks: ["Portal leads called too late", "Cold vendors not nurtured", "Reviews under-asked"],
    pattern:
      "Portal leads are gold that spoils in minutes. They're called too late, not-ready vendors get no nurture, and the reviews that build local trust go unasked.",
    installs: [
      { system: "Capture every enquiry", closes: "Instant response calls and books every portal lead in the first minute, not the next day." },
      { system: "Bring back every customer", closes: "Long-cycle nurture keeps not-yet-ready vendors warm until they list." },
      { system: "Be findable everywhere", closes: "Automated review requests build the local reputation that wins instructions." },
    ],
    fixFirst:
      "Fix lead speed first — portal enquiries convert far better answered in minutes, and right now they're going cold before anyone calls.",
  },
  {
    name: "Property mgmt",
    leaks: ["Tenant calls missed", "Maintenance admin drag", "Manual renewal reminders"],
    pattern:
      "The work is relentless and mostly admin. Tenant calls pile up faster than you can answer, maintenance coordination eats the day, and renewals are chased by memory instead of a system.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI handles routine tenant calls and logs maintenance requests automatically." },
      { system: "Run without you", closes: "Automated coordination and scheduling take the maintenance chase off your desk." },
      { system: "Bring back every customer", closes: "Renewal reminders fire automatically so no tenancy lapses by oversight." },
    ],
    fixFirst:
      "Take the maintenance admin off your team first — it's the biggest time drain, and the hours it frees go straight back into filling and keeping units.",
  },
  {
    name: "Salons",
    leaks: ["No-shows & gaps", "No rebooking prompts", "Lapsed clients ignored"],
    pattern:
      "Empty chairs are pure lost revenue. No-shows leave gaps you can't refill, clients walk out without rebooking, and the ones who drift away are never invited back.",
    installs: [
      { system: "Run without you", closes: "Automated confirmations and waitlist fill cut no-shows and plug the gaps." },
      { system: "Bring back every customer", closes: "Every visit ends with an automated rebooking prompt before they leave your chair." },
      { system: "Bring back every customer", closes: "Reactivation campaigns win back clients who've quietly drifted to another salon." },
    ],
    fixFirst:
      "Kill the no-shows first. A gap you learn about at 10am can't be refilled, so automated confirmations and waitlists protect the most revenue fastest.",
  },
  {
    name: "Pet services",
    leaks: ["Booking calls missed", "No repeat reminders", "Reviews not requested"],
    pattern:
      "It's a routine, repeat business run on memory. Booking calls slip while you're with an animal, the regular grooming cycle never gets a nudge, and delighted owners are never asked to review.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI books every appointment call while your hands are full." },
      { system: "Bring back every customer", closes: "Automated repeat reminders keep every grooming and care cycle on schedule." },
      { system: "Be findable everywhere", closes: "Review requests turn happy owners into the proof local pet-owners trust." },
    ],
    fixFirst:
      "Set up the repeat reminders first. Pet care is a predictable cycle, and a gentle automated nudge turns one-off visits into a booked-out calendar.",
  },
  {
    name: "Auto repair",
    leaks: ["Service calls missed", "Manual MOT reminders", "Quotes not followed up"],
    pattern:
      "It's a diary business leaking at the edges. Service calls miss while you're under a car, MOT reminders depend on you remembering, and quotes for bigger work go unanswered.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI answers and books every service call from the workshop floor." },
      { system: "Bring back every customer", closes: "Automated MOT and service reminders bring every car back on time." },
      { system: "Convert every quote", closes: "Follow-up sequences chase every repair quote until it's approved." },
    ],
    fixFirst:
      "Automate the MOT reminders first — it's guaranteed annual repeat work that's leaking purely because no one has time to chase it.",
  },
  {
    name: "Clinics",
    leaks: ["Reception overwhelmed", "Manual recall reminders", "Invisible in health search"],
    pattern:
      "The front desk is the bottleneck. Reception can't answer everything, recalls depend on manual lists, and when patients search AI for local care, your clinic doesn't surface.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI absorbs routine reception calls and books appointments 24/7." },
      { system: "Bring back every customer", closes: "Automated recall reminders bring patients back for check-ups and follow-ups." },
      { system: "Be findable everywhere", closes: "AEO/GEO visibility puts your clinic in the answer for local health searches." },
    ],
    fixFirst:
      "Relieve reception first. Every unanswered call is a booking lost and a patient who dials the next clinic — and it's the leak your team feels most.",
  },
  {
    name: "Hospitality",
    leaks: ["Booking enquiries missed", "No win-back for regulars", "Reviews not prompted"],
    pattern:
      "Covers walk out the door before you notice. Booking calls miss during service, regulars drift without a reason to return, and great nights never turn into the reviews that fill tables.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI takes every booking enquiry during the rush without pulling staff off the floor." },
      { system: "Bring back every customer", closes: "Win-back campaigns bring lapsed regulars back with a reason to return." },
      { system: "Be findable everywhere", closes: "Automated review prompts turn great nights into the ratings that fill tables." },
    ],
    fixFirst:
      "Capture the booking calls first — enquiries land right when your team is slammed in service, so that's exactly when covers are being lost.",
  },
  {
    name: "Accountants",
    leaks: ["Enquiries slow to answer", "Deadlines chased manually", "Referrals not captured"],
    pattern:
      "Trust is won in the first reply — and yours is slow. New enquiries wait, client deadlines are chased by hand, and the referrals that should grow the firm are never asked for.",
    installs: [
      { system: "Capture every enquiry", closes: "Instant response engages every new enquiry before they call another firm." },
      { system: "Run without you", closes: "Automated deadline and document chasing keeps clients on track without nagging." },
      { system: "Be findable everywhere", closes: "Review and referral systems turn satisfied clients into a steady pipeline." },
    ],
    fixFirst:
      "Speed up enquiry response first. Accounting clients shop on responsiveness, and a slow first reply loses the ones worth the most.",
  },
  {
    name: "Solicitors",
    leaks: ["Intake calls missed", "Slow enquiry follow-up", "Invisible in AI search"],
    pattern:
      "Legal clients don't wait. Intake calls miss while you're in a matter, enquiries aren't followed up fast enough, and when someone asks AI for a local solicitor, you're not named.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI handles intake calls and qualifies matters around the clock." },
      { system: "Convert every quote", closes: "Sequenced follow-up converts more enquiries into instructed matters." },
      { system: "Be findable everywhere", closes: "AEO/GEO visibility puts your firm in the answer when clients ask AI for legal help." },
    ],
    fixFirst:
      "Fix intake capture first. A missed legal enquiry rarely calls back, and each instructed matter is worth far too much to leak to voicemail.",
  },
  {
    name: "Recruitment",
    leaks: ["Candidate replies slow", "Pipeline admin drag", "Lapsed clients dormant"],
    pattern:
      "Speed is the whole game and admin is stealing it. Good candidates go cold before you reply, the pipeline runs on manual chasing, and past clients sit dormant while you cold-prospect.",
    installs: [
      { system: "Capture every enquiry", closes: "Instant response keeps candidates engaged before a competitor places them." },
      { system: "Run without you", closes: "Automated pipeline updates and scheduling free consultants to actually place." },
      { system: "Bring back every customer", closes: "Reactivation campaigns wake dormant clients with roles ready to fill." },
    ],
    fixFirst:
      "Speed up candidate replies first. Top candidates are placed within days, so a slow response is the difference between a fee and a wasted shortlist.",
  },
  {
    name: "E-commerce",
    leaks: ["Abandoned carts", "No post-purchase flow", "Support tickets pile up"],
    pattern:
      "The traffic converts worse than it should. Carts get abandoned with no recovery, first-time buyers never get a second-order flow, and support piles up faster than you can clear it.",
    installs: [
      { system: "Convert every quote", closes: "Automated cart-recovery flows win back the checkouts that stall." },
      { system: "Bring back every customer", closes: "Post-purchase sequences turn one-time buyers into repeat customers." },
      { system: "Run without you", closes: "AI support handles routine tickets instantly so your team clears the queue." },
    ],
    fixFirst:
      "Turn on cart recovery first — those are buyers who already wanted it, so recovered carts are the fastest revenue on the table.",
  },
  {
    name: "Fitness & gyms",
    leaks: ["Trial leads not called", "No win-back for cancels", "Reviews under-asked"],
    pattern:
      "Members leak in at the top and out at the bottom. Trial leads aren't called while intent is hot, cancellations vanish with no win-back, and happy members are never asked to review.",
    installs: [
      { system: "Capture every enquiry", closes: "Instant response calls every trial lead while their motivation is still high." },
      { system: "Bring back every customer", closes: "Win-back campaigns re-enrol cancelled members with the right nudge." },
      { system: "Be findable everywhere", closes: "Automated review requests build the social proof that converts local sign-ups." },
    ],
    fixFirst:
      "Call the trial leads first. Fitness intent is emotional and fades within hours, so a fast call turns a form-fill into a paying member.",
  },
  {
    name: "Cleaning",
    leaks: ["Quote calls missed", "No recurring reminders", "Manual follow-up"],
    pattern:
      "A recurring-revenue business run one job at a time. Quote calls slip during jobs, recurring cleans aren't systematically rebooked, and follow-up depends on someone remembering.",
    installs: [
      { system: "Capture every enquiry", closes: "Voice AI answers and quotes every enquiry call while your team's on site." },
      { system: "Bring back every customer", closes: "Automated reminders lock in recurring cleans instead of one-off bookings." },
      { system: "Convert every quote", closes: "Sequenced follow-up chases every quote so none is forgotten." },
    ],
    fixFirst:
      "Systematise recurring bookings first. Cleaning's real value is the repeat contract, so converting one-off jobs into recurring ones compounds fastest.",
  },
];

export default function Industries() {
  const [selected, setSelected] = useState<Industry | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openModal = useCallback((ind: Industry, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setSelected(ind);
  }, []);

  const closeModal = useCallback(() => {
    setSelected(null);
    const el = triggerRef.current;
    // restore focus to the card that opened the modal, after it unmounts
    if (el) requestAnimationFrame(() => el.focus());
  }, []);

  return (
    <section id="industries" className="section">
      <div className="inner">
        <div className="section-head" data-reveal="">
          <div className="eyebrow">Industries</div>
          <h2 className="h2">We&rsquo;ve mapped the leak patterns across 18 SME industries.</h2>
          <p className="lead">
            Find yours and click to open its full leak map — the three biggest leaks, what&rsquo;s really
            happening, what we install, and the one to fix first.
          </p>
        </div>
        <div className="ind-grid">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.name}
              type="button"
              data-reveal=""
              className="glass glass-hover ind-card"
              onClick={(e) => openModal(ind, e.currentTarget)}
              aria-haspopup="dialog"
              aria-label={`${ind.name} — view the full leak map`}
            >
              <div>
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
              <span className="ind-card-cta">View the full leak map →</span>
            </button>
          ))}
          <JourneyButton className="glass glass-hover ind-card card-link">
            <span className="ind-name" style={{ color: "var(--accent-primary)" }}>Don&rsquo;t see yours?</span>
            <span className="small" style={{ marginTop: 8, color: "var(--text-muted)" }}>Run the scan — Sage knows it too →</span>
          </JourneyButton>
        </div>
      </div>

      {selected && <IndustryModal industry={selected} onClose={closeModal} />}
    </section>
  );
}

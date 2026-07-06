"use client";

import { useCallback, useRef, useState } from "react";
import JourneyButton from "./JourneyButton";
import IndustryModal, { type Industry } from "./IndustryModal";

// CANDIDATE COPY — emotion-layer leak maps (CATALYST v5, brief section 4).
// All 18 sectors carry the five parts. Drafted for JW/Cy approval.
const INDUSTRIES: Industry[] = [
  {
    name: "Plumbers",
    feelsLike:
      "You're under a sink when the emergency call comes in. By the time you ring back, they've already phoned someone else.",
    leaks: ["Missed calls", "Cold quotes", "Forgotten reviews"],
    sageAsks: "How many jobs last month went to whoever picked up first, not whoever was best?",
    installs: ["Capture every enquiry", "Convert every quote", "Be findable everywhere"],
    ownerGets:
      "Every ring answered and booked, every quote chased to a yes, and finished jobs turned into the reviews that win the next call.",
  },
  {
    name: "Electricians",
    feelsLike:
      "The after-hours call rings out to voicemail, and the emergency-premium job goes to whoever answered their phone.",
    leaks: ["Missed calls", "Cold quotes", "Invisible online"],
    sageAsks: "When someone asks AI for a local electrician tonight, does your name come up or a rival's?",
    installs: ["Capture every enquiry", "Convert every quote", "Be findable everywhere"],
    ownerGets:
      "After-hours calls captured and booked, quotes chased instead of forgotten, and a name that shows up when buyers ask AI for an electrician.",
  },
  {
    name: "Gas engineers",
    feelsLike:
      "Last year's boiler customer just booked their annual service with someone else, because nobody reminded them it was due.",
    leaks: ["Missed calls", "Lapsed customers", "Admin drag"],
    sageAsks: "Of the boilers you serviced last year, how many are already booked back in for this one?",
    installs: ["Capture every enquiry", "Bring back every customer", "Run without you"],
    ownerGets:
      "Every booking call answered, annual services reminded and rebooked automatically, and last year's customers back on your calendar instead of a rival's.",
  },
  {
    name: "Tree surgeons",
    feelsLike:
      "The storm hits and every call lands in the same hour, most of them ringing out while you're forty feet up a tree.",
    leaks: ["Missed calls", "Cold quotes", "Forgotten reviews"],
    sageAsks: "When the season spikes and the calls all land at once, who answers the ones you can't?",
    installs: ["Capture every enquiry", "Convert every quote", "Be findable everywhere"],
    ownerGets:
      "The seasonal surge captured instead of lost, every quote kept warm to a yes, and dramatic before-and-afters turned into reviews.",
  },
  {
    name: "Builders",
    feelsLike:
      "The client is ready to sign now, but your quote is still three days out, and by then they've gone with the firm that replied today.",
    leaks: ["Cold quotes", "Admin drag", "Forgotten reviews"],
    sageAsks: "How many builds did you lose last year to a faster quote, not a better one?",
    installs: ["Run without you", "Convert every quote", "Be findable everywhere"],
    ownerGets:
      "Same-day quotes out the door, every proposal chased to a decision, and referrals captured as the proof that wins the next build.",
  },
  {
    name: "Estate agents",
    feelsLike:
      "A portal lead is gold for about five minutes. Yours sat in the inbox until lunch, and by then they'd booked a viewing elsewhere.",
    leaks: ["Missed calls", "Lapsed customers", "Forgotten reviews"],
    sageAsks: "Honestly, how fast does a portal enquiry get a call back right now, minutes or hours?",
    installs: ["Capture every enquiry", "Bring back every customer", "Be findable everywhere"],
    ownerGets:
      "Every portal lead called in the first minute, not-yet-ready vendors nurtured until they list, and reviews that win the next instruction.",
  },
  {
    name: "Property mgmt",
    feelsLike:
      "Tenant calls stack up faster than you can answer, maintenance eats the whole day, and a renewal just lapsed because it lived on a sticky note.",
    leaks: ["Missed calls", "Admin drag", "Lapsed customers"],
    sageAsks: "How many hours a week does your team lose to maintenance chasing instead of filling and keeping units?",
    installs: ["Capture every enquiry", "Run without you", "Bring back every customer"],
    ownerGets:
      "Routine tenant calls handled, maintenance coordination off your desk, and renewals that fire on time instead of by memory.",
  },
  {
    name: "Salons",
    feelsLike:
      "A chair sits empty at 2pm because one client no-showed and another walked out without rebooking, both revenue you can't get back.",
    leaks: ["Admin drag", "Lapsed customers", "Missed calls"],
    sageAsks: "How many chairs sat empty last week that a confirmation or a waitlist could have filled?",
    installs: ["Run without you", "Bring back every customer", "Capture every enquiry"],
    ownerGets:
      "No-shows cut and gaps refilled automatically, every visit ending in a rebooking, and drifted clients invited back before they settle elsewhere.",
  },
  {
    name: "Pet services",
    feelsLike:
      "You're mid-groom with both hands full, the phone rings with a booking, and the regular whose cycle is due never gets a nudge.",
    leaks: ["Missed calls", "Lapsed customers", "Forgotten reviews"],
    sageAsks: "Of the pets you groomed last quarter, how many are booked in for their next cycle?",
    installs: ["Capture every enquiry", "Bring back every customer", "Be findable everywhere"],
    ownerGets:
      "Every booking call answered hands-free, every grooming cycle nudged back onto the calendar, and happy owners turned into local reviews.",
  },
  {
    name: "Auto repair",
    feelsLike:
      "You're under a car when the service call comes in, and next year's MOT reminder depends on you remembering, so half never go out.",
    leaks: ["Missed calls", "Lapsed customers", "Cold quotes"],
    sageAsks: "How many MOTs due this month has anyone actually reminded the customer about?",
    installs: ["Capture every enquiry", "Bring back every customer", "Convert every quote"],
    ownerGets:
      "Service calls booked from the workshop floor, every MOT reminded and rebooked on time, and repair quotes chased to approval.",
  },
  {
    name: "Clinics",
    feelsLike:
      "Reception is drowning, the phone rings out, and the patient who couldn't get through just dialled the clinic down the road.",
    leaks: ["Missed calls", "Lapsed customers", "Invisible online"],
    sageAsks: "How many patients are overdue a recall that's still sitting on a manual list nobody has time to work?",
    installs: ["Capture every enquiry", "Bring back every customer", "Be findable everywhere"],
    ownerGets:
      "Reception relieved with calls answered around the clock, recalls that bring patients back automatically, and a clinic that surfaces when people search for local care.",
  },
  {
    name: "Hospitality",
    feelsLike:
      "The booking message lands mid-service, nobody sees it until the shift ends, and a regular you haven't seen in months has quietly stopped coming.",
    leaks: ["Missed calls", "Lapsed customers", "Forgotten reviews"],
    sageAsks: "How many booking enquiries came in during last Friday's service that nobody got to reply to?",
    installs: ["Capture every enquiry", "Bring back every customer", "Be findable everywhere"],
    ownerGets:
      "Every enquiry answered mid-rush without pulling staff off the floor, regulars given a reason to return, and great nights turned into the reviews that fill tables.",
  },
  {
    name: "Accountants",
    feelsLike:
      "A new enquiry lands, sits for a day, and by the time you reply they've already signed with the firm that answered first.",
    leaks: ["Missed calls", "Admin drag", "Forgotten reviews"],
    sageAsks: "When a prospect enquires today, how long before they hear back, and how many don't wait?",
    installs: ["Capture every enquiry", "Run without you", "Be findable everywhere"],
    ownerGets:
      "Every enquiry engaged before they call another firm, deadlines and documents chased without nagging, and satisfied clients turned into a steady referral pipeline.",
  },
  {
    name: "Solicitors",
    feelsLike:
      "An intake call comes in while you're deep in a matter, it goes to voicemail, and a case worth thousands never rings back.",
    leaks: ["Missed calls", "Cold quotes", "Invisible online"],
    sageAsks: "When someone needs a solicitor at 8pm and asks AI, is your firm in the answer?",
    installs: ["Capture every enquiry", "Convert every quote", "Be findable everywhere"],
    ownerGets:
      "Intake calls answered and qualified around the clock, enquiries followed up to instructed matters, and a firm that shows up when clients ask AI for legal help.",
  },
  {
    name: "Recruitment",
    feelsLike:
      "The candidate was perfect on Monday. By the time you replied on Wednesday, a faster agency had already placed them.",
    leaks: ["Missed calls", "Admin drag", "Lapsed customers"],
    sageAsks: "How many placeable candidates went cold last month while your reply sat in a queue?",
    installs: ["Capture every enquiry", "Run without you", "Bring back every customer"],
    ownerGets:
      "Candidates engaged before a competitor places them, pipeline admin off your consultants, and dormant clients woken up with roles ready to fill.",
  },
  {
    name: "E-commerce",
    feelsLike:
      "The cart's full, the buyer's one click from paying, then they're gone, with nothing to bring them back and a support queue you can't clear.",
    leaks: ["Cold quotes", "Lapsed customers", "Admin drag"],
    sageAsks: "Of the carts abandoned this week, how many got a single message trying to win them back?",
    installs: ["Convert every quote", "Bring back every customer", "Run without you"],
    ownerGets:
      "Stalled checkouts recovered, one-time buyers turned into repeat orders, and routine tickets handled instantly so the queue stays clear.",
  },
  {
    name: "Fitness & gyms",
    feelsLike:
      "Someone fills in a trial form at 9pm, fired up to start. Nobody calls, the motivation fades by morning, and they never come in.",
    leaks: ["Missed calls", "Lapsed customers", "Forgotten reviews"],
    sageAsks: "How many trial leads from last week got a call while their motivation was still hot?",
    installs: ["Capture every enquiry", "Bring back every customer", "Be findable everywhere"],
    ownerGets:
      "Every trial lead called while intent is high, cancelled members re-enrolled with the right nudge, and reviews that convert the next local sign-up.",
  },
  {
    name: "Cleaning",
    feelsLike:
      "A quote call comes in while your team's mid-job, it slips, and last month's one-off clean never became the recurring contract it should have.",
    leaks: ["Missed calls", "Lapsed customers", "Cold quotes"],
    sageAsks: "How many of last month's one-off cleans have you converted into recurring bookings?",
    installs: ["Capture every enquiry", "Bring back every customer", "Convert every quote"],
    ownerGets:
      "Quote calls answered while you're on site, one-off jobs locked into recurring contracts, and every quote chased so none is forgotten.",
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
            Find yours and open its leak map: what it feels like, where the money leaks, the question Sage
            asks, what we install, and what you get back.
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
              aria-label={`${ind.name}: view the full leak map`}
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
            <span className="small" style={{ marginTop: 8, color: "var(--text-muted)" }}>Run the scan, Sage knows it too →</span>
          </JourneyButton>
        </div>
      </div>

      {selected && <IndustryModal industry={selected} onClose={closeModal} />}
    </section>
  );
}

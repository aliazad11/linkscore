// Today's date for every model call that writes copy for a user. The model's own sense of
// "now" is its training cutoff: in October 2026 reports told students they were looking for
// an "alternance pour septembre 2025". The server clock is the source of truth, appended to
// each system prompt. Underscore prefix = not routable.
export function todayContext(now) {
  const d = now instanceof Date ? now : new Date();
  const y = d.getUTCFullYear();
  const iso = d.toISOString().slice(0, 10);
  const human = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  return "Today's date is " + human + " (" + iso + "). The current year is " + y + ". "
    + "Every reference to the current or next year, a season, a quarter, a deadline, an application or intake period (an internship, alternance or job start), a trend year or any timeframe must be consistent with this date. "
    + "Never present " + (y - 1) + " or any earlier year as the current or upcoming year. "
    + "Years that appear in the person's own profile or posts (job start dates, graduation years, past events) are facts: keep them exactly as given.";
}

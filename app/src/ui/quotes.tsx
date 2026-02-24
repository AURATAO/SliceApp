// CongratsText.tsx

export type CongratsBucket = "long" | "near" | "last" | "completed" | "default";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 10+ days left
const LONG = [
  "You’re early. That’s ✨main character✨ behavior.",
  "Small steps, big plot. Keep going.",
  "You’re planting seeds. Stop digging them up.",
  "Slow progress is still progress. Yes, even today.",
  "You showed up. The goal is sweating now.",
  "Boring consistency is hot. Keep slicing.",
  "Future you is already clapping. Quietly. Proudly.",
  "One tiny win a day = unstoppable in a month.",
  "Stay cute. Stay focused. Stay moving.",
  "This isn’t luck. It’s you being stubborn (in a good way).",
] as const;

// 2–3 days left
const NEAR = [
  "Close enough to taste it. Don’t drop the plate.",
  "Final stretch. No jazz hands. Just finish.",
  "Almost done—don’t become a philosopher now.",
  "You’re in the zone. Lock the door.",
  "Three days left. Be obsessed for 72 hours.",
  "Keep it clean. Keep it quick. Keep it you.",
  "You’re basically at the checkout counter. Pay and leave.",
  "Don’t romanticize it—complete it.",
  "This is the ‘no excuses’ part of the movie.",
  "So close… I can hear the achievement badge loading.",
] as const;

// 1 day left
const LAST = [
  "One day left. Don’t negotiate with tomorrow.",
  "Last day: do it messy, but do it.",
  "Today is the boss fight. Hit it once.",
  "One more slice. Then you earn snacks.",
  "Finish it. Then vanish peacefully like a legend.",
  "You’re 24 hours away from freedom. Act like it.",
  "Do it for your future self’s smug smile.",
  "One day left—no overthinking, only finishing.",
  "This is not a vibe. It’s a deadline. Go.",
  "Final slice. Make it sharp. Make it yours.",
] as const;

// completed
const COMPLETED = [
  "Done. Go be adorable in real life now.",
  "Completed. Your effort just got receipts.",
  "You finished. That’s rare. That’s hot.",
  "A full Slice. Respect. Bowing slightly.",
  "You did it. Don’t downplay it. Ever.",
  "Achievement unlocked: “Actually Finished Something.”",
  "Completed. Now go celebrate like you mean it.",
  "You’re done. Enjoy your villain era (peacefully).",
  "Finished. The goal is crying. You won.",
  "Done done. Like… DONE. Iconic.",
] as const;

// default (4–9 days left)
const DEFAULT = [
  "Nice cut. Keep going.",
  "Progress logged. Your future self says thanks.",
  "Good job. Now do it again, tiny monster.",
  "You moved. That’s literally the whole game.",
  "No big speech. Just keep slicing.",
  "One step forward. No drama. Love that for you.",
  "You’re building the streak. Protect it.",
  "That counts. Yes, it counts.",
  "Okayyyy productivity. I see you.",
  "Done. Don’t overthink it. Next.",
] as const;

export function pickCongratsText(
  remainingDays: number,
  willCompletePlan: boolean,
): { bucket: CongratsBucket; text: string } {
  if (willCompletePlan) return { bucket: "completed", text: pick(COMPLETED) };
  if (remainingDays >= 10) return { bucket: "long", text: pick(LONG) };
  if (remainingDays === 1) return { bucket: "last", text: pick(LAST) };
  if (remainingDays <= 3) return { bucket: "near", text: pick(NEAR) };
  return { bucket: "default", text: pick(DEFAULT) };
}

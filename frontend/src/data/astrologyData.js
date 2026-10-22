const VS = "\uFE0E";

export const SIGNS = [
  { id: 1, name: "Aries", glyph: "\u2648" + VS, element: "fire", style: "act first and refine later", dates: "Mar 21 - Apr 19" },
  { id: 2, name: "Taurus", glyph: "\u2649" + VS, element: "earth", style: "move steadily and want what you build to last", dates: "Apr 20 - May 20" },
  { id: 3, name: "Gemini", glyph: "\u264A" + VS, element: "air", style: "stay curious and keep your options open", dates: "May 21 - Jun 20" },
  { id: 4, name: "Cancer", glyph: "\u264B" + VS, element: "water", style: "protect what you care about and feel your way through", dates: "Jun 21 - Jul 22" },
  { id: 5, name: "Leo", glyph: "\u264C" + VS, element: "fire", style: "bring warmth and want to be seen doing it", dates: "Jul 23 - Aug 22" },
  { id: 6, name: "Virgo", glyph: "\u264D" + VS, element: "earth", style: "notice the details and look for ways to improve things", dates: "Aug 23 - Sep 22" },
  { id: 7, name: "Libra", glyph: "\u264E" + VS, element: "air", style: "weigh both sides and look for balance", dates: "Sep 23 - Oct 22" },
  { id: 8, name: "Scorpio", glyph: "\u264F" + VS, element: "water", style: "go deep and hold nothing back", dates: "Oct 23 - Nov 21" },
  { id: 9, name: "Sagittarius", glyph: "\u2650" + VS, element: "fire", style: "chase meaning and the bigger picture", dates: "Nov 22 - Dec 21" },
  { id: 10, name: "Capricorn", glyph: "\u2651" + VS, element: "earth", style: "plan for the long run and carry the weight", dates: "Dec 22 - Jan 19" },
  { id: 11, name: "Aquarius", glyph: "\u2652" + VS, element: "air", style: "step back and question how things are done", dates: "Jan 20 - Feb 18" },
  { id: 12, name: "Pisces", glyph: "\u2653" + VS, element: "water", style: "absorb the mood and follow your intuition", dates: "Feb 19 - Mar 20" }
];

export const HOUSES = [
  { short: "Self", title: "House of Self", about: "How you meet the world: your first impression, your body, and your instinctive way of starting things.", ask: "What do people notice about you first, and does it match how you feel inside?" },
  { short: "Worth", title: "House of Worth", about: "What you own and what you value: money, possessions, and the things that make you feel secure.", ask: "What do you spend on without hesitation, and what does that say about what you value?" },
  { short: "Voice", title: "House of Voice", about: "How you think and talk: everyday conversation, siblings, neighbors, and the way you learn.", ask: "When you can't find the words, what do you do instead?" },
  { short: "Roots", title: "House of Roots", about: "Where you come from: home, family, and the private foundation you return to.", ask: "What does home feel like at its best, and what from childhood do you still carry?" },
  { short: "Joy", title: "House of Joy", about: "What lights you up: creativity, play, romance, and the things you do purely for pleasure.", ask: "When did you last lose track of time doing something just because you loved it?" },
  { short: "Craft", title: "House of Craft", about: "Your daily rhythm: routines, work habits, health, and the small skills you keep sharpening.", ask: "Which daily habit gives you energy, and which one quietly drains it?" },
  { short: "Others", title: "House of Others", about: "Your one-to-one bonds: partners, close friends, and even the rivals who mirror you.", ask: "What do you keep finding in the people closest to you, good or bad?" },
  { short: "Depths", title: "House of Depths", about: "What you share and risk with others: intimacy, trust, shared money, and big change.", ask: "What have you let go of that changed you for the better?" },
  { short: "Horizons", title: "House of Horizons", about: "What you believe and where you want to go: travel, philosophy, teaching, and the big questions.", ask: "What belief have you outgrown, and what is pulling you toward something larger?" },
  { short: "Legacy", title: "House of Legacy", about: "What you build in public: your career, your reputation, and the mark you want to leave.", ask: "If your work were remembered for one thing, what would you want it to be?" },
  { short: "Community", title: "House of Community", about: "Your circles: friends, groups, causes, and the future you hope to help shape.", ask: "Which group makes you feel most like yourself, and what do you give back to it?" },
  { short: "Solitude", title: "House of Solitude", about: "What sits below the surface: rest, dreams, hidden patterns, and how things end.", ask: "What do you need to be alone to figure out?" }
];

export const INITIAL_MEMBERS = [
  { id: 1, name: "Momo Samuel", email: "theCodingShaman@gmail.com", phone: "(929) 389-7608", gender: "NB/F", sign: "Virgo", role: "officer", status: "active" },
  { id: 2, name: "Cam", email: "cam@cosmicminds.club", phone: "—", gender: "NB/M", sign: "Leo", role: "officer", status: "active" },
  { id: 3, name: "Mimi", email: "mimi@cosmicminds.club", phone: "—", gender: "F", sign: "Aquarius", role: "member", status: "active" },
  { id: 4, name: "Charlie Huerrera", email: "charlie.h@cosmicminds.club", phone: "—", gender: "M", sign: "Scorpio", role: "member", status: "active" }
];

export const INITIAL_EVENTS = [
  { id: 1, title: "Full Moon in Scorpio Night Vigil", date: "2026-11-04 20:00", location: "Observatory Quad", type: "stargazing", alignment: "Full Moon in Scorpio" },
  { id: 2, title: "Introduction to Natal Wheel Calculations", date: "2026-11-12 18:30", location: "Astrolab Hall 204", type: "workshop", alignment: "Sun trine Neptune" },
  { id: 3, title: "Zodiac Synastry & Compatibility Circle", date: "2026-11-20 19:00", location: "Campus Student Center", type: "social", alignment: "Venus conjunct Jupiter" }
];

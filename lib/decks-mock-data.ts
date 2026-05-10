import type { Deck } from "@/components/decks/DecksLibrary";

export type DeckTerm = {
  id: string;
  question: string;
  answer: string;
};

export const mockDecks: Deck[] = [
  {
    id: "d_001",
    title: "Python Essentials: Loops and Functions",
    topic: "Python",
    creator: "Alex Rivera",
    terms: 12,
    cardsInside: 24,
    updatedAt: "2 hours ago",
    updatedRank: 0,
    visibility: "Private",
    mastery: 71,
  },
  {
    id: "d_002",
    title: "Conics Focus: Hyperbola Core Concepts",
    topic: "Hyperbola",
    creator: "Jordan Lee",
    terms: 10,
    cardsInside: 20,
    updatedAt: "Yesterday",
    updatedRank: 2,
    visibility: "Public",
    mastery: 64,
  },
  {
    id: "d_003",
    title: "Ellipse Equations and Geometry",
    topic: "Ellipse",
    creator: "Sam Patel",
    terms: 9,
    cardsInside: 18,
    updatedAt: "3 days ago",
    updatedRank: 3,
    visibility: "Private",
    mastery: 56,
  },
  {
    id: "d_004",
    title: "Modern JavaScript: Closures and Async",
    topic: "JavaScript",
    creator: "Alex Rivera",
    terms: 11,
    cardsInside: 33,
    updatedAt: "4 hours ago",
    updatedRank: 1,
    visibility: "Public",
    mastery: 79,
  },
  {
    id: "d_005",
    title: "Shakespeare Sonnets: Form and Themes",
    topic: "Poetry",
    creator: "Morgan Chen",
    terms: 8,
    cardsInside: 16,
    updatedAt: "1 week ago",
    updatedRank: 5,
    visibility: "Private",
    mastery: 48,
  },
];

export const mockDeckTerms: Record<string, DeckTerm[]> = {
  d_001: [
    { id: "t_001_01", question: "What does `for` iterate over?", answer: "Any iterable (sequence, iterator, or object with __iter__)." },
    { id: "t_001_02", question: "What is a `while` loop guard?", answer: "A boolean expression evaluated before each iteration." },
    { id: "t_001_03", question: "Define a Python function with a default argument.", answer: "Use `def name(arg=value):` — defaults are evaluated at definition time." },
    { id: "t_001_04", question: "What is `*args`?", answer: "Collects extra positional arguments into a tuple." },
    { id: "t_001_05", question: "What is `**kwargs`?", answer: "Collects extra keyword arguments into a dict." },
    { id: "t_001_06", question: "What does `return` do?", answer: "Ends the function and sends a value back to the caller." },
    { id: "t_001_07", question: "What is recursion?", answer: "A function that calls itself, with a base case to stop." },
    { id: "t_001_08", question: "What is a closure?", answer: "An inner function that remembers variables from its enclosing scope." },
    { id: "t_001_09", question: "`break` vs `continue`?", answer: "`break` exits the loop; `continue` skips to the next iteration." },
    { id: "t_001_10", question: "What is `range(3)`?", answer: "An iterable of 0, 1, 2 (stop-exclusive)." },
    { id: "t_001_11", question: "List comprehension syntax?", answer: "`[expr for x in iterable if cond]`" },
    { id: "t_001_12", question: "Why avoid mutable default args?", answer: "The default object is shared across calls; use `None` and assign inside." },
  ],
  d_002: [
    { id: "t_002_01", question: "Standard form of a hyperbola (horizontal transverse axis)?", answer: "(x−h)²/a² − (y−k)²/b² = 1" },
    { id: "t_002_02", question: "Where are the foci for a horizontal hyperbola?", answer: "At (h ± c, k) where c² = a² + b²." },
    { id: "t_002_03", question: "What are asymptotes of (x/a)² − (y/b)² = 1?", answer: "y = ±(b/a)x (through the center)." },
    { id: "t_002_04", question: "Eccentricity of a hyperbola?", answer: "e = c/a, and e > 1." },
    { id: "t_002_05", question: "Difference of distances to foci?", answer: "Constant 2a for points on the hyperbola." },
    { id: "t_002_06", question: "Conjugate axis length?", answer: "2b, perpendicular to the transverse axis." },
    { id: "t_002_07", question: "Vertices of horizontal hyperbola?", answer: "(h ± a, k)." },
    { id: "t_002_08", question: "Rectangular hyperbola example?", answer: "xy = k (asymptotes are the axes)." },
    { id: "t_002_09", question: "How to complete the square?", answer: "Group x and y terms, add/subtract constants to form perfect squares." },
    { id: "t_002_10", question: "Directrix relation (conceptual)?", answer: "Defined via constant ratio e > 1 to a focus and directrix line." },
  ],
  d_003: [
    { id: "t_003_01", question: "Standard ellipse centered at origin?", answer: "x²/a² + y²/b² = 1 (a ≥ b for major on x-axis)." },
    { id: "t_003_02", question: "Foci distance c?", answer: "c² = a² − b²." },
    { id: "t_003_03", question: "Major axis length?", answer: "2a (the longer axis)." },
    { id: "t_003_04", question: "Minor axis length?", answer: "2b." },
    { id: "t_003_05", question: "Eccentricity of an ellipse?", answer: "e = c/a, with 0 ≤ e < 1." },
    { id: "t_003_06", question: "Sum of distances to foci on ellipse?", answer: "Constant 2a." },
    { id: "t_003_07", question: "Parametric form?", answer: "x = a cos t, y = b sin t." },
    { id: "t_003_08", question: "Area of an ellipse?", answer: "πab." },
    { id: "t_003_09", question: "When is it a circle?", answer: "When a = b (e = 0)." },
  ],
  d_004: [
    { id: "t_004_01", question: "What is a JavaScript closure?", answer: "A function plus the lexical environment it was created in." },
    { id: "t_004_02", question: "`async` function returns?", answer: "Always a Promise." },
    { id: "t_004_03", question: "What does `await` do?", answer: "Pauses async function until a Promise settles, then unwraps value." },
    { id: "t_004_04", question: "Promise.all behavior?", answer: "Fulfills with array of results; rejects if any input rejects." },
    { id: "t_004_05", question: "`let` vs `var` in loops?", answer: "`let` is block-scoped per iteration; `var` is function-scoped." },
    { id: "t_004_06", question: "What is hoisting?", answer: "`var`/function declarations are initialized before execution runs." },
    { id: "t_004_07", question: "Arrow function and `this`?", answer: "Inherits `this` from enclosing lexical scope." },
    { id: "t_004_08", question: "What is the event loop?", answer: "Mechanism that processes tasks, microtasks, and macrotasks after call stack clears." },
    { id: "t_004_09", question: "`fetch` returns?", answer: "A Promise resolving to a Response." },
    { id: "t_004_10", question: "Optional chaining operator?", answer: "`?.` short-circuits if left side is nullish." },
    { id: "t_004_11", question: "Nullish coalescing?", answer: "`??` returns right side only when left is null or undefined." },
  ],
  d_005: [
    { id: "t_005_01", question: "How many lines in a Shakespearean sonnet?", answer: "14 lines." },
    { id: "t_005_02", question: "Typical rhyme scheme (English sonnet)?", answer: "ABAB CDCD EFEF GG." },
    { id: "t_005_03", question: "What is a volta?", answer: "A turn in argument or tone, often before the final couplet." },
    { id: "t_005_04", question: "Petrarchan sonnet structure?", answer: "Octave (often ABBAABBA) + sestet (varied CDECDE or similar)." },
    { id: "t_005_05", question: "Iambic pentameter?", answer: "Five iambs per line (unstressed–stressed feet)." },
    { id: "t_005_06", question: "Couplet function in English sonnet?", answer: "Often delivers a punchline, resolution, or witty close." },
    { id: "t_005_07", question: "Common themes in Sonnets?", answer: "Love, time, beauty, mortality, and faith." },
    { id: "t_005_08", question: "What is enjambment?", answer: "A sentence running past the line break without terminal punctuation." },
  ],
};

export function getMockDeck(deckId: string): Deck | undefined {
  return mockDecks.find((d) => d.id === deckId);
}

export function getMockDeckTerms(deckId: string): DeckTerm[] {
  return mockDeckTerms[deckId] ?? [];
}

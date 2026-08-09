export type QuestionCategory =
  | "core"
  | "data-structures"
  | "functions"
  | "gotchas"
  | "algorithms";

export interface QuizQuestion {
  id: string;
  category: QuestionCategory;
  prompt: string;
  /** Optional code block shown in monospace above the answers. */
  code?: string;
  /** Exactly 4 answer strings; the correct one is at `correctIndex`. */
  answers: string[];
  correctIndex: number;
  /** One-sentence explanation of WHY the answer is right. */
  explanation: string;
}

/** Number of questions dealt per run (sampled from the bank). */
export const DECK_SIZE = 20;

/**
 * Deterministic PRNG (mulberry32) so runs can be seeded for testability.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle driven by a seeded PRNG (does not mutate input). */
export function seededShuffle<T>(input: readonly T[], seed: number): T[] {
  const out = input.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Returns a copy of the question with its answers shuffled and
 * `correctIndex` recomputed to match.
 */
export function shuffleAnswers(question: QuizQuestion, seed: number): QuizQuestion {
  const order = seededShuffle(question.answers.map((_, i) => i), seed);
  return {
    ...question,
    answers: order.map((i) => question.answers[i]),
    correctIndex: order.indexOf(question.correctIndex),
  };
}

/**
 * Builds a shuffled deck for one run: samples `size` questions from the
 * bank and shuffles each question's answers. Seed must stay stable for
 * the duration of a run (see `useQuizEngine`).
 */
export function buildDeck(seed: number, size = DECK_SIZE): QuizQuestion[] {
  return seededShuffle(QUESTIONS, seed)
    .slice(0, size)
    .map((question, i) => shuffleAnswers(question, seed + i + 1));
}

/**
 * Deterministic "question of the day": hashes the date so every visitor
 * sees the same highlighted question on a given day.
 */
export function dailyQuestion(date = new Date()): QuizQuestion {
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return QUESTIONS[hash % QUESTIONS.length];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "event-loop-order",
    category: "core",
    prompt: "What is the console output of this snippet?",
    code: `console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
console.log(4);`,
    answers: ["1, 4, 3, 2", "1, 2, 3, 4", "1, 4, 2, 3", "4, 1, 3, 2"],
    correctIndex: 0,
    explanation:
      "Synchronous code runs first (1, 4), microtasks (Promise) before macrotasks (setTimeout), so 3 logs before 2.",
  },
  {
    id: "closure-capture",
    category: "core",
    prompt: "What does a closure capture?",
    answers: [
      "Its lexical scope — variables of the enclosing function",
      "A snapshot of the global object",
      "The current call stack",
      "Only its own arguments",
    ],
    correctIndex: 0,
    explanation:
      "A closure retains a live reference to its lexical scope, so it can read and write the enclosing function's variables.",
  },
  {
    id: "var-hoisting",
    category: "core",
    prompt: "Which declaration is hoisted AND initialized to undefined?",
    answers: ["var", "let", "const", "None of them"],
    correctIndex: 0,
    explanation:
      "`var` is hoisted and initialized to `undefined`; `let`/`const` are hoisted but live in the temporal dead zone until their declaration.",
  },
  {
    id: "loose-eq-zero",
    category: "core",
    prompt: "What does `0 == false` evaluate to?",
    answers: ["true", "false", "TypeError", "null"],
    correctIndex: 0,
    explanation:
      "Loose equality coerces both sides to numbers first (0 → 0, false → 0), so it returns true.",
  },
  {
    id: "strict-eq-zero",
    category: "core",
    prompt: "What does `0 === false` evaluate to?",
    answers: ["false", "true", "TypeError", "undefined"],
    correctIndex: 0,
    explanation:
      "Strict equality does no coercion and `number` never equals `boolean`, so it returns false.",
  },
  {
    id: "arrow-this",
    category: "core",
    prompt: "How does `this` behave inside an arrow function?",
    answers: [
      "It is lexical — inherited from the enclosing scope",
      "It is the function's own invocation context",
      "It is always the global object",
      "It is undefined in strict mode only",
    ],
    correctIndex: 0,
    explanation:
      "Arrow functions have no `this` of their own; they use the `this` of the surrounding scope where they were defined.",
  },
  {
    id: "array-ooB",
    category: "data-structures",
    prompt: "What does `[1, 2, 3][5]` evaluate to?",
    answers: [
      "undefined",
      "null",
      "RangeError: out of bounds",
      "3",
    ],
    correctIndex: 0,
    explanation:
      "Arrays are objects: missing indexes simply return `undefined` — JavaScript never throws bounds errors on read.",
  },
  {
    id: "map-nonstring-keys",
    category: "data-structures",
    prompt: "Map vs Object — which allows non-string keys such as numbers, objects, or NaN?",
    answers: ["Map", "Object", "Both", "Neither"],
    correctIndex: 0,
    explanation:
      "Map keys can be any value — including NaN (which equals itself inside a Map) — while Object keys are coerced to strings.",
  },
  {
    id: "map-size",
    category: "data-structures",
    prompt: "Map vs Object — which has an O(1) `.size`?",
    answers: ["Map", "Object", "Both", "Neither"],
    correctIndex: 0,
    explanation:
      "Map tracks its own size internally; Object requires `Object.keys(obj).length`, which is O(n).",
  },
  {
    id: "localstorage-persist",
    category: "data-structures",
    prompt: "Which storage persists after the tab closes AND is NOT sent with HTTP requests?",
    answers: ["localStorage", "sessionStorage", "Cookies", "IndexedDB is the only one"],
    correctIndex: 0,
    explanation:
      "localStorage survives tab/browser restarts and stays client-side, unlike cookies which are sent with every request.",
  },
  {
    id: "sessionstorage-scope",
    category: "data-structures",
    prompt: "Which storage is cleared when the tab closes?",
    answers: ["sessionStorage", "localStorage", "Cookies", "Cache Storage"],
    correctIndex: 0,
    explanation:
      "sessionStorage is scoped to the tab session and is wiped when the tab closes.",
  },
  {
    id: "cookie-transport",
    category: "data-structures",
    prompt: "Which storage is sent automatically with every HTTP request (and can be httpOnly)?",
    answers: ["Cookies", "localStorage", "sessionStorage", "IndexedDB"],
    correctIndex: 0,
    explanation:
      "Cookies are attached to matching requests by the browser and can be marked httpOnly so JS can't read them.",
  },
  {
    id: "v8-array-max",
    category: "gotchas",
    prompt: "What is the practical maximum length of an array in V8 (Chrome/Node)?",
    answers: [
      "~2^29 - 1 (≈536M elements)",
      "~2^32 - 1 (≈4.3B elements)",
      "~1 million elements",
      "Unlimited",
    ],
    correctIndex: 0,
    explanation:
      "V8 arrays are capped at 2^32 - 2 in theory but practically ~2^29 - 1 elements before allocation fails.",
  },
  {
    id: "tdz",
    category: "gotchas",
    prompt: "What is the temporal dead zone (TDZ)?",
    answers: [
      "The period where let/const exist but cannot be accessed — a ReferenceError",
      "The delay before hoisted var initializes",
      "The time a Promise stays pending",
      "A debugging mode for closures",
    ],
    correctIndex: 0,
    explanation:
      "let/const are hoisted but uninitialized until their declaration line — accessing them earlier throws a ReferenceError.",
  },
  {
    id: "typeof-null",
    category: "gotchas",
    prompt: "What does `typeof null` evaluate to?",
    answers: ['"object"', '"null"', '"undefined"', '"boolean"'],
    correctIndex: 0,
    explanation:
      "A historical bug from the first JS engines: null's type tag was 0, the same as objects, so typeof reports 'object'.",
  },
  {
    id: "empty-array-neq",
    category: "gotchas",
    prompt: "What does `[] == ![]` evaluate to?",
    answers: ["true", "false", "TypeError", "NaN"],
    correctIndex: 0,
    explanation:
      "Both sides coerce to 0: [] → '' → 0 and ![] → false → 0, so loose equality returns true.",
  },
  {
    id: "nan-self",
    category: "gotchas",
    prompt: "How do you check if a value is NaN?",
    answers: ["Number.isNaN(value)", "value === NaN", "value == NaN", "typeof value === 'NaN'"],
    correctIndex: 0,
    explanation:
      "NaN is the only value not equal to itself, so === fails — Number.isNaN is the reliable check.",
  },
  {
    id: "const-mutation",
    category: "gotchas",
    prompt: "What happens when you run this?",
    code: `const obj = { a: 1 };
obj.a = 2;`,
    answers: [
      "Works — obj.a becomes 2",
      "TypeError: cannot assign to const",
      "Silently fails",
      "SyntaxError at parse time",
    ],
    correctIndex: 0,
    explanation:
      "const freezes the binding to the object, not the object's contents — mutating properties is allowed.",
  },
  {
    id: "set-dedupe",
    category: "functions",
    prompt: "What does `[...new Set([1, 2, 2, 3])]` evaluate to?",
    answers: ["[1, 2, 3]", "[1, 2, 2, 3]", "[1, 2]", "Set { 1, 2, 3 }"],
    correctIndex: 0,
    explanation:
      "A Set keeps only unique values, and spreading it back into an array yields [1, 2, 3].",
  },
  {
    id: "map-vs-foreach",
    category: "functions",
    prompt: "Which array method returns a NEW array?",
    answers: ["map", "forEach", "Both", "Neither"],
    correctIndex: 0,
    explanation:
      "map builds and returns a new transformed array; forEach only iterates and returns undefined.",
  },
  {
    id: "rest-params",
    category: "functions",
    prompt: "In `function f(...args)`, what is `args`?",
    answers: [
      "An array of all passed arguments",
      "An arguments-like object",
      "A promise",
      "A generator",
    ],
    correctIndex: 0,
    explanation:
      "The rest parameter collects remaining arguments into a real array, unlike the array-like `arguments` object.",
  },
  {
    id: "nullish-vs-ors",
    category: "functions",
    prompt: "Which two values do these expressions produce?",
    code: `0 ?? "default"   // ?
0 || "default"   // ?`,
    answers: ["0 and 'default'", "'default' and 'default'", "'default' and 0", "0 and 0"],
    correctIndex: 0,
    explanation:
      "?? only falls back on null/undefined, while || falls back on any falsy value — so 0 survives ?? but not ||.",
  },
  {
    id: "debounce-vs-throttle",
    category: "functions",
    prompt: "Which technique delays execution until events stop firing?",
    answers: ["Debounce", "Throttle", "Both", "Neither"],
    correctIndex: 0,
    explanation:
      "Debounce waits for a quiet period after the last event; throttle limits firing to at most once per interval.",
  },
  {
    id: "two-sum",
    category: "algorithms",
    prompt: "What is the optimal time complexity for the classic Two Sum problem?",
    answers: [
      "O(n) with a hash map",
      "O(n²) with nested loops",
      "O(n log n) with sorting only",
      "O(log n) with binary search",
    ],
    correctIndex: 0,
    explanation:
      "A single pass storing complements in a hash map finds the pair in O(n) time — the textbook optimal solution.",
  },
  {
    id: "is-palindrome",
    category: "algorithms",
    prompt: "What is the optimal complexity of a two-pointer isPalindrome check?",
    answers: [
      "O(n) time, O(1) space",
      "O(n) time, O(n) space",
      "O(n²) time, O(1) space",
      "O(log n) time, O(n) space",
    ],
    correctIndex: 0,
    explanation:
      "Two pointers walk inward comparing characters in one pass — no extra storage beyond two indices.",
  },
];

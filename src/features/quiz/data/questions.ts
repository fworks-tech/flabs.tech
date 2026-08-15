export type QuestionCategory =
  | 'core'
  | 'data-structures'
  | 'functions'
  | 'gotchas'
  | 'algorithms'
  | 'memory';

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
  /**
   * Optional code snippet shown with the explanation when the player
   * answers WRONG — the "learn from your mistakes" block.
   */
  explanationCode?: string;
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
  const order = seededShuffle(
    question.answers.map((_, i) => i),
    seed,
  );
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
 * sees the same highlighted question on a given day. Answers are shuffled
 * with the same date-derived seed, so the correct position is fair and
 * stable for the whole day.
 */
export function dailyQuestion(date = new Date()): QuizQuestion {
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  const question = QUESTIONS[hash % QUESTIONS.length];
  return shuffleAnswers(question, hash);
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 'event-loop-order',
    category: 'core',
    prompt: 'What is the console output of this snippet?',
    code: `console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
console.log(4);`,
    answers: ['1, 4, 3, 2', '1, 2, 3, 4', '1, 4, 2, 3', '4, 1, 3, 2'],
    correctIndex: 0,
    explanation:
      'Synchronous code runs first (1, 4), microtasks (Promise) before macrotasks (setTimeout), so 3 logs before 2.',
    explanationCode: `console.log(1); // sync — runs immediately
setTimeout(() => console.log(2)); // macrotask — queued last
Promise.resolve().then(() => console.log(3)); // microtask
console.log(4); // sync
// Output: 1, 4, then microtasks (3), then macrotasks (2)`,
  },
  {
    id: 'closure-capture',
    category: 'core',
    prompt: 'What does a closure capture?',
    answers: [
      'Its lexical scope — variables of the enclosing function',
      'A snapshot of the global object',
      'The current call stack',
      'Only its own arguments',
    ],
    correctIndex: 0,
    explanation:
      "A closure retains a live reference to its lexical scope, so it can read and write the enclosing function's variables.",
    explanationCode: `function outer() {
  let count = 0; // captured by reference — not a snapshot
  return () => ++count;
}
const inc = outer();
inc(); // 1
inc(); // 2 — the closure remembers count between calls`,
  },
  {
    id: 'var-hoisting',
    category: 'core',
    prompt: 'Which declaration is hoisted AND initialized to undefined?',
    answers: ['var', 'let', 'const', 'None of them'],
    correctIndex: 0,
    explanation:
      '`var` is hoisted and initialized to `undefined`; `let`/`const` are hoisted but live in the temporal dead zone until their declaration.',
    explanationCode: `console.log(a); // undefined — hoisted + initialized
var a = 1;

console.log(b); // ReferenceError — in the TDZ
let b = 2;`,
  },
  {
    id: 'loose-eq-zero',
    category: 'core',
    prompt: 'What does `0 == false` evaluate to?',
    answers: ['true', 'false', 'TypeError', 'null'],
    correctIndex: 0,
    explanation:
      'Loose equality coerces both sides to numbers first (0 → 0, false → 0), so it returns true.',
    explanationCode: `0 == false;  // true — both coerce to the number 0
0 === false; // false — number is never equal to boolean`,
  },
  {
    id: 'strict-eq-zero',
    category: 'core',
    prompt: 'What does `0 === false` evaluate to?',
    answers: ['false', 'true', 'TypeError', 'undefined'],
    correctIndex: 0,
    explanation:
      'Strict equality does no coercion and `number` never equals `boolean`, so it returns false.',
    explanationCode: `0 === false; // false — different types, no coercion
0 == false;  // true — loose equality coerces both to 0`,
  },
  {
    id: 'arrow-this',
    category: 'core',
    prompt: 'How does `this` behave inside an arrow function?',
    answers: [
      'It is lexical — inherited from the enclosing scope',
      "It is the function's own invocation context",
      'It is always the global object',
      'It is undefined in strict mode only',
    ],
    correctIndex: 0,
    explanation:
      'Arrow functions have no `this` of their own; they use the `this` of the surrounding scope where they were defined.',
    explanationCode: `const obj = {
  name: 'João',
  arrow: () => this.name, // lexical — this from the OUTER scope, not obj
  method() { return this.name; } // dynamic — this is obj
};
obj.arrow();  // undefined (window.name)
obj.method(); // 'João'`,
  },
  {
    id: 'array-ooB',
    category: 'data-structures',
    prompt: 'What does `[1, 2, 3][5]` evaluate to?',
    answers: ['undefined', 'null', 'RangeError: out of bounds', '3'],
    correctIndex: 0,
    explanation:
      'Arrays are objects: missing indexes simply return `undefined` — JavaScript never throws bounds errors on read.',
    explanationCode: `const arr = [1, 2, 3];
arr[5];      // undefined — no bounds error on read
arr.length;  // 3 — length doesn't grow from a read`,
  },
  {
    id: 'map-nonstring-keys',
    category: 'data-structures',
    prompt: 'Map vs Object — which allows non-string keys such as numbers, objects, or NaN?',
    answers: ['Map', 'Object', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'Map keys can be any value — including NaN (which equals itself inside a Map) — while Object keys are coerced to strings.',
    explanationCode: `const obj = {};
obj[1] = 'a';
obj['1'] = 'b';
obj; // { '1': 'b' } — both keys coerced to "1", overwritten!

const map = new Map();
map.set(1, 'a');
map.set('1', 'b');
map.size; // 2 — 1 and '1' are distinct keys`,
  },
  {
    id: 'map-size',
    category: 'data-structures',
    prompt: 'Map vs Object — which has an O(1) `.size`?',
    answers: ['Map', 'Object', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'Map tracks its own size internally; Object requires `Object.keys(obj).length`, which is O(n).',
    explanationCode: `const map = new Map([['a', 1]]);
map.size; // 1 — O(1) internal counter

const obj = { a: 1 };
Object.keys(obj).length; // 1 — O(n) scan of own keys`,
  },
  {
    id: 'localstorage-persist',
    category: 'data-structures',
    prompt: 'Which storage persists after the tab closes AND is NOT sent with HTTP requests?',
    answers: ['localStorage', 'sessionStorage', 'Cookies', 'IndexedDB is the only one'],
    correctIndex: 0,
    explanation:
      'localStorage survives tab/browser restarts and stays client-side, unlike cookies which are sent with every request.',
    explanationCode: `localStorage.setItem('theme', 'dark'); // survives restart
// localStorage is never attached to HTTP requests — cookies are`,
  },
  {
    id: 'sessionstorage-scope',
    category: 'data-structures',
    prompt: 'Which storage is cleared when the tab closes?',
    answers: ['sessionStorage', 'localStorage', 'Cookies', 'Cache Storage'],
    correctIndex: 0,
    explanation: 'sessionStorage is scoped to the tab session and is wiped when the tab closes.',
    explanationCode: `sessionStorage.setItem('k', 'v'); // alive while THIS tab is open
// Close the tab → wiped. A new tab starts with empty sessionStorage.`,
  },
  {
    id: 'cookie-transport',
    category: 'data-structures',
    prompt: 'Which storage is sent automatically with every HTTP request (and can be httpOnly)?',
    answers: ['Cookies', 'localStorage', 'sessionStorage', 'IndexedDB'],
    correctIndex: 0,
    explanation:
      "Cookies are attached to matching requests by the browser and can be marked httpOnly so JS can't read them.",
    explanationCode: `document.cookie = 'sid=abc; HttpOnly; Secure; SameSite=Lax';
// Browser adds the Cookie header to matching requests automatically.
// localStorage / sessionStorage are never sent with requests.`,
  },
  {
    id: 'tdz',
    category: 'gotchas',
    prompt: 'What is the temporal dead zone (TDZ)?',
    answers: [
      'The period where let/const exist but cannot be accessed — a ReferenceError',
      'The delay before hoisted var initializes',
      'The time a Promise stays pending',
      'A debugging mode for closures',
    ],
    correctIndex: 0,
    explanation:
      'let/const are hoisted but uninitialized until their declaration line — accessing them earlier throws a ReferenceError.',
    explanationCode: `console.log(x); // ReferenceError: Cannot access 'x' before initialization
let x = 1;
// x exists (hoisted) but is uninitialized until this line executes`,
  },
  {
    id: 'typeof-null',
    category: 'gotchas',
    prompt: 'What does `typeof null` evaluate to?',
    answers: ['"object"', '"null"', '"undefined"', '"boolean"'],
    correctIndex: 0,
    explanation:
      "A historical bug from the first JS engines: null's type tag was 0, the same as objects, so typeof reports 'object'.",
    explanationCode: `typeof null;      // 'object' — legacy bug (type tag 0 = object)
typeof undefined; // 'undefined'
// Correct check: value === null`,
  },
  {
    id: 'empty-array-neq',
    category: 'gotchas',
    prompt: 'What does `[] == ![]` evaluate to?',
    answers: ['true', 'false', 'TypeError', 'NaN'],
    correctIndex: 0,
    explanation:
      "Both sides coerce to 0: [] → '' → 0 and ![] → false → 0, so loose equality returns true.",
    explanationCode: `[] == ![];
// ![] → false → 0
// []  → '' → 0
// 0 == 0 → true (never write this in real code)`,
  },
  {
    id: 'nan-self',
    category: 'gotchas',
    prompt: 'How do you check if a value is NaN?',
    answers: ['Number.isNaN(value)', 'value === NaN', 'value == NaN', "typeof value === 'NaN'"],
    correctIndex: 0,
    explanation:
      'NaN is the only value not equal to itself, so === fails — Number.isNaN is the reliable check.',
    explanationCode: `NaN === NaN;         // false — NaN never equals itself
Number.isNaN(NaN);   // true — reliable
Number.isNaN('NaN'); // false — no coercion
isNaN('NaN');        // true — global isNaN coerces! trap`,
  },
  {
    id: 'const-mutation',
    category: 'gotchas',
    prompt: 'What happens when you run this?',
    code: `const obj = { a: 1 };
obj.a = 2;`,
    answers: [
      'Works — obj.a becomes 2',
      'TypeError: cannot assign to const',
      'Silently fails',
      'SyntaxError at parse time',
    ],
    correctIndex: 0,
    explanation:
      "const freezes the binding to the object, not the object's contents — mutating properties is allowed.",
    explanationCode: `const obj = { a: 1 };
obj.a = 2; // works — the BINDING is const, contents are mutable
obj = {};  // TypeError: assignment to constant variable`,
  },
  {
    id: 'set-dedupe',
    category: 'functions',
    prompt: 'What does `[...new Set([1, 2, 2, 3])]` evaluate to?',
    answers: ['[1, 2, 3]', '[1, 2, 2, 3]', '[1, 2]', 'Set { 1, 2, 3 }'],
    correctIndex: 0,
    explanation:
      'A Set keeps only unique values, and spreading it back into an array yields [1, 2, 3].',
    explanationCode: `[...new Set([1, 2, 2, 3])]; // [1, 2, 3] — duplicates dropped
// A Set stores each unique value once, in insertion order`,
  },
  {
    id: 'map-vs-foreach',
    category: 'functions',
    prompt: 'Which array method returns a NEW array?',
    answers: ['map', 'forEach', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'map builds and returns a new transformed array; forEach only iterates and returns undefined.',
    explanationCode: `const arr = [1, 2, 3];
const doubled = arr.map(x => x * 2); // NEW array [2, 4, 6]
const r = arr.forEach(x => x * 2);   // undefined — no return value`,
  },
  {
    id: 'rest-params',
    category: 'functions',
    prompt: 'In `function f(...args)`, what is `args`?',
    answers: [
      'An array of all passed arguments',
      'An arguments-like object',
      'A promise',
      'A generator',
    ],
    correctIndex: 0,
    explanation:
      'The rest parameter collects remaining arguments into a real array, unlike the array-like `arguments` object.',
    explanationCode: `function f(...args) {
  return Array.isArray(args); // true — a real array
}
// The old arguments object has no .map/.filter — rest does`,
  },
  {
    id: 'nullish-vs-ors',
    category: 'functions',
    prompt: 'Which two values do these expressions produce?',
    code: `0 ?? "default"   // ?
0 || "default"   // ?`,
    answers: ["0 and 'default'", "'default' and 'default'", "'default' and 0", '0 and 0'],
    correctIndex: 0,
    explanation:
      '?? only falls back on null/undefined, while || falls back on any falsy value — so 0 survives ?? but not ||.',
    explanationCode: `0 ?? 'd';   // 0 — ?? only falls back on null/undefined
0 || 'd';   // 'd' — 0 is falsy, so || falls back
'' ?? 'd';  // '' — preserved
'' || 'd';  // 'd'`,
  },
  {
    id: 'debounce-vs-throttle',
    category: 'functions',
    prompt: 'Which technique delays execution until events stop firing?',
    answers: ['Debounce', 'Throttle', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'Debounce waits for a quiet period after the last event; throttle limits firing to at most once per interval.',
    explanationCode: `// Debounce: fires 300ms AFTER the last keystroke — search inputs
debounce(() => search(query), 300);
// Throttle: fires AT MOST once every 200ms — scroll handlers
throttle(() => updateProgress(), 200);`,
  },
  {
    id: 'two-sum',
    category: 'algorithms',
    prompt: 'What is the optimal time complexity for the classic Two Sum problem?',
    answers: [
      'O(n) with a hash map',
      'O(n²) with nested loops',
      'O(n log n) with sorting only',
      'O(log n) with binary search',
    ],
    correctIndex: 0,
    explanation:
      'A single pass storing complements in a hash map finds the pair in O(n) time — the textbook optimal solution.',
    explanationCode: `function twoSum(nums, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}
// One pass = O(n); nested brute-force loops would be O(n²)`,
  },
  {
    id: 'is-palindrome',
    category: 'algorithms',
    prompt: 'What is the optimal complexity of a two-pointer isPalindrome check?',
    answers: [
      'O(n) time, O(1) space',
      'O(n) time, O(n) space',
      'O(n²) time, O(1) space',
      'O(log n) time, O(n) space',
    ],
    correctIndex: 0,
    explanation:
      'Two pointers walk inward comparing characters in one pass — no extra storage beyond two indices.',
    explanationCode: `function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l++] !== s[r--]) return false;
  }
  return true;
}
// One pass, two indices only: O(n) time, O(1) space`,
  },
  {
    id: 'promise-all',
    category: 'functions',
    prompt: 'What does Promise.all do when one promise rejects?',
    answers: [
      'Immediately rejects with that error',
      'Waits for all to finish, then rejects',
      'Returns partial results',
      'Throws a synchronous error',
    ],
    correctIndex: 0,
    explanation:
      "Promise.all short-circuits on the first rejection — it doesn't wait for other promises to settle.",
    explanationCode: `Promise.all([fetch('/a'), fetch('/b')])
  .then(console.log)      // both values, in order
  .catch(console.error);  // fires on the FIRST rejection — fast fail`,
  },
  {
    id: 'promise-allsettled',
    category: 'functions',
    prompt: 'What does Promise.allSettled return for each promise?',
    answers: [
      "{ status: 'fulfilled', value } or { status: 'rejected', reason }",
      'The resolved value directly',
      'Throws on any rejection',
      'undefined for rejected promises',
    ],
    correctIndex: 0,
    explanation:
      'Promise.allSettled never rejects — it returns an array of status objects showing the outcome of each promise.',
    explanationCode: `const results = await Promise.allSettled([fetch('/a'), fetch('/b')]);
// [{status:'fulfilled', value}, {status:'rejected', reason}]
// Never rejects — use it when partial failures are acceptable`,
  },
  {
    id: 'async-await-try-catch',
    category: 'functions',
    prompt: 'What happens if you forget try/catch around an awaited rejected promise?',
    answers: [
      'The async function returns a rejected promise',
      'It throws synchronously',
      'The error is silently ignored',
      'Node.js crashes',
    ],
    correctIndex: 0,
    explanation:
      "An unhandled rejection in an async function propagates as a rejected promise — it doesn't throw synchronously.",
    explanationCode: `async function load() {
  await fetch('/missing'); // rejection propagates out
}
load().catch(console.error);
// async functions never throw synchronously — they return
// a rejected promise that must be caught with try/catch or .catch`,
  },
  {
    id: 'prototype-chain',
    category: 'core',
    prompt: 'What is the prototype chain?',
    answers: [
      "An object's lookup path for properties via __proto__",
      'A linked list of constructors',
      'A copy of all parent properties',
      'A memory optimization technique',
    ],
    correctIndex: 0,
    explanation:
      "When a property isn't found on an object, JavaScript walks up the prototype chain via [[Prototype]] until it finds it or reaches null.",
    explanationCode: `const animal = { speaks: true };
const dog = Object.create(animal); // dog.__proto__ = animal
dog.speaks;     // true — not on dog, found on animal
dog.toString(); // inherited from Object.prototype
// Lookup path: dog → animal → Object.prototype → null`,
  },
  {
    id: 'class-inheritance',
    category: 'core',
    prompt: 'What must you call before accessing `this` in a subclass constructor?',
    answers: [
      'super()',
      'this.init()',
      'parent.constructor()',
      'Nothing — this is always available',
    ],
    correctIndex: 0,
    explanation:
      'super() must be called before `this` is accessible in a subclass constructor — it initializes the parent part of the object.',
    explanationCode: `class Animal { constructor() { this.alive = true; } }
class Dog extends Animal {
  constructor() {
    this.woof = true; // ReferenceError — must call super() first
    super();
  }
}`,
  },
  {
    id: 'event-delegation',
    category: 'core',
    prompt: 'What is event delegation?',
    answers: [
      'Handling events on a parent to catch events from children',
      'Passing event handlers to child components',
      'Removing event listeners after use',
      'Using capture phase instead of bubble',
    ],
    correctIndex: 0,
    explanation:
      'Event delegation leverages event bubbling — attach one listener to a parent and use event.target to identify which child triggered it.',
    explanationCode: `document.querySelector('#list').addEventListener('click', (e) => {
  if (e.target.matches('li')) handleItem(e.target);
});
// ONE listener for every item — vs attaching one per <li>`,
  },
  {
    id: 'spread-vs-rest',
    category: 'functions',
    prompt: "What's the difference between ...spread and ...rest?",
    answers: [
      'Spread expands iterables; rest collects into an array',
      'They are identical',
      'Rest expands; spread collects',
      'Spread works only with arrays',
    ],
    correctIndex: 0,
    explanation:
      'Spread (...) expands an array/string into individual elements; rest (...) collects remaining arguments/elements into an array.',
    explanationCode: `const arr = [1, 2, 3];
Math.max(...arr); // spread — expands into arguments

function sum(...nums) { // rest — collects into a real array
  return nums.reduce((a, b) => a + b, 0);
}`,
  },
  {
    id: 'destructuring-default',
    category: 'functions',
    prompt: 'What does `const { a = 5 } = {}` assign to `a`?',
    answers: ['5', 'undefined', 'null', 'ReferenceError'],
    correctIndex: 0,
    explanation:
      'Destructuring defaults kick in when the value is undefined — since {} has no `a`, it defaults to 5.',
    explanationCode: `const { a = 5 } = {};      // a = 5 — default applies
const { a = 5 } = { a: 0 };  // a = 0 — NOT undefined, default skipped`,
  },
  {
    id: 'optional-chaining',
    category: 'gotchas',
    prompt: 'What does `user?.address?.city` return if user is null?',
    answers: ['undefined', 'null', 'TypeError', "'' (empty string)"],
    correctIndex: 0,
    explanation:
      'Optional chaining (?.) short-circuits to undefined when the left side is null/undefined — no error thrown.',
    explanationCode: `const user = null;
user?.address?.city; // undefined — short-circuits safely
user.address.city;   // TypeError: Cannot read properties of null`,
  },
  {
    id: 'object-freeze',
    category: 'gotchas',
    prompt: 'Is Object.freeze shallow or deep?',
    answers: [
      'Shallow — nested objects can still be modified',
      'Deep — all levels are frozen',
      'Depends on the third argument',
      "Freeze doesn't exist",
    ],
    correctIndex: 0,
    explanation:
      'Object.freeze only freezes the top level — nested objects remain mutable unless you recursively freeze them.',
    explanationCode: `const obj = Object.freeze({ a: 1, nested: { b: 2 } });
obj.a = 99;         // silently ignored (TypeError in strict mode)
obj.nested.b = 3;   // WORKS — freeze is shallow only`,
  },
  {
    id: 'json-parse-stringify',
    category: 'functions',
    prompt: 'What does JSON.stringify do to undefined values?',
    answers: [
      'Removes them entirely from the output',
      "Converts to 'undefined' string",
      'Throws an error',
      'Converts to null',
    ],
    correctIndex: 0,
    explanation:
      "JSON.stringify skips undefined values in objects and arrays — they simply don't appear in the output.",
    explanationCode: `JSON.stringify({ a: undefined, b: () => {}, c: 1 });
// '{"c":1}' — functions and undefined are dropped
JSON.stringify([undefined, 1]); // '[null,1]' — arrays become null`,
  },
  {
    id: 'dom-queryselector',
    category: 'core',
    prompt: "What's the difference between getElementById and querySelector?",
    answers: [
      'querySelector accepts any CSS selector; getElementById only IDs',
      'querySelector is faster',
      'getElementById is deprecated',
      'They return different types',
    ],
    correctIndex: 0,
    explanation:
      'getElementById is optimized for ID lookups only; querySelector accepts any CSS selector but is slightly slower.',
    explanationCode: `document.getElementById('x'); // ID lookup only — fast
document.querySelector('#x');  // any CSS selector — slightly slower
document.querySelectorAll('.card'); // returns a NodeList`,
  },
  {
    id: 'requestanimationframe',
    category: 'core',
    prompt: 'When does requestAnimationFrame execute its callback?',
    answers: [
      'Before the next repaint (typically 60fps)',
      'Immediately and synchronously',
      'After setTimeout with 0ms',
      'In the microtask queue',
    ],
    correctIndex: 0,
    explanation:
      'requestAnimationFrame fires before the browser repaints — ideal for smooth animations without jank.',
    explanationCode: `requestAnimationFrame(() => animate());
// Runs before the next repaint (~60fps), synced to the display.
// setTimeout(0) is NOT display-synced — rAF avoids jank.`,
  },
  {
    id: 'weakmap-weakset',
    category: 'data-structures',
    prompt: 'Why use WeakMap/WeakSet instead of Map/Set?',
    answers: [
      'They allow garbage collection of keys',
      'They are faster',
      'They support iteration',
      'They have smaller memory footprint',
    ],
    correctIndex: 0,
    explanation:
      'WeakMap/WeakSet hold weak references to keys — if no other references exist, the entries can be garbage collected.',
    explanationCode: `const cache = new WeakMap();
let user = { id: 1 };
cache.set(user, 'expensive result');
user = null; // cache entry becomes GC-eligible — no leak
// Trade-offs: object keys only, not iterable, no .size`,
  },
  {
    id: 'closure-private',
    category: 'functions',
    prompt: 'How can closures create private variables?',
    answers: [
      'Encapsulate state in a function scope and expose getters/setters',
      'Use the private keyword',
      'Store in __private property',
      'Closures cannot be private',
    ],
    correctIndex: 0,
    explanation:
      'A closure retains access to its enclosing scope — variables declared there are inaccessible from outside the function.',
    explanationCode: `function createCounter() {
  let count = 0; // private — only reachable via returned closures
  return { inc: () => ++count, get: () => count };
}
const c = createCounter();
c.count; // undefined — encapsulated`,
  },
  {
    id: 'promise-chain',
    category: 'functions',
    prompt: 'What happens if you forget to return in a .then() callback?',
    answers: [
      'The next .then receives undefined',
      'The chain breaks',
      'It throws an error',
      'The promise is automatically resolved',
    ],
    correctIndex: 0,
    explanation:
      'Without a return, the .then() callback returns undefined implicitly — the next handler receives that undefined.',
    explanationCode: `Promise.resolve(1)
  .then((v) => { v + 1; })       // forgot return → resolves undefined
  .then((v) => console.log(v)); // undefined!
// Always return values to pass them down the chain`,
  },
  {
    id: 'map-iteration-order',
    category: 'data-structures',
    prompt: 'Which guarantees insertion order for ALL key types?',
    answers: ['Map', 'Plain object', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'Map preserves insertion order for every key; plain objects sort integer-like keys numerically first, breaking insertion order.',
    explanationCode: `const obj = {};
obj[3] = 'c'; obj[1] = 'a'; obj[2] = 'b';
Object.keys(obj); // ['1','2','3'] — integer keys sorted first

const map = new Map([[3,'c'],[1,'a'],[2,'b']]);
[...map.keys()]; // [3,1,2] — insertion order preserved`,
  },
  {
    id: 'map-proto-key',
    category: 'data-structures',
    prompt: 'Using a plain object as a lookup table, which key silently corrupts it?',
    answers: ['"__proto__"', '"constructor"', '"toString"', '"length"'],
    correctIndex: 0,
    explanation:
      'Assigning "__proto__" replaces the object\'s prototype instead of creating a normal key — the lookup silently gains inherited keys and loses stored data; Map is immune.',
    explanationCode: `const lookup = {};
lookup['__proto__'] = { hacked: true };
lookup.hacked;       // true — the prototype was REPLACED (inherited key!)
Object.keys(lookup); // [] — nothing stored as an own key

const map = new Map();
map.set('__proto__', { hacked: true }); // just a normal entry`,
  },
  {
    id: 'object-hasown',
    category: 'data-structures',
    prompt: 'Which check only looks at OWN properties, ignoring the prototype chain?',
    answers: ['Object.hasOwn(obj, key)', 'key in obj', 'obj[key] !== undefined', 'obj.key'],
    correctIndex: 0,
    explanation:
      '`in` and truthiness checks walk the prototype chain — Object.hasOwn only reports keys that exist directly on the object.',
    explanationCode: `const obj = { a: 1 };
'a' in obj;            // true — own property
'toString' in obj;     // true — INHERITED, false positive!
Object.hasOwn(obj, 'toString'); // false — safe`,
  },
  {
    id: 'set-vs-array-membership',
    category: 'data-structures',
    prompt: 'Which gives O(1) membership checks on large collections?',
    answers: ['Set — .has()', 'Array — .includes()', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'Set.has is an O(1) hash lookup; Array.includes scans the whole array in O(n) — a huge difference at scale.',
    explanationCode: `const arr = Array.from({ length: 1_000_000 }, (_, i) => i);
const set = new Set(arr);
arr.includes(999_999); // O(n) — up to 1M comparisons
set.has(999_999);      // O(1) — direct hash lookup`,
  },
  {
    id: 'set-object-identity',
    category: 'data-structures',
    prompt: 'How many entries does a Set keep for two structurally identical objects?',
    answers: [
      'Two — identity-based equality',
      'One — structural equality',
      'Zero — objects are rejected',
      'It throws an error',
    ],
    correctIndex: 0,
    explanation:
      'Set compares objects by identity (SameValueZero) — two objects with equal contents are still different entries.',
    explanationCode: `const a = { id: 1 };
const b = { id: 1 };
const s = new Set([a, b]);
s.size; // 2 — identity-based, not structural
// To dedupe by value you need a key function + Map`,
  },
  {
    id: 'sparse-array',
    category: 'data-structures',
    prompt: 'What does `new Array(3)` contain?',
    answers: ['Three empty slots (holes)', 'Three undefined values', 'An empty array', 'null'],
    correctIndex: 0,
    explanation:
      'new Array(3) creates holes — no values are stored, and methods like map and forEach skip holes entirely.',
    explanationCode: `const a = new Array(3);
a.map(() => 'x');    // [empty × 3] — holes are SKIPPED
[...a];              // [undefined, undefined, undefined] — spread fills them
a.fill(1);           // [1, 1, 1] — fill does not skip`,
  },
  {
    id: 'array-is-object',
    category: 'data-structures',
    prompt: 'What is `typeof []`?',
    answers: ["'object'", "'array'", "'undefined'", "'function'"],
    correctIndex: 0,
    explanation:
      "Arrays ARE objects — integer keys plus a special auto-updating length property. typeof reports 'object'.",
    explanationCode: `typeof [1, 2, 3]; // 'object' — arrays are objects
const a = [1, 2, 3];
a['extra'] = 'x'; // arbitrary properties are allowed
a.length;         // 3 — length tracks indexed elements only`,
  },
  {
    id: 'spread-cost',
    category: 'data-structures',
    prompt: 'Repeatedly doing `arr = [...arr, x]` inside a loop is…',
    answers: [
      'O(n²) — the array is copied every iteration',
      'O(n) — push is amortized constant',
      'O(log n)',
      'O(1)',
    ],
    correctIndex: 0,
    explanation:
      'Each spread allocates a fresh copy of the whole array — n copies of growing size add up to O(n²).',
    explanationCode: `let arr = [];
for (let i = 0; i < 10000; i++) {
  arr = [...arr, i]; // O(n²) — copies everything, every time
}
// Better: push into ONE array, spread once at the end`,
  },
  {
    id: 'typedarray',
    category: 'data-structures',
    prompt: 'Which is the right choice for a large, fixed-size numeric buffer?',
    answers: ['TypedArray (Float64Array, Uint8Array, …)', 'A regular array', 'A Set', 'A Map'],
    correctIndex: 0,
    explanation:
      'TypedArrays allocate one contiguous flat buffer with no per-element object overhead — far faster for numeric data.',
    explanationCode: `const typed = new Float64Array(1_000_000);
typed[0] = 3.14; // direct flat-buffer access
// A regular array stores each number as a boxed object bucket —
// slower numeric work and more memory`,
  },
  {
    id: 'proto-vs-prototype',
    category: 'core',
    prompt: 'Which is the actual link from an instance to its prototype?',
    answers: [
      '__proto__ (the [[Prototype]] slot)',
      '.prototype on the instance',
      'Both are identical',
      '.constructor',
    ],
    correctIndex: 0,
    explanation:
      '__proto__ is the live link on the instance; .prototype is a property on constructor FUNCTIONS that new instances get linked to.',
    explanationCode: `function Animal() {}
Animal.prototype.speak = () => '...';
const dog = new Animal();

dog.__proto__ === Animal.prototype;        // true — the instance link
dog.constructor.prototype === dog.__proto__; // true — same object`,
  },
  {
    id: 'prototype-pollution',
    category: 'core',
    prompt: 'Why is prototype pollution a security risk?',
    answers: [
      'It mutates the shared prototype — every object inherits the injected property',
      'It only slows down property lookups',
      'It affects only the polluted object',
      'It clears the prototype chain',
    ],
    correctIndex: 0,
    explanation:
      'Setting __proto__ / constructor.prototype on a parsed object poisons the shared prototype, so EVERY object inherits the injected property — use Maps for user-controlled keys.',
    explanationCode: `// Naive recursive merge — the classic pollution vector:
function merge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object') {
      merge(target[key], source[key]); // target['__proto__'] IS the shared prototype
    } else {
      target[key] = source[key];
    }
  }
}
merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
({}).isAdmin; // true — Object.prototype now carries isAdmin`,
  },
  {
    id: 'object-createnull',
    category: 'core',
    prompt: 'When is Object.create(null) the right choice?',
    answers: [
      'A key-value store with zero inherited properties',
      'Creating class instances',
      'Extending built-in objects',
      'Freezing objects',
    ],
    correctIndex: 0,
    explanation:
      'Object.create(null) builds an object with no prototype at all — no toString, no __proto__ collision, ideal for safe lookup tables.',
    explanationCode: `const store = Object.create(null);
store.toString;         // undefined — nothing inherited!
store['__proto__'] = 1; // a plain own key — no pollution

const obj = {};
obj.toString; // function — inherited from Object.prototype`,
  },
  {
    id: 'arch-patterns',
    category: 'core',
    prompt: 'Which architecture scales independent services but adds orchestration complexity?',
    answers: ['Microservices', 'Monolith', 'Serverless functions', 'Static site'],
    correctIndex: 0,
    explanation:
      'Microservices let each service deploy and scale independently — at the cost of networking, orchestration and operational complexity.',
    explanationCode: `// Monolith: one deployable — simplest ops, scales as a unit
// Microservices: independent deploy/scale — needs orchestration
// Serverless: pay-per-invoke — no servers, but cold starts`,
  },
  {
    id: 'websocket-security',
    category: 'core',
    prompt: 'Which is the most effective way to secure WebSockets?',
    answers: [
      'Validate Origin + authenticate tokens + require wss://',
      'Encrypt the payload inside the app',
      'Use very short messages',
      'Restrict the message size',
    ],
    correctIndex: 0,
    explanation:
      'Cross-site WebSocket hijacking is prevented by checking the Origin header and authenticating; wss:// prevents downgrade attacks.',
    explanationCode: `const ws = new WebSocket('wss://api.example.com/ws?token=' + token);
// Server side must:
// 1. Validate the Origin header (block cross-site hijacking)
// 2. Authenticate the token (reject unauthenticated sockets)
// 3. Refuse plain ws:// (downgrade/interception risk)`,
  },
  {
    id: 'multitenant-auth',
    category: 'core',
    prompt: 'What prevents cross-tenant data leakage in a multi-tenant SaaS app?',
    answers: [
      'Tenant-scoped keys and per-request tenant checks on the server',
      'Hiding the tenant ID in the client',
      'Using one shared database',
      'Adding CORS headers',
    ],
    correctIndex: 0,
    explanation:
      "Every query must be scoped by the authenticated user's tenant — client-supplied IDs alone are trivially forgeable (IDOR).",
    explanationCode: `// Never trust a client-supplied tenantId alone:
const data = db.query(
  'SELECT * FROM items WHERE tenant_id = $1',
  [req.user.tenantId] // taken from the verified session
);
// Scoped tokens + row-level checks stop IDOR / cross-tenant reads`,
  },
  {
    id: 'stack-vs-heap',
    category: 'memory',
    prompt: 'Where do objects and closures live in JavaScript?',
    answers: [
      'The heap — managed by garbage collection',
      'The stack — freed when functions return',
      'The global scope',
      'The event loop',
    ],
    correctIndex: 0,
    explanation:
      'Objects, arrays and closures live on the heap and are reclaimed by the GC; the stack holds primitives and references for the current call frames.',
    explanationCode: `// Stack: primitives + references (fast, per call-frame)
const a = 5;       // primitive on the stack
const obj = {x:1}; // heap object — 'obj' reference sits on the stack
// Heap: objects, arrays, closures — cleaned by garbage collection`,
  },
  {
    id: 'value-vs-reference',
    category: 'memory',
    prompt: 'Two variables assigned the same object — what happens when one mutates it?',
    answers: [
      'The change is visible through both — references are copied',
      'Only the first variable sees the change',
      'A TypeError is thrown',
      'The object is cloned automatically',
    ],
    correctIndex: 0,
    explanation:
      'Assignment copies the reference, not the object — both variables point to the same heap allocation, so mutations are shared.',
    explanationCode: `const a = { n: 1 };
const b = a;   // copies the REFERENCE, not the object
b.n = 2;
a.n; // 2 — same object!

let x = 1, y = x;
y = 2; // x stays 1 — primitives copy by value`,
  },
  {
    id: 'classic-leak',
    category: 'memory',
    prompt: 'Which of these is a classic JavaScript memory leak?',
    answers: [
      'An event listener retaining a closure over large data',
      'Using const everywhere',
      'Recursion with a base case',
      'Deleting array elements',
    ],
    correctIndex: 0,
    explanation:
      'A listener (or cached closure) that captures a large value keeps it alive forever — the closure holds a live reference to its scope.',
    explanationCode: `const bigData = new Array(1_000_000).fill('x');
function load() {
  const el = document.querySelector('#list');
  el.addEventListener('click', () => apply(bigData));
  // bigData stays in memory as long as the listener lives
}
// Fix: removeEventListener when done, or null out references`,
  },
  {
    id: 'string-concat',
    category: 'memory',
    prompt: 'Why is building a string with += inside a loop slow?',
    answers: [
      'Strings are immutable — every append allocates a new string',
      '+= is a syntax error inside loops',
      'The engine disables JIT in loops',
      'Strings are copied on every read',
    ],
    correctIndex: 0,
    explanation:
      'Each += allocates a brand-new string and abandons the old one — O(n²) allocation churn; collect parts and join instead.',
    explanationCode: `let s = '';
for (let i = 0; i < 100_000; i++) s += i; // new string every time (O(n²))

// Better: build an array, join once
const parts = [];
for (let i = 0; i < 100_000; i++) parts.push(i);
const result = parts.join('');`,
  },
  {
    id: 'bfs-vs-dfs',
    category: 'algorithms',
    prompt: 'Which traversal finds the shortest path in an unweighted graph?',
    answers: [
      'BFS — it explores level by level',
      'DFS — it explores deep first',
      'Both always',
      'Neither — sorting is required first',
    ],
    correctIndex: 0,
    explanation:
      'BFS visits nodes in order of distance, so the first time it reaches a target IS the shortest path; DFS has no such guarantee.',
    explanationCode: `// BFS (queue): level by level — first arrival = shortest path
// DFS (stack/recursion): deep first — no shortest-path guarantee
// DFS still wins for: cycle detection, path existence, tree depth`,
  },
  {
    id: 'adjacency-list',
    category: 'algorithms',
    prompt: 'Which graph representation is memory-efficient for sparse graphs?',
    answers: [
      'Adjacency list — O(V + E)',
      'Adjacency matrix — O(V²)',
      'Edge list with sorting',
      'Incidence matrix',
    ],
    correctIndex: 0,
    explanation:
      'An adjacency list stores only real edges (O(V+E)); a matrix always costs O(V²), though it gives O(1) edge lookups for dense graphs.',
    explanationCode: `const graph = new Map();
graph.set('A', ['B', 'C']); // node → neighbors
graph.set('B', ['A']);
// Memory: O(V + E) — only real edges stored.
// Adjacency matrix: O(V²) always — wasteful when sparse.`,
  },
  {
    id: 'cycle-detection',
    category: 'algorithms',
    prompt: 'How do you detect a cycle in a directed graph?',
    answers: [
      'DFS tracking in-progress nodes — a back edge means a cycle',
      'Counting the total number of edges',
      'Running a BFS level order',
      'Checking node degrees',
    ],
    correctIndex: 0,
    explanation:
      'DFS with three states (unvisited / in-progress / done) finds a cycle exactly when an edge leads to a node still in progress.',
    explanationCode: `const state = new Map(); // 0 unvisited, 1 in-progress, 2 done
function hasCycle(node) {
  if (state.get(node) === 1) return true;  // back edge — cycle!
  if (state.get(node) === 2) return false;
  state.set(node, 1);
  for (const next of graph.get(node) ?? []) {
    if (hasCycle(next)) return true;
  }
  state.set(node, 2);
  return false;
}`,
  },
  {
    id: 'memoization',
    category: 'algorithms',
    prompt: 'Naive Fibonacci recursion is O(2ⁿ). With memoization it becomes…',
    answers: ['O(n)', 'O(n²)', 'O(log n)', 'Still O(2ⁿ)'],
    correctIndex: 0,
    explanation:
      'Memoization caches subproblem results, so each fib(k) is computed once — overlapping subproblems collapse exponential work to linear.',
    explanationCode: `const memo = new Map();
function fib(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n); // reuse — the whole point
  const v = fib(n - 1) + fib(n - 2);
  memo.set(n, v);
  return v;
}
// Without memo: the same subtrees recompute exponentially`,
  },
  {
    id: 'complexity-log',
    category: 'algorithms',
    prompt: 'Why is binary search O(log n)?',
    answers: [
      'Each step halves the search space — log₂(n) steps',
      'It sorts the input first',
      'It scans elements in parallel',
      'It only reads every other element',
    ],
    correctIndex: 0,
    explanation:
      "Halving the range per step means at most log₂(n) comparisons — for 1M elements that's ~20 steps instead of 1M.",
    explanationCode: `// n → n/2 → n/4 → ... → 1 takes log₂(n) steps
// 1_000_000 elements: ~20 comparisons (2^20 ≈ 1M)
// Linear scan: up to 1,000,000 comparisons`,
  },
  {
    id: 'map-json',
    category: 'data-structures',
    prompt: 'Which is natively JSON-serializable?',
    answers: ['Plain object', 'Map', 'Both', 'Neither'],
    correctIndex: 0,
    explanation:
      'JSON.stringify works on plain objects out of the box; a Map serializes as an empty {} unless converted with Array.from first.',
    explanationCode: `JSON.stringify({ a: 1 });        // '{"a":1}' — native
JSON.stringify(new Map([['a', 1]])); // '{}' — empty!

// To serialize a Map:
JSON.stringify(Object.fromEntries(map)); // or Array.from(map)`,
  },
  {
    id: 'var-block-leak',
    category: 'core',
    prompt: 'What is the console output of this snippet?',
    code: `if (true) {
  var x = 1;
}
console.log(x);`,
    answers: ['1', 'ReferenceError: x is not defined', 'undefined', 'TypeError'],
    correctIndex: 0,
    explanation:
      'var ignores blocks — it is function-scoped, so x leaks out of the if block; let/const would stay confined.',
    explanationCode: `if (true) { var x = 1; }
console.log(x); // 1 — var leaks out of the block

if (true) { let y = 1; }
console.log(y); // ReferenceError — let is block-scoped`,
  },
  {
    id: 'function-hoisting',
    category: 'core',
    prompt: 'What is the console output of this snippet?',
    code: `greet();

function greet() {
  console.log('hi');
}`,
    answers: [
      "'hi' — function declarations are fully hoisted",
      'ReferenceError — greet is not defined',
      'TypeError — greet is undefined',
      'undefined',
    ],
    correctIndex: 0,
    explanation:
      'Function declarations are hoisted entirely, so they can be called before their line; function expressions stay undefined until executed.',
    explanationCode: `greet(); // works — declarations are fully hoisted
function greet() { console.log('hi'); }

sayHi(); // TypeError — sayHi is undefined here
var sayHi = function () { console.log('hi'); };`,
  },
  {
    id: 'this-in-settimeout',
    category: 'core',
    prompt: 'What does `this` refer to inside the setTimeout callback?',
    code: `const obj = {
  name: 'João',
  delayed() {
    setTimeout(function () {
      console.log(this.name);
    }, 100);
  },
};

obj.delayed();`,
    answers: [
      'The global object — regular functions get dynamic this',
      "'João' — bound to obj",
      'The setTimeout return value',
      "TypeError: cannot read 'name'",
    ],
    correctIndex: 0,
    explanation:
      'Regular functions get `this` from the call site — the callback is invoked as a plain function, so this is the global object (undefined in strict mode).',
    explanationCode: `const obj = {
  name: 'João',
  delayed() {
    setTimeout(function () { console.log(this.name); }, 100);
    // this = window/global — the callback is a plain call
    setTimeout(() => console.log(this.name), 100);
    // arrow captures obj — lexical this
  },
};`,
  },
  {
    id: 'promise-race-any',
    category: 'functions',
    prompt: 'Which resolves with the FIRST fulfilled result, ignoring earlier rejections?',
    answers: ['Promise.any', 'Promise.race', 'Promise.all', 'Promise.allSettled'],
    correctIndex: 0,
    explanation:
      'Promise.any waits for the first promise to FULFILL and ignores rejections; Promise.race settles on whichever settles first — rejection included.',
    explanationCode: `// race — first to SETTLE wins (even a rejection) → timeout pattern
Promise.race([fetch('/slow'), timeout(5000)]);

// any — first to FULFILL wins, rejections ignored → mirror fallback
Promise.any([fetch('/mirror1'), fetch('/mirror2')]);`,
  },
  {
    id: 'shallow-deep-copy',
    category: 'gotchas',
    prompt: 'Which creates a true deep copy?',
    answers: [
      'structuredClone(obj)',
      'JSON.parse(JSON.stringify(obj))',
      '{ ...obj }',
      'Object.assign({}, obj)',
    ],
    correctIndex: 0,
    explanation:
      'structuredClone recursively clones nested values (including Date, Map, Set); spread/assign are shallow, and the JSON trick loses undefined, functions and Dates.',
    explanationCode: `const original = { a: 1, nested: { b: 2 }, when: new Date() };

const shallow = { ...original };          // nested is SHARED — leaks back
const jsonCopy = JSON.parse(JSON.stringify(original)); // Date → string!
const deep = structuredClone(original);   // nested cloned, Date preserved`,
  },
  {
    id: 'ds-array-vs-ll-access',
    category: 'data-structures',
    prompt: 'Which statement is true about random access and middle insertion?',
    answers: [
      'Array: O(1) access, O(n) middle insert — Linked list: O(n) access, O(1) middle insert with a node pointer',
      'Array: O(n) access, O(1) middle insert — Linked list: O(1) access, O(n) middle insert',
      'Both are O(1) for access and O(n) for middle insertion',
      'Both are O(n) for access and O(1) for middle insertion',
    ],
    correctIndex: 0,
    explanation:
      'Arrays index by offset (O(1) access) but shift elements on insert (O(n)); linked lists traverse for access (O(n)) but rewire pointers in O(1) when you already hold the node.',
    explanationCode: `// Array: access O(1), insertion O(n) — shifts everything after i
arr.splice(i, 0, x);        // O(n)

// Linked list: access O(n), insertion O(1) with the node
const newNode = { val: x, next: node.next };
node.next = newNode;        // O(1) — just rewiring`,
  },
  {
    id: 'ds-hash-collision',
    category: 'data-structures',
    prompt: 'How do hash tables typically resolve collisions?',
    answers: [
      'Chaining (linked list per bucket) or open addressing (probing for a free slot)',
      'By rehashing every key into a larger array',
      'By storing all keys in a sorted array',
      'By allowing only unique hash values',
    ],
    correctIndex: 0,
    explanation:
      'Chaining stores colliding keys in a bucket list (Java 8 promotes long chains to trees); open addressing probes linearly/quadratically or with double hashing for the next free slot.',
    explanationCode: `// Chaining: bucket holds a linked list (or tree once chains grow long)
// Open addressing: probe i+1 (linear), i+c·k² (quadratic), or
// rehash with a second hash function until a free slot is found.
// Both degrade to O(n) worst case; rehash when the load factor rises.`,
  },
  {
    id: 'ds-stack-queue-apps',
    category: 'data-structures',
    prompt: 'Which pair of applications correctly maps to Stack and Queue?',
    answers: [
      'Undo history → Stack (LIFO); print job queue → Queue (FIFO)',
      'Undo history → Queue; print jobs → Stack',
      'Both use LIFO',
      'Both use FIFO',
    ],
    correctIndex: 0,
    explanation:
      'Undo pops the most recent action (LIFO → Stack); print jobs finish in arrival order (FIFO → Queue). BFS uses a Queue; DFS uses a Stack.',
    explanationCode: `// Stack (LIFO): undo history, DFS, expression evaluation
// Queue (FIFO): print jobs, task scheduling, BFS
// BFS finds shortest paths in unweighted graphs; DFS goes deep first`,
  },
  {
    id: 'ds-bst-vs-hashmap',
    category: 'data-structures',
    prompt: 'When is a balanced BST preferred over a hash table?',
    answers: [
      'When you need sorted iteration, predecessor/successor, or range queries',
      'When you need average O(1) lookup',
      'When keys must never collide',
      'When memory usage must be minimal',
    ],
    correctIndex: 0,
    explanation:
      'A BST keeps keys ordered — sorted in-order traversal, range scans, and floor/ceiling in O(log n). Hash tables win on average-case speed but lose all ordering.',
    explanationCode: `// BST wins: sorted iteration, kth smallest, range [a..b], floor/ceil
// Hash table wins: average O(1) get/set when order is irrelevant.
// Balanced BST also guarantees O(log n) worst case — hashing has O(n).`,
  },
  {
    id: 'ds-lru-cache',
    category: 'data-structures',
    prompt: 'Which data structure combination implements an O(1) LRU cache?',
    answers: [
      'Hash map (key → node) + doubly linked list ordered by recency',
      'Single linked list + array',
      'Two stacks',
      'Binary search tree only',
    ],
    correctIndex: 0,
    explanation:
      'The map gives O(1) lookup by key; the doubly linked list lets you move a hit to the head and evict the tail (LRU) — both O(1), which a singly linked list cannot do for arbitrary middle nodes.',
    explanationCode: `// get(key): move node to head    → O(1)
// put(key): evict tail when full → O(1)
// Doubly linked list → O(1) removal of ANY node (singly can't —
// a singly list has no predecessor pointer to splice the node out).`,
  },
  {
    id: 'alg-stable-sort',
    category: 'algorithms',
    prompt: 'Which of these sorting algorithms is STABLE (preserves relative order of equal elements)?',
    answers: ['Merge sort', 'Quicksort', 'Heapsort', 'None of them'],
    correctIndex: 0,
    explanation:
      'Merge sort preserves the relative order of equal keys. Quicksort and heapsort (classic in-place versions) do not — important for multi-key sorts (e.g., sort by date, then name).',
    explanationCode: `// Stable: merge sort, insertion sort, bubble sort
// Not stable: quicksort, heapsort (classic in-place versions)
// Multi-key sort: sort by date first, then name — a stable sort
// keeps the date order for equal names.`,
  },
];

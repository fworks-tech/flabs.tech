import type { Metadata } from "next";

import { baseURL } from "@/config";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";

export const metadata: Metadata = {
  ...generateMeta({
    title: "DevSprint — JavaScript Quiz",
    description: "Test your JavaScript fundamentals with DevSprint: 20 questions, 3 lives, 15 seconds each. Leaderboard, achievements, and referral opportunities for top scorers.",
    baseURL,
    image: "/api/og/generate?title=DevSprint",
    path: "/quiz",
  }),
  alternates: {
    canonical: `${baseURL}/quiz`,
  },
};

const quizFAQs = [
  {
    question: "What is DevSprint?",
    answer: "DevSprint is an arcade-style JavaScript quiz mini-game that tests the topics commonly asked in technical interviews. It features 20 questions, a 15-second timer, 3 lives, and streak multipliers.",
  },
  {
    question: "How many questions are in DevSprint?",
    answer: "DevSprint has a bank of 25 questions, but each run deals 20 randomly sampled questions. This keeps every game fresh while maintaining consistent scoring.",
  },
  {
    question: "What JavaScript topics does DevSprint cover?",
    answer: "DevSprint covers closures, event loop, type coercion, data structures (Map, Set, Array), hoisting, TDZ, algorithms (Two Sum, palindrome), and common gotchas like typeof null and NaN equality.",
  },
  {
    question: "How does the scoring work?",
    answer: "Correct answers earn 100 points multiplied by your streak (up to x5). You also get a 2-second time bonus for correct answers. Wrong answers or timeouts cost one of your 3 lives.",
  },
  {
    question: "What is the rank system?",
    answer: "Ranks are based on accuracy: Junior (<60%), Mid-Level (60-74%), Senior (75-89%), and Staff (90%+). Score 80% or higher to unlock referral opportunities.",
  },
];

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Schema
        as="faqPage"
        baseURL={baseURL}
        path="/quiz"
        title="DevSprint — JavaScript Quiz"
        description="Test your JavaScript fundamentals with DevSprint."
        faqs={quizFAQs}
      />
      {children}
    </>
  );
}

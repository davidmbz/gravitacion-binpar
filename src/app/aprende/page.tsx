import type { Metadata } from "next";
import { LearnExperience } from "@/features/learn/learn-experience";

export const metadata: Metadata = { title: "Aprende" };

export default function LearnPage() {
  return <LearnExperience />;
}

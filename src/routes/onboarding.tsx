import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/components/classroom/OnboardingPage";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

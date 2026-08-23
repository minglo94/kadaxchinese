import { createFileRoute } from "@tanstack/react-router";
import { GamesHub } from "@/components/games/GamesHub";

export const Route = createFileRoute("/games/")({ component: GamesHub });

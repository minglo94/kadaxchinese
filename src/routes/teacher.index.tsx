import { createFileRoute } from "@tanstack/react-router";
import { TeacherHome } from "@/components/teacher/TeacherHome";

export const Route = createFileRoute("/teacher/")({ component: TeacherHome });

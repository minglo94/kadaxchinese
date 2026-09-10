import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { ClassroomDetailPage } from "@/components/teacher/ClassroomDetailPage";

export const Route = createFileRoute("/teacher/class/$classId")({ component: ClassRoute });

function ClassRoute() {
  const { classId } = Route.useParams();
  const matches = useMatches();
  // 這條路線同時是 layout：有子路線（學生詳情）時只渲染 <Outlet/>。
  const hasChild = matches.some((match) => match.routeId.includes("student/$studentId"));
  if (hasChild) return <Outlet />;
  return <ClassroomDetailPage classId={classId} />;
}

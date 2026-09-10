import { createFileRoute } from "@tanstack/react-router";
import { StudentDetailPage } from "@/components/teacher/StudentDetailPage";

export const Route = createFileRoute("/teacher/class/$classId/student/$studentId")({
  component: StudentRoute,
});

function StudentRoute() {
  const { classId, studentId } = Route.useParams();
  return <StudentDetailPage classId={classId} studentId={studentId} />;
}

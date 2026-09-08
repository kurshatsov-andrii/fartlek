import { createFileRoute, Navigate } from "@tanstack/react-router";

const EventSingularRedirect = () => {
  const { id } = Route.useParams();
  return <Navigate to="/events/$id" params={{ id }} replace />;
};

export const Route = createFileRoute("/event/$id")({
  component: EventSingularRedirect,
});

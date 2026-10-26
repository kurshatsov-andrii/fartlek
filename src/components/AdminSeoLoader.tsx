import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";

const Editor = lazy(() => import("@/components/AdminSeoEditor").then((module) => ({ default: module.AdminSeoEditor })));

/** Visitors never download the administrator's editing tools. */
export function AdminSeoLoader() {
  const { isAdmin, user } = useAuth();
  if (!isAdmin || !user) return null;
  return <Suspense fallback={null}><Editor /></Suspense>;
}
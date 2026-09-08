import { createFileRoute } from "@tanstack/react-router";
import CategoriesIndex from "@/pages/CategoriesIndex";

export const Route = createFileRoute("/category/")({
  component: CategoriesIndex,
});

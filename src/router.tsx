import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Hand loader-fetched query data from SSR to the browser so suspense queries
  // don't refetch (and blank the page) right after hydration.
  setupRouterSsrQueryIntegration({ router, queryClient, wrapQueryClient: false });

  // Pages rendered by an older server (cached HTML during a deploy) carry no
  // query payload; skip query hydration instead of crashing the whole page.
  const integratedHydrate = router.options.hydrate;
  if (integratedHydrate) {
    router.options.hydrate = (dehydrated: any) =>
      dehydrated?.query ? integratedHydrate(dehydrated) : undefined;
  }

  return router;
};

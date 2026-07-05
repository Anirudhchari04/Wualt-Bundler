import { executeRoute, json, validate } from "@/lib/api";
import { bundleService } from "@/modules/bundles/bundle.service";
import { bundleIdSchema } from "@/modules/bundles/bundle.validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return executeRoute(async () => {
    const { id } = validate(bundleIdSchema, await context.params);
    return json({ data: await bundleService.getById(id) });
  });
}

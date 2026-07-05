import { executeRoute, json, readJson, validate } from "@/lib/api";
import { bundleIdSchema } from "@/modules/bundles/bundle.validation";
import { scanService } from "@/modules/scans/scan.service";
import { scanPayloadSchema } from "@/modules/scans/scan.validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return executeRoute(async () => {
    const { id: bundleId } = validate(bundleIdSchema, await context.params);
    const input = validate(scanPayloadSchema, await readJson(request));
    const result = await scanService.record({ ...input, bundleId });
    return json(
      { data: result },
      { status: result.duplicate ? 200 : 201 },
    );
  });
}

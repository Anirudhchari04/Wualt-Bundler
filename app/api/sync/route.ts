import { executeRoute, json, readJson, validate } from "@/lib/api";
import { syncService } from "@/modules/sync/sync.service";
import { syncRequestSchema } from "@/modules/sync/sync.validation";

export async function POST(request: Request) {
  return executeRoute(async () => {
    const input = validate(syncRequestSchema, await readJson(request));
    return json({ data: await syncService.sync(input) });
  });
}

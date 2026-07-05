import { executeRoute, json, readJson, validate } from "@/lib/api";
import { bundleService } from "@/modules/bundles/bundle.service";
import {
  createBundleSchema,
  listBundlesSchema,
} from "@/modules/bundles/bundle.validation";

export async function GET(request: Request) {
  return executeRoute(async () => {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const query = validate(listBundlesSchema, searchParams);
    return json(await bundleService.list(query));
  });
}

export async function POST(request: Request) {
  return executeRoute(async () => {
    const input = validate(createBundleSchema, await readJson(request));
    return json({ data: await bundleService.create(input) }, { status: 201 });
  });
}

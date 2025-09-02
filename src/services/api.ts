import { type ApicVersion, type Environment, type Catalog } from "../components/filters/types";

export type ApiItem = { id: string; name: string };

export async function fetchApis(params: {
  version: Exclude<ApicVersion, "">;
  env: Exclude<Environment, "">;
  catalog: Exclude<Catalog, "">;
  signal?: AbortSignal;
}): Promise<ApiItem[]> {
  const { version, env, catalog, signal } = params;
  const url = new URL("/apis", "https://your.api.example");
  url.searchParams.set("version", version);
  url.searchParams.set("environment", env);
  url.searchParams.set("catalog", catalog);

  const res = await fetch(url.toString(), { signal, credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch APIs (${res.status})`);
  return res.json();
}

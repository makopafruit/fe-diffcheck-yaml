import { useQuery } from "@tanstack/react-query";
import { fetchApicApis, type ApicApi } from "../services/apic.service";
export type ApicVersion = "" | "v5" | "v10";
export type Environment = "" | "uat" | "staging" | "prod";
export type Catalog = "" | "ubp" | "core";

type Filters = {
  version?: ApicVersion;
  environment?: Environment;
  catalog?: Catalog;
};

export function useApic(filters?: Filters) {
  const allChosen = !!filters?.version && !!filters?.environment && !!filters?.catalog;
  
  
  return useQuery<ApicApi[], Error>({
    queryKey: ["products", filters?.version, filters?.environment, filters?.catalog],
    queryFn: ({ signal }) => fetchApicApis(signal),
    enabled: allChosen,
    staleTime: 0, // 60 * 1000 = 1 minute cache, 0 = no staleTime
  });
}

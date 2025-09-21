// src/hooks/useApiDetail.ts
import { useQuery } from "@tanstack/react-query";
import { fetchApiById, type ApiDetailSwagger } from "../services/apic.service";

export function useApiDetail(id?: string, useMock = true) {
  return useQuery<ApiDetailSwagger, Error>({
    queryKey: ["api-detail", id, useMock],
    enabled: !!id,                                  // runs as soon as id exists
    queryFn: ({ signal }) => fetchApiById(id!, signal, { useMock }),
    staleTime: 0,
  });
}

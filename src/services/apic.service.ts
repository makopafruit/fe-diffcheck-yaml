// src/services/products.ts
export type ApicApi = {
  id: number;
  title: string;
  price: number;
  description: string;
};

export async function fetchApicApis(signal?: AbortSignal): Promise<ApicApi[]> {
  const res = await fetch("https://dummyjson.com/products", { signal });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const data = await res.json();
  return data.products; // API returns { products: [...] }
}

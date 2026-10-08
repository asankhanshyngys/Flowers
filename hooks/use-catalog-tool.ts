'use client';
import { useEffect } from 'react';
import { type Filters, type Product } from '@/lib/catalog';
interface ModelContext {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
}
export function useCatalogTool(
  products: Product[],
  filters: Filters,
  ready = true,
) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context || !ready) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'read_visible_bouquets',
            description:
              'Чтение букетов с учётом текущих фильтров. Цены в тиынах (100 тиынов = 1 тенге). Заказы не оформляются.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input) {
              if (
                !input ||
                typeof input !== 'object' ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error('Ожидается пустой объект');
              return {
                currency: 'KZT',
                products: products.map((p) => ({
                  id: p.id,
                  name: p.name,
                  priceMinor: p.price,
                  available: p.available,
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Browsing is available without WebMCP. */
    }
    return () => lifecycle.abort();
  }, [products, filters, ready]);
}

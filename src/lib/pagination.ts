export interface PaginationOptions {
  limit: number;
  cursor?: string;
  offset?: number;
  order: 'asc' | 'desc';
  sortField: string;
}

export function buildPaginationMeta(
  total: number,
  limit: number,
  itemsCount: number,
  lastItem: { id: string } | undefined,
  hasExtraItem: boolean
) {
  return {
    total,
    limit,
    nextCursor: hasExtraItem && lastItem ? lastItem.id : null,
    hasMore: hasExtraItem,
  };
}

import { Response } from 'express';

export interface MetaPagination {
  total: number;
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SuccessCollectionResponse<T> {
  data: T[];
  meta: MetaPagination;
}

export interface SuccessItemResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendCollection<T>(
  res: Response,
  statusCode: number,
  data: T[],
  meta: MetaPagination
): void {
  const payload: SuccessCollectionResponse<T> = { data, meta };
  res.status(statusCode).json(payload);
}

export function sendItem<T>(res: Response, statusCode: number, data: T): void {
  const payload: SuccessItemResponse<T> = { data };
  res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  res.status(statusCode).json(payload);
}

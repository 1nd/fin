// CCA: 1
export type StorageRecord<TPayload extends object = Record<string, never>> = {
  id: string;
  userId: string;
  updatedAt: string;
  deletedAt?: string;
} & TPayload;

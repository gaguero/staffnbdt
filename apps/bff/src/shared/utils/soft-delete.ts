export interface SoftDeleteOptions {
  includeDeleted?: boolean;
}

export const softDeleteFilter = (includeDeleted = false) => {
  if (includeDeleted) {
    return {};
  }
  return {
    deletedAt: null,
  };
};

export const applySoftDelete = <T extends Record<string, any>>(
  query: T,
  includeDeleted = false,
): T => {
  if (includeDeleted) {
    return query;
  }

  return {
    ...query,
    where: {
      ...query.where,
      deletedAt: null,
    },
  };
};
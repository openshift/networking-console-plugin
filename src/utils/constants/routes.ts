export const RoutesStatuses = ['Accepted', 'Pending', 'Rejected'] as const;

export type RoutesStatusesType = (typeof RoutesStatuses)[number];

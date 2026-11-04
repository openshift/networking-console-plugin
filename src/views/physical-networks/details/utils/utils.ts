import { getName } from '@utils/resources/shared';

import { EnactmentState, NodeEnactmentStateDetails } from '../../utils/types';

export const filterEnactmentStateDetails = (
  details: NodeEnactmentStateDetails[],
  searchInput: string,
  states: EnactmentState[],
): NodeEnactmentStateDetails[] =>
  details.filter(
    ({ node, status }) =>
      (getName(node)?.includes(searchInput) ?? false) &&
      states.includes(EnactmentState[status as keyof typeof EnactmentState]),
  );

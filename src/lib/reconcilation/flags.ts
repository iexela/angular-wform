import { isAngularAtLeast } from '../utils';

export const canAccessListOfValidators = isAngularAtLeast(11, 0);
export const canManageValidatorsIndividually = isAngularAtLeast(12, 2);

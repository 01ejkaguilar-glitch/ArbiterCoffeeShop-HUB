export const ROLES = {
  ADMIN: 'admin',
  BARISTA: 'barista',
  KITCHEN_STAFF: 'kitchen-staff',
  CUSTOMER: 'customer',
};

export const ROLE_DASHBOARD = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.BARISTA]: '/barista/dashboard',
  [ROLES.KITCHEN_STAFF]: '/kitchen/dashboard',
  [ROLES.CUSTOMER]: '/customer/dashboard',
};

/**
 * Shared theme tokens for Workforce components.
 * Import DEFAULT_THEME (barista) or KITCHEN_THEME instead of copy-pasting.
 */

import { FaUtensils, FaCookieBite, FaSnowflake, FaBox, FaSprayCan, FaPencilAlt } from 'react-icons/fa';

export const DEFAULT_THEME = {
  primary: '#006837',
  gradient: 'linear-gradient(90deg, #006837, #009245)',
  tint: '#E8F5E9',
  tintBorder: '#a5d6a7',
};

export const KITCHEN_THEME = {
  primary: '#c2410c',
  gradient: 'linear-gradient(90deg, #c2410c, #ea580c)',
  tint: '#fff7ed',
  tintBorder: '#fdba74',
};

export const KITCHEN_INVENTORY_TYPES = [
  { key: 'kitchen',    label: 'Kitchen',     icon: FaUtensils  },
  { key: 'baking',     label: 'Baking',      icon: FaCookieBite },
  { key: 'deli',       label: 'Deli Frozen', icon: FaSnowflake },
  { key: 'packaging',  label: 'Packaging',   icon: FaBox       },
  { key: 'cleaning',   label: 'Cleaning',    icon: FaSprayCan  },
  { key: 'stationery', label: 'Stationery',  icon: FaPencilAlt },
];

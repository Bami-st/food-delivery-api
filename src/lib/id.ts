import { init } from '@paralleldrive/cuid2';

// Create deterministic-length collision-resistant IDs
const createId = init({
  length: 16,
});

export function generateRestaurantId(): string {
  return `rest_${createId()}`;
}

export function generateMenuItemId(): string {
  return `menu_${createId()}`;
}

export function generateCustomerId(): string {
  return `cust_${createId()}`;
}

export function generateOrderId(): string {
  return `ord_${createId()}`;
}

export function generateOrderItemId(): string {
  return `item_${createId()}`;
}

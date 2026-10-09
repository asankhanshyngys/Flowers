import {
  sqliteTable,
  text,
  integer,
  index,
  check,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    searchName: text('search_name').notNull(),
    active: integer('active').notNull().default(1),
    displayOrder: integer('display_order').notNull().default(0),
    version: integer('version').notNull().default(1),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    check('category_active', sql`${t.active} IN (0,1)`),
    check('category_order', sql`${t.displayOrder} >= 0`),
  ],
);
export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    color: text('color').notNull().default(''),
    price: integer('price').notNull(),
    image: text('image').notNull().default(''),
    available: integer('available').notNull().default(0),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    displayOrder: integer('display_order').notNull().default(0),
    searchText: text('search_text').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    check(
      'product_price',
      sql`typeof(${t.price}) = 'integer' AND ${t.price} BETWEEN 0 AND 100000000`,
    ),
    check('product_available', sql`${t.available} IN (0,1)`),
    check(
      'product_status',
      sql`${t.status} IN ('draft','published','archived')`,
    ),
    check('product_order', sql`${t.displayOrder} >= 0`),
    index('products_public_order').on(t.status, t.displayOrder, t.id),
    index('products_public_price').on(t.status, t.price, t.id),
    index('products_category').on(t.categoryId, t.status),
  ],
);

export const adminAccounts = sqliteTable('admin_accounts', {
  email: text('email').primaryKey(),
  passwordHash: text('password_hash').notNull(),
  version: integer('version').notNull().default(1),
});
export const adminSessions = sqliteTable(
  'admin_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    email: text('email')
      .notNull()
      .references(() => adminAccounts.email, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('admin_session_expiry').on(t.expiresAt)],
);
export const adminLoginLimits = sqliteTable('admin_login_limits', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull(),
  expiresAt: integer('expires_at').notNull(),
});

export const adminPasswordResets = sqliteTable('admin_password_resets', {
  tokenHash: text('token_hash').primaryKey(),
  email: text('email').notNull().references(() => adminAccounts.email, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (t) => [index('admin_reset_expiry').on(t.expiresAt)]);

export const storeLocations = sqliteTable('store_locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull().default(''),
  hours: text('hours').notNull().default(''),
  mapUrl: text('map_url').notNull().default(''),
  active: integer('active').notNull().default(1),
  displayOrder: integer('display_order').notNull().default(0),
  version: integer('version').notNull().default(1),
}, t => [check('location_active', sql`${t.active} IN (0,1)`), check('location_order', sql`${t.displayOrder} >= 0`)]);

-- ============================================================
-- DRIPRR — Full Database Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enums
CREATE TYPE "UserRole"          AS ENUM ('CUSTOMER', 'STORE_OWNER', 'RIDER', 'ADMIN');
CREATE TYPE "OrderStatus"       AS ENUM ('PLACED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentMethod"     AS ENUM ('RAZORPAY', 'COD');
CREATE TYPE "PaymentStatus"     AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "DeliveryStatus"    AS ENUM ('ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');

-- User
CREATE TABLE "User" (
  "id"        TEXT         NOT NULL PRIMARY KEY,  -- Supabase Auth UUID
  "phone"     TEXT         UNIQUE,
  "email"     TEXT         UNIQUE,
  "name"      TEXT         NOT NULL,
  "role"      "UserRole"   NOT NULL DEFAULT 'CUSTOMER',
  "avatar"    TEXT,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Store
CREATE TABLE "Store" (
  "id"               TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"          TEXT        NOT NULL REFERENCES "User"("id"),
  "name"             TEXT        NOT NULL,
  "slug"             TEXT        NOT NULL UNIQUE,
  "tagline"          TEXT,
  "coverUrl"         TEXT,
  "logoUrl"          TEXT,
  "address"          TEXT        NOT NULL DEFAULT '',
  "city"             TEXT        NOT NULL DEFAULT '',
  "pincode"          TEXT        NOT NULL DEFAULT '',
  "lat"              FLOAT,
  "lng"              FLOAT,
  "isOpen"           BOOLEAN     NOT NULL DEFAULT FALSE,
  "status"           TEXT        NOT NULL DEFAULT 'active',
  "categories"       TEXT[]      NOT NULL DEFAULT '{}',
  "deliveryRadiusKm" FLOAT       NOT NULL DEFAULT 5,
  "deliveryFee"      FLOAT       NOT NULL DEFAULT 49,
  "freeDeliveryAbove" FLOAT      NOT NULL DEFAULT 999,
  "etaMin"           INT         NOT NULL DEFAULT 45,
  "rating"           FLOAT       NOT NULL DEFAULT 0,
  "reviewCount"      INT         NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- StoreApplication
CREATE TABLE "StoreApplication" (
  "id"             TEXT               NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerName"      TEXT               NOT NULL,
  "email"          TEXT               NOT NULL,
  "phone"          TEXT               NOT NULL,
  "storeName"      TEXT               NOT NULL,
  "storeAddress"   TEXT               NOT NULL,
  "city"           TEXT               NOT NULL,
  "pincode"        TEXT               NOT NULL,
  "categories"     TEXT[]             NOT NULL DEFAULT '{}',
  "description"    TEXT               NOT NULL,
  "instagram"      TEXT,
  "experience"     TEXT,
  "monthlySales"   TEXT,
  "status"         "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt"     TIMESTAMPTZ,
  "reviewedBy"     TEXT,
  "rejectReason"   TEXT,
  "createdUserId"  TEXT,
  "createdStoreId" TEXT,
  "createdAt"      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Product
CREATE TABLE "Product" (
  "id"            TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId"       TEXT        NOT NULL REFERENCES "Store"("id"),
  "name"          TEXT        NOT NULL,
  "brand"         TEXT        NOT NULL DEFAULT '',
  "description"   TEXT,
  "category"      TEXT        NOT NULL,
  "tags"          TEXT[]      NOT NULL DEFAULT '{}',
  "price"         FLOAT       NOT NULL,
  "originalPrice" FLOAT       NOT NULL,
  "imageUrls"     TEXT[]      NOT NULL DEFAULT '{}',
  "badge"         TEXT,
  "published"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "inStock"       BOOLEAN     NOT NULL DEFAULT TRUE,
  "rating"        FLOAT       NOT NULL DEFAULT 0,
  "reviewCount"   INT         NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory
CREATE TABLE "Inventory" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" TEXT        NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "size"      TEXT        NOT NULL,
  "stock"     INT         NOT NULL DEFAULT 0,
  "reserved"  INT         NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("productId", "size")
);

-- Address
CREATE TABLE "Address" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT        NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "label"     TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "phone"     TEXT        NOT NULL,
  "address"   TEXT        NOT NULL,
  "landmark"  TEXT,
  "city"      TEXT        NOT NULL DEFAULT '',
  "pincode"   TEXT        NOT NULL,
  "lat"       FLOAT,
  "lng"       FLOAT,
  "isDefault" BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WishlistItem
CREATE TABLE "WishlistItem" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT        NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "productId" TEXT        NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "productId")
);

-- Cart
CREATE TABLE "Cart" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CartItem
CREATE TABLE "CartItem" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "cartId"    TEXT        NOT NULL REFERENCES "Cart"("id") ON DELETE CASCADE,
  "productId" TEXT        NOT NULL REFERENCES "Product"("id"),
  "size"      TEXT        NOT NULL,
  "quantity"  INT         NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("cartId", "productId", "size")
);

-- Order
CREATE TABLE "Order" (
  "id"               TEXT           NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"           TEXT           NOT NULL REFERENCES "User"("id"),
  "storeId"          TEXT           NOT NULL REFERENCES "Store"("id"),
  "status"           "OrderStatus"  NOT NULL DEFAULT 'PLACED',
  "paymentMethod"    "PaymentMethod" NOT NULL DEFAULT 'COD',
  "subtotal"         FLOAT          NOT NULL,
  "deliveryFee"      FLOAT          NOT NULL DEFAULT 49,
  "discount"         FLOAT          NOT NULL DEFAULT 0,
  "total"            FLOAT          NOT NULL,
  "deliveryName"     TEXT           NOT NULL,
  "deliveryPhone"    TEXT           NOT NULL,
  "deliveryAddress"  TEXT           NOT NULL,
  "deliveryLandmark" TEXT,
  "deliveryPincode"  TEXT           NOT NULL,
  "deliverySlot"     TEXT,
  "eta"              TEXT,
  "couponCode"       TEXT,
  "createdAt"        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- OrderItem
CREATE TABLE "OrderItem" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"   TEXT        NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "productId" TEXT        NOT NULL REFERENCES "Product"("id"),
  "name"      TEXT        NOT NULL,
  "brand"     TEXT        NOT NULL DEFAULT '',
  "imageUrl"  TEXT,
  "size"      TEXT        NOT NULL,
  "price"     FLOAT       NOT NULL,
  "qty"       INT         NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment
CREATE TABLE "Payment" (
  "id"                TEXT            NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"           TEXT            NOT NULL UNIQUE REFERENCES "Order"("id"),
  "method"            "PaymentMethod" NOT NULL,
  "status"            "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount"            FLOAT           NOT NULL,
  "razorpayOrderId"   TEXT            UNIQUE,
  "razorpayPaymentId" TEXT            UNIQUE,
  "razorpaySignature" TEXT,
  "paidAt"            TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Rider
CREATE TABLE "Rider" (
  "id"              TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"          TEXT        NOT NULL UNIQUE REFERENCES "User"("id"),
  "zone"            TEXT        NOT NULL,
  "isActive"        BOOLEAN     NOT NULL DEFAULT FALSE,
  "currentLocation" TEXT,
  "vehicleType"     TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery
CREATE TABLE "Delivery" (
  "id"              TEXT             NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"         TEXT             NOT NULL UNIQUE REFERENCES "Order"("id"),
  "riderId"         TEXT             REFERENCES "Rider"("id"),
  "status"          "DeliveryStatus" NOT NULL DEFAULT 'ASSIGNED',
  "currentLocation" TEXT,
  "pickedUpAt"      TIMESTAMPTZ,
  "deliveredAt"     TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Review
CREATE TABLE "Review" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT        NOT NULL REFERENCES "User"("id"),
  "productId" TEXT        NOT NULL REFERENCES "Product"("id"),
  "storeId"   TEXT        NOT NULL REFERENCES "Store"("id"),
  "rating"    INT         NOT NULL,
  "title"     TEXT,
  "text"      TEXT,
  "images"    TEXT[]      NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "productId")
);

-- Notification
CREATE TABLE "Notification" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT        NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"      TEXT        NOT NULL,
  "title"     TEXT        NOT NULL,
  "body"      TEXT        NOT NULL,
  "payload"   JSONB,
  "readAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupon
CREATE TABLE "Coupon" (
  "id"        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId"   TEXT,
  "code"      TEXT        NOT NULL UNIQUE,
  "type"      TEXT        NOT NULL,
  "value"     FLOAT       NOT NULL,
  "minOrder"  FLOAT       NOT NULL DEFAULT 0,
  "maxUses"   INT         NOT NULL DEFAULT 100,
  "uses"      INT         NOT NULL DEFAULT 0,
  "active"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX "idx_store_owner"        ON "Store"("ownerId");
CREATE INDEX "idx_product_store"      ON "Product"("storeId");
CREATE INDEX "idx_product_category"   ON "Product"("category");
CREATE INDEX "idx_order_user"         ON "Order"("userId");
CREATE INDEX "idx_order_store"        ON "Order"("storeId");
CREATE INDEX "idx_order_status"       ON "Order"("status");
CREATE INDEX "idx_application_status" ON "StoreApplication"("status");
CREATE INDEX "idx_notification_user"  ON "Notification"("userId");

-- ============================================================
-- Done! All tables created.
-- ============================================================

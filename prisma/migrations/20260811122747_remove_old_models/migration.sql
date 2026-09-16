/*
  Warnings:

  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `line_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "line_items" DROP CONSTRAINT "line_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "line_items" DROP CONSTRAINT "line_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_employee_id_fkey";

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "employees";

-- DropTable
DROP TABLE "line_items";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "products";

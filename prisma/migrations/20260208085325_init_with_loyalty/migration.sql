-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyRevenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EventRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "venue" TEXT,
    "revenue" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "loyaltyTier" TEXT NOT NULL DEFAULT 'REGULAR',
    "referralCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "costPerUnit" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "showOnMenu" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderType" TEXT NOT NULL,
    "transportFee" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "setupFee" REAL NOT NULL DEFAULT 0,
    "serviceFee" REAL NOT NULL DEFAULT 0,
    "transportFee" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_name" TEXT,
    "ordered_liters" REAL,
    "jerrycans_required" REAL,
    "total_value_ugx" REAL,
    "production_status" TEXT DEFAULT 'PLANNED',
    CONSTRAINT "Event_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    CONSTRAINT "EventItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentMethodId" TEXT NOT NULL,
    "amountPaid" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Paid',
    "reference" TEXT,
    CONSTRAINT "Payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "PaymentLink_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentLink_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentLink_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "expenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethodId" TEXT NOT NULL,
    CONSTRAINT "Expense_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_date" DATETIME NOT NULL,
    "juice_type" TEXT NOT NULL,
    "target_liters" REAL NOT NULL,
    "production_type" TEXT NOT NULL,
    "event_id" TEXT,
    "expected_revenue_ugx" REAL NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_plans_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_code" TEXT NOT NULL,
    "plan_id" TEXT,
    "juice_type" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "output_liters" REAL NOT NULL DEFAULT 0,
    "wastage_liters" REAL NOT NULL DEFAULT 0,
    "yield_percentage" REAL,
    "batch_value_ugx" REAL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_batches_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "production_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_raw_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "inventory_item_id" TEXT,
    "material_name" TEXT NOT NULL,
    "quantity_used" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "cost_ugx" REAL NOT NULL,
    CONSTRAINT "batch_raw_materials_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "production_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batch_raw_materials_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "temperature_ok" BOOLEAN NOT NULL,
    "hygiene_ok" BOOLEAN NOT NULL,
    "taste_ok" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "checked_by" TEXT NOT NULL,
    "checked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_checks_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "production_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "packaging_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "package_type" TEXT NOT NULL,
    "package_size_liters" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_liters" REAL NOT NULL,
    "total_value_ugx" REAL NOT NULL,
    "packaged_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packaging_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "production_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finished_goods_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "liters" REAL NOT NULL,
    "expiry_date" DATETIME,
    "available" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "finished_goods_inventory_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "production_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "parent_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entry_date" DATETIME NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit_amount" REAL NOT NULL DEFAULT 0,
    "credit_amount" REAL NOT NULL DEFAULT 0,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_id" TEXT,
    CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ledger_entries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "accounting_periods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounting_periods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_month" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closed_by" TEXT,
    "closed_at" DATETIME
);

-- CreateTable
CREATE TABLE "daily_sales_summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "total_bottle_sales_ugx" REAL NOT NULL DEFAULT 0,
    "total_jerrycan_sales_ugx" REAL NOT NULL DEFAULT 0,
    "total_event_sales_ugx" REAL NOT NULL DEFAULT 0,
    "total_sales_ugx" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL,
    "lowStockThreshold" REAL NOT NULL DEFAULT 10,
    "expiryDate" DATETIME,
    "supplier" TEXT,
    "lastRestocked" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "baseQuantity" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recipes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipe_ingredients_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "supplier_type" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "payment_terms" TEXT NOT NULL,
    "default_unit_price" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "purchase_requisitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requisition_date" DATETIME NOT NULL,
    "requested_by" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity_requested" REAL NOT NULL,
    "required_date" DATETIME NOT NULL,
    "reason" TEXT,
    "linked_production_plan_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_date" DATETIME NOT NULL,
    "expected_delivery_date" DATETIME NOT NULL,
    "approved_by" TEXT NOT NULL,
    "total_value_ugx" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity_ordered" REAL NOT NULL,
    "unit_price_ugx" REAL NOT NULL,
    "total_price_ugx" REAL NOT NULL,
    CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "po_id" TEXT NOT NULL,
    "received_date" DATETIME NOT NULL,
    "received_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "goods_receipts_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grn_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity_received" REAL NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "goods_receipt_items_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "payment_date" DATETIME NOT NULL,
    "amount_ugx" REAL NOT NULL,
    "payment_method" TEXT NOT NULL,
    "reference_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "supplier_payments_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_no" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "department_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL,
    "hire_date" DATETIME NOT NULL,
    "base_salary" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "check_in" DATETIME,
    "check_out" DATETIME,
    "hours_worked" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "gross_pay" INTEGER NOT NULL,
    "deductions" INTEGER NOT NULL DEFAULT 0,
    "net_pay" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processed_at" DATETIME,
    CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRevenue_date_key" ON "DailyRevenue"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_code_key" ON "PaymentMethod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_referralCode_key" ON "Customer"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "production_batches_batch_code_key" ON "production_batches"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "quality_checks_batch_id_key" ON "quality_checks"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_account_code_key" ON "chart_of_accounts"("account_code");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_periods_period_month_key" ON "accounting_periods"("period_month");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sales_summary_date_key" ON "daily_sales_summary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_productId_key" ON "recipes"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_no_key" ON "employees"("employee_no");

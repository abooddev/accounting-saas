CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_tenant_id_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"tax_number" varchar(100),
	"payment_terms_days" integer DEFAULT 0 NOT NULL,
	"credit_limit" numeric(20, 6) DEFAULT '0' NOT NULL,
	"balance_usd" numeric(20, 6) DEFAULT '0' NOT NULL,
	"balance_lbp" numeric(20, 6) DEFAULT '0' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"barcode" varchar(100),
	"sku" varchar(100),
	"unit" varchar(20) DEFAULT 'piece' NOT NULL,
	"cost_price" numeric(20, 6),
	"cost_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"selling_price" numeric(20, 6),
	"selling_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"track_stock" boolean DEFAULT true NOT NULL,
	"current_stock" numeric(20, 6) DEFAULT '0' NOT NULL,
	"min_stock_level" numeric(20, 6) DEFAULT '0' NOT NULL,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "products_tenant_barcode_unique" UNIQUE("tenant_id","barcode"),
	CONSTRAINT "products_tenant_sku_unique" UNIQUE("tenant_id","sku")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"to_currency" varchar(3) DEFAULT 'LBP' NOT NULL,
	"rate" numeric(20, 6) NOT NULL,
	"effective_date" date NOT NULL,
	"source" varchar(50) DEFAULT 'manual',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "exchange_rates_tenant_id_from_currency_to_currency_effective_date_unique" UNIQUE("tenant_id","from_currency","to_currency","effective_date")
);
--> statement-breakpoint
CREATE TABLE "money_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"type" varchar(20) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"current_balance" numeric(20, 6) DEFAULT '0',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(20, 6) DEFAULT '1' NOT NULL,
	"unit" varchar(20) DEFAULT 'piece',
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(20, 6) NOT NULL,
	"sort_order" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"invoice_number" varchar(100),
	"internal_number" varchar(50) NOT NULL,
	"contact_id" uuid,
	"date" date NOT NULL,
	"due_date" date,
	"status" varchar(20) DEFAULT 'pending',
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"subtotal" numeric(20, 6) DEFAULT '0' NOT NULL,
	"discount_type" varchar(10),
	"discount_value" numeric(20, 6) DEFAULT '0',
	"discount_amount" numeric(20, 6) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 6) DEFAULT '0',
	"total" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_lbp" numeric(20, 6) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(20, 6) DEFAULT '0',
	"balance" numeric(20, 6) DEFAULT '0',
	"notes" text,
	"expense_category" varchar(100),
	"attachment_url" varchar(500),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"contact_id" uuid,
	"invoice_id" uuid,
	"account_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"amount_lbp" numeric(20, 6) NOT NULL,
	"payment_method" varchar(30) NOT NULL,
	"reference" varchar(255),
	"notes" text,
	"attachment_url" varchar(500),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "account_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"balance_after" numeric(20, 6) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"description" varchar(500),
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"current_number" integer DEFAULT 0,
	"year" integer NOT NULL,
	"format" varchar(50) DEFAULT '{prefix}-{year}-{number:05d}',
	CONSTRAINT "sequences_tenant_id_type_year_unique" UNIQUE("tenant_id","type","year")
);
--> statement-breakpoint
CREATE TABLE "pos_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"terminal_id" varchar(50) NOT NULL,
	"terminal_code" varchar(20) NOT NULL,
	"cashier_id" uuid NOT NULL,
	"cashier_name" varchar(255) NOT NULL,
	"opened_at" timestamp NOT NULL,
	"closed_at" timestamp,
	"opening_cash_usd" numeric(20, 2) DEFAULT '0' NOT NULL,
	"opening_cash_lbp" numeric(20, 2) DEFAULT '0' NOT NULL,
	"closing_cash_usd" numeric(20, 2),
	"closing_cash_lbp" numeric(20, 2),
	"expected_cash_usd" numeric(20, 2) DEFAULT '0' NOT NULL,
	"expected_cash_lbp" numeric(20, 2) DEFAULT '0' NOT NULL,
	"difference_usd" numeric(20, 2),
	"difference_lbp" numeric(20, 2),
	"total_sales" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_returns" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_transactions" numeric(10, 0) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"barcode" varchar(100),
	"product_name" varchar(255) NOT NULL,
	"product_name_ar" varchar(255),
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price" numeric(20, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(20, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"receipt_number" varchar(50) NOT NULL,
	"local_id" varchar(50),
	"customer_id" uuid,
	"customer_name" varchar(255),
	"subtotal" numeric(20, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(20, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 2) DEFAULT '0',
	"total" numeric(20, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 2) NOT NULL,
	"total_lbp" numeric(20, 2) NOT NULL,
	"payment" jsonb NOT NULL,
	"cashier_id" uuid NOT NULL,
	"cashier_name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"void_reason" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_accounts" ADD CONSTRAINT "money_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_money_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."money_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_account_id_money_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."money_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale_items" ADD CONSTRAINT "pos_sale_items_sale_id_pos_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."pos_sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_session_id_pos_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pos_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "contacts_tenant_type_idx" ON "contacts" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "contacts_tenant_name_idx" ON "contacts" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "categories_tenant_parent_idx" ON "categories" USING btree ("tenant_id","parent_id");--> statement-breakpoint
CREATE INDEX "products_tenant_category_idx" ON "products" USING btree ("tenant_id","category_id");--> statement-breakpoint
CREATE INDEX "products_tenant_name_idx" ON "products" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "exchange_rates_tenant_date_idx" ON "exchange_rates" USING btree ("tenant_id","effective_date");--> statement-breakpoint
CREATE INDEX "money_accounts_tenant_currency_idx" ON "money_accounts" USING btree ("tenant_id","currency");--> statement-breakpoint
CREATE INDEX "money_accounts_tenant_type_idx" ON "money_accounts" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_items_product_idx" ON "invoice_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_type_idx" ON "invoices" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "invoices_tenant_contact_idx" ON "invoices" USING btree ("tenant_id","contact_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_status_idx" ON "invoices" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "invoices_tenant_date_idx" ON "invoices" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "invoices_tenant_due_date_idx" ON "invoices" USING btree ("tenant_id","due_date");--> statement-breakpoint
CREATE INDEX "invoices_tenant_internal_number_idx" ON "invoices" USING btree ("tenant_id","internal_number");--> statement-breakpoint
CREATE INDEX "payments_tenant_type_idx" ON "payments" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "payments_tenant_contact_idx" ON "payments" USING btree ("tenant_id","contact_id");--> statement-breakpoint
CREATE INDEX "payments_tenant_invoice_idx" ON "payments" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "payments_tenant_date_idx" ON "payments" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "account_movements_tenant_account_idx" ON "account_movements" USING btree ("tenant_id","account_id");--> statement-breakpoint
CREATE INDEX "account_movements_tenant_date_idx" ON "account_movements" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "account_movements_reference_idx" ON "account_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "pos_sessions_tenant_idx" ON "pos_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "pos_sessions_tenant_status_idx" ON "pos_sessions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "pos_sessions_cashier_idx" ON "pos_sessions" USING btree ("cashier_id");--> statement-breakpoint
CREATE INDEX "pos_sale_items_sale_idx" ON "pos_sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "pos_sales_tenant_idx" ON "pos_sales" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "pos_sales_session_idx" ON "pos_sales" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "pos_sales_receipt_idx" ON "pos_sales" USING btree ("tenant_id","receipt_number");--> statement-breakpoint
CREATE INDEX "pos_sales_date_idx" ON "pos_sales" USING btree ("tenant_id","created_at");
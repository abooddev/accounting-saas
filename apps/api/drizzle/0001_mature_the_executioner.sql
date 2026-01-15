CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity_ordered" numeric(20, 6) DEFAULT '1' NOT NULL,
	"quantity_received" numeric(20, 6) DEFAULT '0' NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"line_total" numeric(20, 6) NOT NULL,
	"sort_order" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"supplier_id" uuid,
	"date" date NOT NULL,
	"expected_delivery_date" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"subtotal" numeric(20, 6) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(20, 6) DEFAULT '0',
	"total" numeric(20, 6) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"description" varchar(500) NOT NULL,
	"quantity_ordered" numeric(20, 6) NOT NULL,
	"quantity_delivered" numeric(20, 6) DEFAULT '0' NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(20, 6) NOT NULL,
	"sort_order" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"date" date NOT NULL,
	"expected_delivery_date" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"subtotal" numeric(20, 6) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(20, 6) DEFAULT '0',
	"tax_amount" numeric(20, 6) DEFAULT '0',
	"total" numeric(20, 6) DEFAULT '0' NOT NULL,
	"price_list_id" uuid,
	"sales_rep_id" uuid,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customer_price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"price_list_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_price_lists_unique" UNIQUE("customer_id","price_list_id")
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_list_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price" numeric(20, 6) NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_list_items_unique" UNIQUE("price_list_id","product_id","min_quantity")
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "credit_note_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"allocated_at" timestamp DEFAULT now(),
	"allocated_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "credit_note_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(20, 6) DEFAULT '1' NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"line_total" numeric(20, 6) NOT NULL,
	"sort_order" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"type" varchar(10) NOT NULL,
	"contact_id" uuid NOT NULL,
	"contact_type" varchar(20) NOT NULL,
	"original_invoice_id" uuid,
	"date" date NOT NULL,
	"reason" text,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"subtotal" numeric(20, 6) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(20, 6) DEFAULT '0',
	"total" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_lbp" numeric(20, 6) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"applied_amount" numeric(20, 6) DEFAULT '0',
	"unapplied_amount" numeric(20, 6) DEFAULT '0',
	"notes" text,
	"cancellation_reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(20, 6) NOT NULL,
	"unit_price" numeric(20, 6) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(20, 6) NOT NULL,
	"sort_order" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"date" date NOT NULL,
	"valid_until" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(20, 6) NOT NULL,
	"subtotal" numeric(20, 6) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(20, 6) DEFAULT '0',
	"tax_amount" numeric(20, 6) DEFAULT '0',
	"total" numeric(20, 6) DEFAULT '0' NOT NULL,
	"terms" text,
	"notes" text,
	"rejection_reason" text,
	"converted_to_type" varchar(20),
	"converted_to_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_contacts_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_price_lists" ADD CONSTRAINT "customer_price_lists_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_price_lists" ADD CONSTRAINT "customer_price_lists_price_list_id_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_allocations" ADD CONSTRAINT "credit_note_allocations_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_allocations" ADD CONSTRAINT "credit_note_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_allocations" ADD CONSTRAINT "credit_note_allocations_allocated_by_users_id_fk" FOREIGN KEY ("allocated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_original_invoice_id_invoices_id_fk" FOREIGN KEY ("original_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_order_items_po_idx" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "purchase_order_items_product_idx" ON "purchase_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_tenant_idx" ON "purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_tenant_supplier_idx" ON "purchase_orders" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_tenant_status_idx" ON "purchase_orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "purchase_orders_tenant_date_idx" ON "purchase_orders" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "purchase_orders_tenant_number_idx" ON "purchase_orders" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "sales_order_items_sales_order_idx" ON "sales_order_items" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "sales_order_items_product_idx" ON "sales_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sales_orders_tenant_idx" ON "sales_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sales_orders_tenant_status_idx" ON "sales_orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "sales_orders_tenant_customer_idx" ON "sales_orders" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "sales_orders_tenant_date_idx" ON "sales_orders" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "sales_orders_tenant_number_idx" ON "sales_orders" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "customer_price_lists_customer_idx" ON "customer_price_lists" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_price_lists_price_list_idx" ON "customer_price_lists" USING btree ("price_list_id");--> statement-breakpoint
CREATE INDEX "customer_price_lists_customer_priority_idx" ON "customer_price_lists" USING btree ("customer_id","priority");--> statement-breakpoint
CREATE INDEX "price_list_items_price_list_idx" ON "price_list_items" USING btree ("price_list_id");--> statement-breakpoint
CREATE INDEX "price_list_items_product_idx" ON "price_list_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "price_list_items_list_product_qty_idx" ON "price_list_items" USING btree ("price_list_id","product_id","min_quantity");--> statement-breakpoint
CREATE INDEX "price_lists_tenant_idx" ON "price_lists" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "price_lists_tenant_name_idx" ON "price_lists" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "price_lists_tenant_default_idx" ON "price_lists" USING btree ("tenant_id","is_default");--> statement-breakpoint
CREATE INDEX "credit_note_allocations_credit_note_idx" ON "credit_note_allocations" USING btree ("credit_note_id");--> statement-breakpoint
CREATE INDEX "credit_note_allocations_invoice_idx" ON "credit_note_allocations" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "credit_note_items_credit_note_idx" ON "credit_note_items" USING btree ("credit_note_id");--> statement-breakpoint
CREATE INDEX "credit_note_items_product_idx" ON "credit_note_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "credit_notes_tenant_type_idx" ON "credit_notes" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "credit_notes_tenant_contact_idx" ON "credit_notes" USING btree ("tenant_id","contact_id");--> statement-breakpoint
CREATE INDEX "credit_notes_tenant_status_idx" ON "credit_notes" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "credit_notes_tenant_date_idx" ON "credit_notes" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "credit_notes_tenant_number_idx" ON "credit_notes" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "quote_items_quote_idx" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quote_items_product_idx" ON "quote_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "quotes_tenant_idx" ON "quotes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "quotes_tenant_status_idx" ON "quotes" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "quotes_tenant_customer_idx" ON "quotes" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "quotes_tenant_date_idx" ON "quotes" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "quotes_tenant_number_idx" ON "quotes" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "quotes_tenant_valid_until_idx" ON "quotes" USING btree ("tenant_id","valid_until");
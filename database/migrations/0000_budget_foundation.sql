CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"account_id" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"plan" jsonb NOT NULL,
	CONSTRAINT "budgets_revision_positive" CHECK ("budgets"."revision" > 0),
	CONSTRAINT "budgets_plan_object" CHECK (jsonb_typeof("budgets"."plan") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_account_unique" ON "budgets" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "budgets_owner_idx" ON "budgets" USING btree ("owner_id");
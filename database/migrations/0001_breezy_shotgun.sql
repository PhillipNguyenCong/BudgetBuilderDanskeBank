CREATE TABLE "transaction_corrections" (
	"owner_id" text NOT NULL,
	"budget_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"source_id" text,
	"revision" integer NOT NULL,
	"decision" jsonb,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "transaction_corrections_budget_id_transaction_id_pk" PRIMARY KEY("budget_id","transaction_id"),
	CONSTRAINT "transaction_corrections_revision_positive" CHECK ("transaction_corrections"."revision" > 0),
	CONSTRAINT "transaction_corrections_decision_object" CHECK ("transaction_corrections"."decision" is null or jsonb_typeof("transaction_corrections"."decision") = 'object')
);
--> statement-breakpoint
ALTER TABLE "transaction_corrections" ADD CONSTRAINT "transaction_corrections_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_corrections_owner_budget" ON "transaction_corrections" USING btree ("owner_id","budget_id");
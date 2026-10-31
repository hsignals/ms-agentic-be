CREATE TABLE "retained_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" varchar(200) NOT NULL,
	"channel_id" varchar(200) NOT NULL,
	"run_id" uuid NOT NULL,
	"data_type" text NOT NULL,
	"access" varchar(30) NOT NULL,
	"provider" text,
	"connection_id" text,
	"saved_at" timestamp with time zone NOT NULL,
	"retrieved_at" timestamp with time zone,
	"source_as_of" timestamp with time zone,
	"size_bytes" integer NOT NULL,
	"storage_reference" text NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	CONSTRAINT "retained_files_access_check" CHECK ("retained_files"."access" IN ('accountEvidence', 'channelPrivate')),
	CONSTRAINT "retained_files_size_check" CHECK ("retained_files"."size_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" varchar(200) NOT NULL,
	"channel_id" varchar(200) NOT NULL,
	"mode" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"result" jsonb,
	"error_code" varchar(80),
	"deployment_id" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_runs_mode_check" CHECK ("analysis_runs"."mode" IN ('foreground', 'background')),
	CONSTRAINT "analysis_runs_status_check" CHECK ("analysis_runs"."status" IN ('queued', 'running', 'completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "retained_files" ADD CONSTRAINT "retained_files_run_id_analysis_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "retained_files_scope_idx" ON "retained_files" USING btree ("account_id","channel_id");--> statement-breakpoint
CREATE INDEX "analysis_runs_scope_idx" ON "analysis_runs" USING btree ("account_id","channel_id");
ALTER TABLE "exercises" ADD COLUMN "catalog_id" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "force" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "mechanic" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_catalog_id_unique" UNIQUE("catalog_id");
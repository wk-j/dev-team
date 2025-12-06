CREATE TYPE "public"."energy_state" AS ENUM('dormant', 'kindling', 'blazing', 'cooling', 'crystallized');--> statement-breakpoint
CREATE TYPE "public"."orbital_state" AS ENUM('open', 'focused', 'deep_work', 'away', 'supernova');--> statement-breakpoint
CREATE TYPE "public"."ping_status" AS ENUM('sent', 'delivered', 'read', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ping_type" AS ENUM('gentle', 'warm', 'direct');--> statement-breakpoint
CREATE TYPE "public"."star_type" AS ENUM('sun', 'giant', 'main_sequence', 'dwarf', 'neutron');--> statement-breakpoint
CREATE TYPE "public"."stream_state" AS ENUM('nascent', 'flowing', 'rushing', 'flooding', 'stagnant', 'evaporated');--> statement-breakpoint
CREATE TYPE "public"."work_item_depth" AS ENUM('shallow', 'medium', 'deep', 'abyssal');--> statement-breakpoint
CREATE TABLE "energy_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"work_item_id" uuid,
	"stream_id" uuid,
	"target_user_id" uuid,
	"data" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resonance_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id_a" uuid NOT NULL,
	"user_id_b" uuid NOT NULL,
	"resonance_score" integer DEFAULT 0 NOT NULL,
	"shared_work_items" integer DEFAULT 0 NOT NULL,
	"shared_streams" integer DEFAULT 0 NOT NULL,
	"ping_count" integer DEFAULT 0 NOT NULL,
	"established_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_interaction_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resonance_pings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"type" "ping_type" NOT NULL,
	"status" "ping_status" DEFAULT 'sent' NOT NULL,
	"message" text,
	"related_work_item_id" uuid,
	"related_stream_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stream_divers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"dived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"surfaced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"state" "stream_state" DEFAULT 'flowing' NOT NULL,
	"velocity" real DEFAULT 1 NOT NULL,
	"path_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"crystal_count" integer DEFAULT 0 NOT NULL,
	"parent_stream_id" uuid,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evaporated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"invited_by_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "team_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"constellation_layout" jsonb,
	"pulse_rate" integer DEFAULT 60,
	"total_crystals" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"role" varchar(100),
	"star_type" "star_type" DEFAULT 'main_sequence' NOT NULL,
	"energy_signature_color" varchar(7) DEFAULT '#00d4ff' NOT NULL,
	"orbital_state" "orbital_state" DEFAULT 'open' NOT NULL,
	"position_x" real DEFAULT 0 NOT NULL,
	"position_y" real DEFAULT 0 NOT NULL,
	"position_z" real DEFAULT 0 NOT NULL,
	"current_energy_level" integer DEFAULT 100 NOT NULL,
	"sanctum_theme" varchar(50) DEFAULT 'deep_void',
	"preferences" jsonb,
	"oauth_provider" varchar(50),
	"oauth_provider_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_item_contributors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"energy_contributed" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"first_contributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_contributed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"energy_state" "energy_state" DEFAULT 'dormant' NOT NULL,
	"energy_level" integer DEFAULT 0 NOT NULL,
	"depth" "work_item_depth" DEFAULT 'medium' NOT NULL,
	"stream_position" real DEFAULT 0 NOT NULL,
	"primary_diver_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kindled_at" timestamp with time zone,
	"crystallized_at" timestamp with time zone,
	"crystal_facets" integer DEFAULT 0,
	"crystal_brilliance" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "energy_events" ADD CONSTRAINT "energy_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "energy_events" ADD CONSTRAINT "energy_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "energy_events" ADD CONSTRAINT "energy_events_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "energy_events" ADD CONSTRAINT "energy_events_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "energy_events" ADD CONSTRAINT "energy_events_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_connections" ADD CONSTRAINT "resonance_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_connections" ADD CONSTRAINT "resonance_connections_user_id_a_users_id_fk" FOREIGN KEY ("user_id_a") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_connections" ADD CONSTRAINT "resonance_connections_user_id_b_users_id_fk" FOREIGN KEY ("user_id_b") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_pings" ADD CONSTRAINT "resonance_pings_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_pings" ADD CONSTRAINT "resonance_pings_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_pings" ADD CONSTRAINT "resonance_pings_related_work_item_id_work_items_id_fk" FOREIGN KEY ("related_work_item_id") REFERENCES "public"."work_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_pings" ADD CONSTRAINT "resonance_pings_related_stream_id_streams_id_fk" FOREIGN KEY ("related_stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_divers" ADD CONSTRAINT "stream_divers_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_divers" ADD CONSTRAINT "stream_divers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_contributors" ADD CONSTRAINT "work_item_contributors_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_contributors" ADD CONSTRAINT "work_item_contributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_primary_diver_id_users_id_fk" FOREIGN KEY ("primary_diver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "energy_events_team_idx" ON "energy_events" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "energy_events_occurred_at_idx" ON "energy_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "energy_events_type_idx" ON "energy_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "resonance_connections_team_idx" ON "resonance_connections" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resonance_connections_user_pair_idx" ON "resonance_connections" USING btree ("user_id_a","user_id_b");--> statement-breakpoint
CREATE INDEX "resonance_pings_to_user_idx" ON "resonance_pings" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "resonance_pings_status_idx" ON "resonance_pings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "stream_divers_stream_user_idx" ON "stream_divers" USING btree ("stream_id","user_id");--> statement-breakpoint
CREATE INDEX "stream_divers_active_idx" ON "stream_divers" USING btree ("surfaced_at");--> statement-breakpoint
CREATE INDEX "streams_team_idx" ON "streams" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "streams_state_idx" ON "streams" USING btree ("state");--> statement-breakpoint
CREATE INDEX "team_invites_team_idx" ON "team_invites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invites_email_idx" ON "team_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invites_token_idx" ON "team_invites" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_user_team_idx" ON "team_memberships" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_orbital_state_idx" ON "users" USING btree ("orbital_state");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("last_active_at");--> statement-breakpoint
CREATE UNIQUE INDEX "work_item_contributors_item_user_idx" ON "work_item_contributors" USING btree ("work_item_id","user_id");--> statement-breakpoint
CREATE INDEX "work_items_stream_idx" ON "work_items" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "work_items_energy_state_idx" ON "work_items" USING btree ("energy_state");--> statement-breakpoint
CREATE INDEX "work_items_primary_diver_idx" ON "work_items" USING btree ("primary_diver_id");
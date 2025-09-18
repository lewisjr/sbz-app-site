
  create table "public"."otps" (
    "id" text not null,
    "otp" bigint not null,
    "updated_at" timestamp with time zone not null
      );


alter table "public"."otps" enable row level security;

alter table "public"."clients" add column "country" text not null;

alter table "public"."clients" add column "signing_arrangement" bigint not null default '1'::bigint;

alter table "public"."odyn-tickets" add column "platform" text not null;

alter table "public"."odyn-tickets" add column "referral_source" text not null;

alter table "public"."odyn-tickets" add column "uid" text not null;

alter table "public"."odyn-tickets" alter column "id_num" set data type text using "id_num"::text;

CREATE UNIQUE INDEX otps_id_key ON public.otps USING btree (id);

CREATE UNIQUE INDEX otps_pkey ON public.otps USING btree (id);

alter table "public"."otps" add constraint "otps_pkey" PRIMARY KEY using index "otps_pkey";

alter table "public"."otps" add constraint "otps_id_key" UNIQUE using index "otps_id_key";

grant delete on table "public"."otps" to "anon";

grant insert on table "public"."otps" to "anon";

grant references on table "public"."otps" to "anon";

grant select on table "public"."otps" to "anon";

grant trigger on table "public"."otps" to "anon";

grant truncate on table "public"."otps" to "anon";

grant update on table "public"."otps" to "anon";

grant delete on table "public"."otps" to "authenticated";

grant insert on table "public"."otps" to "authenticated";

grant references on table "public"."otps" to "authenticated";

grant select on table "public"."otps" to "authenticated";

grant trigger on table "public"."otps" to "authenticated";

grant truncate on table "public"."otps" to "authenticated";

grant update on table "public"."otps" to "authenticated";

grant delete on table "public"."otps" to "service_role";

grant insert on table "public"."otps" to "service_role";

grant references on table "public"."otps" to "service_role";

grant select on table "public"."otps" to "service_role";

grant trigger on table "public"."otps" to "service_role";

grant truncate on table "public"."otps" to "service_role";

grant update on table "public"."otps" to "service_role";


  create policy "service_only"
  on "public"."admins"
  as permissive
  for all
  to service_role
using (true);



  create policy "service_only"
  on "public"."clients"
  as permissive
  for all
  to service_role
using (true);



  create policy "service_only"
  on "public"."logs"
  as permissive
  for all
  to service_role
using (true);



  create policy "service_only"
  on "public"."odyn-tickets"
  as permissive
  for all
  to service_role
using (true);



  create policy "service_only"
  on "public"."otps"
  as permissive
  for all
  to public
using (true);



  create policy "service_only"
  on "public"."system-vars"
  as permissive
  for all
  to service_role
using (true);



  create policy "service_only 2ab9_0"
  on "storage"."objects"
  as permissive
  for select
  to service_role
using ((bucket_id = 'kyc'::text));



  create policy "service_only 2ab9_1"
  on "storage"."objects"
  as permissive
  for insert
  to service_role
with check ((bucket_id = 'kyc'::text));




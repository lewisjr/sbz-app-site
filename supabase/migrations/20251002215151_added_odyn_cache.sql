
  create table "public"."odyn-cache" (
    "uid" text not null,
    "udf" text not null,
    "position" text not null
      );


alter table "public"."odyn-cache" enable row level security;

CREATE UNIQUE INDEX "odyn-cache_pkey" ON public."odyn-cache" USING btree (uid);

alter table "public"."odyn-cache" add constraint "odyn-cache_pkey" PRIMARY KEY using index "odyn-cache_pkey";

grant delete on table "public"."odyn-cache" to "anon";

grant insert on table "public"."odyn-cache" to "anon";

grant references on table "public"."odyn-cache" to "anon";

grant select on table "public"."odyn-cache" to "anon";

grant trigger on table "public"."odyn-cache" to "anon";

grant truncate on table "public"."odyn-cache" to "anon";

grant update on table "public"."odyn-cache" to "anon";

grant delete on table "public"."odyn-cache" to "authenticated";

grant insert on table "public"."odyn-cache" to "authenticated";

grant references on table "public"."odyn-cache" to "authenticated";

grant select on table "public"."odyn-cache" to "authenticated";

grant trigger on table "public"."odyn-cache" to "authenticated";

grant truncate on table "public"."odyn-cache" to "authenticated";

grant update on table "public"."odyn-cache" to "authenticated";

grant delete on table "public"."odyn-cache" to "service_role";

grant insert on table "public"."odyn-cache" to "service_role";

grant references on table "public"."odyn-cache" to "service_role";

grant select on table "public"."odyn-cache" to "service_role";

grant trigger on table "public"."odyn-cache" to "service_role";

grant truncate on table "public"."odyn-cache" to "service_role";

grant update on table "public"."odyn-cache" to "service_role";


  create policy "service_only"
  on "public"."odyn-cache"
  as permissive
  for all
  to service_role
using (true);




create type "public"."message_type" as enum ('text', 'pdf', 'command', 'img');

alter table "public"."admins" add column "approved" boolean not null default true;

alter table "public"."odyn-chats" add column "type" message_type not null default 'text'::message_type;

alter table "public"."odyn-tickets" add column "assignee_email_vars" text;

alter table "public"."odyn-tickets" add column "close_reason" text;


  create policy "anon_pub_sub"
  on "public"."odyn-chats"
  as permissive
  for select
  to anon
using (true);




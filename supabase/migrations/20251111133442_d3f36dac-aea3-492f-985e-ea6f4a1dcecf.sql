-- Enable pg_net extension for HTTP requests from database
create extension if not exists pg_net with schema extensions;

-- Create function to notify admins when product is flagged
create or replace function public.notify_admins_on_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  flagged_by_email text;
  request_id bigint;
  supabase_url text;
  service_role_key text;
begin
  -- Only trigger when status changes to 'flagged' or 'pending'
  if (NEW.status = 'flagged' or NEW.status = 'pending') and 
     (OLD.status is null or OLD.status != NEW.status) and
     NEW.flag_reason is not null then
    
    -- Get the email of the user who flagged the product
    select email into flagged_by_email
    from auth.users
    where id = NEW.flagged_by;

    -- Get Supabase configuration
    supabase_url := 'https://sljsgaqwaivmdnrtbgds.supabase.co';
    service_role_key := current_setting('request.jwt.claims', true)::json->>'role';
    
    -- Make async HTTP POST request to the edge function
    select net.http_post(
      url := supabase_url || '/functions/v1/notify-admins-flagged-product',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsanNnYXF3YWl2bWRucnRiZ2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTg2NDcsImV4cCI6MjA3NTkzNDY0N30.9x-GrGq3UXNa8EOsdsOXToSgJZNoEHMeovUoYttUSWQ'
      ),
      body := jsonb_build_object(
        'productId', NEW.id,
        'productTitle', NEW.title,
        'productDescription', coalesce(NEW.description, ''),
        'flagReason', NEW.flag_reason,
        'flaggedBy', coalesce(flagged_by_email, 'Unknown user')
      )
    ) into request_id;

    -- Log the request for debugging
    raise log 'Notification request sent with ID: % for product: %', request_id, NEW.title;
  end if;

  return NEW;
end;
$$;

-- Create trigger on products table
drop trigger if exists trigger_notify_admins_on_flag on public.products;

create trigger trigger_notify_admins_on_flag
  after insert or update on public.products
  for each row
  execute function public.notify_admins_on_flag();
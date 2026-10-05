-- Run the exam reminder job on Supabase infrastructure. The website does not
-- need to be open, and the cron secret never enters the React bundle.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
    into existing_job_id
    from cron.job
   where jobname = 'exam-push-notifications-hourly';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'exam-push-notifications-hourly',
  '0 * * * *',
  $job$
    select net.http_post(
      url := 'https://rxzvjpgpzidebikgijvy.supabase.co/functions/v1/send-exam-push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'EXAM_NOTIFICATION_CRON_SECRET'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);

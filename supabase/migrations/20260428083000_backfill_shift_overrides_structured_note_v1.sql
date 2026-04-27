-- Backfill legacy shift_overrides.note values into canonical
-- `calendar_override_v1` JSON so UI and notification rendering share one format.

create or replace function public.try_parse_jsonb(input text)
returns jsonb
language plpgsql
immutable
as $$
begin
  return input::jsonb;
exception when others then
  return null;
end;
$$;

with source_rows as (
  select
    so.id,
    so.override_type,
    so.override_shift,
    btrim(coalesce(so.label, '')) as label_trimmed,
    so.start_time,
    so.end_time,
    public.try_parse_jsonb(so.note) as note_json
  from public.shift_overrides as so
),
normalized_rows as (
  select
    src.id,
    case
      when coalesce(
        src.note_json->>'event_type',
        src.note_json->>'eventType',
        src.note_json->>'override_type',
        src.note_json->>'overrideType'
      ) in ('vacation','training','swap','extra','sick','business','custom')
        then coalesce(
          src.note_json->>'event_type',
          src.note_json->>'eventType',
          src.note_json->>'override_type',
          src.note_json->>'overrideType'
        )
      else src.override_type
    end as event_type,
    case
      when coalesce(
        src.note_json->>'shift_change',
        src.note_json->>'shiftChange',
        src.note_json->>'shift_override',
        src.note_json->>'shiftOverride',
        src.note_json->>'override_shift',
        src.note_json->>'overrideShift'
      ) in ('A','B','C','OFF','KEEP')
        then coalesce(
          src.note_json->>'shift_change',
          src.note_json->>'shiftChange',
          src.note_json->>'shift_override',
          src.note_json->>'shiftOverride',
          src.note_json->>'override_shift',
          src.note_json->>'overrideShift'
        )
      else coalesce(src.override_shift, 'KEEP')
    end as shift_change,
    case
      when coalesce(
        btrim(src.note_json->>'title'),
        btrim(src.note_json->>'event_title'),
        btrim(src.note_json->>'eventTitle')
      ) is not null
        then coalesce(
          btrim(src.note_json->>'title'),
          btrim(src.note_json->>'event_title'),
          btrim(src.note_json->>'eventTitle')
        )
      when src.label_trimmed = case src.override_type
        when 'vacation' then '휴가'
        when 'training' then '교육'
        when 'swap' then '교대'
        when 'extra' then '추가근무'
        when 'sick' then '병가'
        when 'business' then '출장'
        else '커스텀'
      end
        then ''
      else src.label_trimmed
    end as title,
    coalesce(btrim(src.note_json->>'memo'), btrim(src.note_json->>'description'), '') as memo,
    coalesce(
      nullif(src.note_json->>'start_at', ''),
      nullif(src.note_json->>'startAt', ''),
      nullif(src.note_json->>'start_time', ''),
      nullif(src.note_json->>'startTime', ''),
      case
        when src.start_time is null then null
        else to_char(src.start_time at time zone 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI')
      end
    ) as start_at,
    coalesce(
      nullif(src.note_json->>'end_at', ''),
      nullif(src.note_json->>'endAt', ''),
      nullif(src.note_json->>'end_time', ''),
      nullif(src.note_json->>'endTime', ''),
      case
        when src.end_time is null then null
        else to_char(src.end_time at time zone 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI')
      end
    ) as end_at,
    coalesce(
      nullif(src.note_json->>'remind_at', ''),
      nullif(src.note_json->>'remindAt', ''),
      nullif(src.note_json->>'alarm_at', ''),
      nullif(src.note_json->>'alarmAt', '')
    ) as remind_at,
    case
      when src.note_json is null then true
      when src.note_json->>'schema' <> 'calendar_override_v1' then true
      when coalesce(src.note_json->>'event_type', '') not in ('vacation','training','swap','extra','sick','business','custom') then true
      when coalesce(src.note_json->>'shift_change', '') not in ('A','B','C','OFF','KEEP') then true
      else false
    end as needs_backfill
  from source_rows as src
)
update public.shift_overrides as so
set note = jsonb_build_object(
  'schema', 'calendar_override_v1',
  'event_type', nr.event_type,
  'shift_change', nr.shift_change,
  'all_day', (nr.start_at is null or nr.end_at is null),
  'start_at', nr.start_at,
  'end_at', nr.end_at,
  'remind_at', nr.remind_at,
  'title', nr.title,
  'memo', nr.memo
)::text
from normalized_rows as nr
where so.id = nr.id
  and nr.needs_backfill;

drop function if exists public.try_parse_jsonb(text);

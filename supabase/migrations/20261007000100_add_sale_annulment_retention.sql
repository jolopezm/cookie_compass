begin;

alter table public.ordenes
  add column estado text not null default 'confirmada',
  add column anulada_en timestamptz,
  add column anulada_por uuid,
  add column motivo_anulacion text,
  add constraint ordenes_estado_check
    check (estado in ('confirmada', 'anulada')),
  add constraint ordenes_anulacion_consistente_check
    check (
      (
        estado = 'confirmada'
        and anulada_en is null
        and anulada_por is null
        and motivo_anulacion is null
      )
      or
      (
        estado = 'anulada'
        and anulada_en is not null
        and anulada_por is not null
        and motivo_anulacion is not null
        and btrim(motivo_anulacion) <> ''
      )
    );

create index ordenes_anuladas_retencion_idx
  on public.ordenes (anulada_en, id)
  where estado = 'anulada';

create table public.auditoria_ventas_anuladas (
  id_orden_original bigint primary key,
  total numeric(14, 4) not null check (total >= 0),
  motivo text not null check (btrim(motivo) <> ''),
  anulada_por uuid not null,
  anulada_en timestamptz not null,
  restaurada_por uuid,
  restaurada_en timestamptz,
  purgada_en timestamptz,
  constraint auditoria_ventas_restauracion_consistente_check
    check ((restaurada_por is null) = (restaurada_en is null))
);

comment on table public.auditoria_ventas_anuladas is
  'Minimal sale-annulment evidence retained after order details and the order are purged.';

alter table public.auditoria_ventas_anuladas enable row level security;

create policy auditoria_ventas_anuladas_lectura
  on public.auditoria_ventas_anuladas
  for select
  to authenticated
  using (public.es_usuario_cookie_compass());

revoke all on table public.auditoria_ventas_anuladas from public, anon, authenticated;
grant select on table public.auditoria_ventas_anuladas to authenticated;

create or replace function public.anular_venta(
  p_id_orden bigint,
  p_motivo text
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_orden public.ordenes%rowtype;
  v_actor uuid := auth.uid();
  v_anulada_en timestamptz := now();
begin
  if v_actor is null or not public.es_usuario_cookie_compass() then
    raise exception using errcode = '42501', message = 'User is not authorized to annul sales';
  end if;

  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception using errcode = '22023', message = 'Annulment reason must not be blank';
  end if;

  select * into v_orden
  from public.ordenes
  where id = p_id_orden
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Sale does not exist';
  end if;

  if v_orden.estado <> 'confirmada' then
    raise exception using errcode = '55000', message = 'Only confirmed sales can be annulled';
  end if;

  insert into public.auditoria_ventas_anuladas (
    id_orden_original,
    total,
    motivo,
    anulada_por,
    anulada_en,
    restaurada_por,
    restaurada_en,
    purgada_en
  ) values (
    v_orden.id,
    v_orden.total,
    btrim(p_motivo),
    v_actor,
    v_anulada_en,
    null,
    null,
    null
  )
  on conflict (id_orden_original) do update
  set total = excluded.total,
      motivo = excluded.motivo,
      anulada_por = excluded.anulada_por,
      anulada_en = excluded.anulada_en,
      restaurada_por = null,
      restaurada_en = null,
      purgada_en = null;

  update public.ordenes
  set estado = 'anulada',
      anulada_en = v_anulada_en,
      anulada_por = v_actor,
      motivo_anulacion = btrim(p_motivo)
  where id = v_orden.id;

  return v_orden.id;
end;
$$;

create or replace function public.restaurar_venta(p_id_orden bigint)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_orden public.ordenes%rowtype;
  v_actor uuid := auth.uid();
  v_restaurada_en timestamptz := now();
begin
  if v_actor is null or not public.es_usuario_cookie_compass() then
    raise exception using errcode = '42501', message = 'User is not authorized to restore sales';
  end if;

  select * into v_orden
  from public.ordenes
  where id = p_id_orden
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Sale does not exist or was already purged';
  end if;

  if v_orden.estado <> 'anulada' then
    raise exception using errcode = '55000', message = 'Only annulled sales can be restored';
  end if;

  if v_orden.anulada_en <= v_restaurada_en - interval '15 days' then
    raise exception using errcode = '55000', message = 'Sale restoration window has expired';
  end if;

  insert into public.auditoria_ventas_anuladas (
    id_orden_original,
    total,
    motivo,
    anulada_por,
    anulada_en,
    restaurada_por,
    restaurada_en
  ) values (
    v_orden.id,
    v_orden.total,
    v_orden.motivo_anulacion,
    v_orden.anulada_por,
    v_orden.anulada_en,
    v_actor,
    v_restaurada_en
  )
  on conflict (id_orden_original) do update
  set restaurada_por = excluded.restaurada_por,
      restaurada_en = excluded.restaurada_en;

  update public.ordenes
  set estado = 'confirmada',
      anulada_en = null,
      anulada_por = null,
      motivo_anulacion = null
  where id = v_orden.id;

  return v_orden.id;
end;
$$;

create or replace function public.purgar_ventas_anuladas()
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ids bigint[];
  v_purgada_en timestamptz := now();
  v_count bigint;
begin
  select coalesce(array_agg(id order by id), array[]::bigint[])
  into v_ids
  from (
    select id
    from public.ordenes
    where estado = 'anulada'
      and anulada_en <= v_purgada_en - interval '15 days'
    order by id
    for update
  ) as elegibles;

  v_count := cardinality(v_ids);
  if v_count = 0 then
    return 0;
  end if;

  insert into public.auditoria_ventas_anuladas (
    id_orden_original,
    total,
    motivo,
    anulada_por,
    anulada_en,
    purgada_en
  )
  select id, total, motivo_anulacion, anulada_por, anulada_en, v_purgada_en
  from public.ordenes
  where id = any(v_ids)
  on conflict (id_orden_original) do update
  set purgada_en = excluded.purgada_en;

  delete from public.detalle_ordenes
  where id_orden = any(v_ids);

  delete from public.ordenes
  where id = any(v_ids);

  return v_count;
end;
$$;

create or replace function public.registrar_venta(
  p_id_cliente bigint,
  p_detalles jsonb,
  p_fecha timestamptz default now()
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_orden_id bigint;
  v_item record;
  v_precio numeric;
  v_total numeric(14, 4) := 0;
begin
  if auth.uid() is null or not public.es_usuario_cookie_compass() then
    raise exception using errcode = '42501', message = 'User is not authorized to register sales';
  end if;

  if p_id_cliente is null or not exists (
    select 1 from public.clientes where id = p_id_cliente and activo
  ) then
    raise exception using errcode = '23503', message = 'Customer is unknown or inactive';
  end if;

  if p_detalles is null
     or jsonb_typeof(p_detalles) <> 'array'
     or jsonb_array_length(p_detalles) = 0 then
    raise exception using errcode = '22023', message = 'Sale details must be a non-empty array';
  end if;

  for v_item in
    select x.id_producto, x.cantidad
    from jsonb_to_recordset(p_detalles) as x(id_producto bigint, cantidad numeric)
    order by x.id_producto
  loop
    if v_item.id_producto is null or v_item.cantidad is null or v_item.cantidad <= 0 then
      raise exception using errcode = '22023', message = 'Every sale detail requires a product and positive quantity';
    end if;

    select precio into v_precio
    from public.productos
    where id = v_item.id_producto
    for share;

    if not found then
      raise exception using errcode = '23503', message = 'Sale references an unknown product';
    end if;

    v_total := v_total + (v_item.cantidad * v_precio);
  end loop;

  insert into public.ordenes (fecha_registro, total, id_cliente)
  values (coalesce(p_fecha, now()), v_total, p_id_cliente)
  returning id into v_orden_id;

  insert into public.detalle_ordenes (
    fecha_registro,
    id_orden,
    id_producto,
    cantidad,
    precio_unitario
  )
  select
    coalesce(p_fecha, now()),
    v_orden_id,
    x.id_producto,
    x.cantidad,
    p.precio
  from jsonb_to_recordset(p_detalles) as x(id_producto bigint, cantidad numeric)
  join public.productos p on p.id = x.id_producto;

  update public.clientes
  set proxima_entrega = null
  where id = p_id_cliente
    and proxima_entrega <= coalesce(p_fecha, now())::date;

  return v_orden_id;
end;
$$;

revoke insert, update, delete on table public.ordenes, public.detalle_ordenes
  from public, anon, authenticated;

revoke execute on function public.registrar_venta(bigint, jsonb, timestamptz)
  from public, anon;
grant execute on function public.registrar_venta(bigint, jsonb, timestamptz)
  to authenticated;

revoke execute on function public.anular_venta(bigint, text) from public, anon, authenticated;
revoke execute on function public.restaurar_venta(bigint) from public, anon, authenticated;
revoke execute on function public.purgar_ventas_anuladas() from public, anon, authenticated;
grant execute on function public.anular_venta(bigint, text) to authenticated;
grant execute on function public.restaurar_venta(bigint) to authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'purge-annulled-sales-daily',
  '0 3 * * *',
  $cron$select public.purgar_ventas_anuladas();$cron$
);

commit;

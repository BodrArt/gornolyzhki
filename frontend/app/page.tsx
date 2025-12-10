'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ResortView = {
  id: number;
  name: string;
  region: string | null;
  carDistanceKm: number | null;
  carHoursMin: number | null;
  carHoursMax: number | null;
  runsCount: number | null;
  maxRunLengthM: number | null;
  verticalDropM: number | null;
  hasChairlift: boolean;
  hasGondola: boolean;
  hasDraglift: boolean;
  kidsFriendly: boolean;
  nightSkiing: boolean;
  notes?: string | null;
};

export default function HomePage() {
  const [resorts, setResorts] = useState<ResortView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [maxHours, setMaxHours] = useState<number>(3);
  const [onlyComfort, setOnlyComfort] = useState<boolean>(false);
  const [excludeDraglift, setExcludeDraglift] = useState<boolean>(false);
  const [kidsOnly, setKidsOnly] = useState<boolean>(false);
  const [nightOnly, setNightOnly] = useState<boolean>(false);
  const [minRunLength, setMinRunLength] = useState<number>(0);
  const [minVerticalDrop, setMinVerticalDrop] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorText(null);

      try {
        const { data: cities, error: cityError } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', 'moscow')
          .limit(1);

        if (cityError) throw cityError;
        if (!cities || cities.length === 0) {
          throw new Error('Не найдена Москва в таблице cities (slug=moscow)');
        }

        const moscowId = cities[0].id;

        const { data, error } = await supabase
          .from('travel_profiles')
          .select(`
            car_distance_km,
            car_hours_min,
            car_hours_max,
            notes,
            resorts (
              id,
              name,
              region,
              runs_count,
              max_run_length_m,
              vertical_drop_m,
              has_chairlift,
              has_gondola,
              has_draglift,
              kids_friendly,
              night_skiing
            )
          `)
          .eq('city_id', moscowId);

        if (error) throw error;

        const mapped: ResortView[] =
          (data || [])
            .filter((row: any) => row.resorts)
            .map((row: any) => {
              const r = row.resorts;
              return {
                id: r.id,
                name: r.name,
                region: r.region,
                carDistanceKm: row.car_distance_km,
                carHoursMin: row.car_hours_min,
                carHoursMax: row.car_hours_max,
                runsCount: r.runs_count,
                maxRunLengthM: r.max_run_length_m,
                verticalDropM: r.vertical_drop_m,
                hasChairlift: !!r.has_chairlift,
                hasGondola: !!r.has_gondola,
                hasDraglift: !!r.has_draglift,
                kidsFriendly: !!r.kids_friendly,
                nightSkiing: !!r.night_skiing,
                notes: row.notes,
              };
            });

        setResorts(mapped);
      } catch (e: any) {
        console.error(e);
        setErrorText(e.message ?? 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = resorts.filter((r) => {
    if (r.carHoursMax != null && r.carHoursMax > maxHours) return false;
    if (onlyComfort && !(r.hasChairlift || r.hasGondola)) return false;
    if (excludeDraglift && r.hasDraglift) return false;
    if (kidsOnly && !r.kidsFriendly) return false;
    if (nightOnly && !r.nightSkiing) return false;
    if (minRunLength > 0 && (r.maxRunLengthM ?? 0) < minRunLength) return false;
    if (minVerticalDrop > 0 && (r.verticalDropM ?? 0) < minVerticalDrop) return false;
    return true;
  });

  return (
    <main
      style={{
        padding: '24px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
        Горнолыжка из Москвы на машине
      </h1>
      <p style={{ marginBottom: '20px', color: '#555' }}>
        Выбираем курорты под Москвой по времени в пути и комфортности катания.
      </p>

      <section
        style={{
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          background: '#fafafa',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Фильтры</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <label style={{ fontSize: '14px' }}>
              Максимум времени в пути (часы):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={0.5}
                max={4}
                step={0.5}
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ width: 40, textAlign: 'right' }}>{maxHours}</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px' }}>
              Мин. длина трассы (м):
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={minRunLength}
              onChange={(e) => setMinRunLength(Number(e.target.value) || 0)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '14px' }}>
              Мин. перепад (м):
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={minVerticalDrop}
              onChange={(e) => setMinVerticalDrop(Number(e.target.value) || 0)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '14px',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={onlyComfort}
              onChange={(e) => setOnlyComfort(e.target.checked)}
            />
            Только с креслами/кабинками
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={excludeDraglift}
              onChange={(e) => setExcludeDraglift(e.target.checked)}
            />
            Исключить бугели
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={kidsOnly}
              onChange={(e) => setKidsOnly(e.target.checked)}
            />
            Подходит для детей
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={nightOnly}
              onChange={(e) => setNightOnly(e.target.checked)}
            />
            С вечерним катанием
          </label>
        </div>
      </section>

      {loading && <p>Загружаем курорты…</p>}
      {errorText && (
        <p style={{ color: 'red', marginBottom: '12px' }}>
          Ошибка: {errorText}
        </p>
      )}

      {!loading && !errorText && (
        <>
          <p style={{ marginBottom: '8px', color: '#555' }}>
            Найдено курортов: <b>{filtered.length}</b> из {resorts.length}
          </p>

          {filtered.length === 0 && (
            <p>Под выбранные фильтры ничего не нашлось. Попробуй смягчить условия.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {filtered.map((r) => (
              <article
                key={r.id}
                style={{
                  borderRadius: '12px',
                  border: '1px solid #eee',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: '#777' }}>
                      {r.region || 'Регион не указан'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13 }}>
                    {r.carHoursMin && r.carHoursMax && (
                      <div>
                        🚗 {r.carHoursMin}–{r.carHoursMax} ч
                      </div>
                    )}
                    {r.carDistanceKm && (
                      <div>{r.carDistanceKm} км от Москвы</div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    ⛰ {r.runsCount ?? '?'} трасс, до{' '}
                    {r.maxRunLengthM ? `${r.maxRunLengthM} м` : '?'}; перепад{' '}
                    {r.verticalDropM ? `${r.verticalDropM} м` : '?'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                  <Tag active={r.hasChairlift}>кресла</Tag>
                  <Tag active={r.hasGondola}>кабинки</Tag>
                  <Tag active={r.hasDraglift}>бугели</Tag>
                  <Tag active={r.kidsFriendly}>для детей</Tag>
                  <Tag active={r.nightSkiing}>вечернее катание</Tag>
                </div>

                {r.notes && (
                  <div style={{ fontSize: 12, color: '#777' }}>
                    <b>Дорога:</b> {r.notes}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function Tag(props: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid',
        borderColor: props.active ? '#0a7' : '#ccc',
        color: props.active ? '#0a7' : '#777',
        background: props.active ? '#e6fff6' : '#f9f9f9',
      }}
    >
      {props.children}
    </span>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type City = {
  id: number;
  name: string;
  slug: string;
};

type ResortView = {
  id: number;
  slug: string;
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
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>('moscow');

  const [resorts, setResorts] = useState<ResortView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // фильтры
  const [maxHours, setMaxHours] = useState<number>(12); // по умолчанию 12, можно до 30
  const [onlyComfort, setOnlyComfort] = useState<boolean>(false);
  const [excludeDraglift, setExcludeDraglift] = useState<boolean>(false);
  const [kidsOnly, setKidsOnly] = useState<boolean>(false);
  const [nightOnly, setNightOnly] = useState<boolean>(false);
  const [minRunLength, setMinRunLength] = useState<number>(0);
  const [minVerticalDrop, setMinVerticalDrop] = useState<number>(0);

  // 1) Загружаем список городов
  useEffect(() => {
    async function loadCities() {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) {
        console.error(error);
        setErrorText('Не удалось загрузить список городов');
      } else {
        setCities(data || []);
      }
    }

    loadCities();
  }, []);

  // 2) Загружаем курорты при смене города
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorText(null);

      try {
        const { data: citiesData, error: cityError } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', selectedCitySlug)
          .limit(1);

        if (cityError) throw cityError;
        if (!citiesData || citiesData.length === 0) {
          throw new Error(`Не найден город со slug=${selectedCitySlug}`);
        }

        const cityId = citiesData[0].id;

        const { data, error } = await supabase
          .from('travel_profiles')
          .select(`
            car_distance_km,
            car_hours_min,
            car_hours_max,
            notes,
            resorts (
              id,
              slug,
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
          .eq('city_id', cityId);

        if (error) throw error;

        const mapped: ResortView[] =
          (data || [])
            .filter((row: any) => row.resorts)
            .map((row: any) => {
              const r = row.resorts;
              return {
                id: r.id,
                slug: r.slug,
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
        setResorts([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedCitySlug]);

  // применяем фильтры
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

  const currentCity = cities.find((c) => c.slug === selectedCitySlug);

  return (
    <main
      style={{
        padding: '24px',
        maxWidth: '960px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#0f172a',
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '28px', marginBottom: 8 }}>
          Горнолыжка на машине
        </h1>
        <p style={{ marginBottom: 0, fontSize: 14, color: '#4b5563' }}>
          Подбор горнолыжных курортов по времени в пути и характеристикам трасс.
        </p>
      </header>

      {/* выбор города */}
      <section
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          background: '#e5e7eb',
        }}
      >
        <label
          style={{
            fontSize: 14,
            display: 'block',
            marginBottom: 6,
            color: '#111827',
            fontWeight: 600,
          }}
        >
          Город выезда
        </label>
        <select
          value={selectedCitySlug}
          onChange={(e) => setSelectedCitySlug(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #9ca3af',
            minWidth: 240,
            color: '#111827',
            backgroundColor: '#ffffff',
            fontSize: 14,
          }}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </section>

      {/* фильтры */}
      <section
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          background: '#f3f4f6',
        }}
      >
        <h2
          style={{
            fontSize: 18,
            marginBottom: 12,
            color: '#111827',
            fontWeight: 600,
          }}
        >
          Фильтры
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
            marginBottom: 12,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 14,
                color: '#111827',
                fontWeight: 500,
                display: 'block',
                marginBottom: 4,
              }}
            >
              Максимум времени в пути (часы)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  width: 32,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#111827',
                  fontWeight: 600,
                }}
              >
                {maxHours}
              </span>
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 14,
                color: '#111827',
                fontWeight: 500,
                display: 'block',
                marginBottom: 4,
              }}
            >
              Мин. длина трассы (м)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={minRunLength}
              onChange={(e) => setMinRunLength(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #9ca3af',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 14,
                color: '#111827',
                fontWeight: 500,
                display: 'block',
                marginBottom: 4,
              }}
            >
              Мин. перепад высот (м)
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={minVerticalDrop}
              onChange={(e) => setMinVerticalDrop(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #9ca3af',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 14,
            color: '#111827',
          }}
        >
          <FilterCheckbox
            label="Только с креслами/кабинками"
            checked={onlyComfort}
            onChange={setOnlyComfort}
          />
          <FilterCheckbox
            label="Исключить бугели"
            checked={excludeDraglift}
            onChange={setExcludeDraglift}
          />
          <FilterCheckbox
            label="Подходит для детей"
            checked={kidsOnly}
            onChange={setKidsOnly}
          />
          <FilterCheckbox
            label="С вечерним катанием"
            checked={nightOnly}
            onChange={setNightOnly}
          />
        </div>
      </section>

      {currentCity && (
        <p
          style={{
            marginBottom: 8,
            color: '#4b5563',
            fontSize: 14,
          }}
        >
          Город выезда: <b>{currentCity.name}</b>
        </p>
      )}

      {loading && <p>Загружаем курорты…</p>}
      {errorText && (
        <p style={{ color: '#b91c1c', marginBottom: 12 }}>
          Ошибка: {errorText}
        </p>
      )}

      {!loading && !errorText && (
        <>
          <p style={{ marginBottom: 8, color: '#4b5563', fontSize: 14 }}>
            Найдено курортов: <b>{filtered.length}</b> из {resorts.length}
          </p>

          {filtered.length === 0 && (
            <p>Под выбранные фильтры ничего не нашлось. Попробуй смягчить условия.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {filtered.map((r) => (
              <article
                key={r.id}
                style={{
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      <Link
                        href={`/resort/${r.slug}`}
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        {r.name}
                      </Link>
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {r.region || 'Регион не указан'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: '#111827' }}>
                    {r.carHoursMin && r.carHoursMax && (
                      <div>
                        🚗 {r.carHoursMin}–{r.carHoursMax} ч
                      </div>
                    )}
                    {r.carDistanceKm && <div>{r.carDistanceKm} км от города</div>}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: '#111827' }}>
                  ⛰ {r.runsCount ?? '?'} трасс, до{' '}
                  {r.maxRunLengthM ? `${r.maxRunLengthM} м` : '?'}; перепад{' '}
                  {r.verticalDropM ? `${r.verticalDropM} м` : '?'}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                  <Tag active={r.hasChairlift}>кресла</Tag>
                  <Tag active={r.hasGondola}>кабинки</Tag>
                  <Tag active={r.hasDraglift}>бугели</Tag>
                  <Tag active={r.kidsFriendly}>для детей</Tag>
                  <Tag active={r.nightSkiing}>вечернее катание</Tag>
                </div>

                {r.notes && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
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

function FilterCheckbox(props: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

function Tag(props: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid',
        borderColor: props.active ? '#16a34a' : '#d1d5db',
        color: props.active ? '#166534' : '#4b5563',
        background: props.active ? '#dcfce7' : '#f9fafb',
      }}
    >
      {props.children}
    </span>
  );
}

'use client';
// @ts-nocheck
/* eslint-disable */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResortPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [resort, setResort] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function load() {
      try {
        setLoading(true);
        setErrorText(null);

        // 1. Курорт по slug
        const { data: resortData, error: resortError } = await supabase
          .from('resorts')
          .select(
            `
            id,
            name,
            slug,
            region,
            runs_count,
            max_run_length_m,
            vertical_drop_m,
            has_chairlift,
            has_gondola,
            has_draglift,
            kids_friendly,
            night_skiing,
            season_start_month,
            season_end_month,
            skipass_from_rub
          `
          )
          .eq('slug', slug)
          .single();

        if (resortError || !resortData) {
          console.error(resortError);
          setErrorText('Курорт не найден');
          setResort(null);
          setProfiles([]);
          return;
        }

        setResort(resortData);

        // 2. Профили «как добраться»
        const { data: profData, error: profError } = await supabase
          .from('travel_profiles')
          .select(
            `
            car_distance_km,
            car_hours_min,
            car_hours_max,
            notes,
            cities (
              id,
              name,
              slug
            )
          `
          )
          .eq('resort_id', resortData.id);

        if (!profError && profData) {
          setProfiles(profData);
        }
      } catch (e: any) {
        console.error(e);
        setErrorText('Ошибка загрузки данных по курорту');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <main style={container}>
        <p>Загружаем данные курорта…</p>
      </main>
    );
  }

  if (!resort || errorText) {
    return (
      <main style={container}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Курорт не найден</h1>
        <p style={{ color: '#6b7280' }}>
          Похоже, мы не нашли такой курорт. Проверьте ссылку или вернитесь на главную.
        </p>
      </main>
    );
  }

  const seasonText =
    resort.season_start_month && resort.season_end_month
      ? `с ${resort.season_start_month} по ${resort.season_end_month} месяц`
      : 'сезон не указан';

  return (
    <main style={container}>
      {/* Заголовок */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{resort.name}</h1>
        <p style={{ fontSize: 14, color: '#4b5563' }}>
          {resort.region || 'Регион не указан'}
        </p>
      </header>

      {/* Характеристики */}
      <section style={card}>
        <h2 style={h2}>Характеристики курорта</h2>

        <div style={grid}>
          <Item label="Трассы" value={resort.runs_count ?? '—'} />
          <Item
            label="Макс. длина трассы"
            value={
              resort.max_run_length_m ? `${resort.max_run_length_m} м` : '—'
            }
          />
          <Item
            label="Перепад высот"
            value={
              resort.vertical_drop_m ? `${resort.vertical_drop_m} м` : '—'
            }
          />
          <Item label="Сезон" value={seasonText} />
          <Item
            label="Ски-пасс от"
            value={
              resort.skipass_from_rub
                ? `${resort.skipass_from_rub} ₽`
                : 'уточняйте на сайте'
            }
          />
        </div>

        <div style={tagRow}>
          <Tag active={resort.has_chairlift}>кресельные</Tag>
          <Tag active={resort.has_gondola}>кабинка / гондола</Tag>
          <Tag active={resort.has_draglift}>бугели</Tag>
          <Tag active={resort.kids_friendly}>для детей</Tag>
          <Tag active={resort.night_skiing}>вечернее катание</Tag>
        </div>
      </section>

      {/* Как добраться */}
      <section style={card}>
        <h2 style={h2}>Как добраться</h2>

        {profiles.length === 0 && (
          <p style={{ color: '#6b7280' }}>Нет данных по времени в пути.</p>
        )}

        {profiles.length > 0 && (
          <table style={table}>
            <thead>
              <tr>
                <Th>Город</Th>
                <Th>Расстояние</Th>
                <Th>Время в пути</Th>
                <Th>Комментарий</Th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, idx) => (
                <tr key={idx}>
                  <Td>{p.cities?.name ?? '—'}</Td>
                  <Td>{p.car_distance_km ? `${p.car_distance_km} км` : '—'}</Td>
                  <Td>
                    {p.car_hours_min && p.car_hours_max
                      ? `${p.car_hours_min}–${p.car_hours_max} ч`
                      : '—'}
                  </Td>
                  <Td>{p.notes || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Блок под монетизацию */}
      <section style={card}>
        <h2 style={h2}>Полезное</h2>
        <ul style={{ paddingLeft: 18, color: '#4b5563' }}>
          <li>Ссылка на официальный сайт курорта — можно добавить позже.</li>
          <li>Отели рядом — сюда лягут партнёрские ссылки.</li>
          <li>Прокат и школы — место для локального бизнеса.</li>
        </ul>
      </section>
    </main>
  );
}

//
// Простейшие стили и маленькие компоненты
//

const container = {
  padding: '24px',
  maxWidth: '960px',
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  color: '#0f172a',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
};

const card = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  padding: 16,
  marginBottom: 16,
  boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
};

const h2 = {
  fontSize: 18,
  marginBottom: 12,
  color: '#111827',
  fontWeight: 600,
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

function Item({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const tagRow = {
  marginTop: 12,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

function Tag({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid',
        borderColor: active ? '#16a34a' : '#d1d5db',
        color: active ? '#166534' : '#4b5563',
        background: active ? '#dcfce7' : '#f9fafb',
      }}
    >
      {children}
    </span>
  );
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: 14,
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '6px 8px',
        borderBottom: '1px solid #e5e7eb',
        color: '#6b7280',
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: '6px 8px',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {children}
    </td>
  );
}

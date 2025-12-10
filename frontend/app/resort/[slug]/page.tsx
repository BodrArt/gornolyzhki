import { supabase } from '@/lib/supabaseClient';

type ResortPageProps = {
  params: { slug: string };
};

export default async function ResortPage({ params }: ResortPageProps) {
  const { slug } = params;

  // 1. Загружаем сам курорт
  const { data: resort, error } = await supabase
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

  if (error || !resort) {
    return (
      <main
        style={{
          padding: '24px',
          maxWidth: '960px',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Курорт не найден</h1>
        <p style={{ color: '#6b7280' }}>
          Похоже, мы не нашли такой курорт. Проверьте ссылку или вернитесь на главную.
        </p>
      </main>
    );
  }

  // 2. Загружаем, как добраться из городов (Москва, НН и т.д.)
  const { data: profiles } = await supabase
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
    .eq('resort_id', resort.id);

  const seasonText =
    resort.season_start_month && resort.season_end_month
      ? `c ${resort.season_start_month} по ${resort.season_end_month} месяц`
      : 'сезон не указан';

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
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{resort.name}</h1>
        <p style={{ fontSize: 14, color: '#4b5563' }}>
          {resort.region || 'Регион не указан'}
        </p>
      </header>

      {/* Основные параметры */}
      <section
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: 16,
          marginBottom: 16,
          boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
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
          Характеристики курорта
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            fontSize: 14,
          }}
        >
          <div>
            <div style={{ color: '#6b7280' }}>Трассы</div>
            <div style={{ fontWeight: 600 }}>
              {resort.runs_count ?? '—'} шт.
            </div>
          </div>

          <div>
            <div style={{ color: '#6b7280' }}>Макс. длина трассы</div>
            <div style={{ fontWeight: 600 }}>
              {resort.max_run_length_m
                ? `${resort.max_run_length_m} м`
                : '—'}
            </div>
          </div>

          <div>
            <div style={{ color: '#6b7280' }}>Перепад высот</div>
            <div style={{ fontWeight: 600 }}>
              {resort.vertical_drop_m
                ? `${resort.vertical_drop_m} м`
                : '—'}
            </div>
          </div>

          <div>
            <div style={{ color: '#6b7280' }}>Сезон</div>
            <div style={{ fontWeight: 600 }}>{seasonText}</div>
          </div>

          <div>
            <div style={{ color: '#6b7280' }}>Ски-пасс (от)</div>
            <div style={{ fontWeight: 600 }}>
              {resort.skipass_from_rub
                ? `${resort.skipass_from_rub} ₽`
                : 'уточняйте на сайте курорта'}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 12,
          }}
        >
          <Tag active={!!resort.has_chairlift}>кресельные подъёмники</Tag>
          <Tag active={!!resort.has_gondola}>кабинки / гондола</Tag>
          <Tag active={!!resort.has_draglift}>бугели</Tag>
          <Tag active={!!resort.kids_friendly}>подходит для детей</Tag>
          <Tag active={!!resort.night_skiing}>вечернее катание</Tag>
        </div>
      </section>

      {/* Как добраться из городов */}
      <section
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: 16,
          marginBottom: 16,
          boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
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
          Как добраться
        </h2>

        {(!profiles || profiles.length === 0) && (
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Пока нет данных по времени в пути. Скоро добавим.
          </p>
        )}

        {profiles && profiles.length > 0 && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#6b7280',
                    fontWeight: 500,
                  }}
                >
                  Город
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#6b7280',
                    fontWeight: 500,
                  }}
                >
                  Расстояние
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#6b7280',
                    fontWeight: 500,
                  }}
                >
                  Время в пути
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#6b7280',
                    fontWeight: 500,
                  }}
                >
                  Комментарий
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {p.cities?.name ?? '—'}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {p.car_distance_km
                      ? `${p.car_distance_km} км`
                      : '—'}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {p.car_hours_min && p.car_hours_max
                      ? `${p.car_hours_min}–${p.car_hours_max} ч`
                      : '—'}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #f3f4f6',
                      color: '#6b7280',
                    }}
                  >
                    {p.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Ссылки / место под монетизацию */}
      <section
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: 16,
          marginBottom: 16,
          boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
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
          Полезное и дальше по плану
        </h2>
        <ul style={{ fontSize: 14, color: '#4b5563', paddingLeft: 18 }}>
          <li>Официальный сайт курорта — сюда позже можно добавить ссылку.</li>
          <li>Ссылки на отели поблизости — сюда можно прикрутить партнёрку.</li>
          <li>Прокат и школы — можно продавать размещение локальному бизнесу.</li>
        </ul>
      </section>
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
        borderColor: props.active ? '#16a34a' : '#d1d5db',
        color: props.active ? '#166534' : '#4b5563',
        background: props.active ? '#dcfce7' : '#f9fafb',
        marginRight: 4,
      }}
    >
      {props.children}
    </span>
  );
}

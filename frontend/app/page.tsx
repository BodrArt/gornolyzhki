// @ts-nocheck
/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Home() {
  const [resorts, setResorts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<number | null>(5); // Москва по умолчанию
  const [maxHours, setMaxHours] = useState<number>(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Города
      const { data: citiesData } = await supabase
        .from("cities")
        .select("id, name, slug")
        .order("name");

      if (citiesData) setCities(citiesData);

      // Курорты + travel_profiles
      const { data: resortsData } = await supabase
        .from("resorts")
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
          travel_profiles (
            car_hours_min,
            car_hours_max,
            car_distance_km,
            cities ( id, name )
          )
        `
        )
        .order("name");

      if (resortsData) setResorts(resortsData);

      setLoading(false);
    }

    load();
  }, []);

  // Фильтрация по выбранному городу и максимуму часов
  const filtered =
    selectedCity === null
      ? resorts
      : resorts.filter((resort) =>
          resort.travel_profiles?.some(
            (p: any) =>
              p.cities?.id === selectedCity &&
              p.car_hours_min != null &&
              p.car_hours_min <= maxHours
          )
        );

  const currentCity = cities.find((c) => c.id === selectedCity);

  return (
    <main style={container}>
      {/* Шапка */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={h1}>Горнолыжка на машине</h1>

        <p style={lead}>
          Сервис для тех, кто планирует горнолыжку на машине из конкретного города, а не
          «куда-нибудь».
        </p>
        <p style={lead2}>
          Выберите город выезда, задайте максимум часов в дороге — мы покажем курорты, куда
          есть смысл ехать.
        </p>
        <p style={lead3}>
          Сейчас поддерживаются <b>Москва</b>, <b>Нижний Новгород</b> и ещё несколько
          крупных городов. Базу постепенно дополняем.
        </p>
      </header>

      {/* Панель фильтров */}
      <section style={filtersWrapper}>
        <div style={filterBlock}>
          <label style={label}>Город выезда</label>
          <select
            style={select}
            value={selectedCity ?? ""}
            onChange={(e) => setSelectedCity(Number(e.target.value))}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {currentCity && (
            <div style={hintText}>
              Показаны курорты, куда можно доехать <b>из {currentCity.name}</b>.
            </div>
          )}
        </div>

        <div style={filterBlock}>
          <label style={label}>Максимум времени в пути, ч</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="range"
              min={1}
              max={30}
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={sliderValue}>{maxHours}</span>
          </div>
          <div style={hintText}>
            Оцениваем дорогу как <b>нижнюю границу</b> времени (минимум часов в пути).
          </div>
        </div>
      </section>

      {/* Итоговая строка */}
      <section style={{ marginTop: 16 }}>
        {loading ? (
          <p style={{ color: "#4b5563" }}>Загружаем курорты…</p>
        ) : (
          <p style={{ color: "#4b5563", fontSize: 14 }}>
            Найдено курортов под выбранные условия:{" "}
            <b>{filtered.length}</b> из {resorts.length}.
          </p>
        )}
      </section>

      {/* Список курортов */}
      <section style={{ marginTop: 12 }}>
        {loading ? null : filtered.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Для этого города и выбранного лимита по времени пока нет курортов
            (или они не попадают под фильтр). Попробуйте увеличить максимум часов или
            выбрать другой город.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((resort) => {
              // находим профиль для текущего города
              const profile =
                resort.travel_profiles?.find(
                  (p: any) => p.cities?.id === selectedCity
                ) ?? null;

              return (
                <Link
                  key={resort.id}
                  href={`/resort/${resort.slug}`}
                  style={card}
                >
                  <div style={cardHeader}>
                    <div>
                      <div style={resortTitle}>{resort.name}</div>
                      <div style={resortRegion}>
                        {resort.region || "Регион не указан"}
                      </div>
                    </div>
                    {profile && (
                      <div style={travelInfo}>
                        {profile.car_hours_min != null &&
                          profile.car_hours_max != null && (
                            <div>
                              🚗 {profile.car_hours_min}–{profile.car_hours_max} ч
                            </div>
                          )}
                        {profile.car_distance_km != null && (
                          <div>{profile.car_distance_km} км от города</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={lineInfo}>
                    ⛰ {resort.runs_count ?? "?"} трасс, макс. длина{" "}
                    {resort.max_run_length_m
                      ? `${resort.max_run_length_m} м`
                      : "?"}
                    , перепад{" "}
                    {resort.vertical_drop_m
                      ? `${resort.vertical_drop_m} м`
                      : "?"}
                  </div>

                  <div style={tagRow}>
                    {resort.has_chairlift && <Tag>кресельные подъёмники</Tag>}
                    {resort.has_gondola && <Tag>кабинки / гондола</Tag>}
                    {resort.has_draglift && <Tag>бугели</Tag>}
                    {resort.kids_friendly && <Tag>подходит для детей</Tag>}
                    {resort.night_skiing && <Tag>вечернее катание</Tag>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

//
// СТИЛИ
//

const container = {
  padding: 24,
  maxWidth: 960,
  margin: "0 auto",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  color: "#0f172a",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const h1 = {
  fontSize: 28,
  marginBottom: 8,
  color: "#111827",
};

const lead = {
  fontSize: 15,
  color: "#4b5563",
  marginBottom: 4,
};

const lead2 = {
  fontSize: 14,
  color: "#4b5563",
  marginBottom: 2,
};

const lead3 = {
  fontSize: 13,
  color: "#6b7280",
};

const filtersWrapper = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  backgroundColor: "#f3f4f6",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginTop: 8,
};

const filterBlock = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  minWidth: 260,
  flex: 1,
};

const label = {
  fontSize: 13,
  color: "#111827",
  fontWeight: 600,
};

const select = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  backgroundColor: "#ffffff",
  color: "#111827",
};

const hintText = {
  fontSize: 12,
  color: "#6b7280",
};

const sliderValue = {
  minWidth: 28,
  textAlign: "right" as const,
  fontVariantNumeric: "tabular-nums" as const,
  color: "#111827",
  fontWeight: 600,
};

const card = {
  display: "block",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  textDecoration: "none",
  backgroundColor: "#ffffff",
  color: "#111827",
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const resortTitle = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 2,
};

const resortRegion = {
  fontSize: 13,
  color: "#6b7280",
};

const travelInfo = {
  fontSize: 13,
  textAlign: "right" as const,
  color: "#111827",
};

const lineInfo = {
  marginTop: 6,
  fontSize: 13,
  color: "#111827",
};

const tagRow = {
  marginTop: 8,
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 6,
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid #bfdbfe",
        backgroundColor: "#eff6ff",
        color: "#1d4ed8",
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

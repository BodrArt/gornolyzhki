"use client";
// @ts-nocheck
/* eslint-disable */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";


export default function Home() {
  const [resorts, setResorts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<number | null>(5); // Москва
  const [maxHours, setMaxHours] = useState<number>(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Загружаем города
      const { data: citiesData } = await supabase
        .from("cities")
        .select("id, name, slug")
        .order("name");

      if (citiesData) setCities(citiesData);

      // Загружаем курорты + travel_profiles
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

  // Фильтрация курортов по времени в пути
  const filtered =
    selectedCity === null
      ? resorts
      : resorts.filter((resort) =>
          resort.travel_profiles?.some(
            (p: any) =>
              p.cities?.id === selectedCity &&
              p.car_hours_min <= maxHours
          )
        );

  return (
    <main style={container}>
      {/* Шапка */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={h1}>Горнолыжка на машине</h1>

        <p style={lead}>
          Подбор горнолыжных курортов России по времени в пути и характеристикам трасс.
          Выберите город, укажите максимальные часы в дороге — и получите список доступных курортов.
        </p>

        <p style={lead2}>
          Сейчас поддерживаются <b>Москва</b> и <b>Нижний Новгород</b>.
          Добавляем остальные города.
        </p>
      </header>

      {/* Панель фильтров */}
      <section style={filters}>
        <div style={filterBlock}>
          <label style={label}>Город выезда:</label>
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
        </div>

        <div style={filterBlock}>
          <label style={label}>Макс. время в пути (ч):</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="range"
              min={1}
              max={30}
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
            />
            <span>{maxHours}</span>
          </div>
        </div>
      </section>

      {/* Результаты */}
      <section style={{ marginTop: 24 }}>
        {loading ? (
          <p>Загружаем курорты…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            По выбранным параметрам курорты не найдены.
          </p>
        ) : (
          filtered.map((resort) => (
            <Link
              key={resort.id}
              href={`/resort/${resort.slug}`}
              style={card}
            >
              <h3 style={resortTitle}>{resort.name}</h3>
              <p style={resortRegion}>{resort.region}</p>

              <div style={tagRow}>
                {resort.has_chairlift && <Tag>креселки</Tag>}
                {resort.has_gondola && <Tag>кабинка</Tag>}
                {resort.has_draglift && <Tag>бугели</Tag>}
                {resort.kids_friendly && <Tag>для детей</Tag>}
                {resort.night_skiing && <Tag>ночное катание</Tag>}
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}

//
// МАЛЕНЬКИЕ КОМПОНЕНТЫ И СТИЛИ
//

const container = {
  padding: 24,
  maxWidth: 960,
  margin: "0 auto",
  fontFamily: "system-ui, sans-serif",
};

const h1 = {
  fontSize: 32,
  marginBottom: 8,
};

const lead = {
  fontSize: 16,
  color: "#4b5563",
  marginBottom: 4,
};

const lead2 = {
  fontSize: 15,
  color: "#6b7280",
};

const filters = {
  display: "flex",
  gap: 24,
  background: "#f9fafb",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const filterBlock = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const label = {
  fontSize: 14,
  color: "#374151",
};

const select = {
  padding: 6,
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

const card = {
  display: "block",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginBottom: 12,
  textDecoration: "none",
  color: "#111827",
  background: "white",
  transition: "0.15s",
};

const resortTitle = {
  fontSize: 20,
  marginBottom: 4,
};

const resortRegion = {
  fontSize: 14,
  color: "#6b7280",
};

const tagRow = {
  marginTop: 8,
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

function Tag({ children }: { children: any }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        background: "#eef2ff",
        color: "#4338ca",
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

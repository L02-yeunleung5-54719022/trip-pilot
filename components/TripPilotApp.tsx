"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clearTripData, loadTripData, resetTripData, saveTripData } from "@/lib/storage";
import { loadTripDataFromCloud, saveTripDataToCloud, syncEnabled } from "@/lib/sync";
import type {
  DocumentItem,
  Expense,
  ExpenseCategory,
  ItineraryItem,
  TimeBlock,
  TripData,
  WishlistItem
} from "@/lib/types";

type MainTab = "trip" | "map" | "budget" | "shopping" | "info";
type CloudStatus = "off" | "loading" | "synced" | "saving" | "error";
type ChecklistCategory = "Documents" | "Packing" | "Money" | "Transport" | "Other";

type ChecklistItem = {
  id: string;
  title: string;
  category: ChecklistCategory;
  completed: boolean;
  notes: string;
};

type TripDataV2 = TripData & {
  checklist?: ChecklistItem[];
};

type TimedItineraryItem = ItineraryItem & {
  time?: string;
  order?: number;
};

type WeatherState = {
  loading: boolean;
  max?: number;
  min?: number;
  code?: number;
  text: string;
};

const tabs: { key: MainTab; label: string; icon: string }[] = [
  { key: "trip", label: "行程", icon: "🗓" },
  { key: "map", label: "地圖", icon: "🗺" },
  { key: "budget", label: "記帳", icon: "💳" },
  { key: "shopping", label: "願望", icon: "⭐" },
  { key: "info", label: "資訊", icon: "ℹ️" }
];

const timeBlocks: TimeBlock[] = ["Morning", "Afternoon", "Evening"];

const timeBlockLabel: Record<TimeBlock, string> = {
  Morning: "上午",
  Afternoon: "下午",
  Evening: "晚上"
};

const expenseCategories: ExpenseCategory[] = [
  "Accommodation",
  "Transport",
  "Food",
  "Attractions",
  "Shopping",
  "Other"
];

const categoryLabel: Record<string, string> = {
  Accommodation: "住宿",
  Transport: "交通",
  Food: "飲食",
  Attractions: "景點",
  Shopping: "購物",
  Other: "其他"
};

const checklistCategoryLabel: Record<ChecklistCategory, string> = {
  Documents: "文件",
  Packing: "行李",
  Money: "金錢",
  Transport: "交通",
  Other: "其他"
};

const cityCoords: Record<string, { lat: number; lon: number; label: string; timezone: string }> = {
  Vienna: { lat: 48.2082, lon: 16.3738, label: "維也納", timezone: "Europe/Vienna" },
  Prague: { lat: 50.0755, lon: 14.4378, label: "布拉格", timezone: "Europe/Prague" },
  Budapest: { lat: 47.4979, lon: 19.0402, label: "布達佩斯", timezone: "Europe/Budapest" },
  Bratislava: { lat: 48.1486, lon: 17.1077, label: "Bratislava", timezone: "Europe/Bratislava" },
  Vancouver: { lat: 49.2827, lon: -123.1207, label: "溫哥華", timezone: "America/Vancouver" },
  Frankfurt: { lat: 50.1109, lon: 8.6821, label: "法蘭克福", timezone: "Europe/Berlin" }
};

const cityThemeMap: Record<string, { accent: string; soft: string; badge: string; banner: string; landmark: string }> = {
  Vienna: {
    accent: "#7A9A6D",
    soft: "#EEF5EA",
    badge: "維也納",
    banner: "bg-[#7A9A6D]",
    landmark: "🏰"
  },
  Prague: {
    accent: "#C96A7A",
    soft: "#FAEEF1",
    badge: "布拉格",
    banner: "bg-[#C96A7A]",
    landmark: "⛪"
  },
  Budapest: {
    accent: "#D39232",
    soft: "#FCF1DF",
    badge: "布達佩斯",
    banner: "bg-[#D39232]",
    landmark: "🏛"
  },
  Bratislava: {
    accent: "#8C6BB1",
    soft: "#F3ECFA",
    badge: "Bratislava",
    banner: "bg-[#8C6BB1]",
    landmark: "🏯"
  },
  Frankfurt: {
    accent: "#6D7B8A",
    soft: "#EEF2F5",
    badge: "法蘭克福",
    banner: "bg-[#6D7B8A]",
    landmark: "✈️"
  },
  Vancouver: {
    accent: "#4F8AA3",
    soft: "#EAF4F8",
    badge: "溫哥華",
    banner: "bg-[#4F8AA3]",
    landmark: "🌲"
  }
};

function getThemeByCity(city: string) {
  if (city.includes("Vienna")) return cityThemeMap.Vienna;
  if (city.includes("Prague")) return cityThemeMap.Prague;
  if (city.includes("Budapest")) return cityThemeMap.Budapest;
  if (city.includes("Bratislava")) return cityThemeMap.Bratislava;
  if (city.includes("Frankfurt")) return cityThemeMap.Frankfurt;
  if (city.includes("Vancouver")) return cityThemeMap.Vancouver;
  return {
    accent: "#C86A45",
    soft: "#F8EFE8",
    badge: "Central Europe",
    banner: "bg-[#C86A45]",
    landmark: "🧳"
  };
}

function getCitySummaryBackground(city: string) {
  const c = city.toLowerCase();

  if (c.includes("vienna")) return "/city-bg/vienna.png";
  if (c.includes("prague")) return "/city-bg/prague.png";
  if (c.includes("budapest")) return "/city-bg/budapest.png";
  if (c.includes("bratislava")) return "/city-bg/bratislava.png";
  if (c.includes("frankfurt")) return "/city-bg/frankfurt.png";
  if (c.includes("vancouver")) return "/city-bg/vancouver.png";

  return "/dashboard-bg.png";
}

function withAlpha(hex: string, alpha = "B3") {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  return `${hex}${alpha}`;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(amount: number, currency = "HKD") {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}`;
}

function parseDateKey(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(date: string) {
  if (date === "pretrip") return "行前";
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getDates(start: string, end: string) {
  const result: string[] = [];
  const current = parseDateKey(start);
  const last = parseDateKey(end);

  while (current <= last) {
    result.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function getTodayDateKey() {
  return formatDateKey(new Date());
}

function getSmartDefaultDate(data: TripDataV2) {
  const today = getTodayDateKey();
  const start = data.trip.startDate;
  const end = data.trip.endDate;

  if (today < start) return "pretrip";
  if (today > end) return end;
  return today;
}

function formatCountdown(minutes: number) {
  if (minutes <= 0) return "即將開始";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours <= 0) return `${mins}分鐘`;
  if (mins === 0) return `${hours}小時`;
  return `${hours}小時${mins}分鐘`;
}

function getCountdownText(item?: TimedItineraryItem) {
  if (!item || item.date === "pretrip") return "";

  const [hour, minute] = getItemTime(item).split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

  const target = parseDateKey(item.date);
  target.setHours(hour, minute, 0, 0);

  const diff = Math.ceil((target.getTime() - Date.now()) / 60000);

  if (diff < -30) return "已過時間";
  return `距離下一個行程 ${formatCountdown(Math.max(diff, 0))}`;
}
function getArrivalTimeFromNotes(item: TimedItineraryItem) {
  const text = `${item.notes || ""} ${item.title || ""}`;
  const match = text.match(/(?:→|->|到|抵達)\s*(\d{1,2}:\d{2})/);
  return match?.[1] || "";
}


function getAccommodationCheckInTime() {
  return "15:00";
}

function getAccommodationCheckOutTime(stay: { id?: string; name?: string; city?: string }) {
  const name = `${stay.id || ""} ${stay.name || ""} ${stay.city || ""}`.toLowerCase();

  if (name.includes("prague")) return "07:00";
  return "10:00";
}

function makeMapsSearchLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildRouteMapLink(items: TimedItineraryItem[]) {
  const stops = items
    .map(item => item.address || item.city || item.title)
    .filter(Boolean)
    .slice(0, 9);

  if (stops.length === 0) return "";
  if (stops.length === 1) return makeMapsSearchLink(stops[0]);

  const origin = encodeURIComponent(stops[0]);
  const destination = encodeURIComponent(stops[stops.length - 1]);
  const waypoints = stops.slice(1, -1).map(encodeURIComponent).join("|");

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}`;
}

async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
}

function fallbackTimeFromBlock(block: TimeBlock) {
  if (block === "Morning") return "09:00";
  if (block === "Afternoon") return "14:00";
  return "19:00";
}

function timeBlockFromTime(time: string): TimeBlock {
  const hour = Number(time.split(":")[0]);
  if (Number.isNaN(hour)) return "Morning";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function getItemTime(item: TimedItineraryItem) {
  return item.time || fallbackTimeFromBlock(item.timeBlock);
}

function getWeatherIcon(code?: number) {
  if (code === undefined) return "🌤";
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "🌤";
  if ([45, 48].includes(code)) return "🌫";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈";
  return "🌤";
}

function weatherText(code?: number) {
  if (code === undefined) return "暫無預報";
  if (code === 0) return "晴天";
  if ([1, 2, 3].includes(code)) return "晴時多雲";
  if ([45, 48].includes(code)) return "有霧";
  if ([51, 53, 55].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "有雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "下雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天氣變化";
}

function getItemType(item: TimedItineraryItem) {
  const text = `${item.title} ${item.notes}`.toLowerCase();

  if (
    text.includes("flight") ||
    text.includes("airport") ||
    text.includes("航班") ||
    text.includes("機場") ||
    text.includes("起飛") ||
    text.includes("抵達")
  ) {
    return { label: "航班", icon: "✈️", color: "bg-blue-50 text-blue-700" };
  }

  if (text.includes("train") || text.includes("火車") || text.includes("rail")) {
    return { label: "火車", icon: "🚆", color: "bg-indigo-50 text-indigo-700" };
  }

  if (text.includes("bus") || text.includes("巴士")) {
    return { label: "巴士", icon: "🚌", color: "bg-cyan-50 text-cyan-700" };
  }

  if (
    text.includes("hotel") ||
    text.includes("airbnb") ||
    text.includes("入住") ||
    text.includes("退房") ||
    text.includes("住宿")
  ) {
    return { label: "住宿", icon: "🏨", color: "bg-amber-50 text-amber-700" };
  }

  if (
    text.includes("食") ||
    text.includes("餐") ||
    text.includes("咖啡") ||
    text.includes("breakfast") ||
    text.includes("lunch") ||
    text.includes("dinner")
  ) {
    return { label: "飲食", icon: "🍽", color: "bg-orange-50 text-orange-700" };
  }

  if (
    text.includes("old town") ||
    text.includes("老城") ||
    text.includes("museum") ||
    text.includes("bath") ||
    text.includes("景點") ||
    text.includes("溫泉")
  ) {
    return { label: "景點", icon: "🏰", color: "bg-purple-50 text-purple-700" };
  }

  if (text.includes("shopping") || text.includes("購物")) {
    return { label: "購物", icon: "🛍", color: "bg-pink-50 text-pink-700" };
  }

  return { label: "行程", icon: "📍", color: "bg-slate-100 text-slate-700" };
}

function euroCity(date: string, data: TripDataV2) {
  if (date === "pretrip") return "Central Europe";

  const d = parseDateKey(date).getTime();

  for (const stay of data.accommodations) {
    const start = parseDateKey(stay.checkInDate).getTime();
    const end = parseDateKey(stay.checkOutDate).getTime();

    if (d >= start && d <= end) {
      return stay.city;
    }
  }

  if (date === "2026-05-18") return "Vancouver / Frankfurt";
  if (date === "2026-05-19") return "Frankfurt / Vienna";
  if (date === "2026-05-31") return "Vienna / Frankfurt";
  return "Central Europe";
}

function primaryCity(cityText: string) {
  if (cityText.includes("Vienna")) return "Vienna";
  if (cityText.includes("Prague")) return "Prague";
  if (cityText.includes("Budapest")) return "Budapest";
  if (cityText.includes("Bratislava")) return "Bratislava";
  if (cityText.includes("Frankfurt")) return "Frankfurt";
  if (cityText.includes("Vancouver")) return "Vancouver";
  return "Vienna";
}

function sortItineraryItems(items: TimedItineraryItem[]) {
  return [...items].sort((a, b) => {
    const timeDiff = getItemTime(a).localeCompare(getItemTime(b));
    if (timeDiff !== 0) return timeDiff;
    const orderDiff = (a.order || 0) - (b.order || 0);
    if (orderDiff !== 0) return orderDiff;
    return a.title.localeCompare(b.title);
  });
}

function exchangeRateToHKD(currency: string) {
  const rates: Record<string, number> = {
    HKD: 1,
    EUR: 8.5,
    CAD: 5.7,
    CZK: 0.36,
    HUF: 0.022,
    USD: 7.8
  };
  return rates[currency] || 1;
}

function toHKD(amount: number, currency: string) {
  return amount * exchangeRateToHKD(currency);
}

function getCityCode(city: string) {
  const normalized = city.toLowerCase();

  if (normalized.includes("vancouver")) return "YVR";
  if (normalized.includes("frankfurt")) return "FRA";
  if (normalized.includes("vienna")) return "VIE";
  if (normalized.includes("prague")) return "PRG";
  if (normalized.includes("budapest")) return "BUD";
  if (normalized.includes("bratislava")) return "BTS";

  return city.slice(0, 3).toUpperCase();
}

export default function TripPilotApp() {
  const [data, setData] = useState<TripDataV2 | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("trip");
  const [selectedDate, setSelectedDate] = useState<string>("pretrip");
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [editingItem, setEditingItem] = useState<TimedItineraryItem | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddShopping, setShowAddShopping] = useState(false);
  const [editingShopping, setEditingShopping] = useState<WishlistItem | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(syncEnabled ? "loading" : "off");
  const cloudReadyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const localData = loadTripData() as TripDataV2;
      if (cancelled) return;

      setData(localData);
      setSelectedDate(getSmartDefaultDate(localData));

      if (!syncEnabled) {
        cloudReadyRef.current = true;
        setCloudStatus("off");
        return;
      }

      try {
        setCloudStatus("loading");
        const cloudData = (await loadTripDataFromCloud()) as TripDataV2 | null;
        if (cancelled) return;

        if (cloudData) {
          setData(cloudData);
          saveTripData(cloudData);
          setSelectedDate(getSmartDefaultDate(cloudData));
        } else {
          await saveTripDataToCloud(localData);
        }

        cloudReadyRef.current = true;
        setCloudStatus("synced");
      } catch {
        cloudReadyRef.current = true;
        setCloudStatus("error");
      }
    }

    boot();

    return () => {
      cancelled = true;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!data) return;

    saveTripData(data);

    if (!syncEnabled || !cloudReadyRef.current) return;

    setCloudStatus("saving");

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const ok = await saveTripDataToCloud(data);
        setCloudStatus(ok ? "synced" : "error");
      } catch {
        setCloudStatus("error");
      }
    }, 900);
  }, [data]);

  async function syncFromCloud() {
    if (!syncEnabled) {
      setCloudStatus("off");
      return;
    }

    try {
      setCloudStatus("loading");
      const cloudData = (await loadTripDataFromCloud()) as TripDataV2 | null;

      if (cloudData) {
        setData(cloudData);
        saveTripData(cloudData);
        setSelectedDate(getSmartDefaultDate(cloudData));
      }

      setCloudStatus("synced");
    } catch {
      setCloudStatus("error");
    }
  }

  async function syncToCloudNow() {
    if (!data || !syncEnabled) {
      setCloudStatus("off");
      return;
    }

    try {
      setCloudStatus("saving");
      const ok = await saveTripDataToCloud(data);
      setCloudStatus(ok ? "synced" : "error");
    } catch {
      setCloudStatus("error");
    }
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F7F1E7] p-6">
        <div className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-8 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
          <div className="text-4xl">🧳</div>
          <h1 className="mt-4 text-2xl font-black text-[#183B63]">TripPilot</h1>
          <p className="mt-2 text-[#6D7B8A]">正在載入你的旅程...</p>
        </div>
      </main>
    );
  }

  const update = (next: TripDataV2) => setData(next);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7F1E7] via-[#F3EFE8] to-[#EEF4F1] pb-24 text-[#183B63]">
      <div className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+0.25rem)]">
        {activeTab === "trip" && (
          <TripHome
            data={data}
            update={update}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAdd={() => setShowAddItinerary(true)}
            onEdit={item => setEditingItem(item)}
          />
        )}

        {activeTab === "map" && <MapPage data={data} selectedDate={selectedDate} />}

        {activeTab === "budget" && (
          <BudgetPage data={data} update={update} onAdd={() => setShowAddExpense(true)} onEdit={setEditingExpense} />
        )}

        {activeTab === "shopping" && (
          <ShoppingPage data={data} update={update} onAdd={() => setShowAddShopping(true)} onEdit={setEditingShopping} />
        )}

        {activeTab === "info" && (
            <InfoPage
              data={data}
              update={update}
              selectedDate={selectedDate}
              cloudStatus={cloudStatus}
              syncFromCloud={syncFromCloud}
              syncToCloudNow={syncToCloudNow}
            />
          )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {showAddItinerary && (
        <ItineraryModal
          mode="add"
          data={data}
          selectedDate={selectedDate === "pretrip" ? data.trip.startDate : selectedDate}
          onClose={() => setShowAddItinerary(false)}
          onSave={item => {
            update({ ...data, itinerary: [...data.itinerary, item] });
            setShowAddItinerary(false);
          }}
        />
      )}

      {editingItem && (
        <ItineraryModal
          mode="edit"
          data={data}
          selectedDate={editingItem.date}
          initialItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={item => {
            const exists = data.itinerary.some(existing => existing.id === item.id);

            update({
              ...data,
              itinerary: exists
                ? data.itinerary.map(existing => (existing.id === item.id ? item : existing))
                : [...data.itinerary, item]
            });

            setEditingItem(null);
          }}
        />
      )}

      {showAddExpense && (
        <AddExpenseModal
          mode="add"
          data={data}
          onClose={() => setShowAddExpense(false)}
          onSave={expense => {
            update({ ...data, expenses: [...data.expenses, expense] });
            setShowAddExpense(false);
          }}
        />
      )}

      {editingExpense && (
        <AddExpenseModal
          mode="edit"
          data={data}
          initialExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={expense => {
            update({
              ...data,
              expenses: data.expenses.map(existing =>
                existing.id === expense.id ? expense : existing
              )
            });
            setEditingExpense(null);
          }}
        />
      )}

      {showAddShopping && (
        <AddShoppingModal
          mode="add"
          data={data}
          onClose={() => setShowAddShopping(false)}
          onSave={item => {
            update({ ...data, wishlist: [...data.wishlist, item] });
            setShowAddShopping(false);
          }}
        />
      )}

      {editingShopping && (
        <AddShoppingModal
          mode="edit"
          data={data}
          initialItem={editingShopping}
          onClose={() => setEditingShopping(null)}
          onSave={item => {
            update({
              ...data,
              wishlist: data.wishlist.map(existing =>
                existing.id === item.id ? item : existing
              )
            });
            setEditingShopping(null);
          }}
        />
      )}
    </main>
  );
}


function TripHero({ data }: { data: TripDataV2 }) {
  const days =
    Math.ceil(
      (parseDateKey(data.trip.endDate).getTime() -
        parseDateKey(data.trip.startDate).getTime()) /
        86400000
    ) + 1;

  const checklist = data.checklist || [];
  const completedChecklist = checklist.filter(item => item.completed).length;

  return (
    <section
      className="relative overflow-hidden rounded-[2.25rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 text-[#183B63] shadow-[0_12px_30px_rgba(24,59,99,0.08)]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(255,253,248,0.78) 0%, rgba(255,253,248,0.58) 45%, rgba(255,253,248,0.90) 100%), url('/dashboard-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-[#D39232]/15" />
      <div className="absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-[#7A9A6D]/12" />

      <div className="relative z-10">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#6D7B8A]">Central Europe</p>
            <h2 className="mt-1 text-3xl font-black leading-tight text-[#183B63]">
              {data.trip.name}
            </h2>
          </div>

        </div>

        <p className="text-sm font-bold text-[#6D7B8A]">
          {data.trip.startDate} → {data.trip.endDate}
        </p>

        <p className="mt-4 text-sm font-black tracking-wide text-[#6D7B8A] drop-shadow-sm">
          Vienna · Prague · Budapest · Bratislava
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <HeroStat label="天數" value={`${days}`} />
          <HeroStat label="城市" value="5" />
        </div>

        {checklist.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[#E8DED0] bg-[#FAF6EFB3] p-3 shadow-sm">
            <div className="flex items-center justify-between text-sm font-black">
              <span>行前準備</span>
              <span>
                {completedChecklist}/{checklist.length}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#E8DED0]">
              <div
                className="h-2 rounded-full bg-[#C86A45]"
                style={{ width: `${checklist.length ? (completedChecklist / checklist.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8DED0] bg-[#FAF6EFB3] p-3 shadow-sm">
      <p className="text-xs text-[#6D7B8A]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#183B63]">{value}</p>
    </div>
  );
}

function CentralEuropeSkyline() {
  return (
    <div className="relative mt-4 h-28 overflow-hidden rounded-[1.5rem] border border-[#E8DED0] bg-gradient-to-b from-[#F9F4EC] to-[#F4EEE4]">
      <div className="absolute inset-x-0 bottom-0 h-10 bg-[#DDE8E0]" />
      <div className="absolute left-3 bottom-8 text-5xl opacity-90">⛪</div>
      <div className="absolute left-20 bottom-10 text-4xl opacity-90">🏰</div>
      <div className="absolute left-36 bottom-9 text-5xl opacity-90">🏛</div>
      <div className="absolute left-56 bottom-8 text-4xl opacity-90">🏯</div>
      <div className="absolute right-6 bottom-9 text-4xl opacity-90">⛪</div>
      <div className="absolute top-3 left-4 text-xs font-bold text-[#6D7B8A]">
        Vienna · Prague · Budapest · Bratislava
      </div>
      <div className="absolute top-3 right-4 text-xl">☁️ ✨</div>
      <div className="absolute bottom-2 left-0 h-px w-full border-t border-dashed border-[#C86A45]/40" />
    </div>
  );
}

function TripHome({
  data,
  update,
  selectedDate,
  setSelectedDate,
  onAdd,
  onEdit
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  onAdd: () => void;
  onEdit: (item: TimedItineraryItem) => void;
}) {
  const dates = useMemo(() => getDates(data.trip.startDate, data.trip.endDate), [data]);

  const isPreTrip = selectedDate === "pretrip";

  const itineraryItems = (data.itinerary as TimedItineraryItem[]).filter(
    item => item.date === selectedDate
  );

  const stayItems: TimedItineraryItem[] = isPreTrip
    ? []
    : data.accommodations.flatMap(stay => {
        const items: TimedItineraryItem[] = [];

        const alreadyHasCheckIn = data.itinerary.some(
          item =>
            item.date === stay.checkInDate &&
            item.address === stay.address &&
            (item.title.includes("入住") || item.title.includes(stay.name))
        );

        const alreadyHasCheckOut = data.itinerary.some(
          item =>
            item.date === stay.checkOutDate &&
            item.address === stay.address &&
            (item.title.includes("退房") || item.title.includes(stay.name))
        );

        if (stay.checkOutDate === selectedDate && !alreadyHasCheckOut) {
          items.push({
            id: `auto-checkout-${stay.id}`,
            title: `退房：${stay.name}`,
            city: stay.city,
            date: stay.checkOutDate,
            time: getAccommodationCheckOutTime(stay),
            order: 0,
            timeBlock: "Morning",
            address: stay.address,
            notes: `${stay.city} 住宿退房｜退房時間 ${getAccommodationCheckOutTime(stay)}｜${stay.checkInDate} → ${stay.checkOutDate}`,
            estimatedCost: 0,
            currency: stay.currency,
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              stay.address
            )}`,
            completed: false
          });
        }

        if (stay.checkInDate === selectedDate && !alreadyHasCheckIn) {
          items.push({
            id: `auto-checkin-${stay.id}`,
            title: `入住：${stay.name}`,
            city: stay.city,
            date: stay.checkInDate,
            time: getAccommodationCheckInTime(),
            order: 99,
            timeBlock: "Evening",
            address: stay.address,
            notes: `${stay.city} 住宿入住｜入住時間 ${getAccommodationCheckInTime()}｜${stay.checkInDate} → ${stay.checkOutDate}｜${money(
              stay.totalCost,
              stay.currency
            )}｜${stay.nights} 晚`,
            estimatedCost: stay.totalCost,
            currency: stay.currency,
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              stay.address
            )}`,
            completed: false
          });
        }

        return items;
      });

  const dayItems = sortItineraryItems([...itineraryItems, ...stayItems]);
  const nonAutoDayItems = sortItineraryItems(
    (data.itinerary as TimedItineraryItem[]).filter(item => item.date === selectedDate)
  );

  const completedCount = dayItems.filter(item => item.completed).length;
  const nextItem = dayItems.find(item => !item.completed);
  const city = euroCity(selectedDate, data);
  const weatherCity = primaryCity(city);

  function toggleComplete(id: string) {
    if (id.startsWith("auto-")) return;

    update({
      ...data,
      itinerary: data.itinerary.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  }

  function deleteItem(id: string) {
    if (id.startsWith("auto-")) return;

    update({
      ...data,
      itinerary: data.itinerary.filter(item => item.id !== id)
    });
  }

  function moveItem(id: string, direction: "up" | "down") {
    if (id.startsWith("auto-")) return;

    const currentIndex = nonAutoDayItems.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= nonAutoDayItems.length) return;

    const currentItem = nonAutoDayItems[currentIndex];
    const targetItem = nonAutoDayItems[targetIndex];
    const currentTime = getItemTime(currentItem);
    const targetTime = getItemTime(targetItem);

    update({
      ...data,
      itinerary: data.itinerary.map(item => {
        if (item.id === currentItem.id) {
          return { ...item, time: targetTime, timeBlock: timeBlockFromTime(targetTime) };
        }

        if (item.id === targetItem.id) {
          return { ...item, time: currentTime, timeBlock: timeBlockFromTime(currentTime) };
        }

        return item;
      })
    });
  }

  return (
    <div className="space-y-5">
      {isPreTrip ? (
        <TripHero data={data} />
      ) : (
        <DailySummaryCard
          data={data}
          selectedDate={selectedDate}
          city={city}
          weatherCity={weatherCity}
          dayItems={dayItems}
          completedCount={completedCount}
          nextItem={nextItem}
        />
      )}

      <DaySelector dates={dates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} trip={data.trip} />

      {isPreTrip ? (
        <ChecklistPanel data={data} update={update} />
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#C86A45]">Timeline</p>
              <h2 className="text-2xl font-black text-[#183B63]">今日行程</h2>
            </div>

            <button
              onClick={onAdd}
              className="rounded-full bg-[#C86A45] px-4 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(200,106,69,0.28)]"
            >
              ＋新增
            </button>
          </div>

          <div className="space-y-4">
            {dayItems.length === 0 && (
              <EmptyCard icon="🗓" title="今日未有行程" text="可以加入景點、交通、餐廳或住宿安排。" />
            )}

            {dayItems.map(item => {
              const isAuto = item.id.startsWith("auto-");
              const moveIndex = nonAutoDayItems.findIndex(movable => movable.id === item.id);

              return (
                <TimelineCard
                  key={item.id}
                  item={item}
                  isAuto={isAuto}
                  canMoveUp={!isAuto && moveIndex > 0}
                  canMoveDown={!isAuto && moveIndex >= 0 && moveIndex < nonAutoDayItems.length - 1}
                  onToggle={() => toggleComplete(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onEdit={() => onEdit(item)}
                  onMoveUp={() => moveItem(item.id, "up")}
                  onMoveDown={() => moveItem(item.id, "down")}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function DailySummaryCard({
  data,
  selectedDate,
  city,
  weatherCity,
  dayItems,
  completedCount,
  nextItem
}: {
  data: TripDataV2;
  selectedDate: string;
  city: string;
  weatherCity: string;
  dayItems: TimedItineraryItem[];
  completedCount: number;
  nextItem?: TimedItineraryItem;
}) {
  const progress = dayItems.length ? Math.round((completedCount / dayItems.length) * 100) : 0;
  const cityTheme = getThemeByCity(city);
  const summaryBg = getCitySummaryBackground(city);

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,253,248,0.80) 0%, rgba(255,253,248,0.62) 45%, rgba(255,253,248,0.91) 100%), url('${summaryBg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold" style={{ color: cityTheme.accent }}>
            今日摘要 · {dateLabel(selectedDate)}
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#183B63]">{city}</h2>
          <p className="mt-1 text-sm font-semibold text-[#6D7B8A]">
            {dayItems.length} 個行程 · 完成 {completedCount} 個
          </p>
        </div>

        <WeatherMini city={weatherCity} date={selectedDate} />
      </div>


      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniInfo label="行程" value={`${dayItems.length} 個`} color={cityTheme.soft} />
        <MiniInfo label="進度" value={`${progress}%`} color={cityTheme.soft} />
        <CompactLocalTimeInfo city={weatherCity} color={cityTheme.soft} />
      </div>

      <div className="mt-4 h-2 rounded-full bg-[#E8DED0]">
        <div
          className="h-2 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: cityTheme.accent }}
        />
      </div>

      {nextItem ? (
        <div className="mt-4 rounded-2xl border border-[#E8DED0] p-4 shadow-sm" style={{ backgroundColor: withAlpha(cityTheme.soft, "B3") }}>
          <p className="text-xs font-black" style={{ color: cityTheme.accent }}>
            下一個行程
          </p>
          <p className="mt-1 text-sm font-black text-[#183B63]">
            {getItemTime(nextItem)} · {nextItem.title}
          </p>
          <p className="mt-1 text-xs font-bold text-[#6D7B8A]">
            {getCountdownText(nextItem) || "按時間排序顯示"}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[#E8DED0] bg-[#EEF5EA] p-4 shadow-sm">
          <p className="text-sm font-black text-[#7A9A6D]">今日行程已完成</p>
        </div>
      )}

    </section>
  );
}

function CityIllustrationCard({ city }: { city: string }) {
  const theme = getThemeByCity(city);

  return (
    <div
      className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#E8DED0]"
      style={{
        background: `linear-gradient(180deg, ${theme.soft} 0%, #FFFDF8 100%)`
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
            Landmark
          </p>
          <p className="text-sm font-semibold text-[#6D7B8A]">{theme.badge}</p>
        </div>

        <div
          className="grid h-10 w-10 place-items-center rounded-full text-xl"
          style={{ backgroundColor: "#FFFDF8", color: theme.accent }}
        >
          {theme.landmark}
        </div>
      </div>

      <div className="relative h-28 px-4 pb-4 pt-2">
        <div className="absolute inset-x-4 bottom-0 h-8 rounded-t-[2rem] bg-[#DCE8EF]/60" />
        <div className="absolute left-6 bottom-6 text-6xl opacity-90">{theme.landmark}</div>
        <div className="absolute left-24 bottom-7 text-5xl opacity-80">🏛</div>
        <div className="absolute left-44 bottom-6 text-4xl opacity-80">⛪</div>
        <div className="absolute right-8 top-5 text-xl opacity-70">☁️ ✨</div>
      </div>
    </div>
  );
}

function LocalTimeMini({ city }: { city: string }) {
  const [time, setTime] = useState("--:--");
  const label = cityCoords[city]?.label || city;

  useEffect(() => {
    const timezone = cityCoords[city]?.timezone || "Europe/Vienna";

    function tick() {
      const formatter = new Intl.DateTimeFormat("zh-HK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timezone
      });

      setTime(formatter.format(new Date()));
    }

    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, [city]);

  return (
    <div className="rounded-2xl border border-[#E8DED0] bg-[#FFFDF8] p-3 shadow-sm">
      <p className="text-xs font-black text-[#6D7B8A]">當地時間</p>
      <p className="mt-1 text-lg font-black text-[#183B63]">{time}</p>
      <p className="text-xs text-[#6D7B8A]">{label}</p>
    </div>
  );
}

function ExchangeMini() {
  return (
    <div className="rounded-2xl border border-[#E8DED0] bg-[#FFFDF8] p-3 shadow-sm">
      <p className="text-xs font-black text-[#6D7B8A]">匯率參考</p>
      <p className="mt-1 text-lg font-black text-[#183B63]">€1 ≈ HK$8.5</p>
      <p className="text-xs text-[#6D7B8A]">手動參考值</p>
    </div>
  );
}

function ChecklistPanel({
  data,
  update
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
}) {
  const checklist = data.checklist || [];

  function toggle(id: string) {
    update({
      ...data,
      checklist: checklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  }

  if (!checklist.length) {
    return (
      <EmptyCard icon="🧳" title="未有行前清單" text="可以在 seed data 加入 checklist。" />
    );
  }

  return (
    <section className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#C86A45]">Before Trip</p>
          <h2 className="text-2xl font-black text-[#183B63]">行前清單</h2>
        </div>
        <p className="rounded-full bg-[#FAF6EF] px-3 py-1 text-xs font-black text-[#183B63]">
          {checklist.filter(item => item.completed).length}/{checklist.length}
        </p>
      </div>

      <div className="space-y-3">
        {checklist.map(item => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="flex w-full items-start gap-3 rounded-2xl border border-[#E8DED0] bg-[#FAF6EF] p-4 text-left"
          >
            <span
              className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                item.completed
                  ? "border-[#7A9A6D] bg-[#7A9A6D] text-white"
                  : "border-[#CFC5B7] bg-[#FFFDF8]"
              }`}
            >
              {item.completed ? "✓" : ""}
            </span>

            <span>
              <span className="block text-sm font-black text-[#183B63]">{item.title}</span>
              <span className="mt-1 block text-xs font-semibold text-[#C86A45]">
                {checklistCategoryLabel[item.category]}
              </span>
              {item.notes && (
                <span className="mt-1 block text-xs text-[#6D7B8A]">{item.notes}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WeatherMini({ city, date }: { city: string; date: string }) {
  const [weather, setWeather] = useState<WeatherState>({
    loading: true,
    text: "讀取中"
  });

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      const coords = cityCoords[city];

      if (!coords || date === "pretrip") {
        setWeather({ loading: false, text: "暫無預報" });
        return;
      }

      try {
        const today = new Date();
        const target = parseDateKey(date);
        const diffDays = Math.floor(
          (target.getTime() -
            new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
            86400000
        );

        if (diffDays < 0 || diffDays > 16) {
          setWeather({ loading: false, text: "暫無預報" });
          return;
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${date}&end_date=${date}`;
        const response = await fetch(url);
        const json = await response.json();

        if (cancelled) return;

        const max = json?.daily?.temperature_2m_max?.[0];
        const min = json?.daily?.temperature_2m_min?.[0];
        const code = json?.daily?.weather_code?.[0];

        setWeather({
          loading: false,
          max: typeof max === "number" ? Math.round(max) : undefined,
          min: typeof min === "number" ? Math.round(min) : undefined,
          code,
          text: weatherText(code)
        });
      } catch {
        if (!cancelled) setWeather({ loading: false, text: "暫無預報" });
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [city, date]);

  return (
    <div className="text-right">
      <p className="text-3xl">{getWeatherIcon(weather.code)}</p>
      <p className="text-sm font-bold text-[#6D7B8A]">
        {weather.loading
          ? "讀取天氣中"
          : weather.max !== undefined && weather.min !== undefined
            ? `${weather.max}°/${weather.min}° · ${weather.text}`
            : weather.text}
      </p>
    </div>
  );
}

function DaySelector({
  dates,
  selectedDate,
  setSelectedDate,
  trip
}: {
  dates: string[];
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  trip: TripDataV2["trip"];
}) {
  const todayTarget = getSmartDefaultDate({ trip, itinerary: [], accommodations: [], transport: [], expenses: [], wishlist: [], documents: [] });
  const showTodayButton = todayTarget !== "pretrip";

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-3 pb-1">
        {showTodayButton && (
          <button
            onClick={() => setSelectedDate(todayTarget)}
            className={`min-w-20 rounded-3xl p-4 text-center shadow-[0_8px_20px_rgba(24,59,99,0.08)] transition ${
              selectedDate === todayTarget
                ? "bg-[#C86A45] text-white"
                : "border border-[#E8DED0] bg-[#FFFDF8] text-[#C86A45]"
            }`}
          >
            <p className="text-xs font-bold opacity-70">快速</p>
            <p className="mt-1 text-lg font-black">今日</p>
          </button>
        )}

        <button
          onClick={() => setSelectedDate("pretrip")}
          className={`min-w-20 rounded-3xl p-4 text-center shadow-[0_8px_20px_rgba(24,59,99,0.08)] transition ${
            selectedDate === "pretrip"
              ? "bg-[#183B63] text-white"
              : "border border-[#E8DED0] bg-[#FFFDF8] text-[#183B63]"
          }`}
        >
          <p className="text-xs font-bold opacity-70">行前</p>
          <p className="mt-1 text-lg font-black">清單</p>
        </button>

        {dates.map((date, index) => {
          const active = date === selectedDate;

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`min-w-20 rounded-3xl p-4 text-center shadow-[0_8px_20px_rgba(24,59,99,0.08)] transition ${
                active
                  ? "bg-[#183B63] text-white"
                  : "border border-[#E8DED0] bg-[#FFFDF8] text-[#4F5F70]"
              }`}
            >
              <p className="text-xs font-bold opacity-70">Day {index + 1}</p>
              <p className="mt-1 text-xl font-black">{dateLabel(date)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniInfo({ label, value, color = "#FAF6EF" }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="rounded-2xl border border-[#E8DED0] p-3 shadow-sm"
      style={{ backgroundColor: withAlpha(color, "B3") }}
    >
      <p className="text-xs font-bold text-[#6D7B8A]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#183B63]">{value}</p>
    </div>
  );
}


function CompactLocalTimeInfo({ city, color = "#FAF6EF" }: { city: string; color?: string }) {
  const [time, setTime] = useState("--:--");
  const label = cityCoords[city]?.label || city;

  useEffect(() => {
    const timezone = cityCoords[city]?.timezone || "Europe/Vienna";

    function tick() {
      const formatter = new Intl.DateTimeFormat("zh-HK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timezone
      });

      setTime(formatter.format(new Date()));
    }

    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, [city]);

  return (
    <div
      className="rounded-2xl border border-[#E8DED0] p-3 shadow-sm"
      style={{ backgroundColor: withAlpha(color, "B3") }}
    >
      <p className="text-xs font-bold text-[#6D7B8A]">當地時間</p>
      <p className="mt-1 text-sm font-black text-[#183B63]">{time}</p>
      <p className="truncate text-[11px] font-semibold text-[#6D7B8A]">{label}</p>
    </div>
  );
}


function TimelineCard({
  item,
  isAuto,
  canMoveUp,
  canMoveDown,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown
}: {
  item: TimedItineraryItem;
  isAuto: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const type = getItemType(item);

  if (type.label === "住宿") {
    return (
      <AccommodationStayCard
        item={item}
        isAuto={isAuto}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );
  }

  if (type.label === "航班" || type.label === "火車" || type.label === "巴士") {
    return (
      <TransportTicketCard
        item={item}
        type={type}
        isAuto={isAuto}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );
  }

  const itemTime = getItemTime(item);

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F4EEE4] text-2xl">
            {type.icon}
          </div>
          <div className="mt-2 h-full w-px bg-[#E8DED0]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-[#C86A45]">
                  {itemTime} · {timeBlockLabel[item.timeBlock]}
                </p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-black ${type.color}`}>
                  {type.label}
                </span>
              </div>

              <h3 className="mt-1 text-xl font-black text-[#183B63]">{item.title}</h3>
            </div>

            <button
              onClick={onToggle}
              disabled={isAuto}
              className={`rounded-full px-3 py-1 text-xs font-black ${
                item.completed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#FAF6EF] text-[#6D7B8A]"
              } ${isAuto ? "opacity-60" : ""}`}
            >
              {isAuto ? "自動" : item.completed ? "完成" : "未完成"}
            </button>
          </div>

          <p className="mt-2 text-sm font-semibold text-[#6D7B8A]">
            📍 {item.city || "未設定城市"}
          </p>

          {item.address && (
            <p className="mt-1 text-sm text-[#6D7B8A]">{item.address}</p>
          )}

          {item.notes && (
            <div className="mt-3 rounded-2xl bg-[#FAF6EF] p-3 text-sm text-[#4F5F70]">
              ✍️ {item.notes}
            </div>
          )}

          <TimelineActions
            item={item}
            isAuto={isAuto}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            light={false}
          />
        </div>
      </div>
    </article>
  );
}


function AccommodationStayCard({
  item,
  isAuto,
  canMoveUp,
  canMoveDown,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown
}: {
  item: TimedItineraryItem;
  isAuto: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const isCheckOut = item.title.includes("退房");
  const itemTime = getItemTime(item);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#C86A45]">
            {isCheckOut ? "CHECK OUT" : "CHECK IN"}
          </p>
          <h3 className="mt-1 text-2xl font-black text-[#183B63]">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold text-[#6D7B8A]">
            {item.date} · {itemTime} · {item.city}
          </p>
        </div>

        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FCF1DF] text-2xl">
          {isCheckOut ? "🧳" : "🏨"}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-[#FAF6EF] p-4">
        <p className="text-xs font-black text-[#6D7B8A]">地址</p>
        <p className="mt-1 text-sm font-bold text-[#183B63]">{item.address || "未設定地址"}</p>
      </div>

      {item.notes && (
        <div className="mt-3 rounded-2xl bg-[#EEF5EA] p-4">
          <p className="text-xs font-black text-[#7A9A6D]">入住資料</p>
          <p className="mt-1 text-sm leading-relaxed text-[#183B63]">{item.notes}</p>
        </div>
      )}

      {isAuto && (
        <button
          onClick={onEdit}
          className="mt-4 w-full rounded-2xl bg-[#183B63] px-4 py-3 text-sm font-black text-white"
        >
          編輯住宿卡
        </button>
      )}

      <TimelineActions
        item={item}
        isAuto={isAuto}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        light={false}
      />
    </article>
  );
}

function TransportTicketCard({
  item,
  type,
  isAuto,
  canMoveUp,
  canMoveDown,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown
}: {
  item: TimedItineraryItem;
  type: { label: string; icon: string; color: string };
  isAuto: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const itemTime = getItemTime(item);
  const arrivalTime = getArrivalTimeFromNotes(item);
  const cityParts = item.city
    ? item.city.split("/").map(part => part.trim()).filter(Boolean)
    : [];

  const fromCity = cityParts[0] || "FROM";
  const toCity = cityParts[1] || "TO";
  const fromCode = getCityCode(fromCity);
  const toCode = getCityCode(toCity);

  const gradientClass =
    type.label === "航班"
      ? "from-blue-500 via-blue-600 to-indigo-700"
      : type.label === "火車"
        ? "from-[#597BAA] via-[#416B9F] to-[#183B63]"
        : "from-cyan-500 via-sky-600 to-blue-700";

  return (
    <article className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${gradientClass} p-5 text-white shadow-[0_18px_36px_rgba(24,59,99,0.18)]`}>
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-white/15 px-3 py-1 text-xs font-black tracking-[0.35em] backdrop-blur">
          {type.label === "航班" ? "FLIGHT" : type.label === "火車" ? "TRAIN" : "BUS"}
        </div>

        <button
          onClick={onEdit}
          disabled={isAuto}
          className="rounded-full bg-white/10 px-3 py-2 text-sm font-black backdrop-blur disabled:opacity-40"
        >
          ✏️
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-4xl font-black tracking-widest">{itemTime}</div>
        <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
          {item.completed ? "已完成" : "未完成"}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-white/70">FROM</p>
          <p className="mt-1 text-4xl font-black tracking-[0.18em]">{fromCode}</p>
          <p className="mt-1 truncate text-sm text-white/80">{fromCity}</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-4xl">{type.icon}</div>
          <div className="mt-2 h-px w-20 border-t-2 border-dashed border-white/45" />
          <p className="mt-2 max-w-28 truncate text-xs text-white/70">{item.title}</p>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold tracking-[0.3em] text-white/70">TO</p>
          <p className="mt-1 text-4xl font-black tracking-[0.18em]">{toCode}</p>
          <p className="mt-1 truncate text-sm text-white/80">{toCity}</p>
          {arrivalTime && <p className="mt-1 text-sm font-black text-white/90">{arrivalTime}</p>}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
        <p className="text-lg font-black">{item.title}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="font-bold text-white/60">出發</p>
            <p className="mt-1 font-black text-white">{fromCity} · {itemTime}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="font-bold text-white/60">到達</p>
            <p className="mt-1 font-black text-white">
              {toCity}{arrivalTime ? ` · ${arrivalTime}` : ""}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="font-bold text-white/60">狀態</p>
            <p className="mt-1 font-black text-white">{item.completed ? "已完成" : "已確認 / 待出發"}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="font-bold text-white/60">提醒</p>
            <p className="mt-1 font-black text-white">{getCountdownText(item) || "請預留交通時間"}</p>
          </div>
        </div>

        {item.notes && <p className="mt-3 text-sm leading-relaxed text-white/85">{item.notes}</p>}
      </div>

      <TimelineActions
        item={item}
        isAuto={isAuto}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        light
      />
    </article>
  );
}

function TimelineActions({
  item,
  isAuto,
  canMoveUp,
  canMoveDown,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  light
}: {
  item: TimedItineraryItem;
  isAuto: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  light: boolean;
}) {
  const pill = light
    ? "bg-white/15 text-white disabled:opacity-40"
    : "bg-[#FAF6EF] text-[#183B63] disabled:opacity-30";

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className={light ? "rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900" : "rounded-full bg-[#D6A84F]/20 px-3 py-1 text-xs font-black text-[#8A650C]"}>
        {money(item.estimatedCost, item.currency)}
      </span>

      {item.googleMapsLink && (
        <a
          href={item.googleMapsLink}
          target="_blank"
          rel="noreferrer"
          className={light ? "rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white" : "rounded-full bg-[#183B63] px-3 py-1 text-xs font-black text-white"}
        >
          開啟地圖
        </a>
      )}

      {!isAuto && (
        <>
          <button onClick={onToggle} className={`rounded-full px-3 py-1 text-xs font-black ${pill}`}>
            {item.completed ? "取消完成" : "標記完成"}
          </button>

          <button onClick={onEdit} className={`rounded-full px-3 py-1 text-xs font-black ${pill}`}>
            編輯
          </button>

          <button onClick={onMoveUp} disabled={!canMoveUp} className={`rounded-full px-3 py-1 text-xs font-black ${pill}`}>
            上移
          </button>

          <button onClick={onMoveDown} disabled={!canMoveDown} className={`rounded-full px-3 py-1 text-xs font-black ${pill}`}>
            下移
          </button>

          <button onClick={onDelete} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
            刪除
          </button>
        </>
      )}
    </div>
  );
}

function MapPage({ data, selectedDate }: { data: TripDataV2; selectedDate: string }) {
  const accommodationPlaces = data.accommodations.map(stay => ({
    id: stay.id,
    title: stay.name,
    city: stay.city,
    address: stay.address,
    googleMapsLink: "",
    notes: `${stay.checkInDate} → ${stay.checkOutDate}`
  }));

  const itineraryPlaces = data.itinerary
    .filter(item => item.address)
    .map(item => ({
      id: item.id,
      title: item.title,
      city: item.city,
      address: item.address,
      googleMapsLink: item.googleMapsLink,
      notes: item.notes
    }));

  const places = [...itineraryPlaces, ...accommodationPlaces];

  const todayItems = selectedDate === "pretrip"
    ? []
    : sortItineraryItems((data.itinerary as TimedItineraryItem[]).filter(item => item.date === selectedDate));

  const todayPlaces = todayItems
    .filter(item => item.address)
    .map(item => ({
      id: item.id,
      title: item.title,
      city: item.city,
      address: item.address,
      googleMapsLink: item.googleMapsLink,
      time: getItemTime(item)
    }));

  const routeLink = buildRouteMapLink(todayItems);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2.25rem] border border-[#E8DED0] bg-[#FFFDF8] text-[#183B63] shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
        <div className="relative h-56 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(211,146,50,0.25),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(122,154,109,0.25),transparent_28%),linear-gradient(135deg,#FFFDF8,#F4EEE4)]" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-[#C86A45]">Today Route</p>
            <h2 className="mt-1 text-3xl font-black">今日路線</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6D7B8A]">
              按今日行程時間排序，一鍵開 Google Maps 導航。
            </p>

            {routeLink && (
              <a
                href={routeLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-full bg-[#183B63] px-4 py-3 text-sm font-black text-white"
              >
                開啟全日路線
              </a>
            )}
          </div>
          <div className="absolute bottom-5 right-5 text-6xl opacity-80">🗺</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#183B63]">今日路線順序</h2>
        <div className="space-y-3">
          {todayPlaces.length === 0 && (
            <EmptyCard icon="📍" title="今日未有地址" text="在行程加入地址後，會顯示在這裡。" />
          )}

          {todayPlaces.map((place, index) => (
            <RouteStepCard
              key={place.id}
              index={index + 1}
              title={place.title}
              city={place.city}
              address={place.address}
              link={place.googleMapsLink}
              time={place.time}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#183B63]">全部地點</h2>
        <div className="space-y-3">
          {places.slice(0, 30).map(place => (
            <PlaceCard key={place.id} title={place.title} city={place.city} address={place.address} link={place.googleMapsLink} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RouteStepCard({
  index,
  title,
  city,
  address,
  link,
  time
}: {
  index: number;
  title: string;
  city: string;
  address: string;
  link?: string;
  time: string;
}) {
  const fallback = makeMapsSearchLink(address || title);

  return (
    <div className="rounded-[1.75rem] border border-[#E8DED0] bg-[#FFFDF8] p-4 shadow-[0_8px_20px_rgba(24,59,99,0.08)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#183B63] text-sm font-black text-white">
          {index}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#C86A45]">{time} · {city}</p>
          <h3 className="mt-1 text-lg font-black text-[#183B63]">{title}</h3>
          <p className="mt-1 text-sm text-[#6D7B8A]">{address}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={link || fallback}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#183B63] px-3 py-2 text-xs font-black text-white"
            >
              導航
            </a>
            <button
              onClick={() => copyText(address)}
              className="rounded-full bg-[#FAF6EF] px-3 py-2 text-xs font-black text-[#183B63]"
            >
              複製地址
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({
  title,
  city,
  address,
  link
}: {
  title: string;
  city: string;
  address: string;
  link?: string;
}) {
  const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || title)}`;

  return (
    <div className="rounded-[1.75rem] border border-[#E8DED0] bg-[#FFFDF8] p-4 shadow-[0_8px_20px_rgba(24,59,99,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#C86A45]">{city}</p>
          <h3 className="mt-1 text-lg font-black text-[#183B63]">{title}</h3>
          <p className="mt-1 text-sm text-[#6D7B8A]">{address}</p>
        </div>

        <a
          href={link || fallback}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-[#183B63] px-3 py-2 text-xs font-black text-white"
        >
          導航
        </a>
      </div>
    </div>
  );
}

function BudgetPage({
  data,
  update,
  onAdd,
  onEdit
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
}) {
  const totalHKD = data.expenses.reduce((sum, x) => sum + toHKD(x.amount, x.currency), 0);
  const accommodationHKD = data.expenses
    .filter(x => x.category === "Accommodation")
    .reduce((sum, x) => sum + toHKD(x.amount, x.currency), 0);
  const dailyHKD = totalHKD / 14;

  const byCategory = expenseCategories.map(category => ({
    category,
    amount: data.expenses
      .filter(x => x.category === category)
      .reduce((sum, x) => sum + toHKD(x.amount, x.currency), 0)
  }));

  function deleteExpense(id: string) {
    update({ ...data, expenses: data.expenses.filter(expense => expense.id !== id) });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.25rem] bg-[#183B63] p-6 text-white shadow-[0_12px_30px_rgba(24,59,99,0.18)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/70">旅費管理</p>
            <h2 className="mt-1 text-4xl font-black">{money(totalHKD, "HKD")}</h2>
          </div>

          <button onClick={onAdd} className="rounded-full bg-white px-4 py-3 text-sm font-black text-[#183B63]">
            ＋記一筆
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <BudgetMini label="住宿" value={money(accommodationHKD, "HKD")} />
          <BudgetMini label="日均" value={money(dailyHKD, "HKD")} />
        </div>

        <p className="mt-4 text-xs text-white/60">
          匯率以手動參考值計算：EUR 8.5 / CAD 5.7 / CZK 0.36 / HUF 0.022
        </p>
      </section>

      <section className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
        <h2 className="text-xl font-black text-[#183B63]">分類支出</h2>
        <div className="mt-4 space-y-4">
          {byCategory.map(row => (
            <div key={row.category}>
              <div className="flex justify-between text-sm font-black">
                <span>{categoryLabel[row.category]}</span>
                <span>{money(row.amount, "HKD")}</span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-[#E8DED0]">
                <div
                  className="h-2 rounded-full bg-[#D39232]"
                  style={{ width: `${totalHKD ? Math.min((row.amount / totalHKD) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#183B63]">支出明細</h2>
        <div className="space-y-3">
          {data.expenses.map(expense => (
            <div key={expense.id} className="rounded-[1.75rem] border border-[#E8DED0] bg-[#FFFDF8] p-4 shadow-[0_8px_20px_rgba(24,59,99,0.08)]">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#C86A45]">
                    {expense.date} · {categoryLabel[expense.category]}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#183B63]">{expense.title}</h3>
                  <p className="mt-1 text-sm text-[#6D7B8A]">
                    {money(expense.amount, expense.currency)} · 約 {money(toHKD(expense.amount, expense.currency), "HKD")}
                  </p>
                  <p className="mt-1 text-sm text-[#6D7B8A]">
                    付款人：{expense.paidBy || "未設定"}
                    {expense.notes ? ` · ${expense.notes}` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <button onClick={() => onEdit(expense)} className="text-xs font-bold text-[#183B63]">
                    編輯
                  </button>
                  <button onClick={() => deleteExpense(expense.id)} className="mt-2 block text-xs font-bold text-rose-500">
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BudgetMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 p-4">
      <p className="text-xs font-bold text-white/60">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function ShoppingPage({
  data,
  update,
  onAdd,
  onEdit
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
  onAdd: () => void;
  onEdit: (item: WishlistItem) => void;
}) {
  const dates = useMemo(() => getDates(data.trip.startDate, data.trip.endDate), [data.trip.startDate, data.trip.endDate]);

  function deleteItem(id: string) {
    update({ ...data, wishlist: data.wishlist.filter(item => item.id !== id) });
  }

  function addWishlistToItinerary(item: WishlistItem, date: string) {
    const title = item.placeName || "願望項目";
    const nextItem: TimedItineraryItem = {
      id: uid("wish-itin"),
      title,
      city: item.city || euroCity(date, data),
      date,
      time: "10:00",
      order: Date.now(),
      timeBlock: "Morning",
      address: item.address || "",
      notes: `${item.category || "願望"}｜${item.notes || ""}`,
      estimatedCost: item.estimatedCost || 0,
      currency: item.currency || data.trip.mainCurrency,
      googleMapsLink: item.googleMapsLink || "",
      completed: false
    };

    update({
      ...data,
      itinerary: [...data.itinerary, nextItem],
      wishlist: data.wishlist
    });

    alert("已加入行程。");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.25rem] bg-gradient-to-br from-[#C86A45] to-[#183B63] p-6 text-white shadow-[0_12px_30px_rgba(24,59,99,0.18)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/70">Wish List</p>
            <h2 className="mt-1 text-3xl font-black">願望清單</h2>
            <p className="mt-2 text-sm text-white/70">
              想去的景點、餐廳、活動、拍照點同購物點都可以放在這裡，再一鍵加入行程。活動可先歸類為「其他」。
            </p>
          </div>

          <button onClick={onAdd} className="rounded-full bg-white px-4 py-3 text-sm font-black text-[#183B63]">
            ＋新增
          </button>
        </div>
      </section>

      <div className="grid gap-4">
        {data.wishlist.length === 0 && (
          <EmptyCard icon="⭐" title="未有願望清單" text="新增想去的景點、餐廳、活動、拍照點或購物點。活動可先選「其他」。" />
        )}

        {data.wishlist.map(item => (
          <ShoppingCard
            key={item.id}
            item={item}
            dates={dates}
            onDelete={() => deleteItem(item.id)}
            onEdit={() => onEdit(item)}
            onAddToItinerary={date => addWishlistToItinerary(item, date)}
          />
        ))}
      </div>
    </div>
  );
}

function ShoppingCard({
  item,
  dates,
  onDelete,
  onEdit,
  onAddToItinerary
}: {
  item: WishlistItem;
  dates: string[];
  onDelete: () => void;
  onEdit: () => void;
  onAddToItinerary: (date: string) => void;
}) {
  const [targetDate, setTargetDate] = useState(dates[0] || "");

  return (
    <article className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
      <div className="flex gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-[#F4EEE4] text-3xl">
          {item.category === "Restaurant" ? "🍽" : item.category === "Attraction" ? "📍" : "⭐"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#C86A45]">
                {item.city || "未設定城市"} · {item.priority}
              </p>
              <h3 className="mt-1 text-xl font-black text-[#183B63]">{item.placeName}</h3>
            </div>

            <div className="text-right">
              <button onClick={onEdit} className="text-sm font-bold text-[#183B63]">
                編輯
              </button>
              <button onClick={onDelete} className="mt-2 block text-sm font-bold text-rose-500">
                刪除
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-[#6D7B8A]">{item.notes || item.address}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#D6A84F]/20 px-3 py-1 text-xs font-black text-[#8A650C]">
              {money(item.estimatedCost, item.currency)}
            </span>
            <span className="rounded-full bg-[#EEF5EA] px-3 py-1 text-xs font-black text-[#183B63]">
              {item.category}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <select
              value={targetDate}
              onChange={event => setTargetDate(event.target.value)}
              className="rounded-2xl border border-[#E8DED0] bg-[#FAF6EF] px-3 py-2 text-xs font-black text-[#183B63]"
            >
              {dates.map(date => (
                <option key={date} value={date}>
                  {dateLabel(date)}
                </option>
              ))}
            </select>

            <button
              onClick={() => onAddToItinerary(targetDate)}
              className="rounded-2xl bg-[#183B63] px-3 py-2 text-xs font-black text-white"
            >
              加入行程
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.googleMapsLink && (
              <a
                href={item.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#183B63] px-3 py-2 text-xs font-black text-white"
              >
                導航
              </a>
            )}
            {item.address && (
              <a
                href={item.googleMapsLink || makeMapsSearchLink(item.address)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#FAF6EF] px-3 py-2 text-xs font-black text-[#183B63]"
              >
                開地圖
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoPage({
  data,
  update,
  selectedDate,
  cloudStatus,
  syncFromCloud,
  syncToCloudNow
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
  selectedDate: string;
  cloudStatus: CloudStatus;
  syncFromCloud: () => Promise<void>;
  syncToCloudNow: () => Promise<void>;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `trippilot-backup-${formatDateKey(new Date())}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file?: File) {
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as TripDataV2;
      if (!parsed.trip || !Array.isArray(parsed.itinerary)) {
        alert("這不是有效的 TripPilot backup。");
        return;
      }
      update(parsed);
      alert("已匯入 backup。");
    } catch {
      alert("匯入失敗，請檢查 JSON 檔案。");
    }
  }

  function copyTodayItinerary() {
    const targetDate = selectedDate === "pretrip" ? data.trip.startDate : selectedDate;
    const items = sortItineraryItems(
      (data.itinerary as TimedItineraryItem[]).filter(item => item.date === targetDate)
    );

    const content = [
      `${targetDate} 今日行程`,
      ...items.map(item => `${getItemTime(item)}｜${item.title}${item.address ? `｜${item.address}` : ""}${item.notes ? `｜${item.notes}` : ""}`)
    ].join("\\n");

    copyText(content);
    alert("已複製今日行程。");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.25rem] bg-[#183B63] p-6 text-white shadow-[0_12px_30px_rgba(24,59,99,0.18)]">
        <p className="text-sm font-bold text-white/70">Travel Vault</p>
        <h2 className="mt-1 text-3xl font-black">旅行資訊庫</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          住宿、交通、文件、緊急資料同設定集中放在這裡。
        </p>
      </section>

      <section className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#183B63]">雲端同步</h2>
            <p className="mt-1 text-sm text-[#6D7B8A]">
              兩部電話使用同一個 Trip ID：birthday-europe-2026
            </p>
          </div>
          <CloudStatusBadge status={cloudStatus} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={syncFromCloud}
            disabled={cloudStatus === "loading" || cloudStatus === "saving"}
            className="rounded-2xl bg-[#183B63] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            從雲端更新
          </button>

          <button
            onClick={syncToCloudNow}
            disabled={cloudStatus === "loading" || cloudStatus === "saving"}
            className="rounded-2xl bg-[#EEF5EA] px-4 py-3 text-sm font-black text-[#183B63] disabled:opacity-50"
          >
            立即上傳
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#6D7B8A]">
          App 會自動保存到雲端；另一部電話重新整理或按「從雲端更新」就會見到最新資料。
        </p>
      </section>

      <section className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
        <h2 className="text-xl font-black text-[#183B63]">離線資料 / Backup</h2>
        <p className="mt-2 text-sm text-[#6D7B8A]">
          將 localStorage 資料匯出成 JSON，旅行前可以備份到 iCloud / Files。
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={exportBackup}
            className="rounded-2xl bg-[#183B63] px-4 py-3 text-sm font-black text-white"
          >
            匯出 Backup
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="rounded-2xl bg-[#FAF6EF] px-4 py-3 text-sm font-black text-[#183B63]"
          >
            匯入 Backup
          </button>

          <button
            onClick={copyTodayItinerary}
            className="col-span-2 rounded-2xl bg-[#EEF5EA] px-4 py-3 text-sm font-black text-[#183B63]"
          >
            複製今日行程文字
          </button>
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={event => importBackup(event.target.files?.[0])}
        />
      </section>

      <InfoSection title="住宿" icon="🏨">
        {data.accommodations.map(stay => (
          <InfoCard
            key={stay.id}
            title={stay.name}
            subtitle={`${stay.city} · ${stay.checkInDate} → ${stay.checkOutDate}`}
            text={`${stay.address} · ${money(stay.totalCost, stay.currency)} · ${stay.nights} 晚${stay.notes ? ` · ${stay.notes}` : ""}`}
          />
        ))}
      </InfoSection>

      <InfoSection title="交通" icon="🚆">
        {data.transport.map(item => (
          <InfoCard
            key={item.id}
            title={`${item.fromCity} → ${item.toCity}`}
            subtitle={`${item.date} · ${item.transportType} · ${item.departureTime} → ${item.arrivalTime}`}
            text={`${item.departureStation || "未設定"} → ${item.arrivalStation || "未設定"} · ${
              item.confirmed ? "已確認" : "未確認"
            } ${item.notes ? `· ${item.notes}` : ""}`}
          />
        ))}
      </InfoSection>

      <InfoSection title="文件" icon="📄">
        {data.documents.map(doc => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </InfoSection>

      <section className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
        <h2 className="text-xl font-black text-[#183B63]">資料設定</h2>
        <p className="mt-2 text-sm text-[#6D7B8A]">
          所有資料目前儲存在這部 iPhone 的 localStorage。
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => update(resetTripData() as TripDataV2)}
            className="rounded-full bg-[#FAF6EF] px-4 py-3 text-sm font-black text-[#183B63]"
          >
            重設範例資料
          </button>

          <button
            onClick={() => {
              clearTripData();
              update(resetTripData() as TripDataV2);
            }}
            className="rounded-full bg-rose-50 px-4 py-3 text-sm font-black text-rose-600"
          >
            清除資料
          </button>
        </div>
      </section>
    </div>
  );
}

function CloudStatusBadge({ status }: { status: CloudStatus }) {
  const config: Record<CloudStatus, { label: string; style: string }> = {
    off: { label: "未連線", style: "bg-gray-100 text-gray-600" },
    loading: { label: "讀取中", style: "bg-amber-50 text-amber-700" },
    synced: { label: "已同步", style: "bg-emerald-50 text-emerald-700" },
    saving: { label: "儲存中", style: "bg-blue-50 text-blue-700" },
    error: { label: "同步錯誤", style: "bg-rose-50 text-rose-700" }
  };

  return (
    <span className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${config[status].style}`}>
      {config[status].label}
    </span>
  );
}

function InfoSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-black text-[#183B63]">
        {icon} {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoCard({
  title,
  subtitle,
  text
}: {
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-[#E8DED0] bg-[#FFFDF8] p-4 shadow-[0_8px_20px_rgba(24,59,99,0.08)]">
      <p className="text-xs font-black text-[#C86A45]">{subtitle}</p>
      <h3 className="mt-1 text-lg font-black text-[#183B63]">{title}</h3>
      <p className="mt-1 text-sm text-[#6D7B8A]">{text}</p>
    </article>
  );
}

function DocumentCard({ doc }: { doc: DocumentItem }) {
  return (
    <article className="rounded-[1.75rem] border border-[#E8DED0] bg-[#FFFDF8] p-4 shadow-[0_8px_20px_rgba(24,59,99,0.08)]">
      <p className="text-xs font-black text-[#C86A45]">
        {doc.date} · {doc.relatedCity}
      </p>
      <h3 className="mt-1 text-lg font-black text-[#183B63]">{doc.title}</h3>
      <p className="mt-1 text-sm text-[#6D7B8A]">{doc.notes}</p>

      {doc.link && (
        <a
          href={doc.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-full bg-[#183B63] px-3 py-2 text-xs font-black text-white"
        >
          開啟連結
        </a>
      )}
    </article>
  );
}

function BottomNav({
  activeTab,
  setActiveTab
}: {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
}) {
  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.25rem)] left-4 right-4 z-50 mx-auto max-w-md">
      <div className="grid grid-cols-5 gap-1 rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8]/90 p-2 shadow-[0_16px_38px_rgba(24,59,99,0.12)] backdrop-blur-xl">
        {tabs.map(tab => {
          const active = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-3xl px-2 py-3 text-center text-xs font-black transition ${
                active
                  ? "bg-[#183B63] text-white shadow-lg"
                  : "text-[#6D7B8A] hover:bg-[#FAF6EF]"
              }`}
            >
              <div className="text-lg">{tab.icon}</div>
              <div className="mt-1">{tab.label}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function EmptyCard({
  icon,
  title,
  text
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-6 text-center shadow-[0_12px_30px_rgba(24,59,99,0.08)]">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-xl font-black text-[#183B63]">{title}</h3>
      <p className="mt-2 text-sm text-[#6D7B8A]">{text}</p>
    </div>
  );
}

function ItineraryModal({
  mode,
  data,
  selectedDate,
  initialItem,
  onClose,
  onSave
}: {
  mode: "add" | "edit";
  data: TripDataV2;
  selectedDate: string;
  initialItem?: TimedItineraryItem;
  onClose: () => void;
  onSave: (item: TimedItineraryItem) => void;
}) {
  const initialTime = initialItem?.time || fallbackTimeFromBlock(initialItem?.timeBlock || "Morning");

  const [title, setTitle] = useState(initialItem?.title || "");
  const [city, setCity] = useState(initialItem?.city || euroCity(selectedDate, data));
  const [date, setDate] = useState(initialItem?.date || selectedDate);
  const [time, setTime] = useState(initialTime);
  const [timeBlock, setTimeBlock] = useState<TimeBlock>(
    initialItem?.timeBlock || timeBlockFromTime(initialTime)
  );
  const [address, setAddress] = useState(initialItem?.address || "");
  const [cost, setCost] = useState(String(initialItem?.estimatedCost ?? 0));
  const [notes, setNotes] = useState(initialItem?.notes || "");
  const [googleMapsLink, setGoogleMapsLink] = useState(initialItem?.googleMapsLink || "");

  function submit() {
    if (!title.trim()) return;

    onSave({
      id: initialItem && !initialItem.id.startsWith("auto-") ? initialItem.id : uid("itin"),
      title,
      city,
      date,
      time,
      order: initialItem?.order || Date.now(),
      timeBlock: timeBlockFromTime(time),
      address,
      notes,
      estimatedCost: Number(cost || 0),
      currency: initialItem?.currency || data.trip.mainCurrency,
      googleMapsLink
    });
  }

  return (
    <Modal title={mode === "add" ? "新增行程" : "編輯行程"} onClose={onClose}>
      <Field label="標題" value={title} setValue={setTitle} />
      <Field label="城市" value={city} setValue={setCity} />
      <Field label="日期" type="date" value={date} setValue={setDate} />

      <Field
        label="時間"
        type="time"
        value={time}
        setValue={value => {
          setTime(value);
          setTimeBlock(timeBlockFromTime(value));
        }}
      />

      <Select
        label="時段"
        value={timeBlock}
        options={timeBlocks}
        labels={timeBlockLabel}
        setValue={value => {
          const block = value as TimeBlock;
          setTimeBlock(block);
          setTime(fallbackTimeFromBlock(block));
        }}
      />

      <Field label="地址" value={address} setValue={setAddress} />
      <Field label="Google Maps 連結" value={googleMapsLink} setValue={setGoogleMapsLink} />
      <Field label="費用" type="number" value={cost} setValue={setCost} />
      <TextArea label="備註" value={notes} setValue={setNotes} />

      <PrimaryButton onClick={submit}>
        {mode === "add" ? "儲存行程" : "儲存修改"}
      </PrimaryButton>
    </Modal>
  );
}

function AddExpenseModal({
  mode = "add",
  data,
  initialExpense,
  onClose,
  onSave
}: {
  mode?: "add" | "edit";
  data: TripDataV2;
  initialExpense?: Expense;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [title, setTitle] = useState(initialExpense?.title || "");
  const [date, setDate] = useState(initialExpense?.date || data.trip.startDate);
  const [category, setCategory] = useState<ExpenseCategory>(initialExpense?.category || "Food");
  const [amount, setAmount] = useState(String(initialExpense?.amount ?? 0));
  const [currency, setCurrency] = useState(initialExpense?.currency || "EUR");
  const [paidBy, setPaidBy] = useState(initialExpense?.paidBy || data.trip.travelers[0] || "Chris");
  const [notes, setNotes] = useState(initialExpense?.notes || "");

  function submit() {
    if (!title.trim()) return;

    onSave({
      id: initialExpense?.id || uid("exp"),
      title,
      date,
      category,
      amount: Number(amount || 0),
      currency,
      paidBy,
      notes
    });
  }

  return (
    <Modal title={mode === "add" ? "新增支出" : "編輯支出"} onClose={onClose}>
      <Field label="名稱" value={title} setValue={setTitle} />
      <Field label="日期" type="date" value={date} setValue={setDate} />

      <Select
        label="分類"
        value={category}
        options={expenseCategories}
        labels={categoryLabel}
        setValue={value => setCategory(value as ExpenseCategory)}
      />

      <Field label="金額" type="number" value={amount} setValue={setAmount} />

      <Select
        label="幣別"
        value={currency}
        options={["EUR", "HKD", "CAD", "CZK", "HUF", "USD"]}
        setValue={setCurrency}
      />

      <Field label="付款人" value={paidBy} setValue={setPaidBy} />
      <TextArea label="備註" value={notes} setValue={setNotes} />
      <PrimaryButton onClick={submit}>{mode === "add" ? "儲存支出" : "儲存修改"}</PrimaryButton>
    </Modal>
  );
}

function AddShoppingModal({
  mode = "add",
  data,
  initialItem,
  onClose,
  onSave
}: {
  mode?: "add" | "edit";
  data: TripDataV2;
  initialItem?: WishlistItem;
  onClose: () => void;
  onSave: (item: WishlistItem) => void;
}) {
  const [placeName, setPlaceName] = useState(initialItem?.placeName || "");
  const [city, setCity] = useState(initialItem?.city || "Vienna");
  const [category, setCategory] = useState(initialItem?.category || "Attraction");
  const [priority, setPriority] = useState(initialItem?.priority || "Nice to Go");
  const [address, setAddress] = useState(initialItem?.address || "");
  const [googleMapsLink, setGoogleMapsLink] = useState(initialItem?.googleMapsLink || "");
  const [estimatedCost, setEstimatedCost] = useState(String(initialItem?.estimatedCost ?? 0));
  const [currency, setCurrency] = useState(initialItem?.currency || "EUR");
  const [estimatedDuration, setEstimatedDuration] = useState(initialItem?.estimatedDuration || "");
  const [notes, setNotes] = useState(initialItem?.notes || "");

  function submit() {
    if (!placeName.trim()) return;

    onSave({
      id: initialItem?.id || uid("wish"),
      placeName,
      city,
      category: category as WishlistItem["category"],
      priority: priority as WishlistItem["priority"],
      address,
      estimatedCost: Number(estimatedCost || 0),
      currency,
      estimatedDuration,
      notes,
      googleMapsLink
    });
  }

  return (
    <Modal title={mode === "add" ? "新增願望" : "編輯願望"} onClose={onClose}>
      <Field label="名稱" value={placeName} setValue={setPlaceName} />
      <Field label="城市" value={city} setValue={setCity} />

      <Select
        label="類型"
        value={category}
        options={["Attraction", "Restaurant", "Cafe", "Bar", "Museum", "Shopping", "Photo Spot", "Other"]}
        labels={{
          Attraction: "景點",
          Restaurant: "餐廳",
          Cafe: "咖啡店",
          Bar: "酒吧",
          Museum: "博物館",
          Shopping: "購物",
          "Photo Spot": "拍照點",
          Other: "其他"
        }}
        setValue={setCategory}
      />

      <Select
        label="優先度"
        value={priority}
        options={["Must Go", "Nice to Go", "Backup"]}
        labels={{
          "Must Go": "必去",
          "Nice to Go": "想去",
          Backup: "後備"
        }}
        setValue={setPriority}
      />

      <Field label="地址" value={address} setValue={setAddress} />
      <Field label="Google Maps 連結" value={googleMapsLink} setValue={setGoogleMapsLink} />
      <Field label="預算" type="number" value={estimatedCost} setValue={setEstimatedCost} />

      <Select
        label="幣別"
        value={currency}
        options={["EUR", "HKD", "CAD", "CZK", "HUF", "USD"]}
        setValue={setCurrency}
      />

      <Field label="預計停留時間" value={estimatedDuration} setValue={setEstimatedDuration} />
      <TextArea label="備註" value={notes} setValue={setNotes} />
      <PrimaryButton onClick={submit}>{mode === "add" ? "儲存願望" : "儲存修改"}</PrimaryButton>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/40 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-[#E8DED0] bg-[#FFFDF8] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#183B63]">{title}</h2>

          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#FAF6EF] text-xl font-black"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
  type = "text"
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#6D7B8A]">{label}</span>

      <input
        type={type}
        value={value}
        onChange={event => setValue(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-[#E8DED0] bg-[#FAF6EF] px-4 py-3 text-base font-semibold text-[#183B63] outline-none focus:border-[#183B63]"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  setValue
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#6D7B8A]">{label}</span>

      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        className="mt-1 min-h-24 w-full rounded-2xl border border-[#E8DED0] bg-[#FAF6EF] px-4 py-3 text-base font-semibold text-[#183B63] outline-none focus:border-[#183B63]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  labels,
  setValue
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  setValue: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#6D7B8A]">{label}</span>

      <select
        value={value}
        onChange={event => setValue(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-[#E8DED0] bg-[#FAF6EF] px-4 py-3 text-base font-semibold text-[#183B63] outline-none focus:border-[#183B63]"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {labels?.[option] || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrimaryButton({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-[#183B63] px-5 py-4 text-base font-black text-white shadow-lg"
    >
      {children}
    </button>
  );
}

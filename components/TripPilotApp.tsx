"use client";

import { useEffect, useMemo, useState } from "react";
import { clearTripData, loadTripData, resetTripData, saveTripData } from "@/lib/storage";
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

type LocalTimeState = {
  label: string;
  time: string;
};

const tabs: { key: MainTab; label: string; icon: string }[] = [
  { key: "trip", label: "行程", icon: "🗓" },
  { key: "map", label: "地圖", icon: "🗺" },
  { key: "budget", label: "記帳", icon: "💳" },
  { key: "shopping", label: "購物", icon: "🛍" },
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
  Vienna: {
    lat: 48.2082,
    lon: 16.3738,
    label: "維也納",
    timezone: "Europe/Vienna"
  },
  Prague: {
    lat: 50.0755,
    lon: 14.4378,
    label: "布拉格",
    timezone: "Europe/Prague"
  },
  Budapest: {
    lat: 47.4979,
    lon: 19.0402,
    label: "布達佩斯",
    timezone: "Europe/Budapest"
  },
  Bratislava: {
    lat: 48.1486,
    lon: 17.1077,
    label: "Bratislava",
    timezone: "Europe/Bratislava"
  },
  Vancouver: {
    lat: 49.2827,
    lon: -123.1207,
    label: "溫哥華",
    timezone: "America/Vancouver"
  },
  Frankfurt: {
    lat: 50.1109,
    lon: 8.6821,
    label: "法蘭克福",
    timezone: "Europe/Berlin"
  }
};

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

export default function TripPilotApp() {
  const [data, setData] = useState<TripDataV2 | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("trip");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [editingItem, setEditingItem] = useState<TimedItineraryItem | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddShopping, setShowAddShopping] = useState(false);

  useEffect(() => {
    const loaded = loadTripData() as TripDataV2;
    setData(loaded);
    setSelectedDate("pretrip");
  }, []);

  useEffect(() => {
    if (data) saveTripData(data);
  }, [data]);

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F7EFE5] p-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-2xl">
          <div className="text-4xl">🧳</div>
          <h1 className="mt-4 text-2xl font-black text-[#12355B]">TripPilot</h1>
          <p className="mt-2 text-slate-500">正在載入你的旅程...</p>
        </div>
      </main>
    );
  }

  const update = (next: TripDataV2) => setData(next);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7EFE5] via-[#EAF2F4] to-white pb-32 text-[#172033]">
      <div className="mx-auto max-w-md px-4 pt-4">
        <TopBar />

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
          <BudgetPage data={data} update={update} onAdd={() => setShowAddExpense(true)} />
        )}

        {activeTab === "shopping" && (
          <ShoppingPage data={data} update={update} onAdd={() => setShowAddShopping(true)} />
        )}

        {activeTab === "info" && <InfoPage data={data} update={update} />}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {showAddItinerary && (
        <ItineraryModal
          mode="add"
          data={data}
          selectedDate={selectedDate}
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
            update({
              ...data,
              itinerary: data.itinerary.map(existing =>
                existing.id === item.id ? item : existing
              )
            });
            setEditingItem(null);
          }}
        />
      )}

      {showAddExpense && (
        <AddExpenseModal
          data={data}
          onClose={() => setShowAddExpense(false)}
          onSave={expense => {
            update({ ...data, expenses: [...data.expenses, expense] });
            setShowAddExpense(false);
          }}
        />
      )}

      {showAddShopping && (
        <AddShoppingModal
          data={data}
          onClose={() => setShowAddShopping(false)}
          onSave={item => {
            update({ ...data, wishlist: [...data.wishlist, item] });
            setShowAddShopping(false);
          }}
        />
      )}
    </main>
  );
}

function TopBar() {
  return (
    <div className="safe-top mb-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B85C38]">
          TripPilot v2
        </p>
        <h1 className="text-xl font-black text-[#12355B]">中歐旅行助手</h1>
      </div>

      <div className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-xl shadow-lg">
        🧳
      </div>
    </div>
  );
}

function TripHero({ data }: { data: TripDataV2 }) {
  const totalAccommodation = data.accommodations.reduce((sum, x) => sum + x.totalCost, 0);
  const days =
    Math.ceil(
      (parseDateKey(data.trip.endDate).getTime() -
        parseDateKey(data.trip.startDate).getTime()) /
        86400000
    ) + 1;

  const checklist = data.checklist || [];
  const completedChecklist = checklist.filter(item => item.completed).length;

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] bg-[#12355B] p-6 text-white shadow-2xl">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#D6A84F]/20" />
      <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white/70">Central Europe</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">{data.trip.name}</h2>
          </div>

          <div className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-bold backdrop-blur">
            ✈️ EU
          </div>
        </div>

        <p className="text-sm font-semibold text-white/75">
          {data.trip.startDate} → {data.trip.endDate}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-white/90">{data.trip.route}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <HeroStat label="天數" value={`${days}`} />
          <HeroStat label="城市" value="5" />
          <HeroStat
            label="住宿"
            value={money(totalAccommodation, data.trip.mainCurrency).replace("HKD ", "$")}
          />
        </div>

        {checklist.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white/12 p-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>行前準備</span>
              <span>
                {completedChecklist}/{checklist.length}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-[#D6A84F]"
                style={{ width: `${(completedChecklist / checklist.length) * 100}%` }}
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
    <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
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

  const itineraryItems = (data.itinerary as TimedItineraryItem[]).filter(
    item => item.date === selectedDate
  );
  
  const isPreTrip = selectedDate === "pretrip";

  const stayItems: TimedItineraryItem[] = data.accommodations.flatMap(stay => {
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
        time: "10:00",
        order: 0,
        timeBlock: "Morning",
        address: stay.address,
        notes: `${stay.city} 住宿退房｜${stay.checkInDate} → ${stay.checkOutDate}`,
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
        time: "18:00",
        order: 99,
        timeBlock: "Evening",
        address: stay.address,
        notes: `${stay.city} 住宿入住｜${stay.checkInDate} → ${stay.checkOutDate}｜${money(
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
          return {
            ...item,
            time: targetTime,
            timeBlock: timeBlockFromTime(targetTime)
          };
        }

        if (item.id === targetItem.id) {
          return {
            ...item,
            time: currentTime,
            timeBlock: timeBlockFromTime(currentTime)
          };
        }

        return item;
      })
    });
  }

  return (
    <div className="space-y-5">
      <TripHero data={data} />

      <DaySelector
        dates={dates}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

     {isPreTrip ? (
  <ChecklistPanel data={data} update={update} />
) : (
  <>
    <DailySummaryCard
      data={data}
      selectedDate={selectedDate}
      city={city}
      weatherCity={weatherCity}
      dayItems={dayItems}
      completedCount={completedCount}
      nextItem={nextItem}
    />

    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#B85C38]">Timeline</p>
          <h2 className="text-2xl font-black text-[#12355B]">今日行程</h2>
        </div>

        <button
          onClick={onAdd}
          className="rounded-full bg-[#B85C38] px-4 py-3 text-sm font-black text-white shadow-lg"
        >
          ＋新增
        </button>
      </div>

      <div className="space-y-4">
        {dayItems.length === 0 && (
          <EmptyCard
            icon="🗓"
            title="今日未有行程"
            text="可以加入景點、交通、餐廳或住宿安排。"
          />
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
  </>
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

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#B85C38]">今日摘要 · {dateLabel(selectedDate)}</p>
          <h2 className="mt-1 text-2xl font-black text-[#12355B]">{city}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {dayItems.length} 個行程 · 完成 {completedCount} 個
          </p>
        </div>

        <WeatherMini city={weatherCity} date={selectedDate} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniInfo label="行程" value={`${dayItems.length} 個`} />
        <MiniInfo label="進度" value={`${progress}%`} />
        <MiniInfo label="主幣別" value={data.trip.mainCurrency} />
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-[#B85C38]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {nextItem && (
        <div className="mt-4 rounded-2xl bg-[#F7EFE5] p-4">
          <p className="text-xs font-black text-[#B85C38]">下一個行程</p>
          <p className="mt-1 text-sm font-black text-[#12355B]">
            {getItemTime(nextItem)} · {nextItem.title}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <LocalTimeMini city={weatherCity} />
        <ExchangeMini />
      </div>
    </section>
  );
}

function LocalTimeMini({ city }: { city: string }) {
  const [local, setLocal] = useState<LocalTimeState>({
    label: cityCoords[city]?.label || city,
    time: "--:--"
  });

  useEffect(() => {
    const timezone = cityCoords[city]?.timezone || "Europe/Vienna";
    const label = cityCoords[city]?.label || city;

    function tick() {
      const formatter = new Intl.DateTimeFormat("zh-HK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timezone
      });

      setLocal({
        label,
        time: formatter.format(new Date())
      });
    }

    tick();
    const timer = window.setInterval(tick, 60000);

    return () => window.clearInterval(timer);
  }, [city]);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-xs font-black text-slate-400">當地時間</p>
      <p className="mt-1 text-lg font-black text-[#12355B]">{local.time}</p>
      <p className="text-xs text-slate-500">{local.label}</p>
    </div>
  );
}

function ExchangeMini() {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-xs font-black text-slate-400">匯率參考</p>
      <p className="mt-1 text-lg font-black text-[#12355B]">€1 ≈ HK$8.5</p>
      <p className="text-xs text-slate-500">手動參考值</p>
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

  if (!checklist.length) return null;

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#B85C38]">Before Trip</p>
          <h2 className="text-2xl font-black text-[#12355B]">行前清單</h2>
        </div>
        <p className="rounded-full bg-[#F7EFE5] px-3 py-1 text-xs font-black text-[#12355B]">
          {checklist.filter(item => item.completed).length}/{checklist.length}
        </p>
      </div>

      <div className="space-y-3">
        {checklist.map(item => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="flex w-full items-start gap-3 rounded-2xl bg-slate-50 p-4 text-left"
          >
            <span
              className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                item.completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {item.completed ? "✓" : ""}
            </span>

            <span>
              <span className="block text-sm font-black text-[#12355B]">{item.title}</span>
              <span className="mt-1 block text-xs font-semibold text-[#B85C38]">
                {checklistCategoryLabel[item.category]}
              </span>
              {item.notes && (
                <span className="mt-1 block text-xs text-slate-500">{item.notes}</span>
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

      if (!coords) {
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
          setWeather({
            loading: false,
            text: "暫無預報"
          });
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
        if (!cancelled) {
          setWeather({
            loading: false,
            text: "暫無預報"
          });
        }
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
      <p className="text-sm font-bold text-slate-500">
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
  setSelectedDate
}: {
  dates: string[];
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-3 pb-1">
       <button
  onClick={() => setSelectedDate("pretrip")}
  className={`min-w-20 rounded-3xl p-4 text-center shadow-lg transition ${
    selectedDate === "pretrip"
      ? "bg-[#12355B] text-white"
      : "bg-white text-slate-600"
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
              className={`min-w-20 rounded-3xl p-4 text-center shadow-lg transition ${
                active ? "bg-[#12355B] text-white" : "bg-white text-slate-600"
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

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F7EFE5] p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-[#12355B]">{value}</p>
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
  const itemTime = getItemTime(item);

  return (
    <article className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-xl">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EAF2F4] text-2xl">
            {type.icon}
          </div>
          <div className="mt-2 h-full w-px bg-slate-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-[#B85C38]">
                  {itemTime} · {timeBlockLabel[item.timeBlock]}
                </p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-black ${type.color}`}>
                  {type.label}
                </span>
              </div>

              <h3 className="mt-1 text-xl font-black text-[#12355B]">{item.title}</h3>
            </div>

            <button
              onClick={onToggle}
              disabled={isAuto}
              className={`rounded-full px-3 py-1 text-xs font-black ${
                item.completed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#F7EFE5] text-slate-500"
              } ${isAuto ? "opacity-60" : ""}`}
            >
              {isAuto ? "自動" : item.completed ? "完成" : "未完成"}
            </button>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            📍 {item.city || "未設定城市"}
          </p>

          {item.address && (
            <p className="mt-1 text-sm text-slate-500">{item.address}</p>
          )}

          {item.notes && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              ✍️ {item.notes}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#D6A84F]/20 px-3 py-1 text-xs font-black text-[#8A650C]">
              {money(item.estimatedCost, item.currency)}
            </span>

            {item.googleMapsLink && (
              <a
                href={item.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#12355B] px-3 py-1 text-xs font-black text-white"
              >
                開啟地圖
              </a>
            )}

            {!isAuto && (
              <>
                <button
                  onClick={onEdit}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#12355B]"
                >
                  編輯
                </button>

                <button
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 disabled:opacity-30"
                >
                  上移
                </button>

                <button
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 disabled:opacity-30"
                >
                  下移
                </button>

                <button
                  onClick={onDelete}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600"
                >
                  刪除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
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

  const todayPlaces = data.itinerary
    .filter(item => item.date === selectedDate && item.address)
    .map(item => ({
      id: item.id,
      title: item.title,
      city: item.city,
      address: item.address,
      googleMapsLink: item.googleMapsLink
    }));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2.25rem] bg-[#12355B] text-white shadow-2xl">
        <div className="relative h-56 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,168,79,0.45),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#12355B,#0B1F36)]" />

          <div className="relative z-10">
            <p className="text-sm font-bold text-white/70">Map Center</p>
            <h2 className="mt-1 text-3xl font-black">中歐地圖中心</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              今日景點、住宿位置、交通站點同 Google Maps 導航。
            </p>
          </div>

          <div className="absolute bottom-5 right-5 text-6xl opacity-80">🗺</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#12355B]">今日地點</h2>
        <div className="space-y-3">
          {todayPlaces.length === 0 && (
            <EmptyCard
              icon="📍"
              title="今日未有地址"
              text="在行程加入地址後，會顯示在這裡。"
            />
          )}

          {todayPlaces.map(place => (
            <PlaceCard
              key={place.id}
              title={place.title}
              city={place.city}
              address={place.address}
              link={place.googleMapsLink}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#12355B]">全部地點</h2>
        <div className="space-y-3">
          {places.slice(0, 30).map(place => (
            <PlaceCard
              key={place.id}
              title={place.title}
              city={place.city}
              address={place.address}
              link={place.googleMapsLink}
            />
          ))}
        </div>
      </section>
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
  const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || title
  )}`;

  return (
    <div className="rounded-[1.75rem] bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#B85C38]">{city}</p>
          <h3 className="mt-1 text-lg font-black text-[#12355B]">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{address}</p>
        </div>

        <a
          href={link || fallback}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-[#12355B] px-3 py-2 text-xs font-black text-white"
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
  onAdd
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
  onAdd: () => void;
}) {
  const totalHKD = data.expenses.reduce(
    (sum, x) => sum + toHKD(x.amount, x.currency),
    0
  );

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
    update({
      ...data,
      expenses: data.expenses.filter(expense => expense.id !== id)
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.25rem] bg-[#12355B] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/70">旅費管理</p>
            <h2 className="mt-1 text-4xl font-black">{money(totalHKD, "HKD")}</h2>
          </div>

          <button
            onClick={onAdd}
            className="rounded-full bg-white px-4 py-3 text-sm font-black text-[#12355B]"
          >
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

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-[#12355B]">分類支出</h2>
        <div className="mt-4 space-y-4">
          {byCategory.map(row => (
            <div key={row.category}>
              <div className="flex justify-between text-sm font-black">
                <span>{categoryLabel[row.category]}</span>
                <span>{money(row.amount, "HKD")}</span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#D6A84F]"
                  style={{
                    width: `${totalHKD ? Math.min((row.amount / totalHKD) * 100, 100) : 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#12355B]">支出明細</h2>
        <div className="space-y-3">
          {data.expenses.map(expense => (
            <div key={expense.id} className="rounded-[1.75rem] bg-white p-4 shadow-lg">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#B85C38]">
                    {expense.date} · {categoryLabel[expense.category]}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#12355B]">
                    {expense.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {money(expense.amount, expense.currency)} · 約 {money(toHKD(expense.amount, expense.currency), "HKD")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    付款人：{expense.paidBy || "未設定"}
                    {expense.notes ? ` · ${expense.notes}` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-xs font-bold text-rose-500"
                  >
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
  onAdd
}: {
  data: TripDataV2;
  update: (d: TripDataV2) => void;
  onAdd: () => void;
}) {
  function deleteItem(id: string) {
    update({ ...data, wishlist: data.wishlist.filter(item => item.id !== id) });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.25rem] bg-gradient-to-br from-[#B85C38] to-[#12355B] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/70">Shopping List</p>
            <h2 className="mt-1 text-3xl font-black">旅行購物清單</h2>
            <p className="mt-2 text-sm text-white/70">
              想買、手信、門票、重要準備都可以放在這裡。
            </p>
          </div>

          <button
            onClick={onAdd}
            className="rounded-full bg-white px-4 py-3 text-sm font-black text-[#12355B]"
          >
            ＋新增
          </button>
        </div>
      </section>

      <div className="grid gap-4">
        {data.wishlist.length === 0 && (
          <EmptyCard
            icon="🛍"
            title="未有購物清單"
            text="新增你想買的手信、用品或門票。"
          />
        )}

        {data.wishlist.map(item => (
          <ShoppingCard key={item.id} item={item} onDelete={() => deleteItem(item.id)} />
        ))}
      </div>
    </div>
  );
}

function ShoppingCard({ item, onDelete }: { item: WishlistItem; onDelete: () => void }) {
  return (
    <article className="rounded-[2rem] bg-white p-5 shadow-xl">
      <div className="flex gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-[#F7EFE5] text-3xl">
          🛍
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#B85C38]">
                {item.city || "未設定城市"} · {item.priority}
              </p>
              <h3 className="mt-1 text-xl font-black text-[#12355B]">
                {item.placeName}
              </h3>
            </div>

            <button onClick={onDelete} className="text-sm font-bold text-rose-500">
              刪除
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-500">{item.notes || item.address}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#D6A84F]/20 px-3 py-1 text-xs font-black text-[#8A650C]">
              {money(item.estimatedCost, item.currency)}
            </span>
            <span className="rounded-full bg-[#EAF2F4] px-3 py-1 text-xs font-black text-[#12355B]">
              {item.category}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoPage({ data, update }: { data: TripDataV2; update: (d: TripDataV2) => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.25rem] bg-[#12355B] p-6 text-white shadow-2xl">
        <p className="text-sm font-bold text-white/70">Travel Vault</p>
        <h2 className="mt-1 text-3xl font-black">旅行資訊庫</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          住宿、交通、文件、緊急資料同設定集中放在這裡。
        </p>
      </section>

      <InfoSection title="住宿" icon="🏨">
        {data.accommodations.map(stay => (
          <InfoCard
            key={stay.id}
            title={stay.name}
            subtitle={`${stay.city} · ${stay.checkInDate} → ${stay.checkOutDate}`}
            text={`${stay.address} · ${money(stay.totalCost, stay.currency)} · ${stay.nights} 晚`}
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

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-[#12355B]">資料設定</h2>
        <p className="mt-2 text-sm text-slate-500">
          所有資料目前儲存在這部 iPhone 的 localStorage。
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => update(resetTripData() as TripDataV2)}
            className="rounded-full bg-[#F7EFE5] px-4 py-3 text-sm font-black text-[#12355B]"
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
      <h2 className="mb-3 text-2xl font-black text-[#12355B]">
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
    <article className="rounded-[1.75rem] bg-white p-4 shadow-lg">
      <p className="text-xs font-black text-[#B85C38]">{subtitle}</p>
      <h3 className="mt-1 text-lg font-black text-[#12355B]">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </article>
  );
}

function DocumentCard({ doc }: { doc: DocumentItem }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-4 shadow-lg">
      <p className="text-xs font-black text-[#B85C38]">
        {doc.date} · {doc.relatedCity}
      </p>
      <h3 className="mt-1 text-lg font-black text-[#12355B]">{doc.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{doc.notes}</p>

      {doc.link && (
        <a
          href={doc.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-full bg-[#12355B] px-3 py-2 text-xs font-black text-white"
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
    <nav className="safe-bottom fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="grid grid-cols-5 gap-1 rounded-[2rem] border border-white/70 bg-white/85 p-2 shadow-2xl backdrop-blur-xl">
        {tabs.map(tab => {
          const active = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-3xl px-2 py-3 text-center text-xs font-black transition ${
                active
                  ? "bg-[#12355B] text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-100"
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
    <div className="rounded-[2rem] bg-white p-6 text-center shadow-xl">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-xl font-black text-[#12355B]">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
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
      id: initialItem?.id || uid("itin"),
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
      googleMapsLink,
      completed: initialItem?.completed || false
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
  data,
  onClose,
  onSave
}: {
  data: TripDataV2;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(data.trip.startDate);
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("EUR");
  const [paidBy, setPaidBy] = useState(data.trip.travelers[0] || "Chris");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!title.trim()) return;

    onSave({
      id: uid("exp"),
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
    <Modal title="新增支出" onClose={onClose}>
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
      <PrimaryButton onClick={submit}>儲存支出</PrimaryButton>
    </Modal>
  );
}

function AddShoppingModal({
  data,
  onClose,
  onSave
}: {
  data: TripDataV2;
  onClose: () => void;
  onSave: (item: WishlistItem) => void;
}) {
  const [placeName, setPlaceName] = useState("");
  const [city, setCity] = useState("Vienna");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!placeName.trim()) return;

    onSave({
      id: uid("wish"),
      placeName,
      city,
      category: "Shopping",
      priority: "Nice to Go",
      address: "",
      estimatedCost: Number(estimatedCost || 0),
      currency,
      estimatedDuration: "",
      notes,
      googleMapsLink: ""
    });
  }

  return (
    <Modal title="新增購物項目" onClose={onClose}>
      <Field label="名稱" value={placeName} setValue={setPlaceName} />
      <Field label="城市" value={city} setValue={setCity} />
      <Field label="預算" type="number" value={estimatedCost} setValue={setEstimatedCost} />
      <Select
        label="幣別"
        value={currency}
        options={["EUR", "HKD", "CAD", "CZK", "HUF", "USD"]}
        setValue={setCurrency}
      />
      <TextArea label="備註" value={notes} setValue={setNotes} />
      <PrimaryButton onClick={submit}>儲存項目</PrimaryButton>
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
      <div className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#12355B]">{title}</h2>

          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl font-black"
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
      <span className="text-sm font-black text-slate-600">{label}</span>

      <input
        type={type}
        value={value}
        onChange={event => setValue(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:border-[#12355B]"
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
      <span className="text-sm font-black text-slate-600">{label}</span>

      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:border-[#12355B]"
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
      <span className="text-sm font-black text-slate-600">{label}</span>

      <select
        value={value}
        onChange={event => setValue(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:border-[#12355B]"
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
      className="w-full rounded-2xl bg-[#12355B] px-5 py-4 text-base font-black text-white shadow-lg"
    >
      {children}
    </button>
  );
}

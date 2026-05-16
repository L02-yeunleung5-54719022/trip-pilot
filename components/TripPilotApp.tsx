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

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(amount: number, currency = "HKD") {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}`;
}
f
  unction parseDateKey(date: string) {
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

  return result;
}

function getItemIcon(title: string, notes = "") {
  const text = `${title} ${notes}`.toLowerCase();

  if (text.includes("flight") || text.includes("airport") || text.includes("arrive")) return "✈️";
  if (text.includes("train") || text.includes("station")) return "🚆";
  if (text.includes("hotel") || text.includes("airbnb") || text.includes("check")) return "🏨";
  if (text.includes("bath") || text.includes("museum") || text.includes("old town")) return "🏰";
  if (text.includes("dinner") || text.includes("lunch") || text.includes("food")) return "🍽";
  if (text.includes("shopping")) return "🛍";
  return "📍";
}

function euroCity(date: string, data: TripData) {
  const d = new Date(date).getTime();

  for (const stay of data.accommodations) {
    const start = new Date(stay.checkInDate).getTime();
    const end = new Date(stay.checkOutDate).getTime();
    if (d >= start && d <= end) return stay.city;
  }

  return "Central Europe";
}

export default function TripPilotApp() {
  const [data, setData] = useState<TripData | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("trip");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddShopping, setShowAddShopping] = useState(false);

  useEffect(() => {
    const loaded = loadTripData();
    setData(loaded);
    setSelectedDate(loaded.trip.startDate);
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

  const update = (next: TripData) => setData(next);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7EFE5] via-[#EAF2F4] to-white pb-28 text-[#172033]">
      <div className="mx-auto max-w-md px-4 pt-4">
        <TopBar />
        {activeTab === "trip" && (
          <TripHome
            data={data}
            update={update}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAdd={() => setShowAddItinerary(true)}
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
        <AddItineraryModal
          data={data}
          selectedDate={selectedDate}
          onClose={() => setShowAddItinerary(false)}
          onSave={item => {
            update({ ...data, itinerary: [...data.itinerary, item] });
            setShowAddItinerary(false);
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
          TripPilot
        </p>
        <h1 className="text-xl font-black text-[#12355B]">中歐旅行助手</h1>
      </div>
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-xl shadow-lg">
        🧳
      </div>
    </div>
  );
}

function TripHero({ data }: { data: TripData }) {
  const totalAccommodation = data.accommodations.reduce((sum, x) => sum + x.totalCost, 0);
  const days =
    Math.ceil(
      (new Date(data.trip.endDate).getTime() - new Date(data.trip.startDate).getTime()) /
        86400000
    ) + 1;

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] bg-[#12355B] p-6 text-white shadow-2xl">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#D6A84F]/20" />
      <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-white/70">Central Europe</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">
              2026
              <br />
              中歐之旅
            </h2>
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
          <HeroStat label="住宿" value={money(totalAccommodation, data.trip.mainCurrency).replace("HKD ", "$")} />
        </div>
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
  onAdd
}: {
  data: TripData;
  update: (d: TripData) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  onAdd: () => void;
}) {
  const dates = useMemo(() => getDates(data.trip.startDate, data.trip.endDate), [data]);
  const dayItems = data.itinerary
    .filter(item => item.date === selectedDate)
    .sort((a, b) => timeBlocks.indexOf(a.timeBlock) - timeBlocks.indexOf(b.timeBlock));

  const city = euroCity(selectedDate, data);

  function toggleComplete(id: string) {
    update({
      ...data,
      itinerary: data.itinerary.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  }

  function deleteItem(id: string) {
    update({
      ...data,
      itinerary: data.itinerary.filter(item => item.id !== id)
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

      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#B85C38]">今日城市</p>
            <h2 className="text-2xl font-black text-[#12355B]">{city}</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl">🌤</p>
            <p className="text-sm font-bold text-slate-500">18° · 晴時多雲</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniInfo label="行程" value={`${dayItems.length} 個`} />
          <MiniInfo label="交通" value="步行/地鐵" />
          <MiniInfo label="預算" value="HKD" />
        </div>
      </section>

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

          {dayItems.map(item => (
            <TimelineCard
              key={item.id}
              item={item}
              onToggle={() => toggleComplete(item.id)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      </section>
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
        <button className="min-w-20 rounded-3xl bg-white p-4 text-center shadow-lg">
          <p className="text-xs font-bold text-slate-400">行前</p>
          <p className="mt-1 text-lg font-black text-[#B85C38]">清單</p>
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
  onToggle,
  onDelete
}: {
  item: ItineraryItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const icon = getItemIcon(item.title, item.notes);

  return (
    <article className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-xl">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EAF2F4] text-2xl">
            {icon}
          </div>
          <div className="mt-2 h-full w-px bg-slate-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-[#B85C38]">
                {timeBlockLabel[item.timeBlock]}
              </p>
              <h3 className="mt-1 text-xl font-black text-[#12355B]">{item.title}</h3>
            </div>

            <button
              onClick={onToggle}
              className={`rounded-full px-3 py-1 text-xs font-black ${
                item.completed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#F7EFE5] text-slate-500"
              }`}
            >
              {item.completed ? "完成" : "未完成"}
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
                className="rounded-full bg-[#12355B] px-3 py-1 text-xs font-black text-white"
              >
                開啟地圖
              </a>
            )}

            <button
              onClick={onDelete}
              className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MapPage({ data, selectedDate }: { data: TripData; selectedDate: string }) {
  const places = [
    ...data.itinerary.filter(item => item.address),
    ...data.accommodations.map(stay => ({
      id: stay.id,
      title: stay.name,
      city: stay.city,
      address: stay.address,
      googleMapsLink: "",
      notes: `${stay.checkInDate} → ${stay.checkOutDate}`
    }))
  ];

  const todayPlaces = data.itinerary.filter(
    item => item.date === selectedDate && item.address
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2.25rem] bg-[#12355B] text-white shadow-2xl">
        <div className="relative h-56 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,168,79,0.45),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#12355B,#0B1F36)]" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-white/70">Map Center</p>
            <h2 className="mt-1 text-3xl font-black">中歐地圖中心</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              查看今日景點、住宿位置同常用 Google Maps 導航。
            </p>
          </div>

          <div className="absolute bottom-5 right-5 text-6xl opacity-80">🗺</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black text-[#12355B]">今日地點</h2>
        <div className="space-y-3">
          {todayPlaces.length === 0 && (
            <EmptyCard icon="📍" title="今日未有地址" text="在行程加入地址後，會顯示在這裡。" />
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
          {places.slice(0, 12).map(place => (
            <PlaceCard
              key={place.id}
              title={place.title}
              city={place.city}
              address={place.address}
              link={"googleMapsLink" in place ? place.googleMapsLink : ""}
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
  data: TripData;
  update: (d: TripData) => void;
  onAdd: () => void;
}) {
  const total = data.expenses.reduce((sum, x) => sum + x.amount, 0);
  const accommodation = data.expenses
    .filter(x => x.category === "Accommodation")
    .reduce((sum, x) => sum + x.amount, 0);
  const daily = total / 13;

  const byCategory = expenseCategories.map(category => ({
    category,
    amount: data.expenses
      .filter(x => x.category === category)
      .reduce((sum, x) => sum + x.amount, 0)
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
            <h2 className="mt-1 text-4xl font-black">{money(total, data.trip.mainCurrency)}</h2>
          </div>
          <button
            onClick={onAdd}
            className="rounded-full bg-white px-4 py-3 text-sm font-black text-[#12355B]"
          >
            ＋記一筆
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <BudgetMini label="住宿" value={money(accommodation, data.trip.mainCurrency)} />
          <BudgetMini label="日均" value={money(daily, data.trip.mainCurrency)} />
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-[#12355B]">分類支出</h2>
        <div className="mt-4 space-y-4">
          {byCategory.map(row => (
            <div key={row.category}>
              <div className="flex justify-between text-sm font-black">
                <span>{categoryLabel[row.category]}</span>
                <span>{money(row.amount, data.trip.mainCurrency)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#D6A84F]"
                  style={{ width: `${total ? Math.min((row.amount / total) * 100, 100) : 0}%` }}
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
                  <h3 className="mt-1 text-lg font-black text-[#12355B]">{expense.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    付款人：{expense.paidBy || "未設定"} {expense.notes ? `· ${expense.notes}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#12355B]">{money(expense.amount, expense.currency)}</p>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="mt-2 text-xs font-bold text-rose-500"
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
  data: TripData;
  update: (d: TripData) => void;
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
          <EmptyCard icon="🛍" title="未有購物清單" text="新增你想買的手信、用品或門票。" />
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
              <h3 className="mt-1 text-xl font-black text-[#12355B]">{item.placeName}</h3>
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

function InfoPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
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
            subtitle={`${item.date} · ${item.transportType}`}
            text={`${item.departureStation || "未設定"} → ${item.arrivalStation || "未設定"} · ${
              item.confirmed ? "已確認" : "未確認"
            }`}
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
            onClick={() => update(resetTripData())}
            className="rounded-full bg-[#F7EFE5] px-4 py-3 text-sm font-black text-[#12355B]"
          >
            重設範例資料
          </button>
          <button
            onClick={() => {
              clearTripData();
              update(resetTripData());
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

function AddItineraryModal({
  data,
  selectedDate,
  onClose,
  onSave
}: {
  data: TripData;
  selectedDate: string;
  onClose: () => void;
  onSave: (item: ItineraryItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState(euroCity(selectedDate, data));
  const [date, setDate] = useState(selectedDate);
  const [timeBlock, setTimeBlock] = useState<TimeBlock>("Morning");
  const [address, setAddress] = useState("");
  const [cost, setCost] = useState("0");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!title.trim()) return;

    onSave({
      id: uid("itin"),
      title,
      city,
      date,
      timeBlock,
      address,
      notes,
      estimatedCost: Number(cost || 0),
      currency: data.trip.mainCurrency,
      googleMapsLink: "",
      completed: false
    });
  }

  return (
    <Modal title="新增行程" onClose={onClose}>
      <Field label="標題" value={title} setValue={setTitle} />
      <Field label="城市" value={city} setValue={setCity} />
      <Field label="日期" type="date" value={date} setValue={setDate} />
      <Select
        label="時段"
        value={timeBlock}
        options={timeBlocks}
        labels={timeBlockLabel}
        setValue={v => setTimeBlock(v as TimeBlock)}
      />
      <Field label="地址" value={address} setValue={setAddress} />
      <Field label="費用" type="number" value={cost} setValue={setCost} />
      <TextArea label="備註" value={notes} setValue={setNotes} />
      <PrimaryButton onClick={submit}>儲存行程</PrimaryButton>
    </Modal>
  );
}

function AddExpenseModal({
  data,
  onClose,
  onSave
}: {
  data: TripData;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(data.trip.startDate);
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [amount, setAmount] = useState("0");
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
      currency: data.trip.mainCurrency,
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
        setValue={v => setCategory(v as ExpenseCategory)}
      />
      <Field label="金額" type="number" value={amount} setValue={setAmount} />
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
  data: TripData;
  onClose: () => void;
  onSave: (item: WishlistItem) => void;
}) {
  const [placeName, setPlaceName] = useState("");
  const [city, setCity] = useState("Vienna");
  const [estimatedCost, setEstimatedCost] = useState("0");
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
      currency: data.trip.mainCurrency,
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
        onChange={e => setValue(e.target.value)}
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
        onChange={e => setValue(e.target.value)}
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
        onChange={e => setValue(e.target.value)}
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

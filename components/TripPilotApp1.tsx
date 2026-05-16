"use client";

import { useEffect, useMemo, useState } from "react";
import { clearTripData, loadTripData, resetTripData, saveTripData } from "@/lib/storage";
import type {
  Accommodation,
  AccommodationType,
  DocumentItem,
  DocumentType,
  Expense,
  ExpenseCategory,
  ItineraryItem,
  TimeBlock,
  Transport,
  TransportType,
  TripData,
  WishlistCategory,
  WishlistItem,
  WishlistPriority
} from "@/lib/types";

type Page =
  | "Dashboard"
  | "Itinerary"
  | "Accommodation"
  | "Transport"
  | "Budget"
  | "Wishlist"
  | "Documents"
  | "Settings";

const pages: { key: Page; icon: string }[] = [
  { key: "Dashboard", icon: "🏠" },
  { key: "Itinerary", icon: "🗓️" },
  { key: "Accommodation", icon: "🏨" },
  { key: "Transport", icon: "🚆" },
  { key: "Budget", icon: "💰" },
  { key: "Wishlist", icon: "⭐" },
  { key: "Documents", icon: "📄" },
  { key: "Settings", icon: "⚙️" }
];

const timeBlocks: TimeBlock[] = ["Morning", "Afternoon", "Evening"];
const accommodationTypes: AccommodationType[] = ["Hotel", "Airbnb", "Hostel", "Other"];
const transportTypes: TransportType[] = ["Train", "Flight", "Bus", "Car", "Other"];
const expenseCategories: ExpenseCategory[] = [
  "Accommodation",
  "Transport",
  "Food",
  "Attractions",
  "Shopping",
  "Other"
];
const wishlistCategories: WishlistCategory[] = [
  "Attraction",
  "Restaurant",
  "Cafe",
  "Bar",
  "Museum",
  "Shopping",
  "Photo Spot",
  "Other"
];
const priorities: WishlistPriority[] = ["Must Go", "Nice to Go", "Backup"];
const documentTypes: DocumentType[] = [
  "Flight Ticket",
  "Train Ticket",
  "Hotel Booking",
  "Insurance",
  "Passport Copy",
  "Attraction Ticket",
  "Other"
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(amount: number, currency = "HKD") {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}`;
}

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";
}

function labelClass() {
  return "space-y-1 text-sm font-medium text-slate-700";
}

function cardClass() {
  return "rounded-3xl border border-slate-100 bg-white p-5 shadow-soft";
}

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  const style =
    variant === "primary"
      ? "bg-cyan-700 text-white hover:bg-cyan-800"
      : variant === "danger"
        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${style}`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
      {children}
    </span>
  );
}

export default function TripPilotApp() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [data, setData] = useState<TripData | null>(null);

  useEffect(() => {
    setData(loadTripData());
  }, []);

  useEffect(() => {
    if (data) saveTripData(data);
  }, [data]);

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className={cardClass()}>
          <h1 className="text-2xl font-bold text-slate-900">TripPilot</h1>
          <p className="mt-2 text-slate-500">Loading your trip...</p>
        </div>
      </main>
    );
  }

  const update = (next: TripData) => setData(next);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <div className="mb-8 rounded-3xl bg-cyan-700 p-5 text-white">
            <div className="text-3xl">✈️</div>
            <h1 className="mt-3 text-2xl font-bold">TripPilot</h1>
            <p className="mt-1 text-sm text-cyan-50">{data.trip.route}</p>
          </div>

          <nav className="space-y-2">
            {pages.map(page => (
              <button
                key={page.key}
                onClick={() => setActivePage(page.key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                  activePage === page.key
                    ? "bg-cyan-50 text-cyan-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{page.icon}</span>
                {page.key}
              </button>
            ))}
          </nav>
        </aside>

        <main className="w-full px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <Header data={data} activePage={activePage} />

          {activePage === "Dashboard" && (
            <Dashboard data={data} goTo={setActivePage} />
          )}

          {activePage === "Itinerary" && (
            <ItineraryPage data={data} update={update} />
          )}

          {activePage === "Accommodation" && (
            <AccommodationPage data={data} update={update} />
          )}

          {activePage === "Transport" && (
            <TransportPage data={data} update={update} />
          )}

          {activePage === "Budget" && (
            <BudgetPage data={data} update={update} />
          )}

          {activePage === "Wishlist" && (
            <WishlistPage data={data} update={update} />
          )}

          {activePage === "Documents" && (
            <DocumentsPage data={data} update={update} />
          )}

          {activePage === "Settings" && (
            <SettingsPage data={data} update={update} />
          )}
        </main>
      </div>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {pages.slice(0, 5).map(page => (
            <button
              key={page.key}
              onClick={() => setActivePage(page.key)}
              className={`rounded-2xl px-2 py-2 text-xs font-semibold ${
                activePage === page.key
                  ? "bg-cyan-50 text-cyan-800"
                  : "text-slate-500"
              }`}
            >
              <div className="text-lg">{page.icon}</div>
              <div className="truncate">{page.key}</div>
            </button>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-3 gap-1">
          {pages.slice(5).map(page => (
            <button
              key={page.key}
              onClick={() => setActivePage(page.key)}
              className={`rounded-2xl px-2 py-2 text-xs font-semibold ${
                activePage === page.key
                  ? "bg-cyan-50 text-cyan-800"
                  : "text-slate-500"
              }`}
            >
              {page.icon} {page.key}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Header({ data, activePage }: { data: TripData; activePage: Page }) {
  return (
    <header className="mb-6">
      <div className="rounded-3xl bg-gradient-to-br from-cyan-700 to-slate-900 p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-cyan-100">{activePage}</p>
        <h1 className="mt-1 text-3xl font-bold">{data.trip.name}</h1>
        <p className="mt-2 text-sm text-cyan-50">
          {data.trip.startDate} → {data.trip.endDate}
        </p>
        <p className="mt-1 text-sm text-cyan-50">{data.trip.route}</p>
      </div>
    </header>
  );
}

function Dashboard({ data, goTo }: { data: TripData; goTo: (page: Page) => void }) {
  const totalAccommodation = data.accommodations.reduce((sum, x) => sum + x.totalCost, 0);
  const totalExpenses = data.expenses.reduce((sum, x) => sum + x.amount, 0);
  const totalDays =
    Math.ceil(
      (new Date(data.trip.endDate).getTime() - new Date(data.trip.startDate).getTime()) /
        86400000
    ) + 1;

  const nextStay = [...data.accommodations].sort((a, b) =>
    a.checkInDate.localeCompare(b.checkInDate)
  )[0];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total days" value={`${totalDays}`} icon="🗓️" />
        <Stat title="Accommodation" value={money(totalAccommodation, data.trip.mainCurrency)} icon="🏨" />
        <Stat title="Expenses" value={money(totalExpenses, data.trip.mainCurrency)} icon="💰" />
        <Stat title="Cities" value="5" icon="🌍" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className={`${cardClass()} xl:col-span-2`}>
          <h2 className="text-xl font-bold">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => goTo("Itinerary")}>Add itinerary item</Button>
            <Button onClick={() => goTo("Accommodation")} variant="secondary">
              Add accommodation
            </Button>
            <Button onClick={() => goTo("Transport")} variant="secondary">
              Add transport
            </Button>
            <Button onClick={() => goTo("Budget")} variant="secondary">
              Add expense
            </Button>
          </div>
        </div>

        <div className={cardClass()}>
          <h2 className="text-xl font-bold">Next stay</h2>
          {nextStay ? (
            <div className="mt-4 space-y-2">
              <Badge>{nextStay.city}</Badge>
              <h3 className="text-lg font-bold">{nextStay.name}</h3>
              <p className="text-sm text-slate-500">
                {nextStay.checkInDate} → {nextStay.checkOutDate}
              </p>
              <p className="text-sm text-slate-600">{nextStay.address}</p>
            </div>
          ) : (
            <p className="mt-3 text-slate-500">No stays yet.</p>
          )}
        </div>
      </div>

      <div className={cardClass()}>
        <h2 className="text-xl font-bold">Upcoming itinerary</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.itinerary.slice(0, 4).map(item => (
            <MiniItem key={item.id} title={item.title} subtitle={`${item.date} · ${item.city}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className={cardClass()}>
      <div className="text-2xl">{icon}</div>
      <p className="mt-3 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function ItineraryPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const empty: ItineraryItem = {
    id: "",
    title: "",
    city: "",
    date: data.trip.startDate,
    timeBlock: "Morning",
    address: "",
    notes: "",
    estimatedCost: 0,
    currency: data.trip.mainCurrency,
    googleMapsLink: "",
    completed: false
  };

  const [form, setForm] = useState<ItineraryItem>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return data.itinerary.reduce<Record<string, ItineraryItem[]>>((acc, item) => {
      acc[item.date] = acc[item.date] || [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [data.itinerary]);

  function save() {
    if (!form.title.trim()) return;

    if (editingId) {
      update({
        ...data,
        itinerary: data.itinerary.map(item =>
          item.id === editingId ? { ...form, id: editingId } : item
        )
      });
    } else {
      update({ ...data, itinerary: [...data.itinerary, { ...form, id: uid("itin") }] });
    }

    setForm(empty);
    setEditingId(null);
  }

  function edit(item: ItineraryItem) {
    setForm(item);
    setEditingId(item.id);
  }

  function remove(id: string) {
    update({ ...data, itinerary: data.itinerary.filter(item => item.id !== id) });
  }

  function toggle(id: string) {
    update({
      ...data,
      itinerary: data.itinerary.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <div className={cardClass()}>
        <h2 className="text-xl font-bold">{editingId ? "Edit itinerary" : "Add itinerary"}</h2>
        <div className="mt-4 space-y-3">
          <TextField label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
          <TextField label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} />
          <TextField label="Date" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
          <SelectField label="Time block" value={form.timeBlock} options={timeBlocks} onChange={v => setForm({ ...form, timeBlock: v as TimeBlock })} />
          <TextField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <TextField label="Estimated cost" type="number" value={String(form.estimatedCost)} onChange={v => setForm({ ...form, estimatedCost: Number(v) })} />
          <TextField label="Google Maps link" value={form.googleMapsLink} onChange={v => setForm({ ...form, googleMapsLink: v })} />
          <TextArea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          <div className="flex gap-2">
            <Button onClick={save}>{editingId ? "Save changes" : "Add item"}</Button>
            {editingId && <Button variant="secondary" onClick={() => { setForm(empty); setEditingId(null); }}>Cancel</Button>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(grouped).length === 0 && <EmptyState text="No itinerary items yet." />}
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, items]) => (
            <div key={date} className={cardClass()}>
              <h2 className="text-xl font-bold">{date}</h2>
              <div className="mt-4 space-y-4">
                {timeBlocks.map(block => {
                  const blockItems = items.filter(item => item.timeBlock === block);
                  return (
                    <div key={block}>
                      <h3 className="mb-2 text-sm font-bold text-cyan-800">{block}</h3>
                      <div className="space-y-2">
                        {blockItems.map(item => (
                          <RecordCard
                            key={item.id}
                            title={item.title}
                            subtitle={`${item.city} · ${money(item.estimatedCost, item.currency)}`}
                            body={item.notes || item.address}
                            badges={[item.completed ? "Done" : "Planned"]}
                            onEdit={() => edit(item)}
                            onDelete={() => remove(item.id)}
                            extra={
                              <Button variant="secondary" onClick={() => toggle(item.id)}>
                                {item.completed ? "Undo" : "Complete"}
                              </Button>
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function AccommodationPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const empty: Accommodation = {
    id: "",
    city: "",
    name: "",
    type: "Hotel",
    checkInDate: data.trip.startDate,
    checkOutDate: data.trip.startDate,
    address: "",
    totalCost: 0,
    currency: data.trip.mainCurrency,
    nights: 1,
    averageCostPerNight: 0,
    bookingReference: "",
    notes: ""
  };

  const [form, setForm] = useState<Accommodation>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const total = data.accommodations.reduce((sum, x) => sum + x.totalCost, 0);

  function save() {
    if (!form.name.trim()) return;

    const normalized = {
      ...form,
      averageCostPerNight: form.nights > 0 ? Number((form.totalCost / form.nights).toFixed(2)) : 0
    };

    if (editingId) {
      update({
        ...data,
        accommodations: data.accommodations.map(item =>
          item.id === editingId ? { ...normalized, id: editingId } : item
        )
      });
    } else {
      update({
        ...data,
        accommodations: [...data.accommodations, { ...normalized, id: uid("acc") }]
      });
    }

    setForm(empty);
    setEditingId(null);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <FormCard title={editingId ? "Edit accommodation" : "Add accommodation"}>
        <TextField label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} />
        <TextField label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <SelectField label="Type" value={form.type} options={accommodationTypes} onChange={v => setForm({ ...form, type: v as AccommodationType })} />
        <TextField label="Check-in" type="date" value={form.checkInDate} onChange={v => setForm({ ...form, checkInDate: v })} />
        <TextField label="Check-out" type="date" value={form.checkOutDate} onChange={v => setForm({ ...form, checkOutDate: v })} />
        <TextField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
        <TextField label="Total cost" type="number" value={String(form.totalCost)} onChange={v => setForm({ ...form, totalCost: Number(v) })} />
        <TextField label="Nights" type="number" value={String(form.nights)} onChange={v => setForm({ ...form, nights: Number(v) })} />
        <TextField label="Booking reference" value={form.bookingReference} onChange={v => setForm({ ...form, bookingReference: v })} />
        <TextArea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
        <Button onClick={save}>{editingId ? "Save changes" : "Add stay"}</Button>
      </FormCard>

      <div className="space-y-4">
        <Stat title="Total accommodation" value={money(total, data.trip.mainCurrency)} icon="🏨" />
        {data.accommodations.map(item => (
          <RecordCard
            key={item.id}
            title={item.name}
            subtitle={`${item.city} · ${item.checkInDate} → ${item.checkOutDate}`}
            body={`${item.address} · ${money(item.totalCost, item.currency)} · ${item.nights} nights · ${money(item.averageCostPerNight, item.currency)}/night`}
            badges={[item.type]}
            onEdit={() => {
              setForm(item);
              setEditingId(item.id);
            }}
            onDelete={() =>
              update({
                ...data,
                accommodations: data.accommodations.filter(x => x.id !== item.id)
              })
            }
          />
        ))}
      </div>
    </section>
  );
}

function TransportPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const empty: Transport = {
    id: "",
    fromCity: "",
    toCity: "",
    date: data.trip.startDate,
    transportType: "Train",
    departureTime: "",
    arrivalTime: "",
    departureStation: "",
    arrivalStation: "",
    cost: 0,
    currency: data.trip.mainCurrency,
    bookingLink: "",
    notes: "",
    confirmed: false
  };

  const [form, setForm] = useState<Transport>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  function save() {
    if (!form.fromCity || !form.toCity) return;

    if (editingId) {
      update({
        ...data,
        transport: data.transport.map(item =>
          item.id === editingId ? { ...form, id: editingId } : item
        )
      });
    } else {
      update({ ...data, transport: [...data.transport, { ...form, id: uid("tr") }] });
    }

    setForm(empty);
    setEditingId(null);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <FormCard title={editingId ? "Edit transport" : "Add transport"}>
        <TextField label="From city" value={form.fromCity} onChange={v => setForm({ ...form, fromCity: v })} />
        <TextField label="To city" value={form.toCity} onChange={v => setForm({ ...form, toCity: v })} />
        <TextField label="Date" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        <SelectField label="Type" value={form.transportType} options={transportTypes} onChange={v => setForm({ ...form, transportType: v as TransportType })} />
        <TextField label="Departure time" type="time" value={form.departureTime} onChange={v => setForm({ ...form, departureTime: v })} />
        <TextField label="Arrival time" type="time" value={form.arrivalTime} onChange={v => setForm({ ...form, arrivalTime: v })} />
        <TextField label="Departure station" value={form.departureStation} onChange={v => setForm({ ...form, departureStation: v })} />
        <TextField label="Arrival station" value={form.arrivalStation} onChange={v => setForm({ ...form, arrivalStation: v })} />
        <TextField label="Cost" type="number" value={String(form.cost)} onChange={v => setForm({ ...form, cost: Number(v) })} />
        <TextField label="Booking link" value={form.bookingLink} onChange={v => setForm({ ...form, bookingLink: v })} />
        <TextArea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.confirmed} onChange={e => setForm({ ...form, confirmed: e.target.checked })} />
          Confirmed
        </label>
        <Button onClick={save}>{editingId ? "Save changes" : "Add transport"}</Button>
      </FormCard>

      <div className="space-y-4">
        {data.transport.map(item => (
          <RecordCard
            key={item.id}
            title={`${item.fromCity} → ${item.toCity}`}
            subtitle={`${item.date} · ${item.transportType}`}
            body={`${item.departureStation || "TBC"} → ${item.arrivalStation || "TBC"} · ${money(item.cost, item.currency)} · ${item.notes}`}
            badges={[item.confirmed ? "Confirmed" : "Not confirmed"]}
            onEdit={() => {
              setForm(item);
              setEditingId(item.id);
            }}
            onDelete={() =>
              update({ ...data, transport: data.transport.filter(x => x.id !== item.id) })
            }
          />
        ))}
      </div>
    </section>
  );
}

function BudgetPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const empty: Expense = {
    id: "",
    date: data.trip.startDate,
    category: "Food",
    title: "",
    amount: 0,
    currency: data.trip.mainCurrency,
    paidBy: data.trip.travelers[0] || "",
    notes: ""
  };

  const [form, setForm] = useState<Expense>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const total = data.expenses.reduce((sum, x) => sum + x.amount, 0);

  const byCategory = expenseCategories.map(category => ({
    category,
    amount: data.expenses
      .filter(x => x.category === category)
      .reduce((sum, x) => sum + x.amount, 0)
  }));

  function save() {
    if (!form.title.trim()) return;

    if (editingId) {
      update({
        ...data,
        expenses: data.expenses.map(item =>
          item.id === editingId ? { ...form, id: editingId } : item
        )
      });
    } else {
      update({ ...data, expenses: [...data.expenses, { ...form, id: uid("exp") }] });
    }

    setForm(empty);
    setEditingId(null);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <FormCard title={editingId ? "Edit expense" : "Add expense"}>
        <TextField label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
        <TextField label="Date" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        <SelectField label="Category" value={form.category} options={expenseCategories} onChange={v => setForm({ ...form, category: v as ExpenseCategory })} />
        <TextField label="Amount" type="number" value={String(form.amount)} onChange={v => setForm({ ...form, amount: Number(v) })} />
        <TextField label="Paid by" value={form.paidBy} onChange={v => setForm({ ...form, paidBy: v })} />
        <TextArea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
        <Button onClick={save}>{editingId ? "Save changes" : "Add expense"}</Button>
      </FormCard>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat title="Total spending" value={money(total, data.trip.mainCurrency)} icon="💰" />
          <Stat title="Daily average" value={money(total / 13, data.trip.mainCurrency)} icon="📊" />
        </div>

        <div className={cardClass()}>
          <h2 className="text-xl font-bold">Category breakdown</h2>
          <div className="mt-4 space-y-3">
            {byCategory.map(row => (
              <div key={row.category}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{row.category}</span>
                  <span>{money(row.amount, data.trip.mainCurrency)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-cyan-700"
                    style={{ width: `${total ? Math.min((row.amount / total) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.expenses.map(item => (
          <RecordCard
            key={item.id}
            title={item.title}
            subtitle={`${item.date} · ${item.category}`}
            body={`${money(item.amount, item.currency)} · Paid by ${item.paidBy} · ${item.notes}`}
            badges={[item.category]}
            onEdit={() => {
              setForm(item);
              setEditingId(item.id);
            }}
            onDelete={() =>
              update({ ...data, expenses: data.expenses.filter(x => x.id !== item.id) })
            }
          />
        ))}
      </div>
    </section>
  );
}

function WishlistPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const empty: WishlistItem = {
    id: "",
    placeName: "",
    city: "",
    category: "Attraction",
    priority: "Nice to Go",
    address: "",
    estimatedCost: 0,
    currency: data.trip.mainCurrency,
    estimatedDuration: "",
    notes: "",
    googleMapsLink: ""
  };

  const [form, setForm] = useState<WishlistItem>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  function save() {
    if (!form.placeName.trim()) return;

    if (editingId) {
      update({
        ...data,
        wishlist: data.wishlist.map(item =>
          item.id === editingId ? { ...form, id: editingId } : item
        )
      });
    } else {
      update({ ...data, wishlist: [...data.wishlist, { ...form, id: uid("wish") }] });
    }

    setForm(empty);
    setEditingId(null);
  }

  function copyToItinerary(item: WishlistItem) {
    const newItem: ItineraryItem = {
      id: uid("itin"),
      title: item.placeName,
      city: item.city,
      date: data.trip.startDate,
      timeBlock: "Morning",
      address: item.address,
      notes: item.notes,
      estimatedCost: item.estimatedCost,
      currency: item.currency,
      googleMapsLink: item.googleMapsLink,
      completed: false
    };

    update({ ...data, itinerary: [...data.itinerary, newItem] });
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <FormCard title={editingId ? "Edit wishlist" : "Add wishlist"}>
        <TextField label="Place name" value={form.placeName} onChange={v => setForm({ ...form, placeName: v })} />
        <TextField label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} />
        <SelectField label="Category" value={form.category} options={wishlistCategories} onChange={v => setForm({ ...form, category: v as WishlistCategory })} />
        <SelectField label="Priority" value={form.priority} options={priorities} onChange={v => setForm({ ...form, priority: v as WishlistPriority })} />
        <TextField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
        <TextField label="Estimated cost" type="number" value={String(form.estimatedCost)} onChange={v => setForm({ ...form, estimatedCost: Number(v) })} />
        <TextField label="Estimated duration" value={form.estimatedDuration} onChange={v => setForm({ ...form, estimatedDuration: v })} />
        <TextField label="Google Maps link" value={form.googleMapsLink} onChange={v => setForm({ ...form, googleMapsLink: v })} />
        <TextArea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
        <Button onClick={save}>{editingId ? "Save changes" : "Add place"}</Button>
      </FormCard>

      <div className="space-y-4">
        {data.wishlist.map(item => (
          <RecordCard
            key={item.id}
            title={item.placeName}
            subtitle={`${item.city} · ${item.estimatedDuration || "Duration TBC"}`}
            body={`${item.address} · ${money(item.estimatedCost, item.currency)} · ${item.notes}`}
            badges={[item.priority, item.category]}
            onEdit={() => {
              setForm(item);
              setEditingId(item.id);
            }}
            onDelete={() =>
              update({ ...data, wishlist: data.wishlist.filter(x => x.id !== item.id) })
            }
            extra={
              <Button variant="secondary" onClick={() => copyToItinerary(item)}>
                Copy to itinerary
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}

function DocumentsPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const empty: DocumentItem = {
    id: "",
    title: "",
    type: "Other",
    relatedCity: "",
    date: data.trip.startDate,
    link: "",
    notes: ""
  };

  const [form, setForm] = useState<DocumentItem>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  function save() {
    if (!form.title.trim()) return;

    if (editingId) {
      update({
        ...data,
        documents: data.documents.map(item =>
          item.id === editingId ? { ...form, id: editingId } : item
        )
      });
    } else {
      update({ ...data, documents: [...data.documents, { ...form, id: uid("doc") }] });
    }

    setForm(empty);
    setEditingId(null);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <FormCard title={editingId ? "Edit document" : "Add document"}>
        <TextField label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
        <SelectField label="Type" value={form.type} options={documentTypes} onChange={v => setForm({ ...form, type: v as DocumentType })} />
        <TextField label="Related city" value={form.relatedCity} onChange={v => setForm({ ...form, relatedCity: v })} />
        <TextField label="Date" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        <TextField label="Link" value={form.link} onChange={v => setForm({ ...form, link: v })} />
        <TextArea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
        <Button onClick={save}>{editingId ? "Save changes" : "Add document"}</Button>
      </FormCard>

      <div className="space-y-4">
        {data.documents.map(item => (
          <RecordCard
            key={item.id}
            title={item.title}
            subtitle={`${item.date} · ${item.relatedCity}`}
            body={`${item.link || "No link yet"} · ${item.notes}`}
            badges={[item.type]}
            onEdit={() => {
              setForm(item);
              setEditingId(item.id);
            }}
            onDelete={() =>
              update({ ...data, documents: data.documents.filter(x => x.id !== item.id) })
            }
          />
        ))}
      </div>
    </section>
  );
}

function SettingsPage({ data, update }: { data: TripData; update: (d: TripData) => void }) {
  const [travellersText, setTravellersText] = useState(data.trip.travelers.join(", "));

  return (
    <section className="max-w-2xl space-y-5">
      <div className={cardClass()}>
        <h2 className="text-xl font-bold">Trip settings</h2>
        <div className="mt-4 space-y-3">
          <TextField label="Trip name" value={data.trip.name} onChange={v => update({ ...data, trip: { ...data.trip, name: v } })} />
          <TextField label="Start date" type="date" value={data.trip.startDate} onChange={v => update({ ...data, trip: { ...data.trip, startDate: v } })} />
          <TextField label="End date" type="date" value={data.trip.endDate} onChange={v => update({ ...data, trip: { ...data.trip, endDate: v } })} />
          <TextField label="Route" value={data.trip.route} onChange={v => update({ ...data, trip: { ...data.trip, route: v } })} />
          <TextField label="Main currency" value={data.trip.mainCurrency} onChange={v => update({ ...data, trip: { ...data.trip, mainCurrency: v } })} />
          <TextField
            label="Travelers, comma separated"
            value={travellersText}
            onChange={v => {
              setTravellersText(v);
              update({
                ...data,
                trip: {
                  ...data.trip,
                  travelers: v.split(",").map(x => x.trim()).filter(Boolean)
                }
              });
            }}
          />
        </div>
      </div>

      <div className={cardClass()}>
        <h2 className="text-xl font-bold">Data controls</h2>
        <p className="mt-2 text-sm text-slate-500">
          Data is saved locally on this device through localStorage.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => update(resetTripData())}>
            Reset seed data
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clearTripData();
              update(resetTripData());
            }}
          >
            Clear all data
          </Button>
        </div>
      </div>
    </section>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardClass()}>
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className={labelClass()}>
      <span>{label}</span>
      <input
        className={inputClass()}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={labelClass()}>
      <span>{label}</span>
      <textarea
        className={`${inputClass()} min-h-24`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className={labelClass()}>
      <span>{label}</span>
      <select className={inputClass()} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RecordCard({
  title,
  subtitle,
  body,
  badges,
  onEdit,
  onDelete,
  extra
}: {
  title: string;
  subtitle: string;
  body: string;
  badges: string[];
  onEdit: () => void;
  onDelete: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {badges.map(badge => (
              <Badge key={badge}>{badge}</Badge>
            ))}
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          <p className="mt-2 text-sm text-slate-600">{body}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {extra}
          <Button variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className={cardClass()}>
      <p className="text-slate-500">{text}</p>
    </div>
  );
}

import type { TripData } from "./types";

export const seedData: TripData = {
  trip: {
    id: "trip-2026-europe",
    name: "2026 Europe Trip",
    startDate: "2026-05-19",
    endDate: "2026-05-31",
    route: "Vienna → Prague → Budapest → Bratislava → Vienna",
    mainCurrency: "HKD",
    travelers: ["Chris"]
  },
  itinerary: [
    {
      id: "itin-vienna-arrival",
      title: "Arrive in Vienna and check in",
      city: "Vienna",
      date: "2026-05-19",
      timeBlock: "Afternoon",
      address: "12 Breitenfurter Straße, 1120 Vienna, Austria",
      notes: "Settle in, buy SIM or transport pass, light dinner nearby.",
      estimatedCost: 200,
      currency: "HKD",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "itin-prague-old-town",
      title: "Prague Old Town evening walk",
      city: "Prague",
      date: "2026-05-23",
      timeBlock: "Evening",
      address: "Old Town Square, Prague",
      notes: "Good for sunset, Charles Bridge, street photos.",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "itin-budapest-bath",
      title: "Budapest thermal bath",
      city: "Budapest",
      date: "2026-05-27",
      timeBlock: "Afternoon",
      address: "Budapest",
      notes: "Bring swimwear and check ticket time.",
      estimatedCost: 300,
      currency: "HKD",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "itin-bratislava-old-town",
      title: "Bratislava Old Town walk",
      city: "Bratislava",
      date: "2026-05-29",
      timeBlock: "Evening",
      address: "Bratislava Old Town",
      notes: "Short walking route, dinner and night view.",
      estimatedCost: 150,
      currency: "HKD",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "itin-vienna-final",
      title: "Final night in Vienna",
      city: "Vienna",
      date: "2026-05-30",
      timeBlock: "Evening",
      address: "Donau-City-Straße 3, 1220 Vienna, Austria",
      notes: "Pack luggage and prepare airport route.",
      estimatedCost: 200,
      currency: "HKD",
      googleMapsLink: "",
      completed: false
    }
  ],
  accommodations: [
    {
      id: "acc-vienna-lyf",
      city: "Vienna",
      name: "lyf Schönbrunn Vienna",
      type: "Hotel",
      checkInDate: "2026-05-19",
      checkOutDate: "2026-05-23",
      address: "12 Breitenfurter Straße, 12. Meidling, 1120 Vienna, Austria",
      totalCost: 2700,
      currency: "HKD",
      nights: 4,
      averageCostPerNight: 675,
      bookingReference: "",
      notes: ""
    },
    {
      id: "acc-prague-airbnb",
      city: "Prague",
      name: "Airbnb",
      type: "Airbnb",
      checkInDate: "2026-05-23",
      checkOutDate: "2026-05-26",
      address: "Hellichova 394/7, Prague 1, Prague 118 00, Czech Republic",
      totalCost: 2927.74,
      currency: "HKD",
      nights: 3,
      averageCostPerNight: 975.91,
      bookingReference: "",
      notes: ""
    },
    {
      id: "acc-budapest-airbnb",
      city: "Budapest",
      name: "Airbnb",
      type: "Airbnb",
      checkInDate: "2026-05-26",
      checkOutDate: "2026-05-29",
      address: "Kisfaludy utca 16, 1st floor, Door 7, Budapest, 1082, Hungary",
      totalCost: 2107.51,
      currency: "HKD",
      nights: 3,
      averageCostPerNight: 702.5,
      bookingReference: "",
      notes: ""
    },
    {
      id: "acc-bratislava-airbnb",
      city: "Bratislava",
      name: "Airbnb",
      type: "Airbnb",
      checkInDate: "2026-05-29",
      checkOutDate: "2026-05-30",
      address: "Budovateľská 1054, First floor, Bratislava, Bratislavský kraj 821 08, Slovakia",
      totalCost: 576.8,
      currency: "HKD",
      nights: 1,
      averageCostPerNight: 576.8,
      bookingReference: "",
      notes: ""
    },
    {
      id: "acc-vienna-district",
      city: "Vienna",
      name: "District Living",
      type: "Hotel",
      checkInDate: "2026-05-30",
      checkOutDate: "2026-05-31",
      address: "Donau-City-Straße 3, 22. Donaustadt, 1220 Vienna, Austria",
      totalCost: 620,
      currency: "HKD",
      nights: 1,
      averageCostPerNight: 620,
      bookingReference: "",
      notes: ""
    }
  ],
  transport: [
    {
      id: "tr-vienna-prague",
      fromCity: "Vienna",
      toCity: "Prague",
      date: "2026-05-23",
      transportType: "Train",
      departureTime: "",
      arrivalTime: "",
      departureStation: "Vienna",
      arrivalStation: "Prague",
      cost: 0,
      currency: "HKD",
      bookingLink: "",
      notes: "Add train details after booking.",
      confirmed: false
    }
  ],
  expenses: [
    {
      id: "exp-accommodation-total",
      date: "2026-05-19",
      category: "Accommodation",
      title: "Total accommodation",
      amount: 8932.05,
      currency: "HKD",
      paidBy: "Chris",
      notes: "Seed total based on all booked stays."
    }
  ],
  wishlist: [
    {
      id: "wish-votivkirche",
      placeName: "Votivkirche Infinity of Light",
      city: "Vienna",
      category: "Attraction",
      priority: "Must Go",
      address: "Rooseveltplatz, Vienna",
      estimatedCost: 150,
      currency: "HKD",
      estimatedDuration: "1–2 hours",
      notes: "IG-style highlight. Check opening times and tickets.",
      googleMapsLink: ""
    }
  ],
  documents: [
    {
      id: "doc-placeholder",
      title: "Add flight, train and hotel confirmation links here",
      type: "Other",
      relatedCity: "All",
      date: "2026-05-19",
      link: "",
      notes: "Paste booking links or QR code links here."
    }
  ]
};

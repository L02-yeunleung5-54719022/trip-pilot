import type { TripData } from "./types";

export const seedData = {
  trip: {
    id: "trip-2026-europe-birthday",
    name: "維維恩🥰 中歐生日之旅",
    startDate: "2026-05-18",
    endDate: "2026-06-01",
    route: "Vancouver → Frankfurt → Vienna → Prague → Budapest → Bratislava → Vienna → Frankfurt → Vancouver",
    mainCurrency: "HKD",
    travelers: ["Chris", "黃梓甄"]
  },

  accommodations: [
    {
      id: "stay-vienna-lyf",
      city: "Vienna",
      name: "lyf Schönbrunn Vienna",
      address: "12 Breitenfurter Straße, 12. Meidling, 1120 Vienna, Austria",
      checkInDate: "2026-05-19",
      checkOutDate: "2026-05-23",
      nights: 4,
      totalCost: 2700,
      currency: "HKD",
      notes: "維也納第一段住宿｜入住 15:00｜退房 10:00｜HKD 2,700 / 4晚"
    },
    {
      id: "stay-prague-airbnb",
      city: "Prague",
      name: "Prague Airbnb",
      address: "Hellichova 394/7, Prague 1, Prague 118 00, Czech Republic",
      checkInDate: "2026-05-23",
      checkOutDate: "2026-05-26",
      nights: 3,
      totalCost: 2927.74,
      currency: "HKD",
      notes: "布拉格 Airbnb｜入住 15:00｜退房 07:00｜HKD 2,927.74"
    },
    {
      id: "stay-budapest-airbnb",
      city: "Budapest",
      name: "Budapest Airbnb",
      address: "Kisfaludy utca 16, 1st floor, Door 7, Budapest, 1082, Hungary",
      checkInDate: "2026-05-26",
      checkOutDate: "2026-05-29",
      nights: 3,
      totalCost: 2107.51,
      currency: "HKD",
      notes: "布達佩斯 Airbnb｜入住 15:00｜退房 10:00｜HKD 2,107.51"
    },
    {
      id: "stay-bratislava-airbnb",
      city: "Bratislava",
      name: "Bratislava Airbnb",
      address: "Budovateľská 1054, First floor, Bratislava, Bratislavský kraj 821 08, Slovakia",
      checkInDate: "2026-05-29",
      checkOutDate: "2026-05-30",
      nights: 1,
      totalCost: 576.8,
      currency: "HKD",
      notes: "Bratislava Airbnb｜入住 15:00｜退房 10:00｜HKD 576.80"
    },
    {
      id: "stay-vienna-district-living",
      city: "Vienna",
      name: "District Living",
      address: "Donau-City-Straße 3, 22. Donaustadt, 1220 Vienna, Austria",
      checkInDate: "2026-05-30",
      checkOutDate: "2026-05-31",
      nights: 1,
      totalCost: 620,
      currency: "HKD",
      notes: "回程維也納住宿｜入住 15:00｜退房 10:00｜HKD 620"
    }
  ],

  transport: [
    {
      id: "transport-yvr-fra-de2455",
      transportType: "Flight",
      date: "2026-05-18",
      fromCity: "Vancouver",
      toCity: "Frankfurt",
      departureStation: "YVR 溫哥華國際機場",
      arrivalStation: "FRA 法蘭克福機場",
      departureTime: "17:50",
      arrivalTime: "12:45",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "Condor DE2455｜抵達日期：2026-05-19"
    },
    {
      id: "transport-fra-vie-de4345",
      transportType: "Flight",
      date: "2026-05-19",
      fromCity: "Frankfurt",
      toCity: "Vienna",
      departureStation: "FRA 法蘭克福機場",
      arrivalStation: "VIE 維也納機場",
      departureTime: "14:30",
      arrivalTime: "15:50",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "Condor DE4345"
    },
    {
      id: "transport-vienna-prague-train",
      transportType: "Train",
      date: "2026-05-23",
      fromCity: "Vienna",
      toCity: "Prague",
      departureStation: "Vienna",
      arrivalStation: "Prague",
      departureTime: "12:10",
      arrivalTime: "16:23",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "火車｜13:04 轉車一次"
    },
    {
      id: "transport-prague-budapest-train",
      transportType: "Train",
      date: "2026-05-26",
      fromCity: "Prague",
      toCity: "Budapest",
      departureStation: "Prague",
      arrivalStation: "Budapest",
      departureTime: "07:37",
      arrivalTime: "14:28",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "火車"
    },
    {
      id: "transport-budapest-bratislava-bus",
      transportType: "Bus",
      date: "2026-05-29",
      fromCity: "Budapest",
      toCity: "Bratislava",
      departureStation: "Budapest",
      arrivalStation: "Bratislava",
      departureTime: "12:30",
      arrivalTime: "15:10",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "巴士｜座位不能坐在一起"
    },
    {
      id: "transport-bratislava-vienna-train",
      transportType: "Train",
      date: "2026-05-30",
      fromCity: "Bratislava",
      toCity: "Vienna",
      departureStation: "Bratislava",
      arrivalStation: "Vienna",
      departureTime: "12:50",
      arrivalTime: "13:46",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "火車 / App ticket"
    },
    {
      id: "transport-vie-fra-de4348",
      transportType: "Flight",
      date: "2026-05-31",
      fromCity: "Vienna",
      toCity: "Frankfurt",
      departureStation: "VIE 維也納機場",
      arrivalStation: "FRA 法蘭克福機場",
      departureTime: "16:55",
      arrivalTime: "18:15",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "Condor DE4348"
    },
    {
      id: "transport-fra-yvr-final",
      transportType: "Flight",
      date: "2026-06-01",
      fromCity: "Frankfurt",
      toCity: "Vancouver",
      departureStation: "FRA 法蘭克福機場",
      arrivalStation: "YVR 溫哥華國際機場",
      departureTime: "14:25",
      arrivalTime: "15:50",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "回程最後一段｜抵達溫哥華機場"    },
    {
      id: "transport-gf-hkg-doh-qr817",
      transportType: "Flight",
      date: "2026-05-18",
      fromCity: "Hong Kong",
      toCity: "Doha",
      departureStation: "HKG 香港國際機場",
      arrivalStation: "DOH 哈馬德國際機場",
      departureTime: "18:15",
      arrivalTime: "22:15",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "女朋友航班｜Qatar Airways QR817｜Boeing 777-300ER｜飛行時間 9小時｜Doha 轉機 3小時55分"
    },
    {
      id: "transport-gf-doh-vie-qr189",
      transportType: "Flight",
      date: "2026-05-19",
      fromCity: "Doha",
      toCity: "Vienna",
      departureStation: "DOH 哈馬德國際機場",
      arrivalStation: "VIE 維也納國際機場",
      departureTime: "02:10",
      arrivalTime: "08:00",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "女朋友航班｜Qatar Airways QR189｜Boeing 787-8｜飛行時間 6小時50分｜抵達 Vienna"
    },
    {
      id: "transport-gf-vie-doh-qr184",
      transportType: "Flight",
      date: "2026-05-31",
      fromCity: "Vienna",
      toCity: "Doha",
      departureStation: "VIE 維也納國際機場",
      arrivalStation: "DOH 哈馬德國際機場",
      departureTime: "16:05",
      arrivalTime: "22:50",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "女朋友回程航班｜Qatar Airways QR184｜Boeing 787-8｜飛行時間 5小時45分｜Doha 轉機 4小時15分"
    },
    {
      id: "transport-gf-doh-hkg-qr818",
      transportType: "Flight",
      date: "2026-06-01",
      fromCity: "Doha",
      toCity: "Hong Kong",
      departureStation: "DOH 哈馬德國際機場",
      arrivalStation: "HKG 香港國際機場",
      departureTime: "03:05",
      arrivalTime: "16:25",
      cost: 0,
      currency: "HKD",
      confirmed: true,
      notes: "女朋友回程航班｜Qatar Airways QR818｜Airbus A350-1000｜飛行時間 8小時20分｜抵達 Hong Kong"

    }
  ],

  itinerary: [
    {
      id: "it-20260518-yvr-fra",
      title: "出發航班：YVR 溫哥華 → FRA 法蘭克福",
      city: "Vancouver / Frankfurt",
      date: "2026-05-18",
      time: "17:50",
      order: 1,
      timeBlock: "Evening",
      address: "Vancouver International Airport, Richmond, BC, Canada",
      notes: "Condor DE2455｜17:50 起飛｜翌日 12:45 抵達 FRA",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Vancouver%20International%20Airport",
      completed: false
    },
    {
      id: "it-20260519-arrive-fra",
      title: "抵達：FRA 法蘭克福",
      city: "Frankfurt",
      date: "2026-05-19",
      time: "12:45",
      order: 1,
      timeBlock: "Afternoon",
      address: "Frankfurt Airport, 60547 Frankfurt am Main, Germany",
      notes: "DE2455 抵達｜準備轉機去 Vienna",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Frankfurt%20Airport",
      completed: false
    },
    {
      id: "it-20260519-fra-vie",
      title: "轉機航班：FRA 法蘭克福 → VIE 維也納",
      city: "Frankfurt / Vienna",
      date: "2026-05-19",
      time: "14:30",
      order: 2,
      timeBlock: "Afternoon",
      address: "Frankfurt Airport, 60547 Frankfurt am Main, Germany",
      notes: "Condor DE4345｜14:30 → 15:50",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Frankfurt%20Airport",
      completed: false
    },
    {
      id: "it-20260523-vienna-prague-train",
      title: "火車：Vienna → Prague",
      city: "Vienna / Prague",
      date: "2026-05-23",
      time: "12:10",
      order: 1,
      timeBlock: "Afternoon",
      address: "Vienna, Austria",
      notes: "12:10 → 16:23｜13:04 轉車一次",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Vienna%20train%20station",
      completed: false
    },
    {
      id: "it-20260526-prague-budapest-train",
      title: "火車：Prague → Budapest",
      city: "Prague / Budapest",
      date: "2026-05-26",
      time: "07:37",
      order: 1,
      timeBlock: "Morning",
      address: "Prague, Czech Republic",
      notes: "07:37 → 14:28",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Prague%20train%20station",
      completed: false
    },
    {
      id: "it-20260529-budapest-bratislava-bus",
      title: "巴士：Budapest → Bratislava",
      city: "Budapest / Bratislava",
      date: "2026-05-29",
      time: "12:30",
      order: 1,
      timeBlock: "Afternoon",
      address: "Budapest, Hungary",
      notes: "12:30 → 15:10｜座位不能坐在一起",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Budapest%20bus%20station",
      completed: false
    },
    {
      id: "it-20260530-bratislava-vienna-train",
      title: "火車：Bratislava → Vienna",
      city: "Bratislava / Vienna",
      date: "2026-05-30",
      time: "12:50",
      order: 1,
      timeBlock: "Afternoon",
      address: "Bratislava, Slovakia",
      notes: "12:50 → 13:46｜App ticket",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Bratislava%20train%20station",
      completed: false
    },
    {
      id: "it-20260531-vie-fra",
      title: "回程航班：VIE 維也納 → FRA 法蘭克福",
      city: "Vienna / Frankfurt",
      date: "2026-05-31",
      time: "16:55",
      order: 1,
      timeBlock: "Afternoon",
      address: "Vienna International Airport, 1300 Schwechat, Austria",
      notes: "Condor DE4348｜16:55 → 18:15",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Vienna%20International%20Airport",
      completed: false
    },
    {
      id: "it-20260601-fra-yvr",
      title: "回程航班：FRA 法蘭克福 → YVR 溫哥華",
      city: "Frankfurt / Vancouver",
      date: "2026-06-01",
      time: "14:25",
      order: 1,
      timeBlock: "Afternoon",
      address: "Frankfurt Airport, 60547 Frankfurt am Main, Germany",
      notes: "14:25 起飛｜15:50 抵達溫哥華機場",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Frankfurt%20Airport",
      completed: false    },
    {
      id: "it-gf-20260518-hkg-doh",
      title: "女朋友航班：HKG 香港 → DOH 多哈",
      city: "Hong Kong / Doha",
      date: "2026-05-18",
      time: "18:15",
      order: 2,
      timeBlock: "Evening",
      address: "Hong Kong International Airport, Hong Kong",
      notes: "Qatar Airways QR817｜18:15 → 22:15｜飛行時間 9小時｜Doha 轉機 3小時55分",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Hong%20Kong%20International%20Airport",
      completed: false
    },
    {
      id: "it-gf-20260519-doh-vie",
      title: "女朋友航班：DOH 多哈 → VIE 維也納",
      city: "Doha / Vienna",
      date: "2026-05-19",
      time: "02:10",
      order: 0,
      timeBlock: "Morning",
      address: "Hamad International Airport, Doha, Qatar",
      notes: "Qatar Airways QR189｜02:10 → 08:00｜飛行時間 6小時50分｜抵達 Vienna",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Hamad%20International%20Airport%20Doha",
      completed: false
    },
    {
      id: "it-gf-20260531-vie-doh",
      title: "女朋友回程航班：VIE 維也納 → DOH 多哈",
      city: "Vienna / Doha",
      date: "2026-05-31",
      time: "16:05",
      order: 0,
      timeBlock: "Afternoon",
      address: "Vienna International Airport, 1300 Schwechat, Austria",
      notes: "Qatar Airways QR184｜16:05 → 22:50｜飛行時間 5小時45分｜Doha 轉機 4小時15分",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Vienna%20International%20Airport",
      completed: false
    },
    {
      id: "it-gf-20260601-doh-hkg",
      title: "女朋友回程航班：DOH 多哈 → HKG 香港",
      city: "Doha / Hong Kong",
      date: "2026-06-01",
      time: "03:05",
      order: 0,
      timeBlock: "Morning",
      address: "Hamad International Airport, Doha, Qatar",
      notes: "Qatar Airways QR818｜03:05 → 16:25｜飛行時間 8小時20分｜抵達 Hong Kong",
      estimatedCost: 0,
      currency: "HKD",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Hamad%20International%20Airport%20Doha",
      completed: false

    }
  ],

  expenses: [
    {
      id: "expense-vienna-lyf",
      date: "2026-05-19",
      title: "lyf Schönbrunn Vienna 住宿",
      category: "Accommodation",
      amount: 2700,
      currency: "HKD",
      paidBy: "Chris",
      notes: "4晚"
    },
    {
      id: "expense-prague-airbnb",
      date: "2026-05-23",
      title: "Prague Airbnb 住宿",
      category: "Accommodation",
      amount: 2927.74,
      currency: "HKD",
      paidBy: "Chris",
      notes: "3晚"
    },
    {
      id: "expense-budapest-airbnb",
      date: "2026-05-26",
      title: "Budapest Airbnb 住宿",
      category: "Accommodation",
      amount: 2107.51,
      currency: "HKD",
      paidBy: "Chris",
      notes: "3晚"
    },
    {
      id: "expense-bratislava-airbnb",
      date: "2026-05-29",
      title: "Bratislava Airbnb 住宿",
      category: "Accommodation",
      amount: 576.8,
      currency: "HKD",
      paidBy: "Chris",
      notes: "1晚"
    },
    {
      id: "expense-vienna-district-living",
      date: "2026-05-30",
      title: "District Living 住宿",
      category: "Accommodation",
      amount: 620,
      currency: "HKD",
      paidBy: "Chris",
      notes: "1晚"
    }
  ],

  wishlist: [
    {
      id: "wish-vienna",
      title: "Vienna 市中心散步 / 咖啡店",
      city: "Vienna",
      category: "Cafe",
      priority: "Nice to Go",
      address: "",
      notes: "到埗後視乎體力安排",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "wish-prague",
      title: "Prague Old Town / Charles Bridge",
      city: "Prague",
      category: "Photo Spot",
      priority: "Must Go",
      address: "",
      notes: "布拉格夜景 / 生日旅行相位",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "wish-budapest",
      title: "Budapest Parliament / Danube 夜景",
      city: "Budapest",
      category: "Photo Spot",
      priority: "Must Go",
      address: "",
      notes: "多瑙河夜景",
      googleMapsLink: "",
      completed: false
    },
    {
      id: "wish-bratislava",
      title: "Bratislava Old Town",
      city: "Bratislava",
      category: "Attraction",
      priority: "Nice to Go",
      address: "",
      notes: "一晚短停，輕鬆行舊城",
      googleMapsLink: "",
      completed: false
    }
  ],

  documents: [
    {
      id: "doc-flight-yvr-fra",
      title: "Condor DE2455 YVR → FRA",
      documentType: "Flight Ticket",
      date: "2026-05-18",
      relatedCity: "Vancouver / Frankfurt",
      link: "",
      notes: "17:50 → 12:45 +1"
    },
    {
      id: "doc-flight-fra-vie",
      title: "Condor DE4345 FRA → VIE",
      documentType: "Flight Ticket",
      date: "2026-05-19",
      relatedCity: "Frankfurt / Vienna",
      link: "",
      notes: "14:30 → 15:50"
    },
    {
      id: "doc-flight-vie-fra",
      title: "Condor DE4348 VIE → FRA",
      documentType: "Flight Ticket",
      date: "2026-05-31",
      relatedCity: "Vienna / Frankfurt",
      link: "",
      notes: "16:55 → 18:15"
    },
    {
      id: "doc-flight-fra-yvr",
      title: "FRA → YVR 回程航班",
      documentType: "Flight Ticket",
      date: "2026-06-01",
      relatedCity: "Frankfurt / Vancouver",
      link: "",
      notes: "14:25 → 15:50｜抵達溫哥華機場"
    },
    {
      id: "doc-hotels",
      title: "所有住宿確認",
      documentType: "Hotel Booking",
      date: "2026-05-19",
      relatedCity: "Vienna / Prague / Budapest / Bratislava",
      link: "",
      notes: "lyf Schönbrunn Vienna、Prague Airbnb、Budapest Airbnb、Bratislava Airbnb、District Living"
    },
    {
      id: "doc-train-bus",
      title: "火車 / 巴士車票",
      documentType: "Train Ticket",
      date: "2026-05-23",
      relatedCity: "Vienna / Prague / Budapest / Bratislava",
      link: "",
      notes: "Vienna→Prague、Prague→Budapest、Budapest→Bratislava、Bratislava→Vienna"    },
    {
      id: "doc-gf-flight-hkg-doh",
      title: "女朋友 Qatar QR817 HKG → DOH",
      documentType: "Flight Ticket",
      date: "2026-05-18",
      relatedCity: "Hong Kong / Doha",
      link: "",
      notes: "18:15 → 22:15｜Boeing 777-300ER｜Doha 轉機 3小時55分"
    },
    {
      id: "doc-gf-flight-doh-vie",
      title: "女朋友 Qatar QR189 DOH → VIE",
      documentType: "Flight Ticket",
      date: "2026-05-19",
      relatedCity: "Doha / Vienna",
      link: "",
      notes: "02:10 → 08:00｜Boeing 787-8"
    },
    {
      id: "doc-gf-flight-vie-doh",
      title: "女朋友 Qatar QR184 VIE → DOH",
      documentType: "Flight Ticket",
      date: "2026-05-31",
      relatedCity: "Vienna / Doha",
      link: "",
      notes: "16:05 → 22:50｜Doha 轉機 4小時15分"
    },
    {
      id: "doc-gf-flight-doh-hkg",
      title: "女朋友 Qatar QR818 DOH → HKG",
      documentType: "Flight Ticket",
      date: "2026-06-01",
      relatedCity: "Doha / Hong Kong",
      link: "",
      notes: "03:05 → 16:25｜Airbus A350-1000"

    }
  ],

  checklist: [
    {
      id: "check-passport",
      title: "護照",
      category: "Documents",
      completed: false,
      notes: "確認有效期及隨身攜帶"
    },
    {
      id: "check-pr-card",
      title: "加拿大 PR / 身份文件",
      category: "Documents",
      completed: false,
      notes: "回程入境需要"
    },
    {
      id: "check-flight-tickets",
      title: "機票 / 車票截圖離線備份",
      category: "Transport",
      completed: false,
      notes: "Condor、火車、巴士票"
    },
    {
      id: "check-hotel-bookings",
      title: "住宿確認 / Airbnb 地址",
      category: "Documents",
      completed: false,
      notes: "每個城市地址已加入 App"
    },
    {
      id: "check-credit-card",
      title: "信用卡 / 現金 / Apple Pay",
      category: "Money",
      completed: false,
      notes: "準備 EUR / CAD / HKD 參考"
    },
    {
      id: "check-esim",
      title: "eSIM / roaming",
      category: "Other",
      completed: false,
      notes: "出發前安裝並截圖 QR"
    },
    {
      id: "check-power",
      title: "尿袋 / 充電線 / 歐洲插頭",
      category: "Packing",
      completed: false,
      notes: "USB-C、Lightning、相機電池"
    }
  ]
} as unknown as TripData;

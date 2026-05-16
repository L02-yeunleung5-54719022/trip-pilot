export type TimeBlock = "Morning" | "Afternoon" | "Evening";

export type AccommodationType = "Hotel" | "Airbnb" | "Hostel" | "Other";

export type TransportType = "Train" | "Flight" | "Bus" | "Car" | "Other";

export type ExpenseCategory =
  | "Accommodation"
  | "Transport"
  | "Food"
  | "Attractions"
  | "Shopping"
  | "Other";

export type WishlistCategory =
  | "Attraction"
  | "Restaurant"
  | "Cafe"
  | "Bar"
  | "Museum"
  | "Shopping"
  | "Photo Spot"
  | "Other";

export type WishlistPriority = "Must Go" | "Nice to Go" | "Backup";

export type DocumentType =
  | "Flight Ticket"
  | "Train Ticket"
  | "Hotel Booking"
  | "Insurance"
  | "Passport Copy"
  | "Attraction Ticket"
  | "Other";

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  route: string;
  mainCurrency: string;
  travelers: string[];
}

export interface ItineraryItem {
  id: string;
  title: string;
  city: string;
  date: string;
  timeBlock: TimeBlock;
  address: string;
  notes: string;
  estimatedCost: number;
  currency: string;
  googleMapsLink: string;
  completed: boolean;
}

export interface Accommodation {
  id: string;
  city: string;
  name: string;
  type: AccommodationType;
  checkInDate: string;
  checkOutDate: string;
  address: string;
  totalCost: number;
  currency: string;
  nights: number;
  averageCostPerNight: number;
  bookingReference: string;
  notes: string;
}

export interface Transport {
  id: string;
  fromCity: string;
  toCity: string;
  date: string;
  transportType: TransportType;
  departureTime: string;
  arrivalTime: string;
  departureStation: string;
  arrivalStation: string;
  cost: number;
  currency: string;
  bookingLink: string;
  notes: string;
  confirmed: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  currency: string;
  paidBy: string;
  notes: string;
}

export interface WishlistItem {
  id: string;
  placeName: string;
  city: string;
  category: WishlistCategory;
  priority: WishlistPriority;
  address: string;
  estimatedCost: number;
  currency: string;
  estimatedDuration: string;
  notes: string;
  googleMapsLink: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: DocumentType;
  relatedCity: string;
  date: string;
  link: string;
  notes: string;
}

export interface TripData {
  trip: Trip;
  itinerary: ItineraryItem[];
  accommodations: Accommodation[];
  transport: Transport[];
  expenses: Expense[];
  wishlist: WishlistItem[];
  documents: DocumentItem[];
}

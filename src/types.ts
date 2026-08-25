export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  group?: string;
  mediaCount: number;
  status: 'Pending' | 'Complete' | 'Denied';
  eventId: string;
  qrCode?: QrCode;
  avatarUrl?: string;
  customMediaUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  visibility?: 'public' | 'private';
  slug?: string;
  imageUrl?: string;
  registeredAttendees: number;
  maxAttendees?: number;
  defaultTemplateId?: string;
  mediaSourceUrl?: string;
  mediaFolderId?: string;
  urlStrategy?: 'pure-slug' | 'hash' | 'slug-with-id' | 'numeric';
  /**
   * UUID v7 identifier — auto-generated on creation, immutable thereafter.
   * Format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx (36 chars)
   * All QR links encode this UUID regardless of urlStrategy.
   * (Slugs are mutable and numeric IDs are guessable — UUID is the only
   * safe permanent identifier for printed QR codes.)
   */
  urlHash?: string;
  requireAuthForQrScan?: boolean;
  scanPageTemplate?: string | null;
  /** ID of a built-in .hbs template selected without modification */
  scanPageTemplateId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateText {
  id: string; // client-side ID for list management
  content: string;
  size: number;
  positionX: number;
  positionY: number;
}

export interface QrTemplate {
  id: string;
  name: string;
  eventId: string;
  qrPositionX: number;
  qrPositionY: number;
  qrSize: number;
  backgroundImage?: string;
  prefix?: string;
  suffix?: string;
  showNumericIdBelow: boolean;
  numericIdSize?: number;
  textColor: 'black' | 'white';
  customTexts: TemplateText[];
  isDefault: boolean;
  qrCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QrCode {
  id: string;
  eventId: string;
  guestId: string;
  numericId: number;
  qrLink: string;
  redirectLink?: string;
  templateId?: string;
  template?: { id: number; name: string };
  guest?: Guest;
  event?: { id: number; urlHash: string };
  createdAt: string;
}

export interface Media {
  id: string;
  eventId: string;
  guestId?: string;
  url: string;
  type: 'photo' | 'video';
  title?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Activity {
  id: string;
  eventId: string;
  action: string;
  description: string;
  createdAt: string;
  userId?: number;
  userName?: string;
}

export interface EventStatistics {
  eventId: string;
  totalGuests: number;
  totalMedia: number;
  activeQrCodes: number;
  registeredAttendees: number;
}

export interface GlobalStatistics {
  totalEvents: number;
  activeEvents: number;
  totalQrCodes: number;
  totalGuests: number;
  mediaDelivered: number;
}

export interface ApiResponseError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

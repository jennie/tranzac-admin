import type { Avatar } from "#ui/types";

export type UserStatus = "subscribed" | "unsubscribed" | "bounced";

import type { ObjectId } from "mongoose";
import type { JWTPayload } from "jose";

export interface AuthPayload extends JWTPayload {
  email?: string;
}

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  preferences: object;
  createdAt: string;
  updatedAt: string;
}

export interface Mail {
  id: number;
  unread?: boolean;
  from: User;
  subject: string;
  body: string;
  date: string;
}
export interface Member {
  name: string;
  username: string;
  role: "member" | "owner";
  avatar: Avatar;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membership: {
    type: string;
    status: string;
    startDate: Date;
    endDate: Date;
  };
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  notes: string;
}

export interface Notification {
  id: number;
  unread?: boolean;
  sender: User;
  body: string;
  date: string;
}

export type Period = "daily" | "weekly" | "monthly";

export interface Range {
  start: Date;
  end: Date;
}

export interface RentalSlotRecord {
  _createdAt: string;
  _editingUrl?: string;
  _firstPublishedAt?: string;
  _isValid: boolean;
  _modelApiKey: string;
  _publicationScheduledAt?: string;
  _publishedAt?: string;
  _status: string;
  _unpublishingScheduledAt?: string;
  _updatedAt: string;
  allAges: boolean;
  description?: string;
  doorsTime?: TimeRecord;
  endTime: TimeRecord;
  eventType?: string;
  expectedAttendance?: number;
  featuredImage?: FileField;
  id: string;
  loadInTime?: TimeRecord;
  loadOutTime?: TimeRecord;
  private: boolean;
  resources?: any; // Consider defining a more specific type if the structure is known
  rooms: RoomRecord[];
  soundCheckTime?: TimeRecord;
  startTime: TimeRecord;
  title?: string;
}

export interface RentalDateRecord {
  _createdAt: string;
  _editingUrl?: string;
  _firstPublishedAt?: string;
  _isValid: boolean;
  _modelApiKey: string;
  _publicationScheduledAt?: string;
  _publishedAt?: string;
  _status: string;
  _unpublishingScheduledAt?: string;
  _updatedAt: string;
  date: string;
  id: string;
  slots: RentalSlotRecord[];
}

export interface RentalRecord {
  _allReferencingEvents: (args: {
    fallbackLocales?: SiteLocale[];
    filter?: any; // Define a more specific type if the filter structure is known
    first?: number;
    locale?: SiteLocale;
    orderBy?: string[];
    skip?: number;
    through?: any; // Define a more specific type if the through structure is known
  }) => Promise<EventRecord[]>;

  _allReferencingEventsMeta: (args: {
    filter?: any; // Define a more specific type if the filter structure is known
    locale?: SiteLocale;
    through?: any; // Define a more specific type if the through structure is known
  }) => Promise<{
    count: number;
  }>;

  _createdAt: string;
  _editingUrl?: string;
  _firstPublishedAt?: string;
  _isValid: boolean;
  _modelApiKey: string;
  _publicationScheduledAt?: string;
  _publishedAt?: string;
  _status: string;
  _unpublishingScheduledAt?: string;
  _updatedAt: string;
  dates: RentalDateRecord[];
  generateEvents: boolean;
  id: string;
  inquiryStatus?: string;
  internalNotes?: string;
  organization?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactPronouns?: string;
}

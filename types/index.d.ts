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

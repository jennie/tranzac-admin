import { defineMongooseModel } from "#nuxt/mongoose";

export const MemberSchema = defineMongooseModel<Member>({
  name: "Member",
  schema: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    loginToken: {
      type: String,
    },
    loginTokenExpires: {
      type: Date,
    },
    membership: {
      status: {
        type: String,
        enum: ["active", "inactive", "pending"],
        default: "pending",
      },
      type: {
        type: String,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      paymentMethod: {
        type: String,
        enum: ["stripe", "paypal", "other"],
      },
      stripeCustomerId: {
        type: String,
      },
      paypalCustomerId: {
        type: String,
      },
      paypalSubscriptionId: {
        type: String,
      },
    },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
    },
    notes: {
      type: String,
    },
    roles: [
      {
        role: String,
        datoRecordId: String,
      },
    ],
  },
  options: {
    timestamps: true,
  },
});

interface Member {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membership: {
    status: "active" | "inactive" | "pending";
    type?: string;
    startDate?: Date;
    endDate?: Date;
    paymentMethod?: "stripe" | "paypal";
    stripeCustomerId?: string;
    paypalCustomerId?: string;
    paypalSubscriptionId?: string;
  };
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

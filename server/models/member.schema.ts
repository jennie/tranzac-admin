import { defineMongooseModel } from "#nuxt/mongoose";

export const MemberSchema = defineMongooseModel({
  name: "Member",
  schema: {
    firstName: {
      type: "string",
    },
    lastName: {
      type: "string",
    },
    email: {
      type: "string",
      unique: true,
    },
    phone: {
      type: "string",
    },
    membership: {
      type: {
        type: "string",
      },
      status: {
        type: "string",
      },
      startDate: {
        type: "Date",
      },
      endDate: {
        type: "Date",
      },
    },
    address: {
      street: {
        type: "string",
      },
      city: {
        type: "string",
      },
      province: {
        type: "string",
      },
      postalCode: {
        type: "string",
      },
    },
    notes: {
      type: "string",
    },
  },
});

// server/models/costEstimate.schema.ts
import mongoose from "mongoose";

const CostEstimateVersionSchema = new mongoose.Schema({
  version: Number,
  costEstimates: [
    {
      id: String,
      date: Date,
      roomSlug: String,
      start: Date,
      end: Date,
      basePrice: Number,
      daytimeHours: Number,
      eveningHours: Number,
      daytimePrice: Number,
      eveningPrice: Number,
      perSlotCosts: [
        {
          description: String,
          cost: { type: Number, default: null },
        },
      ],
      additionalCosts: [
        {
          description: String,
          cost: { type: Number, default: null },
        },
      ],
      totalCost: Number,
    },
  ],
  totalCost: Number,
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const CostEstimateSchema = new mongoose.Schema({
  rentalRequestId: {
    type: String,
    required: true,
  },
  versions: [CostEstimateVersionSchema],
  currentVersion: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ["draft", "sent", "approved", "rejected"],
    default: "draft",
  },
  stripeEstimateId: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

export const CostEstimate = mongoose.model("CostEstimate", CostEstimateSchema);

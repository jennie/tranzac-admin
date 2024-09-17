import mongoose from "mongoose";

const RoomMappingSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  filter: { type: Boolean, required: true }, // Ensure filter is a boolean
});

const RoomMapping =
  mongoose.models.RoomMapping ||
  mongoose.model("RoomMapping", RoomMappingSchema);
export default RoomMapping;

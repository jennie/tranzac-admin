import { ensureConnection } from "../utils/mongoose";
import RoomMapping from "../models/roomMapping.schema";

export default defineEventHandler(async (event) => {
  await ensureConnection(); // Ensure MongoDB connection

  try {
    const allRooms = await RoomMapping.find().lean(); // Fetch all rooms

    // Filter rooms where filter field is set to false
    const filteredRooms = allRooms.filter((room) => room.filter === false);

    const response = { success: true, data: allRooms, filteredRooms };

    return response; // Return both all rooms and filtered ones
  } catch (error) {
    console.error("Error fetching room mapping:", error);
    return { success: false, error: "Failed to fetch room mapping." };
  }
});

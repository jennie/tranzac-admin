// /server/api/members/search/index.get.ts
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  console.log("Handler called"); // Debugging log
  const { q } = getQuery(event);
  console.log("Search query:", q); // Debugging log
  if (!q) {
    console.log("No query provided"); // Debugging log
    return [];
  }

  const mongooseInstance = await ensureConnection();
  console.log("Mongoose connection established"); // Debugging log

  const Member =
    mongooseInstance.models.Member ||
    mongooseInstance.model("Member", MemberSchema);

  try {
    const members = await Member.find({
      // roles: { $elemMatch: { role: "resident" } },
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("firstName lastName email")
      .lean();

    console.log("Search results:", members); // Debugging log

    return members.map((m) => ({
      value: m._id,
      label: `${m.firstName} ${m.lastName}`,
      email: m.email,
    }));
  } catch (error) {
    console.error("Search error:", error); // Debugging log
    throw createError({
      statusCode: 500,
      message: "Failed to search residents",
    });
  }
});

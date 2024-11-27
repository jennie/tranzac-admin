// /server/api/members/search/index.get.ts
import { ensureConnection } from "~/server/utils/mongoose";
import { MemberSchema } from "~/server/models/member.schema"; // Adjust the import path as necessary

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
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } }, // Add this line
      ],
    })
      .select("firstName lastName email")
      .lean();

    return members.map((m) => ({
      value: m._id,
      label: `${m.firstName} ${m.lastName}`,
      email: m.email,
    }));
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to search residents",
    });
  }
});

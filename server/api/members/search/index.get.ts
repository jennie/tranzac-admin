// /server/api/members/search/index.get.ts
import { ensureConnection } from "~/server/utils/mongoose";
import { MemberSchema } from "~/server/models/member.schema"; // Adjust the import path as necessary

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);
  if (!q || typeof q !== "string") return [];

  const mongooseInstance = await ensureConnection();
  const Member =
    mongooseInstance.models.Member ||
    mongooseInstance.model("Member", MemberSchema);

  try {
    // Split search terms and escape special regex characters
    const searchTerms = q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (!searchTerms.length) return [];

    // Create regex pattern that matches all terms in any order
    const searchPattern = searchTerms.map((term) => `(?=.*${term})`).join("");
    const regex = new RegExp(searchPattern, "i");

    const members = await Member.find({
      $or: [
        // Match complete name string
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex,
              options: "i",
            },
          },
        },
        // Also match email for direct email searches
        { email: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    return members.map((m) => ({
      value: m._id,
      label: `${m.firstName} ${m.lastName}`,
      email: m.email,
    }));
  } catch (error) {
    console.error("Search error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to search members",
    });
  }
});

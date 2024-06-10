export default defineEventHandler(async () => {
  return await MemberSchema.find();
});

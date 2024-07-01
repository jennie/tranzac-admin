export default defineEventHandler(async (event) => {
  const id = event.context.params.id;
  return await MemberSchema.findById(id);
});

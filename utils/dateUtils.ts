// utils/dateUtils.ts
import { useDateFormat } from "@vueuse/core";
import { ref } from "vue";

export const useDateUtils = () => {
  const formatDate = (date: Date) => {
    return useDateFormat(ref(date), "MMM D, YYYY").value;
  };

  return {
    formatDate,
  };
};

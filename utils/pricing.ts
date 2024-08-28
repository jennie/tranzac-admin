export function formatCostEstimates(estimates, pricingRules) {
  return estimates.map((estimate) => {
    let daytimeDescription = "N/A";
    let eveningDescription = "N/A";

    // Ensure that pricing rules exist for the room
    const roomRules = pricingRules[estimate.roomSlug];
    if (!roomRules) {
      console.error(`No pricing rules found for room: ${estimate.roomSlug}`);
      return { ...estimate, daytimeDescription, eveningDescription };
    }

    // Determine the day of the week
    const dayOfWeek = new Date(estimate.date).toLocaleDateString("en-CA", {
      weekday: "long",
    });
    console.log(`Processing ${dayOfWeek} for room: ${estimate.roomSlug}`);

    // Ensure that day-specific or "all" rules exist
    const dayRules = roomRules[dayOfWeek] || roomRules["all"];
    if (!dayRules) {
      console.error(
        `No pricing rules found for room: ${estimate.roomSlug} on ${dayOfWeek}`
      );
      return { ...estimate, daytimeDescription, eveningDescription };
    }

    // Log the rules being used
    console.log("Day rules found:", dayRules);

    // Check for daytime pricing
    if (estimate.daytimeHours > 0 && dayRules.daytime) {
      const daytimeRateType = dayRules.daytime.type;
      if (daytimeRateType === "flat") {
        daytimeDescription = "Flat";
      } else if (daytimeRateType === "hourly") {
        const rate = estimate.daytimePrice / estimate.daytimeHours;
        daytimeDescription = `${estimate.daytimeHours.toFixed(
          2
        )} hours @${formatCurrency(rate)}/hour`;
      }
    }

    // Check for evening pricing
    if (estimate.eveningHours > 0 && dayRules.evening) {
      const eveningRateType = dayRules.evening.type;
      if (eveningRateType === "flat") {
        eveningDescription = "Flat";
      } else if (eveningRateType === "hourly") {
        const rate = estimate.eveningPrice / estimate.eveningHours;
        eveningDescription = `${estimate.eveningHours.toFixed(
          2
        )} hours @${formatCurrency(rate)}/hour`;
      }
    }

    return {
      ...estimate,
      daytimeDescription,
      eveningDescription,
    };
  });
}

import { useResources } from "@/composables/useResources";

const { resourceCosts } = useResources();

const pricingRules = {
  timePeriods: {
    morning: { start: 0, end: 12 },
    afternoon: { start: 12, end: 18 },
    evening: { start: 18, end: 24 },
  },

  rules: {
    "living-room": {
      Monday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 150, public: 120 },
        evening: { private: 200, public: 160 },
      },
      Tuesday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 150, public: 120 },
        evening: { private: 200, public: 160 },
      },
      Wednesday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 150, public: 120 },
        evening: { private: 200, public: 160 },
      },
      Thursday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 150, public: 120 },
        evening: { private: 200, public: 160 },
      },
      Friday: {
        morning: { private: 150, public: 120 },
        afternoon: { private: 200, public: 160 },
        evening: { private: 250, public: 200 },
      },
      Saturday: {
        morning: { private: 200, public: 160 },
        afternoon: { private: 250, public: 200 },
        evening: { private: 300, public: 240 },
      },
      Sunday: {
        morning: { private: 200, public: 160 },
        afternoon: { private: 250, public: 200 },
        evening: { private: 300, public: 240 },
      },
    },

    // Main Hall
    "main-hall": {
      Monday: {
        morning: { private: 200, public: 160 },
        afternoon: { private: 250, public: 200 },
        evening: { private: 300, public: 240 },
      },
      Tuesday: {
        morning: { private: 200, public: 160 },
        afternoon: { private: 250, public: 200 },
        evening: { private: 300, public: 240 },
      },
      Wednesday: {
        morning: { private: 200, public: 160 },
        afternoon: { private: 250, public: 200 },
        evening: { private: 300, public: 240 },
      },
      Thursday: {
        morning: { private: 200, public: 160 },
        afternoon: { private: 250, public: 200 },
        evening: { private: 300, public: 240 },
      },
      Friday: {
        morning: { private: 250, public: 200 },
        afternoon: { private: 300, public: 240 },
        evening: { private: 350, public: 280 },
      },
      Saturday: {
        morning: { private: 300, public: 240 },
        afternoon: { private: 350, public: 280 },
        evening: { private: 400, public: 320 },
      },
      Sunday: {
        morning: { private: 300, public: 240 },
        afternoon: { private: 350, public: 280 },
        evening: { private: 400, public: 320 },
      },
    },

    // Zine Library
    "zine-library": {
      Monday: {
        morning: { private: 50, public: 40 },
        afternoon: { private: 75, public: 60 },
        evening: { private: 100, public: 80 },
      },
      Tuesday: {
        morning: { private: 50, public: 40 },
        afternoon: { private: 75, public: 60 },
        evening: { private: 100, public: 80 },
      },
      Wednesday: {
        morning: { private: 50, public: 40 },
        afternoon: { private: 75, public: 60 },
        evening: { private: 100, public: 80 },
      },
      Thursday: {
        morning: { private: 50, public: 40 },
        afternoon: { private: 75, public: 60 },
        evening: { private: 100, public: 80 },
      },
      Friday: {
        morning: { private: 75, public: 60 },
        afternoon: { private: 100, public: 80 },
        evening: { private: 125, public: 100 },
      },
      Saturday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 125, public: 100 },
        evening: { private: 150, public: 120 },
      },
      Sunday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 125, public: 100 },
        evening: { private: 150, public: 120 },
      },
    },

    // Parking Lot
    "parking-lot": {
      Monday: {
        morning: { private: 30, public: 25 },
        afternoon: { private: 45, public: 35 },
        evening: { private: 60, public: 50 },
      },
      Tuesday: {
        morning: { private: 30, public: 25 },
        afternoon: { private: 45, public: 35 },
        evening: { private: 60, public: 50 },
      },
      Wednesday: {
        morning: { private: 30, public: 25 },
        afternoon: { private: 45, public: 35 },
        evening: { private: 60, public: 50 },
      },
      Thursday: {
        morning: { private: 30, public: 25 },
        afternoon: { private: 45, public: 35 },
        evening: { private: 60, public: 50 },
      },
      Friday: {
        morning: { private: 45, public: 35 },
        afternoon: { private: 60, public: 50 },
        evening: { private: 75, public: 60 },
      },
      Saturday: {
        morning: { private: 60, public: 50 },
        afternoon: { private: 75, public: 60 },
        evening: { private: 90, public: 70 },
      },
      Sunday: {
        morning: { private: 60, public: 50 },
        afternoon: { private: 75, public: 60 },
        evening: { private: 90, public: 70 },
      },
    },

    // The Full Building
    "the-full-building": {
      Monday: {
        morning: { private: 300, public: 240 },
        afternoon: { private: 400, public: 320 },
        evening: { private: 500, public: 400 },
      },
      Tuesday: {
        morning: { private: 300, public: 240 },
        afternoon: { private: 400, public: 320 },
        evening: { private: 500, public: 400 },
      },
      Wednesday: {
        morning: { private: 300, public: 240 },
        afternoon: { private: 400, public: 320 },
        evening: { private: 500, public: 400 },
      },
      Thursday: {
        morning: { private: 300, public: 240 },
        afternoon: { private: 400, public: 320 },
        evening: { private: 500, public: 400 },
      },
      Friday: {
        morning: { private: 400, public: 320 },
        afternoon: { private: 500, public: 400 },
        evening: { private: 600, public: 480 },
      },
      Saturday: {
        morning: { private: 500, public: 400 },
        afternoon: { private: 600, public: 480 },
        evening: { private: 700, public: 560 },
      },
      Sunday: {
        morning: { private: 500, public: 400 },
        afternoon: { private: 600, public: 480 },
        evening: { private: 700, public: 560 },
      },
    },

    // Southern Cross
    "southern-cross": {
      Monday: {
        morning: { private: 80, public: 65 },
        afternoon: { private: 100, public: 80 },
        evening: { private: 120, public: 100 },
      },
      Tuesday: {
        morning: { private: 80, public: 65 },
        afternoon: { private: 100, public: 80 },
        evening: { private: 120, public: 100 },
      },
      Wednesday: {
        morning: { private: 80, public: 65 },
        afternoon: { private: 100, public: 80 },
        evening: { private: 120, public: 100 },
      },
      Thursday: {
        morning: { private: 80, public: 65 },
        afternoon: { private: 100, public: 80 },
        evening: { private: 120, public: 100 },
      },
      Friday: {
        morning: { private: 100, public: 80 },
        afternoon: { private: 120, public: 100 },
        evening: { private: 140, public: 120 },
      },
      Saturday: {
        morning: { private: 120, public: 100 },
        afternoon: { private: 140, public: 120 },
        evening: { private: 160, public: 140 },
      },
      Sunday: {
        morning: { private: 120, public: 100 },
        afternoon: { private: 140, public: 120 },
        evening: { private: 160, public: 140 },
      },
    },
  },

  additionalCosts: {
    conditions: [
      { condition: "weekend", cost: 50, description: "Weekend surcharge" },
      {
        condition: "afterHours",
        cost: 100,
        description: "After-hours surcharge",
      },
    ],
    resources: {
      bar: 50,
      food: 100,
      security: 75,
      tech: 120,
      door: 60,
      piano: 200,
      projector: 150,
    },
    getAdditionalCosts(day, timePeriod) {
      const additionalCosts = [];

      // Check if the day is a weekend
      if (day === "Saturday" || day === "Sunday") {
        additionalCosts.push({ description: "Weekend surcharge", cost: 50 });
      }

      // Check if the time period is after hours
      if (timePeriod === "evening") {
        additionalCosts.push({
          description: "After-hours surcharge",
          cost: 100,
        });
      }

      return additionalCosts;
    },
  },

  getPrice(roomSlug, day, timePeriod, isPrivate, resources = []) {
    const roomRules = this.rules[roomSlug];

    if (!roomRules) {
      console.error(`Pricing rule not found for room: ${roomSlug}`);
      return null;
    }

    const dayRules = roomRules[day];
    if (!dayRules) {
      console.error(`Pricing rule not found for day: ${day}`);
      return null;
    }

    const periodRules = dayRules[timePeriod];
    if (!periodRules) {
      console.error(`Pricing rule not found for time period: ${timePeriod}`);
      return null;
    }

    const price = isPrivate ? periodRules.private : periodRules.public;
    if (price === undefined) {
      console.error(
        `Pricing rule not found for: ${roomSlug}, ${day}, ${timePeriod}, ${
          isPrivate ? "private" : "public"
        }`
      );
      return null;
    }

    let totalCost = price;

    // Calculate additional costs
    resources.forEach((resource) => {
      if (this.additionalCosts.resources[resource]) {
        totalCost += this.additionalCosts.resources[resource];
      } else {
        console.error(`Additional cost not found for resource: ${resource}`);
      }
    });

    const additionalConditionsCosts = this.additionalCosts.getAdditionalCosts(
      day,
      timePeriod
    );

    additionalConditionsCosts.forEach((cost) => {
      totalCost += cost.cost;
    });

    return totalCost;
  },
};

export default pricingRules;

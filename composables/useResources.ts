// composables/useResources.ts

export function useResources() {
  const resourceOptions = [
    { label: "Bar Staff", value: "bar" },
    { label: "Food", value: "food" },
    { label: "Security", value: "security" },
    { label: "Tech Staff", value: "tech" },
    { label: "Door Staff", value: "door" },
    { label: "Piano", value: "piano" },
    { label: "Projector", value: "projector" },
  ];

  const resourceCosts = {
    bar: 50,
    food: 100,
    security: 150,
    tech: 75,
    door: 40,
    piano: 60,
    projector: 80,
  };

  return {
    resourceOptions,
    resourceCosts,
  };
}

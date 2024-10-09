// /server/api/rentalRequests/[id]/slots.get.ts

import { defineEventHandler, createError } from "h3";
import fetch from "node-fetch";

const DATO_API_TOKEN = process.env.DATO_API_TOKEN;
const DATO_API_URL = "https://graphql.datocms.com/";

export default defineEventHandler(async (event) => {
  // Ensure this is a GET request
  if (event.req.method !== "GET") {
    return createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed",
    });
  }

  const id = event.context.params.id;

  const QUERY = `
    query RentalSlots($id: ItemId!) {
      rental(filter: {id: {eq: $id}}) {
        id
        dates {
          id
          date
          slots {
            id
            title
            startTime {
              time
            }
            endTime {
              time
            }
            allAges
            description
            doorsTime {
              time
            }
            eventType
            expectedAttendance
            loadInTime {
              time
            }
            loadOutTime {
              time
            }
            private
            resources
            rooms {
              name
              id
            }
            soundCheckTime {
              time
            }
            featuredImage {
              url(imgixParams: {w: "500", h: "250", fit: crop})
            }
          }
        }
      }
    }
  `;

  try {
    const response = await $fetch(DATO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DATO_API_TOKEN}`,
        "X-Include-Drafts": "true",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { id },
        includeDrafts: true,
      }),
    });

    if (!response) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch event slots",
      });
    }

    if (!response || !response.data.rental || !response.data.rental.dates) {
      throw createError({
        statusCode: 404,
        statusMessage: "Rental or dates not found",
      });
    }

    return response.data.rental;
  } catch (error) {
    console.error("Error fetching event slots:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch event slots",
    });
  }
});

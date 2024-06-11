<template>

  <UDashboardPanel grow>

    <UDashboardPanelContent class="pb-24" v-if="booking && booking._createdAt">
      <UPageHeader v-if="justApproved || booking._status == 'published'" headline="Rental" :title="booking.title"
        icon="i-heroicons-clipboard" :description="formattedDate">

      </UPageHeader>
      <UPageHeader v-else headline="Rental Request" :title="booking.title" :description="formattedDate"
        :links="booking._status !== 'published' ? [{ label: 'Edit', color: 'black', to: booking._editingUrl }, { label: 'Approve', color: 'green', click: approveBooking }] : []"
        icon="i-heroicons-clipboard" />



      <UDivider class="mb-4" />

      <UDashboardSection title="Submission" description="">
        <div v-for="property in bookingProperties" :key="property.key"
          class="grid grid-cols-2 gap-2 border-b items-center">
          <p class="flex self-start font-bold">{{ property.label }}</p>

          <p v-if="property.key === '_status' && ((booking[property.key] === 'published') || justApproved)"
            class="flex flex-row items-center uppercase text-green-500 text-2xl font-bold">
            <UIcon name="i-heroicons-clipboard-document-check" class="mr-2" /> <span>Approved</span>
          </p>
          <p v-else-if="property.key === '_status' && booking[property.key] === 'draft'"
            class="flex flex-row items-center uppercase  text-2xl font-bold">
            <UIcon name="i-heroicons-pencil" class="mr-2" /> <span>Draft</span>
          </p>
          <p v-else-if="property.isHTML" class="prose dark:prose-invert" v-html="booking[property.key]"></p>
          <p v-else-if="property.key !== '_status'">{{ property.format ? property.format(booking[property.key]) :
            booking[property.key] }}</p>
        </div>
      </UDashboardSection>
      <UDivider class="mb-4" />


      <UDashboardSection title="History" description="
        A history of actions taken on this booking: Approved, Rejected, Invoice Sent, etc."> </UDashboardSection>

    </UDashboardPanelContent>
  </UDashboardPanel>

</template>

<script lang="ts" setup>
import { format, formatDistance, isValid } from "date-fns";

const router = useRouter();
const id = router.currentRoute.value.params.id;
const justApproved = ref(false);
const QUERY = `query Rental($id: ItemId!) {
  rental(filter: {id: {eq: $id}}) {
    id
    title
    _status
    _createdAt
    _editingUrl
    _updatedAt
    _publishedAt
    allAges
    description(markdown: true)
    doorsTime {
      time
    }
    endDate
    eventType
    expectedAttendance
    id
    internalNotes
    loadInTime {
      time
    }
    loadOutTime {
      time
    }
    organization
    photo {
      url
    }
    primaryContactEmail
    primaryContactName
    primaryContactPhone
    primaryContactPronouns
    private
    resources
    rooms {
      name
    }
    slug
    soundCheckTime {
      time
    }
    startDate
    title
  }
}
`;

const booking = ref([]);
const fetchBooking = () => {

  const { data, error: fetchError } = useGraphqlQuery({
    query: QUERY,
    variables: { id },
    includeDrafts: true,
    transform: (data) => {
      return data => ({
        ...data,
        submissionDate: new Date(data.rental._createdAt),
      })
    }
  }
  );

  watchEffect(() => {
    if (fetchError.value) {
      console.error('Failed to fetch booking', fetchError.value);
    } else if (data.value) {
      booking.value = data.value.rental
    }
  });

};
onMounted(fetchBooking);
watchEffect(() => {
  fetchBooking();
});

const bookingProperties = [
  { key: '_status', label: 'Status' },

  { key: '_updatedAt', label: 'Last Updated', format: (date) => isValid(new Date(date)) ? format(new Date(date), 'MMM d, y') : 'Invalid date' },
  { key: 'startDate', label: 'Start Date', format: (date) => isValid(new Date(date)) ? format(new Date(date), 'MMM d, y h:mm a') : 'Invalid date' },
  { key: 'endDate', label: 'End Date', format: (date) => isValid(new Date(date)) ? format(new Date(date), 'MMM d, y h:mm a') : 'Invalid date' },

  { key: 'primaryContactName', label: 'Primary Contact Name' },
  { key: 'primaryContactEmail', label: 'Primary Contact Email' },
  { key: 'primaryContactPhone', label: 'Primary Contact Phone' },
  { key: 'primaryContactPronouns', label: 'Primary Contact Pronouns' },
  { key: 'resources', label: 'Resources' },
  { key: 'rooms', label: 'Rooms', format: (rooms) => rooms.map(room => room.name).join(', ') },
  { key: 'photo', label: 'Photo', format: (photo) => photo ? `<img src="${photo.url}" alt="Photo of the event" class="w-24 h-24 object-cover rounded-lg">` : 'N/A', isHTML: true },
  { key: 'allAges', label: 'All Ages', format: (allAges) => allAges ? 'Yes' : 'No' },
  { key: 'private', label: 'Private', format: (privateEvent) => privateEvent ? 'Yes' : 'No' },
  { key: 'organization', label: 'Organization' },
  { key: 'description', label: 'Description', isHTML: true },
  { key: 'loadInTime', label: 'Load In Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'soundCheckTime', label: 'Sound Check Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'doorsTime', label: 'Doors Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'loadOutTime', label: 'Load Out Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'eventType', label: 'Event Type' },
  { key: 'expectedAttendance', label: 'Expected Attendance' },
  { key: 'internalNotes', label: 'Internal Notes' },
];

// Create a toast instance
const toast = useToast();


const approveBooking = async () => {
  try {
    // Execute the fetch request
    const { data, error, status, execute } = useFetch(`/api/bookings?id=${booking.value.id}`);
    await execute({ method: 'POST' });

    // Check if the request was successful
    if (status.value === 'success') {
      // Show a success message
      toast.add({
        title: "Success",
        color: "green",
        icon: "i-ph-check-circle",
        description: "Booking approved successfully"
      });
      justApproved.value = true;
    } else {
      // Show an error message
      toast.add({
        title: "Error",
        color: "red",
        icon: "i-ph-sign-in",
        description: error.value.message || "Failed to approve booking"
      });
    }
  } catch (error) {
    // Show an error message
    toast.add({
      title: "Error",
      color: "red",
      icon: "i-ph-sign-in",
      description: "An error occurred while approving the booking"
    });
  }
};
const formattedDate = computed(() => {
  if (booking.value?._createdAt && isValid(new Date(booking.value._createdAt))) {
    return `Submitted on ${format(new Date(booking.value._createdAt), 'MMM d, y')} (${formatDistance(new Date(booking.value._createdAt), new Date())} ago)`;
  } else {
    return 'Loading…';
  }
});
</script>

<style></style>
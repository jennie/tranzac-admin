<script setup lang="ts">
import { format, isValid, addYears } from 'date-fns';
import type { FormSubmitEvent, FormError } from "#ui/types";

const router = useRouter();
const route = useRoute();
const id = route.params.id;

const member = ref<any | null>(null);
const error = ref<string | null>(null);
const toast = useToast();

const state = reactive({
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  membership: {
    status: "",
    startDate: "",
    endDate: "",
    paymentMethod: "",
  },
  address: {
    street: "",
    city: "",
    province: "",
    postalCode: "",
  },
  notes: "",
  createdAt: "",
});

const updateState = (memberData: any) => {
  Object.assign(state, {
    id: memberData._id,
    firstName: memberData.firstName,
    lastName: memberData.lastName,
    email: memberData.email,
    phone: memberData.phone,
    membership: {
      status: memberData.membership.status,
      startDate: memberData.membership.startDate,
      endDate: memberData.membership.endDate,
      paymentMethod: memberData.membership.paymentMethod,
    },
    address: {
      street: memberData.address?.street,
      city: memberData.address?.city,
      province: memberData.address?.province,
      postalCode: memberData.address?.postalCode,
    },
    notes: memberData.notes,
    createdAt: memberData.createdAt,
  });
};

watchEffect(() => {
  if (member.value) {
    updateState(member.value);
  }
});

const fetchMember = async () => {
  try {
    const data = await $fetch(`/api/members/${id}`);
    if (data) {
      member.value = data;
    }
  } catch (error) {
    toast.add({
      title: "Failed to load member details",
      icon: "i-heroicons-x-circle",
    });
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];
  if (!state.firstName) errors.push({ path: "firstName", message: "Please enter the first name." });
  if (!state.lastName) errors.push({ path: "lastName", message: "Please enter the last name." });
  if (!state.email) errors.push({ path: "email", message: "Please enter the email." });
  return errors;
};

const onSubmit = async (event: FormSubmitEvent<any>) => {
  const errors = validate(state);
  if (errors.length) return;

  try {
    const response = await fetch(`/api/members/${state.id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });

    if (response.ok) {
      toast.add({
        title: "Member updated successfully",
        icon: "i-heroicons-check-circle",
        color: "green",
      });
    } else {
      throw new Error('Failed to update member');
    }
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Error updating member",
      icon: "i-heroicons-x-circle",
    });
  }
};

const handleManualPayment = async () => {
  try {
    const today = new Date();
    const oneYearFromNow = addYears(today, 1);

    const updatedMembership = {
      status: 'active',
      startDate: today.toISOString(),
      endDate: oneYearFromNow.toISOString(),
      paymentMethod: 'other',
    };

    const response = await fetch(`/api/members/${state.id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership: updatedMembership }),
    });

    if (response.ok) {
      state.membership = updatedMembership;
      toast.add({
        title: "Membership activated successfully",
        icon: "i-heroicons-check-circle",
        color: "green",
      });
    } else {
      throw new Error('Failed to activate membership');
    }
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Error activating membership",
      icon: "i-heroicons-x-circle",
    });
  }
};

const getStatusColor = (status: string) => {
  return status === 'active' ? 'green' : 'gray';
};

const getStatusDescription = (status: string, startDate: string, createdAt: string) => {
  switch (status) {
    case 'active':
      return `Member since ${format(new Date(startDate), 'MMMM d, y')}`;
    case 'pending':
      return `This member has not yet completed the payment process.${createdAt ? ' They registered on ' + format(new Date(createdAt), 'MMMM d, y') + '.' : ''}`;
    case 'inactive':
      return "This member cancelled their subscription.";
    default:
      return "";
  }
};

onMounted(fetchMember);
</script>

<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <template v-if="state.membership.status">
        <UPageHeader
          :headline="state.membership.status === 'pending' ? 'Pending Member' : state.membership.status === 'inactive' ? 'Inactive Member' : 'Member'"
          :title="`${state.firstName} ${state.lastName}`"
          :description="getStatusDescription(state.membership.status, state.membership.startDate, state.createdAt)"
          :links="[
            { label: 'Save', color: 'green', click: onSubmit },
            ...(state.membership.status === 'pending' ? [{ label: 'Activate (Cash/Interac)', color: 'blue', click: handleManualPayment, icon: 'i-heroicons-banknotes' }] : [])
          ]" icon="i-heroicons-clipboard" />
      </template>
      <template v-else>
        <div class="flex space-y-4 py-10 flex-col">
          <USkeleton class="h-4 w-[100px]" />
          <div class="flex flex-row space-x-4">
            <USkeleton class="h-12 w-12" :ui="{ rounded: 'rounded-full' }" />
            <div class="space-y-2">
              <USkeleton class="h-10 w-[250px]" />
              <USkeleton class="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      </template>

      <UDivider class="mb-4" />

      <UForm :state="state" :validate="validate" @submit="onSubmit">
        <UDashboardSection title="Profile" description="">
          <UFormGroup v-for="field in ['firstName', 'lastName', 'email', 'phone']" :key="field" :name="field"
            :label="field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')"
            :required="['firstName', 'lastName', 'email'].includes(field)" class="grid grid-cols-2 gap-2"
            :ui="{ container: '' }">
            <UInput v-model="state[field]" :type="field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'"
              :autocomplete="field === 'email' || field === 'phone' ? 'off' : undefined"
              :icon="field === 'email' ? 'i-heroicons-envelope' : field === 'phone' ? 'i-heroicons-phone' : undefined" />
          </UFormGroup>

          <UFormGroup name="membership.status" label="Membership Status" class="grid grid-cols-2 gap-2"
            :ui="{ container: '' }">
            <div class="flex flex-row space-x-4 items-center">
              <UBadge :color="getStatusColor(state.membership.status)">
                {{ state.membership.status }}
              </UBadge>
              <p v-if="state.membership.status === 'active'" class="text-sm">
                Expires {{ state.membership.endDate ? format(new Date(state.membership.endDate), 'MMMM d, y') : '–' }}
              </p>
              <StripeLogo v-if="state.membership.paymentMethod === 'stripe'" />
              <PayPalLogo v-else-if="state.membership.paymentMethod === 'paypal'" />
              <span class="text-sm" v-else-if="state.membership.paymentMethod === 'other'">Other (Cash/Interac)</span>
            </div>
          </UFormGroup>

          <UFormGroup v-for="field in ['street', 'city', 'province', 'postalCode']" :key="field"
            :name="`address.${field}`"
            :label="field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')"
            class="grid grid-cols-2 gap-2" :ui="{ container: '' }">
            <UInput v-model="state.address[field]" />
          </UFormGroup>

          <UFormGroup name="notes" label="Notes" class="grid grid-cols-2 gap-2" :ui="{ container: '' }">
            <UTextarea v-model="state.notes" :rows="5" />
          </UFormGroup>
        </UDashboardSection>
      </UForm>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>
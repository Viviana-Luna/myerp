<script lang="ts" setup>
interface Props {
  companyName?: string;
  companySiteLink?: string;
  date?: string;
  icp?: string;
  icpLink?: string;
}

defineOptions({
  name: 'Copyright',
});

withDefaults(defineProps<Props>(), {
  companyName: '企业管理一体化平台',
  companySiteLink: '',
  date: '2026',
  icp: '',
  icpLink: '',
});
</script>

<template>
  <div class="text-md flex-center">
    <!-- ICP Link -->
    <a
      v-if="icp && icpLink"
      :href="icpLink"
      class="hover:text-primary-hover mx-1"
      target="_blank"
    >
      {{ icp }}
    </a>
    <span v-else-if="icp" class="mx-1">{{ icp }}</span>

    <!-- Copyright Text -->
    Copyright © {{ date }}

    <!-- Company Name / Link -->
    <a
      v-if="companyName && companySiteLink"
      :href="companySiteLink"
      class="hover:text-primary-hover mx-1"
      target="_blank"
    >
      {{ companyName }}
    </a>
    <span v-else-if="companyName" class="mx-1">{{ companyName }}</span>
  </div>
</template>

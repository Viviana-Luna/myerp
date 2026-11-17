<script lang="ts" setup>
import type { PurchaseInWarehousingApi } from '#/api/wms/purchaseinwarehousing';
import type { WarehousingApi } from '#/api/wms/warehousing';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { ChevronRight, IconifyIcon } from '@vben/icons';

import { getPurchaseInWarehousingPage } from '#/api/wms/purchaseinwarehousing';
import { getPurchaseOrderPage } from '#/api/wms/purchaseorder';
import { getWarehousingList } from '#/api/wms/warehousing';
import { useMacOsShell } from '#/layouts/macos/use-macos-shell';

defineOptions({ name: 'MacWidgetWmsOverview' });

const { hasAccessByCodes, hasAccessByRoles } = useAccess();
const { openAppByPath } = useMacOsShell();

const warehouseCount = ref<null | number>(null);
const purchaseOrderCount = ref<null | number>(null);
const inWarehousingCount = ref<null | number>(null);
const warehouses = ref<WarehousingApi.Warehousing[]>([]);
const recentEntries = ref<PurchaseInWarehousingApi.PurchaseInWarehousing[]>([]);

function canCall(code: string) {
  return hasAccessByRoles(['super_admin']) || hasAccessByCodes([code]);
}

const hasAnyPermission = computed(
  () =>
    canCall('wms:warehousing:query') ||
    canCall('wms:purchase-order:query') ||
    canCall('wms:purchase-in-warehousing:query'),
);

async function loadData() {
  const tasks: Promise<void>[] = [];
  if (canCall('wms:warehousing:query')) {
    tasks.push(
      getWarehousingList({})
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          warehouses.value = list;
          warehouseCount.value = list.length;
        })
        .catch(() => {
          warehouseCount.value = 0;
        }),
    );
  }
  if (canCall('wms:purchase-order:query')) {
    tasks.push(
      getPurchaseOrderPage({ pageNo: 1, pageSize: 1 })
        .then((res) => {
          purchaseOrderCount.value = res?.total ?? 0;
        })
        .catch(() => {
          purchaseOrderCount.value = 0;
        }),
    );
  }
  if (canCall('wms:purchase-in-warehousing:query')) {
    tasks.push(
      getPurchaseInWarehousingPage({ pageNo: 1, pageSize: 3 })
        .then((res) => {
          inWarehousingCount.value = res?.total ?? 0;
          recentEntries.value = res?.list ?? [];
        })
        .catch(() => {
          inWarehousingCount.value = 0;
        }),
    );
  }
  await Promise.all(tasks);
}

onMounted(loadData);
</script>

<template>
  <div class="mac-wms-widget">
    <div class="mac-widget-head">
      <div class="mac-widget-head__left">
        <span class="mac-widget-badge is-wms">
          <IconifyIcon icon="lucide:warehouse" class="size-3.5 text-white" />
        </span>
        <div>
          <div class="mac-widget-head__title">WMS 仓储动态</div>
          <div class="mac-widget-head__sub">仓库与采购入库概况</div>
        </div>
      </div>
      <button
        class="mac-widget-link"
        type="button"
        @click="openAppByPath('/wms')"
      >
        <span>进入 WMS</span>
        <ChevronRight class="size-3.5" />
      </button>
    </div>

    <div v-if="!hasAnyPermission" class="mac-widget-empty">
      暂无 WMS 查询权限
    </div>

    <template v-else>
      <div class="mac-wms-kpis">
        <div class="mac-wms-kpi">
          <span class="mac-wms-kpi__num">{{ warehouseCount ?? '-' }}</span>
          <span class="mac-wms-kpi__label">仓库节点</span>
        </div>
        <div class="mac-wms-kpi">
          <span class="mac-wms-kpi__num">{{ purchaseOrderCount ?? '-' }}</span>
          <span class="mac-wms-kpi__label">采购订单</span>
        </div>
        <div class="mac-wms-kpi">
          <span class="mac-wms-kpi__num">{{ inWarehousingCount ?? '-' }}</span>
          <span class="mac-wms-kpi__label">入库单据</span>
        </div>
      </div>

      <div class="mac-wms-list">
        <div
          v-for="entry in recentEntries.slice(0, 2)"
          :key="entry.id"
          class="mac-wms-row"
          @click="openAppByPath('/wms')"
        >
          <span class="mac-wms-row__dot"></span>
          <span class="mac-wms-row__name">
            {{
              entry.warehousingEntryName ||
              entry.warehousingEntryCode ||
              '采购入库单'
            }}
          </span>
          <span class="mac-wms-row__code">
            {{ entry.warehousingEntryCode || `#${entry.id}` }}
          </span>
        </div>
        <div
          v-if="recentEntries.length === 0 && warehouses.length > 0"
          class="mac-wms-row"
          @click="openAppByPath('/wms')"
        >
          <span class="mac-wms-row__dot"></span>
          <span class="mac-wms-row__name">
            主仓库：{{ warehouses[0]?.warehousingName }}
          </span>
          <span class="mac-wms-row__code">
            {{ warehouses[0]?.warehousingCategoryName || '仓储' }}
          </span>
        </div>
        <div
          v-if="recentEntries.length === 0 && warehouses.length === 0"
          class="mac-wms-placeholder"
        >
          暂无最近入库动态，点击右上角进入仓储模块管理
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mac-wms-widget {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 14px 16px;
}

.mac-widget-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.mac-widget-head__left {
  display: flex;
  gap: 9px;
  align-items: center;
}

.mac-widget-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  box-shadow: 0 4px 10px -4px rgb(0 0 0 / 35%);
}

.mac-widget-badge.is-wms {
  background: linear-gradient(155deg, #fbbf24, #ea580c);
}

.mac-widget-head__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

.mac-widget-head__sub {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-widget-link {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--primary));
  cursor: pointer;
  background: hsl(var(--primary) / 10%);
  border: 0;
  border-radius: 999px;
}

.mac-widget-link:hover {
  background: hsl(var(--primary) / 18%);
}

.mac-wms-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.mac-wms-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: rgb(255 255 255 / 44%);
  border: 1px solid rgb(255 255 255 / 48%);
  border-radius: 12px;
}

.dark .mac-wms-kpi {
  background: rgb(255 255 255 / 7%);
  border-color: rgb(255 255 255 / 10%);
}

.mac-wms-kpi__num {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

.mac-wms-kpi__label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-wms-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.mac-wms-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  background: rgb(255 255 255 / 38%);
  border-radius: 10px;
  transition: background-color 130ms ease;
}

.dark .mac-wms-row {
  background: rgb(255 255 255 / 6%);
}

.mac-wms-row:hover {
  background: rgb(255 255 255 / 62%);
}

.dark .mac-wms-row:hover {
  background: rgb(255 255 255 / 12%);
}

.mac-wms-row__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 999px;
}

.mac-wms-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.mac-wms-row__code {
  flex-shrink: 0;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-wms-placeholder,
.mac-widget-empty {
  padding: 8px 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  text-align: center;
}
</style>

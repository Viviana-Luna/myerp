<script lang="ts" setup>
import type { ErpPurchaseStatisticsApi } from '#/api/erp/statistics/purchase';
import type { ErpSaleStatisticsApi } from '#/api/erp/statistics/sale';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { ChevronRight, IconifyIcon } from '@vben/icons';

import { getPurchaseSummary } from '#/api/erp/statistics/purchase';
import { getSaleSummary } from '#/api/erp/statistics/sale';
import { useMacOsShell } from '#/layouts/macos/use-macos-shell';

defineOptions({ name: 'MacWidgetErpOverview' });

const { hasAccessByCodes, hasAccessByRoles } = useAccess();
const { openAppByPath } = useMacOsShell();

const loading = ref(false);
const hasPermission = computed(
  () =>
    hasAccessByRoles(['super_admin']) ||
    hasAccessByCodes(['erp:statistics:query']),
);

const saleSummary = ref<Partial<ErpSaleStatisticsApi.SaleSummaryRespVO>>({});
const purchaseSummary = ref<
  Partial<ErpPurchaseStatisticsApi.PurchaseSummaryRespVO>
>({});

function formatMoney(val?: number) {
  const num = Number(val ?? 0);
  return num.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

async function loadData() {
  if (!hasPermission.value) {
    return;
  }
  loading.value = true;
  try {
    const [saleRes, purchaseRes] = await Promise.allSettled([
      getSaleSummary(),
      getPurchaseSummary(),
    ]);
    if (saleRes.status === 'fulfilled' && saleRes.value) {
      saleSummary.value = saleRes.value;
    }
    if (purchaseRes.status === 'fulfilled' && purchaseRes.value) {
      purchaseSummary.value = purchaseRes.value;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="mac-erp-widget">
    <div class="mac-widget-head">
      <div class="mac-widget-head__left">
        <span class="mac-widget-badge is-erp">
          <IconifyIcon icon="lucide:boxes" class="size-3.5 text-white" />
        </span>
        <div>
          <div class="mac-widget-head__title">ERP 经营速览</div>
          <div class="mac-widget-head__sub">销售与采购实时汇总</div>
        </div>
      </div>
      <button
        class="mac-widget-link"
        type="button"
        @click="openAppByPath('/erp')"
      >
        <span>进入 ERP</span>
        <ChevronRight class="size-3.5" />
      </button>
    </div>

    <div v-if="!hasPermission" class="mac-widget-empty">
      暂无 ERP 统计权限，点击右上角进入模块查看
    </div>

    <div v-else class="mac-erp-grid">
      <div class="mac-metric-tile">
        <span class="mac-metric-tile__label">今日销售</span>
        <span class="mac-metric-tile__value">
          ¥{{ formatMoney(saleSummary.todayPrice) }}
        </span>
        <span class="mac-metric-tile__meta">
          昨日 ¥{{ formatMoney(saleSummary.yesterdayPrice) }}
        </span>
      </div>

      <div class="mac-metric-tile">
        <span class="mac-metric-tile__label">本月销售</span>
        <span class="mac-metric-tile__value">
          ¥{{ formatMoney(saleSummary.monthPrice) }}
        </span>
        <span class="mac-metric-tile__meta">
          本年 ¥{{ formatMoney(saleSummary.yearPrice) }}
        </span>
      </div>

      <div class="mac-metric-tile">
        <span class="mac-metric-tile__label">今日采购</span>
        <span class="mac-metric-tile__value">
          ¥{{ formatMoney(purchaseSummary.todayPrice) }}
        </span>
        <span class="mac-metric-tile__meta">
          昨日 ¥{{ formatMoney(purchaseSummary.yesterdayPrice) }}
        </span>
      </div>

      <div class="mac-metric-tile">
        <span class="mac-metric-tile__label">本月采购</span>
        <span class="mac-metric-tile__value">
          ¥{{ formatMoney(purchaseSummary.monthPrice) }}
        </span>
        <span class="mac-metric-tile__meta">
          本年 ¥{{ formatMoney(purchaseSummary.yearPrice) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mac-erp-widget {
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

.mac-widget-badge.is-erp {
  background: linear-gradient(155deg, #34d399, #059669);
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
  transition: background-color 140ms ease;
}

.mac-widget-link:hover {
  background: hsl(var(--primary) / 18%);
}

.mac-erp-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.mac-metric-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 11px;
  background: rgb(255 255 255 / 44%);
  border: 1px solid rgb(255 255 255 / 48%);
  border-radius: 12px;
}

.dark .mac-metric-tile {
  background: rgb(255 255 255 / 7%);
  border-color: rgb(255 255 255 / 10%);
}

.mac-metric-tile__label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-metric-tile__value {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  color: hsl(var(--foreground));
}

.mac-metric-tile__meta {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.mac-widget-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>

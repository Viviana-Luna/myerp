<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { getAppMeta } from '#/layouts/macos/config';
import { useMacOsShell } from '#/layouts/macos/use-macos-shell';

defineOptions({ name: 'MacWidgetQuickShortcuts' });

const router = useRouter();
const accessStore = useAccessStore();
const { openAppByPath } = useMacOsShell();

interface ShortcutCandidate {
  title: string;
  subtitle: string;
  path: string;
  appPath: string;
  icon: string;
  gradient: [string, string];
}

const CANDIDATES: ShortcutCandidate[] = [
  {
    appPath: '/erp',
    gradient: ['#34d399', '#059669'],
    icon: 'lucide:boxes',
    path: '/erp/home',
    subtitle: '销售采购汇总',
    title: 'ERP 首页',
  },
  {
    appPath: '/erp',
    gradient: ['#10b981', '#047857'],
    icon: 'lucide:shopping-cart',
    path: '/erp/sale/order',
    subtitle: '销售单据处理',
    title: 'ERP 销售订单',
  },
  {
    appPath: '/wms',
    gradient: ['#fbbf24', '#ea580c'],
    icon: 'lucide:warehouse',
    path: '/wms/warehousing',
    subtitle: '仓库档案台账',
    title: 'WMS 仓库信息',
  },
  {
    appPath: '/wms',
    gradient: ['#f97316', '#c2410c'],
    icon: 'lucide:package-plus',
    path: '/wms/purchase-in-warehousing',
    subtitle: '采购入库登记',
    title: 'WMS 采购入库',
  },
  {
    appPath: '/bpm',
    gradient: ['#a78bfa', '#6d28d9'],
    icon: 'lucide:check-square',
    path: '/bpm/task/todo',
    subtitle: '待我处理审批',
    title: '待办任务',
  },
  {
    appPath: '/workspace',
    gradient: ['#60a5fa', '#2563eb'],
    icon: 'lucide:sliders-horizontal',
    path: '/workspace/home/manage',
    subtitle: '工作台模板配置',
    title: '首页管理',
  },
];

function routeValid(path: string) {
  const resolved = router.resolve(path);
  return !resolved.matched.some((item) => item.name === 'FallbackNotFound');
}

const visibleShortcuts = computed(() => {
  const topPaths = new Set((accessStore.accessMenus ?? []).map((m) => m.path));
  const filtered = CANDIDATES.filter(
    (item) => topPaths.has(item.appPath) && routeValid(item.path),
  );
  if (filtered.length > 0) {
    return filtered.slice(0, 6);
  }
  return (accessStore.accessMenus ?? [])
    .filter(
      (m) => m.path && m.path !== '/workspace' && !/^https?:/.test(m.path),
    )
    .slice(0, 6)
    .map((m) => {
      const meta = getAppMeta(m.path as string);
      return {
        appPath: m.path as string,
        gradient: meta.gradient,
        icon: meta.icon,
        path: m.path as string,
        subtitle: meta.description || (m.path as string),
        title: meta.shortName || String(m.name),
      };
    });
});

function navigate(item: ShortcutCandidate) {
  if (routeValid(item.path)) {
    router.push(item.path);
  } else {
    openAppByPath(item.appPath);
  }
}
</script>

<template>
  <div class="mac-shortcuts-widget">
    <div class="mac-widget-head">
      <div class="mac-widget-head__left">
        <span class="mac-widget-badge is-shortcut">
          <IconifyIcon icon="lucide:zap" class="size-3.5 text-white" />
        </span>
        <div>
          <div class="mac-widget-head__title">快捷指令</div>
          <div class="mac-widget-head__sub">常用业务入口直达</div>
        </div>
      </div>
    </div>

    <div class="mac-shortcuts-grid">
      <button
        v-for="item in visibleShortcuts"
        :key="item.path"
        class="mac-shortcut-card"
        type="button"
        @click="navigate(item)"
      >
        <span
          class="mac-shortcut-card__icon"
          :style="{
            background: `linear-gradient(155deg, ${item.gradient[0]}, ${item.gradient[1]})`,
          }"
        >
          <IconifyIcon :icon="item.icon" class="size-4 text-white" />
        </span>
        <div class="mac-shortcut-card__text">
          <div class="mac-shortcut-card__title">{{ item.title }}</div>
          <div class="mac-shortcut-card__sub">{{ item.subtitle }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mac-shortcuts-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px 16px;
}

.mac-widget-head {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mac-widget-head__left {
  display: flex;
  gap: 9px;
  align-items: center;
}

.mac-widget-badge.is-shortcut {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(155deg, #818cf8, #4f46e5);
  border-radius: 9px;
  box-shadow: 0 4px 10px -4px rgb(0 0 0 / 35%);
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

.mac-shortcuts-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: start;
  margin-top: 12px;
}

.mac-shortcut-card {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 44%);
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 12px;
  transition:
    background-color 130ms ease,
    transform 130ms ease;
}

.dark .mac-shortcut-card {
  background: rgb(255 255 255 / 7%);
  border-color: rgb(255 255 255 / 9%);
}

.mac-shortcut-card:hover {
  background: rgb(255 255 255 / 74%);
  transform: translateY(-1px);
}

.dark .mac-shortcut-card:hover {
  background: rgb(255 255 255 / 13%);
}

.mac-shortcut-card__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  box-shadow: 0 4px 10px -4px rgb(0 0 0 / 35%);
}

.mac-shortcut-card__text {
  flex: 1;
  min-width: 0;
}

.mac-shortcut-card__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12.5px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.mac-shortcut-card__sub {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10.5px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}
</style>

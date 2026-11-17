<script lang="ts" setup>
import type { MenuRecordRaw, TabDefinition } from '@vben/types';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { X } from '@vben/icons';
import { $t } from '@vben/locales';

import { DESKTOP_APP_PATH, getAppMeta } from './config';
import MacAppIcon from './mac-app-icon.vue';
import { getTabKey, getTabTitle, useMacOsShell } from './use-macos-shell';

defineOptions({ name: 'MacOsDockBar' });

const BASE_ICON_SIZE = 48;
const MAX_ICON_GROW = 16; // 悬停主图标固定放大到 64px
const MAX_HOVER_EXPAND_SUM = 36; // 悬停后整条 Dock 的总增量恒定，滑动过程中绝不变短变长
const SLOT_GAP = 8;
const DIVIDER_SPAN = 13; // 1px 分隔线 + 左右边距 + flex gap 净增量
const MAGNIFY_RADIUS = 136;

const route = useRoute();
const router = useRouter();

const {
  activeApp,
  closeApp,
  closeTabInApp,
  dockPinnedApps,
  dockRunningExtraApps,
  goDesktop,
  hideDock,
  isDesktopMode,
  isDockVisible,
  launchpadOpen,
  openApp,
  tabsOfApp,
} = useMacOsShell();

const rowRef = ref<HTMLElement>();
const hoveredSlotId = ref<null | string>(null);

/** 由单条 rAF 循环同步驱动悬停混合度 (0..1) 与平滑光标坐标，避免 CSS width transition 互相打架 */
const hoverMix = ref(0);
const smoothCursorX = ref<null | number>(null);
let hoverTarget = 0;
let targetCursorX: null | number = null;
let rafId: null | number = null;
let lastFrameTime = 0;

interface DockSlot {
  id: string;
  kind: 'app' | 'desktop' | 'launchpad';
  name: string;
  menu?: MenuRecordRaw;
  fallbackIcon?: string;
  dividerBefore?: boolean;
}

/** 将“工作台桌面”放第一位，“业务应用”放中间，“系统管理/额外运行应用”与“启动台”放在分隔线右侧 */
const allSlots = computed<DockSlot[]>(() => {
  const list: DockSlot[] = [
    {
      id: 'desktop',
      kind: 'desktop',
      name: '工作台桌面',
    },
  ];

  const mainBusinessApps: MenuRecordRaw[] = [];
  const systemApps: MenuRecordRaw[] = [];

  for (const menu of dockPinnedApps.value) {
    if (menu.path === '/system') {
      systemApps.push(menu);
    } else {
      mainBusinessApps.push(menu);
    }
  }

  mainBusinessApps.forEach((menu, index) => {
    const path = menu.path as string;
    const meta = getAppMeta(path);
    list.push({
      dividerBefore: index === 0,
      fallbackIcon: typeof menu.icon === 'string' ? menu.icon : undefined,
      id: path,
      kind: 'app',
      menu,
      name: meta.shortName || $t(String(menu.name)),
    });
  });

  dockRunningExtraApps.value.forEach((menu, index) => {
    const path = menu.path as string;
    const meta = getAppMeta(path);
    list.push({
      dividerBefore: index === 0,
      fallbackIcon: typeof menu.icon === 'string' ? menu.icon : undefined,
      id: path,
      kind: 'app',
      menu,
      name: meta.shortName || $t(String(menu.name)),
    });
  });

  systemApps.forEach((menu, index) => {
    const path = menu.path as string;
    const meta = getAppMeta(path);
    list.push({
      dividerBefore: index === 0,
      fallbackIcon: typeof menu.icon === 'string' ? menu.icon : undefined,
      id: path,
      kind: 'app',
      menu,
      name: meta.shortName || $t(String(menu.name)),
    });
  });

  list.push({
    dividerBefore: systemApps.length === 0,
    id: 'launchpad',
    kind: 'launchpad',
    name: '启动台 · 全部应用',
  });

  return list;
});

/** 计算静态基准布局下每个图标中心 X 及总宽度（无 DOM 测量反馈抖动） */
const restLayout = computed(() => {
  const centers: number[] = [];
  let cursor = 0;
  allSlots.value.forEach((slot, index) => {
    if (index > 0) {
      cursor += SLOT_GAP;
    }
    if (slot.dividerBefore) {
      cursor += DIVIDER_SPAN;
    }
    centers.push(cursor + BASE_ICON_SIZE / 2);
    cursor += BASE_ICON_SIZE;
  });
  return {
    centers,
    totalWidth: Math.max(cursor, 1),
  };
});

/** 悬停态总扩展宽度严格锁定，保证滑动切换到任意图标时整条 Dock 长度完全不变 */
const hoverExpandBudget = computed(() =>
  Math.min(MAX_HOVER_EXPAND_SUM, Math.max(0, (allSlots.value.length - 1) * 10)),
);

const currentRowWidth = computed(() =>
  Number(
    (
      restLayout.value.totalWidth +
      hoverMix.value * hoverExpandBudget.value
    ).toFixed(2),
  ),
);

/**
 * 恒定预算注水分配：
 * 1. 进入 Dock 时总宽度平滑一次性展开至 totalWidth + hoverExpandBudget
 * 2. 在各图标间横向滑动时，所有图标增量之和恒等于 hoverExpandBudget
 * 3. 单图标最大增幅锁定为 MAX_ICON_GROW (64px)，边缘图标也不会异常膨胀
 */
const slotMetrics = computed(() => {
  const slots = allSlots.value;
  const count = slots.length;
  const mix = hoverMix.value;
  const cursorX = smoothCursorX.value;
  const budget = hoverExpandBudget.value;

  if (count === 0 || mix <= 0.001 || cursorX === null || budget <= 0) {
    return slots.map(() => ({ lift: 0, size: BASE_ICON_SIZE }));
  }

  const weights = slots.map((_, idx) => {
    const center = restLayout.value.centers[idx] ?? 0;
    const dist = Math.abs(cursorX - center);
    if (dist >= MAGNIFY_RADIUS) {
      return 0.02;
    }
    const bell = 0.5 * (1 + Math.cos((Math.PI * dist) / MAGNIFY_RADIUS));
    return 0.02 + bell ** 1.25;
  });

  const deltas = Array.from<number>({ length: count }).fill(0);
  const locked = Array.from<boolean>({ length: count }).fill(false);
  let remaining = budget;

  for (let pass = 0; pass < count && remaining > 1e-4; pass += 1) {
    let weightSum = 0;
    for (let i = 0; i < count; i += 1) {
      if (!locked[i]) {
        weightSum += weights[i] ?? 0;
      }
    }
    if (weightSum <= 0) {
      break;
    }

    let cappedAny = false;
    for (let i = 0; i < count; i += 1) {
      if (locked[i]) {
        continue;
      }
      const share = remaining * ((weights[i] ?? 0) / weightSum);
      const nextVal = (deltas[i] ?? 0) + share;
      if (nextVal >= MAX_ICON_GROW) {
        remaining -= MAX_ICON_GROW - (deltas[i] ?? 0);
        deltas[i] = MAX_ICON_GROW;
        locked[i] = true;
        cappedAny = true;
      }
    }

    if (!cappedAny) {
      for (let i = 0; i < count; i += 1) {
        if (!locked[i]) {
          deltas[i] =
            (deltas[i] ?? 0) + remaining * ((weights[i] ?? 0) / weightSum);
        }
      }
      remaining = 0;
      break;
    }
  }

  return deltas.map((delta) => {
    const extra = delta * mix;
    return {
      lift: Number((6 * (extra / MAX_ICON_GROW)).toFixed(2)),
      size: Number((BASE_ICON_SIZE + extra).toFixed(2)),
    };
  });
});

function getSlotMetrics(index: number) {
  return slotMetrics.value[index] ?? { lift: 0, size: BASE_ICON_SIZE };
}

function stopAnimationLoop() {
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function tick(now: number) {
  const dt = lastFrameTime ? Math.min(32, now - lastFrameTime) / 16.667 : 1;
  lastFrameTime = now;

  const mixLerp = 1 - 0.72 ** dt;
  const posLerp = 1 - 0.55 ** dt;

  let dirty = false;

  const mixDiff = hoverTarget - hoverMix.value;
  if (Math.abs(mixDiff) <= 0.002) {
    hoverMix.value = hoverTarget;
  } else {
    hoverMix.value += mixDiff * mixLerp;
    dirty = true;
  }

  if (targetCursorX !== null && smoothCursorX.value !== null) {
    const posDiff = targetCursorX - smoothCursorX.value;
    if (Math.abs(posDiff) <= 0.15) {
      smoothCursorX.value = targetCursorX;
    } else {
      smoothCursorX.value += posDiff * posLerp;
      dirty = true;
    }
  }

  if (hoverTarget === 0 && hoverMix.value <= 0.002) {
    hoverMix.value = 0;
    smoothCursorX.value = null;
    targetCursorX = null;
    rafId = null;
    lastFrameTime = 0;
    return;
  }

  if (dirty) {
    rafId = window.requestAnimationFrame(tick);
  } else {
    rafId = null;
    lastFrameTime = 0;
  }
}

function ensureTicking() {
  if (rafId === null) {
    lastFrameTime = 0;
    rafId = window.requestAnimationFrame(tick);
  }
}

function resetHoverStateImmediate() {
  stopAnimationLoop();
  hoverTarget = 0;
  hoverMix.value = 0;
  targetCursorX = null;
  smoothCursorX.value = null;
  hoveredSlotId.value = null;
  lastFrameTime = 0;
}

function handleRowMouseMove(event: MouseEvent) {
  if (!isDockVisible.value) {
    return;
  }
  const el = rowRef.value;
  if (!el) {
    return;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) {
    return;
  }
  // Dock 居中定位，centerX 与固定活跃宽度均不随帧间微调改变，彻底消除长度反馈震荡
  const centerX = rect.left + rect.width / 2;
  const activeWidth = restLayout.value.totalWidth + hoverExpandBudget.value;
  const fixedLeft = centerX - activeWidth / 2;
  const ratio = Math.min(
    1,
    Math.max(0, (event.clientX - fixedLeft) / activeWidth),
  );
  const nextX = ratio * restLayout.value.totalWidth;

  targetCursorX = nextX;
  if (smoothCursorX.value === null) {
    smoothCursorX.value = nextX;
  }
  hoverTarget = 1;
  ensureTicking();
}

function handleDockLeave() {
  hoverTarget = 0;
  hoveredSlotId.value = null;
  ensureTicking();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !isDesktopMode.value && isDockVisible.value) {
    hideDock();
  }
}

watch(isDockVisible, (visible) => {
  if (!visible) {
    resetHoverStateImmediate();
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  stopAnimationLoop();
  window.removeEventListener('keydown', handleKeyDown);
});

function slotFullTitle(slot: DockSlot) {
  if (slot.kind === 'desktop') return '工作台桌面';
  if (slot.kind === 'launchpad') return '启动台 · 全部应用';
  return slot.menu ? $t(String(slot.menu.name)) : slot.name;
}

function slotTabs(slot: DockSlot) {
  if (slot.kind !== 'app' || !slot.menu) {
    return [];
  }
  return tabsOfApp(slot.menu);
}

function isSlotActive(slot: DockSlot) {
  if (slot.kind === 'desktop') return isDesktopMode.value;
  if (slot.kind === 'launchpad') return launchpadOpen.value;
  return !isDesktopMode.value && activeApp.value?.path === slot.id;
}

function isSlotRunning(slot: DockSlot) {
  if (slot.kind === 'desktop') return isDesktopMode.value;
  if (slot.kind === 'launchpad') return launchpadOpen.value;
  return slotTabs(slot).length > 0 || isSlotActive(slot);
}

function handleSlotClick(slot: DockSlot) {
  if (slot.kind === 'desktop') {
    goDesktop();
    return;
  }
  if (slot.kind === 'launchpad') {
    hideDock();
    launchpadOpen.value = !launchpadOpen.value;
    return;
  }
  if (slot.menu) {
    openApp(slot.menu);
  }
}

function openPopoverTab(tab: TabDefinition) {
  hideDock();
  router.push(tab.fullPath || tab.path);
}

function iconPathFor(slot: DockSlot) {
  if (slot.kind === 'desktop') return DESKTOP_APP_PATH;
  if (slot.kind === 'launchpad') return 'launchpad';
  return slot.id;
}
</script>

<template>
  <div
    v-if="!isDesktopMode && isDockVisible"
    aria-hidden="true"
    class="macos-dock__clickaway"
    @click="hideDock"
  ></div>

  <nav
    aria-label="应用 Dock"
    class="macos-dock"
    :class="{ 'is-collapsed': !isDockVisible }"
    @mouseleave="handleDockLeave"
  >
    <div class="macos-dock__shell" @click.stop>
      <div class="macos-dock__backdrop" aria-hidden="true"></div>
      <div class="macos-dock__specular" aria-hidden="true"></div>

      <div
        ref="rowRef"
        class="macos-dock__row"
        :style="{ width: `${currentRowWidth}px` }"
        @mousemove="handleRowMouseMove"
      >
        <template v-for="(slot, idx) in allSlots" :key="slot.id">
          <div v-if="slot.dividerBefore" class="macos-dock__sep"></div>

          <div
            class="macos-dock__slot"
            :class="{ 'is-hovered': hoveredSlotId === slot.id }"
            :style="{
              height: `${BASE_ICON_SIZE}px`,
              width: `${getSlotMetrics(idx).size}px`,
            }"
            @mouseenter="hoveredSlotId = slot.id"
          >
            <!-- 浮层位于图标尺寸之外，保持 1:1 清晰像素比，不随图标缩放 -->
            <div
              v-if="slotTabs(slot).length > 0"
              class="macos-dock__popover"
              :style="{
                bottom: `${getSlotMetrics(idx).size + getSlotMetrics(idx).lift + 14}px`,
              }"
              @mousemove.stop
            >
              <div class="macos-dock__popover-head">
                <span class="macos-dock__popover-title">
                  {{ slotFullTitle(slot) }}
                </span>
                <button
                  v-if="slot.menu"
                  class="macos-dock__popover-quit"
                  type="button"
                  @click.stop="closeApp(slot.menu)"
                >
                  退出
                </button>
              </div>
              <div class="macos-dock__popover-list">
                <div
                  v-for="tab in slotTabs(slot)"
                  :key="getTabKey(tab)"
                  class="macos-dock__win"
                  :class="{ 'is-current': tab.path === route.path }"
                >
                  <button
                    class="macos-dock__win-btn"
                    type="button"
                    @click.stop="openPopoverTab(tab)"
                  >
                    {{ getTabTitle(tab) }}
                  </button>
                  <button
                    class="macos-dock__win-close"
                    title="关闭页面"
                    type="button"
                    @click.stop="closeTabInApp(tab)"
                  >
                    <X class="size-3" />
                  </button>
                </div>
              </div>
            </div>

            <div
              v-else
              class="macos-dock__tooltip"
              :style="{
                bottom: `${getSlotMetrics(idx).size + getSlotMetrics(idx).lift + 12}px`,
              }"
            >
              {{ slotFullTitle(slot) }}
            </div>

            <!-- 真正的动态大小图标按钮（沿底线向上生长，推开相邻图标） -->
            <button
              class="macos-dock__icon-btn"
              :aria-label="slotFullTitle(slot)"
              :style="{
                height: `${getSlotMetrics(idx).size}px`,
                transform: `translateY(-${getSlotMetrics(idx).lift}px)`,
                width: `${getSlotMetrics(idx).size}px`,
              }"
              type="button"
              @click="handleSlotClick(slot)"
            >
              <MacAppIcon
                :fallback-icon="slot.fallbackIcon"
                :path="iconPathFor(slot)"
                variant="dock"
              />
            </button>

            <!-- 固定在 Dock 底部的运行指示点，绝不随图标移动或缩放 -->
            <span
              v-if="isSlotRunning(slot)"
              class="macos-dock__dot"
              :class="{ 'is-active': isSlotActive(slot) }"
            ></span>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
@media (max-width: 600px) {
  .macos-dock {
    bottom: 8px;
    max-width: calc(100vw - 16px);
  }

  .macos-dock__shell {
    max-width: 100%;
    padding: 6px 8px 10px;
    overflow-x: auto;
    scrollbar-width: none;
    border-radius: 18px;
  }

  .macos-dock__shell::-webkit-scrollbar {
    display: none;
  }

  .macos-dock__row {
    width: auto !important;
  }
}

@media (hover: none) {
  .macos-dock__tooltip,
  .macos-dock__popover {
    display: none;
  }
}

.macos-dock__clickaway {
  position: fixed;
  inset: 0;
  z-index: 254;
  background: transparent;
}

.macos-dock {
  position: fixed;
  bottom: 10px;
  left: 50%;
  z-index: 260;
  pointer-events: none;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition:
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.macos-dock.is-collapsed {
  opacity: 0;
  transform: translateX(-50%) translateY(calc(100% + 26px));
}

.macos-dock__shell {
  position: relative;
  padding: 7px 11px 12px;
  pointer-events: auto;
  border: 0.5px solid rgb(255 255 255 / 62%);
  border-radius: 22px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 72%),
    inset 0 -1px 0 rgb(255 255 255 / 16%),
    0 20px 44px -14px rgb(15 23 42 / 28%),
    0 4px 12px -4px rgb(15 23 42 / 12%);
  isolation: isolate;
}

.macos-dock.is-collapsed .macos-dock__shell {
  pointer-events: none;
}

.dark .macos-dock__shell {
  border-color: rgb(255 255 255 / 18%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 16%),
    0 22px 48px -12px rgb(0 0 0 / 74%);
}

.macos-dock__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: rgb(255 255 255 / 34%);
  border-radius: inherit;
  backdrop-filter: blur(28px) saturate(190%) brightness(1.04);
}

.dark .macos-dock__backdrop {
  background: rgb(22 26 36 / 56%);
}

.macos-dock__specular {
  position: absolute;
  top: 0;
  right: 7%;
  left: 7%;
  z-index: 1;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 88%) 50%,
    transparent
  );
}

.dark .macos-dock__specular {
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 26%) 50%,
    transparent
  );
}

.macos-dock__row {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.macos-dock__sep {
  flex-shrink: 0;
  align-self: center;
  width: 1px;
  height: 34px;
  margin: 0 2px;
  background: rgb(15 23 42 / 14%);
}

.dark .macos-dock__sep {
  background: rgb(255 255 255 / 18%);
}

.macos-dock__slot {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: flex-end;
  justify-content: center;
}

/* 鼠标向浮层移动的透明桥接热区 */
.macos-dock__slot::after {
  position: absolute;
  right: -10px;
  bottom: 100%;
  left: -10px;
  height: 36px;
  content: '';
}

.macos-dock__icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition: filter 140ms ease;
}

.macos-dock__icon-btn:hover {
  filter: brightness(1.04);
}

.macos-dock__icon-btn:active {
  filter: brightness(0.92);
}

/* 固定在 Dock 底部轨道的运行小圆点 */
.macos-dock__dot {
  position: absolute;
  bottom: -8px;
  left: 50%;
  width: 4px;
  height: 4px;
  pointer-events: none;
  background: rgb(15 23 42 / 42%);
  border-radius: 999px;
  transform: translateX(-50%);
  transition:
    background-color 140ms ease,
    width 140ms ease;
}

.dark .macos-dock__dot {
  background: rgb(255 255 255 / 52%);
}

.macos-dock__dot.is-active {
  width: 5px;
  height: 5px;
  background: rgb(15 23 42 / 86%);
}

.dark .macos-dock__dot.is-active {
  background: rgb(255 255 255 / 95%);
}

/* 1:1 清晰 Apple 风格 Tooltip（带向下小三角） */
.macos-dock__tooltip {
  position: absolute;
  left: 50%;
  z-index: 20;
  visibility: hidden;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
  color: rgb(255 255 255 / 96%);
  white-space: nowrap;
  pointer-events: none;
  background: rgb(24 28 38 / 86%);
  border: 0.5px solid rgb(255 255 255 / 18%);
  border-radius: 7px;
  box-shadow: 0 10px 24px -10px rgb(0 0 0 / 45%);
  opacity: 0;
  backdrop-filter: blur(16px);
  transform: translate(-50%, 3px);
  transition:
    opacity 110ms ease 60ms,
    transform 110ms ease 60ms;
}

.macos-dock__tooltip::after {
  position: absolute;
  top: 100%;
  left: 50%;
  content: '';
  border-color: rgb(24 28 38 / 86%) transparent transparent;
  border-style: solid;
  border-width: 5px 5px 0;
  transform: translateX(-50%);
}

.macos-dock__slot.is-hovered .macos-dock__tooltip {
  visibility: visible;
  opacity: 1;
  transform: translate(-50%, 0);
}

/* 统一窗口切换浮层 */
.macos-dock__popover {
  position: absolute;
  left: 50%;
  z-index: 20;
  visibility: hidden;
  min-width: 224px;
  max-width: 280px;
  padding: 8px;
  background: hsl(var(--popover) / 94%);
  border: 0.5px solid hsl(var(--border) / 85%);
  border-radius: 14px;
  box-shadow: 0 18px 40px -16px rgb(15 23 42 / 42%);
  opacity: 0;
  backdrop-filter: blur(22px) saturate(160%);
  transform: translate(-50%, 4px);
  transition:
    opacity 120ms ease 80ms,
    transform 120ms ease 80ms;
}

.macos-dock__slot.is-hovered .macos-dock__popover {
  visibility: visible;
  opacity: 1;
  transform: translate(-50%, 0);
}

.macos-dock__popover-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid hsl(var(--border) / 60%);
}

.macos-dock__popover-title {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.macos-dock__popover-quit {
  padding: 2px 6px;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

.macos-dock__popover-quit:hover {
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 10%);
}

.macos-dock__popover-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
}

.macos-dock__win {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 3px 4px 3px 8px;
  border-radius: 8px;
}

.macos-dock__win:hover {
  background: hsl(var(--accent));
}

.macos-dock__win.is-current .macos-dock__win-btn {
  font-weight: 600;
  color: hsl(var(--primary));
}

.macos-dock__win-btn {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: hsl(var(--foreground));
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.macos-dock__win-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

.macos-dock__win-close:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--border) / 60%);
}
</style>

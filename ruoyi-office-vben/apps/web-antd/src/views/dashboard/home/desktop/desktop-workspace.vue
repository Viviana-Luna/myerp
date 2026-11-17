<script lang="ts" setup>
import type { GridLayoutItem } from '../types/layout';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Plus, RotateCw, X } from '@vben/icons';
import { usePreferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { watchDebounced } from '@vueuse/core';
import { Dropdown, Empty, Menu, message, Modal, Tabs } from 'ant-design-vue';
import { GridItem, GridLayout } from 'grid-layout-plus';

import { WALLPAPER_PRESETS } from '#/layouts/macos/config';
import { useMacOsShell } from '#/layouts/macos/use-macos-shell';

import { getAllComponents } from '../components/registry';
import ComponentWrapper from '../components/wrapper/component-wrapper.vue';
import {
  createDefaultDesktopLayout,
  getMacWidgetMeta,
  MAC_DESKTOP_WIDGETS,
} from './widget-registry';

defineOptions({ name: 'MacOsDesktopWorkspace' });

const props = defineProps<{
  pageId?: number;
}>();

const ROW_HEIGHT = 54;
const GRID_MARGIN = 12;

const router = useRouter();
const userStore = useUserStore();
const { isMobile } = usePreferences();
const {
  cycleWallpaper,
  desktopEditing,
  desktopLibraryOpen,
  desktopResetNonce,
  launchpadOpen,
  setWallpaper,
  wallpaper,
} = useMacOsShell();

const layout = ref<GridLayoutItem[]>([]);
const libraryTab = ref('macos');
const hydrated = ref(false);

const storageKey = computed(
  () => `macos-desktop-widgets:v2:${userStore.userInfo?.id ?? 'guest'}`,
);

const legacyWidgets = computed(() => getAllComponents());

function normalizeItems(items: GridLayoutItem[]): GridLayoutItem[] {
  return items.map((item, idx) => {
    const meta = getMacWidgetMeta(item.componentCode);
    return {
      ...item,
      config: item.config ?? {},
      h: Number(item.h ?? meta?.defaultH ?? 4),
      i: item.i || `widget-${idx}`,
      minH: item.minH ?? meta?.minH ?? 3,
      minW: item.minW ?? meta?.minW ?? 4,
      w: Number(item.w ?? meta?.defaultW ?? 8),
      x: Number(item.x ?? 0),
      y: Number(item.y ?? 0),
    };
  });
}

function readLocalLayout(): GridLayoutItem[] | null {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function persistLayout() {
  try {
    const snapshot = layout.value.map((item) => ({
      componentCode: item.componentCode,
      config: item.config,
      h: item.h,
      i: item.i,
      minH: item.minH,
      minW: item.minW,
      w: item.w,
      x: item.x,
      y: item.y,
    }));
    localStorage.setItem(storageKey.value, JSON.stringify(snapshot));
  } catch {
    // 忽略本地存储异常
  }
}

function initDesktopLayout() {
  hydrated.value = false;
  const local = readLocalLayout();
  layout.value = normalizeItems(local ?? createDefaultDesktopLayout());
  hydrated.value = true;
}

onMounted(initDesktopLayout);

watch(
  () => storageKey.value,
  () => {
    initDesktopLayout();
  },
);

watchDebounced(
  layout,
  () => {
    if (hydrated.value) {
      persistLayout();
    }
  },
  { debounce: 350, deep: true },
);

watch(desktopResetNonce, () => {
  resetToDefault();
});

function nextAvailableRow() {
  let maxY = 0;
  for (const item of layout.value) {
    maxY = Math.max(maxY, item.y + item.h);
  }
  return maxY;
}

function addWidget(code: string) {
  const macMeta = getMacWidgetMeta(code);
  const w = macMeta?.defaultW ?? 8;
  const h = macMeta?.defaultH ?? 4;
  layout.value = [
    ...layout.value,
    {
      componentCode: code,
      config: {},
      h,
      i: `widget-${Date.now()}`,
      minH: macMeta?.minH ?? 3,
      minW: macMeta?.minW ?? 4,
      w,
      x: 0,
      y: nextAvailableRow(),
    },
  ];
  desktopLibraryOpen.value = false;
  message.success('已添加小组件到桌面');
}

function removeWidget(id: string) {
  layout.value = layout.value.filter((item) => item.i !== id);
}

function resetToDefault() {
  localStorage.removeItem(storageKey.value);
  layout.value = normalizeItems(createDefaultDesktopLayout());
  desktopEditing.value = false;
  message.success('已恢复默认桌面小组件布局');
}

function openHomeManage() {
  router.push('/workspace/home/manage');
}

function handleContextMenuClick(info: { key: number | string }) {
  const key = String(info.key);
  switch (key) {
    case 'add-widget': {
      desktopEditing.value = true;
      desktopLibraryOpen.value = true;

      break;
    }
    case 'launchpad': {
      launchpadOpen.value = true;

      break;
    }
    case 'manage': {
      openHomeManage();

      break;
    }
    case 'next-wallpaper': {
      cycleWallpaper();

      break;
    }
    case 'reset': {
      resetToDefault();

      break;
    }
    case 'toggle-edit': {
      desktopEditing.value = !desktopEditing.value;

      break;
    }
    default: {
      if (key.startsWith('wp:')) {
        setWallpaper(key.slice(3) as any);
      }
    }
  }
}
</script>

<template>
  <div class="macos-desktop-wrapper h-full w-full">
    <Dropdown :trigger="['contextmenu']">
      <div
        class="macos-desktop-canvas"
        :class="{ 'is-editing': desktopEditing }"
        :data-home-page-id="props.pageId ?? ''"
      >
        <div v-if="layout.length === 0" class="macos-desktop-empty">
          <div class="lg-card macos-desktop-empty__card">
            <div class="lg-card__backdrop" aria-hidden="true"></div>
            <div class="lg-card__body">
              <Empty description="桌面上还没有小组件" />
              <div class="mt-4 flex justify-center gap-2">
                <button
                  class="mac-action-btn is-primary"
                  type="button"
                  @click="desktopLibraryOpen = true"
                >
                  <Plus class="size-3.5" />
                  <span>添加小组件</span>
                </button>
                <button
                  class="mac-action-btn"
                  type="button"
                  @click="resetToDefault"
                >
                  <RotateCw class="size-3.5" />
                  <span>恢复默认</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <GridLayout
          v-else-if="!isMobile"
          v-model:layout="layout"
          :col-num="24"
          :is-draggable="desktopEditing"
          :is-resizable="desktopEditing"
          :margin="[GRID_MARGIN, GRID_MARGIN]"
          :prevent-collision="false"
          :row-height="ROW_HEIGHT"
          :use-css-transforms="true"
          :vertical-compact="true"
        >
          <GridItem
            v-for="item in layout"
            :key="item.i"
            :h="item.h"
            :i="item.i"
            :is-draggable="desktopEditing"
            :is-resizable="desktopEditing"
            :min-h="item.minH"
            :min-w="item.minW"
            :static="!desktopEditing"
            :w="item.w"
            :x="item.x"
            :y="item.y"
          >
            <div
              class="mac-widget-wrap"
              :class="{ 'is-editing': desktopEditing }"
            >
              <div
                class="lg-card mac-widget-shell"
                :class="{
                  'is-editing': desktopEditing,
                  'is-legacy': !getMacWidgetMeta(item.componentCode),
                }"
              >
                <div class="lg-card__backdrop" aria-hidden="true"></div>
                <div class="lg-card__specular" aria-hidden="true"></div>

                <div class="lg-card__content">
                  <component
                    :is="getMacWidgetMeta(item.componentCode)!.component"
                    v-if="getMacWidgetMeta(item.componentCode)"
                  />
                  <ComponentWrapper
                    v-else
                    :component-code="item.componentCode"
                    :config="item.config"
                  />
                </div>
              </div>

              <button
                v-if="desktopEditing"
                class="mac-widget-remove"
                title="从桌面移除"
                type="button"
                @click.stop="removeWidget(item.i)"
              >
                <X class="size-3.5" />
              </button>
            </div>
          </GridItem>
        </GridLayout>

        <!-- 移动端单列降级 -->
        <div v-else class="macos-desktop-mobile">
          <div
            v-for="item in layout"
            :key="item.i"
            class="lg-card mac-widget-shell"
            :style="{ minHeight: `${Math.max(item.h * 58, 190)}px` }"
          >
            <div class="lg-card__backdrop" aria-hidden="true"></div>
            <div class="lg-card__content">
              <component
                :is="getMacWidgetMeta(item.componentCode)!.component"
                v-if="getMacWidgetMeta(item.componentCode)"
              />
              <ComponentWrapper
                v-else
                :component-code="item.componentCode"
                :config="item.config"
              />
            </div>
          </div>
        </div>

        <!-- 编辑态悬浮工具胶囊 -->
        <Transition name="toolbar-pop">
          <div v-if="desktopEditing && !isMobile" class="macos-desktop-toolbar">
            <span class="macos-desktop-toolbar__hint">
              拖动调整位置 · 右下角调整大小
            </span>
            <button
              class="mac-action-btn"
              type="button"
              @click="desktopLibraryOpen = true"
            >
              <Plus class="size-3.5" />
              <span>添加小组件</span>
            </button>
            <button
              class="mac-action-btn"
              type="button"
              @click="cycleWallpaper"
            >
              <span>切换壁纸</span>
            </button>
            <button
              class="mac-action-btn"
              type="button"
              @click="resetToDefault"
            >
              <span>恢复默认</span>
            </button>
            <button
              class="mac-action-btn"
              type="button"
              @click="openHomeManage"
            >
              <span>首页管理</span>
            </button>
            <button
              class="mac-action-btn is-primary"
              type="button"
              @click="desktopEditing = false"
            >
              <span>完成</span>
            </button>
          </div>
        </Transition>

        <!-- 小组件库弹窗 -->
        <Modal
          v-model:open="desktopLibraryOpen"
          :footer="null"
          title="添加桌面小组件"
          width="640px"
        >
          <Tabs v-model:active-key="libraryTab">
            <Tabs.TabPane key="macos" tab="macOS 桌面小组件">
              <div class="widget-library-grid">
                <button
                  v-for="widget in MAC_DESKTOP_WIDGETS"
                  :key="widget.code"
                  class="widget-library-card"
                  type="button"
                  @click="addWidget(widget.code)"
                >
                  <div class="widget-library-card__title">
                    {{ widget.name }}
                  </div>
                  <div class="widget-library-card__desc">
                    {{ widget.description }}
                  </div>
                </button>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane key="legacy" tab="系统工作台组件">
              <div class="widget-library-grid">
                <button
                  v-for="widget in legacyWidgets"
                  :key="widget.code"
                  class="widget-library-card"
                  type="button"
                  @click="addWidget(widget.code)"
                >
                  <div class="widget-library-card__title">
                    {{ widget.name }}
                  </div>
                  <div class="widget-library-card__desc">
                    {{ widget.description || widget.code }}
                  </div>
                </button>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Modal>
      </div>

      <template #overlay>
        <Menu @click="handleContextMenuClick">
          <Menu.Item key="toggle-edit">
            {{ desktopEditing ? '完成整理桌面' : '整理桌面小组件' }}
          </Menu.Item>
          <Menu.Item key="add-widget">添加桌面小组件...</Menu.Item>
          <Menu.Item key="launchpad">打开全部应用 (启动台)</Menu.Item>
          <Menu.Divider />
          <Menu.SubMenu key="wallpapers" title="更换壁纸">
            <Menu.Item v-for="wp in WALLPAPER_PRESETS" :key="`wp:${wp.id}`">
              {{ wp.id === wallpaper ? `✓ ${wp.name}` : wp.name }}
            </Menu.Item>
          </Menu.SubMenu>
          <Menu.Item key="manage">首页模板管理</Menu.Item>
          <Menu.Item key="reset">恢复默认桌面布局</Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>

<style scoped>
.macos-desktop-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 12px 20px 92px;
  overflow-y: auto;
  transition: padding-top 180ms ease;
}

.macos-desktop-canvas.is-editing {
  padding-top: 52px;
}

.mac-widget-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.macos-desktop-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70%;
}

.macos-desktop-empty__card {
  width: 340px;
  padding: 28px 24px;
}

.macos-desktop-mobile {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 84px;
}

/* Liquid Glass 双层折射卡片：外层定框，backdrop 层承接模糊，content 层保持高清文字 */
.lg-card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 48%);
  border-radius: 22px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 62%),
    inset 0 -1px 0 rgb(255 255 255 / 12%),
    0 18px 40px -22px rgb(15 23 42 / 34%),
    0 4px 12px -4px rgb(15 23 42 / 12%);
  isolation: isolate;
  transition:
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.dark .lg-card {
  border-color: rgb(255 255 255 / 15%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 14%),
    0 20px 44px -20px rgb(0 0 0 / 70%);
}

.lg-card__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: rgb(255 255 255 / 54%);
  border-radius: inherit;
  backdrop-filter: blur(22px) saturate(165%) brightness(1.03);
}

.dark .lg-card__backdrop {
  background: rgb(24 28 38 / 62%);
}

.lg-card__specular {
  position: absolute;
  top: 0;
  right: 8%;
  left: 8%;
  z-index: 1;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 78%) 50%,
    transparent
  );
}

.dark .lg-card__specular {
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 22%) 50%,
    transparent
  );
}

.lg-card__content,
.lg-card__body {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}

.mac-widget-shell:hover {
  border-color: rgb(255 255 255 / 70%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 72%),
    0 22px 46px -22px rgb(15 23 42 / 40%);
}

.dark .mac-widget-shell:hover {
  border-color: rgb(255 255 255 / 24%);
}

.mac-widget-shell.is-editing {
  cursor: grab;
  border-color: hsl(var(--primary) / 70%);
  box-shadow:
    0 0 0 2px hsl(var(--primary) / 24%),
    0 22px 44px -22px rgb(15 23 42 / 45%);
}

.mac-widget-shell.is-editing .lg-card__content {
  pointer-events: none;
  user-select: none;
}

/* 旧版工作台组件在桌面内透明化融合，去除白底嵌套感 */
.mac-widget-shell.is-legacy .lg-card__content {
  padding: 6px;
}

.mac-widget-shell.is-legacy :deep(.bg-background) {
  background-color: transparent !important;
}

.mac-widget-remove {
  position: absolute;
  top: -7px;
  right: -7px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: hsl(var(--background) / 96%);
  border: 1px solid hsl(var(--border));
  border-radius: 999px;
  box-shadow: 0 6px 14px -4px rgb(0 0 0 / 35%);
  transition:
    background-color 120ms ease,
    color 120ms ease,
    transform 120ms ease;
}

.mac-widget-remove:hover {
  color: #fff;
  background: hsl(var(--destructive));
  border-color: hsl(var(--destructive));
  transform: scale(1.08);
}

.macos-desktop-toolbar {
  position: fixed;
  top: 42px;
  left: 50%;
  z-index: 250;
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 5px 8px 5px 12px;
  white-space: nowrap;
  background: rgb(255 255 255 / 82%);
  border: 1px solid rgb(255 255 255 / 78%);
  border-radius: 999px;
  box-shadow: 0 14px 32px -14px rgb(15 23 42 / 38%);
  backdrop-filter: blur(22px) saturate(160%);
  transform: translateX(-50%);
}

.dark .macos-desktop-toolbar {
  background: rgb(28 32 42 / 84%);
  border-color: rgb(255 255 255 / 16%);
}

.macos-desktop-toolbar__hint {
  padding-right: 4px;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-action-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 28px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: rgb(15 23 42 / 6%);
  border: 0;
  border-radius: 999px;
  transition: background-color 130ms ease;
}

.dark .mac-action-btn {
  background: rgb(255 255 255 / 10%);
}

.mac-action-btn:hover {
  background: rgb(15 23 42 / 12%);
}

.dark .mac-action-btn:hover {
  background: rgb(255 255 255 / 18%);
}

.mac-action-btn.is-primary {
  color: #fff;
  background: hsl(var(--primary));
}

.mac-action-btn.is-primary:hover {
  filter: brightness(1.06);
}

.widget-library-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: 400px;
  padding: 4px 2px;
  overflow-y: auto;
}

.widget-library-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  transition:
    border-color 130ms ease,
    background-color 130ms ease;
}

.widget-library-card:hover {
  background: hsl(var(--accent));
  border-color: hsl(var(--primary) / 50%);
}

.widget-library-card__title {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.widget-library-card__desc {
  font-size: 11.5px;
  color: hsl(var(--muted-foreground));
}

.toolbar-pop-enter-active,
.toolbar-pop-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.toolbar-pop-enter-from,
.toolbar-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>

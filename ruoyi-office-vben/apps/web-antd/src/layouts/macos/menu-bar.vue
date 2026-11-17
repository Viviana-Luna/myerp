<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

import {
  ArrowLeft,
  LayoutGrid,
  MoonStar,
  Palette,
  PanelLeft,
  Plus,
  Sun,
} from '@vben/icons';
import { GlobalSearch } from '@vben/layouts';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { Dropdown, Menu, Popover } from 'ant-design-vue';

import { DESKTOP_APP_PATH, WALLPAPER_PRESETS } from './config';
import MacAppIcon from './mac-app-icon.vue';
import { useMacOsShell } from './use-macos-shell';

defineOptions({ name: 'MacOsMenuBar' });

const emit = defineEmits<{
  lockScreen: [];
  logout: [];
}>();

const accessStore = useAccessStore();
const { isDark } = usePreferences();
const {
  activeApp,
  activeAppName,
  desktopEditing,
  desktopLibraryOpen,
  goDesktop,
  isDesktopMode,
  launchpadOpen,
  setWallpaper,
  wallpaper,
} = useMacOsShell();

const wallpaperPopoverOpen = ref(false);
const clockText = ref('');
let clockTimer: number | undefined;

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function updateClock() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = WEEKDAYS[now.getDay()] ?? '';
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  clockText.value = `${month}月${day}日 ${weekday} ${hh}:${mm}`;
}

onMounted(() => {
  updateClock();
  clockTimer = window.setInterval(updateClock, 15_000);
});

onUnmounted(() => {
  if (clockTimer !== undefined) {
    window.clearInterval(clockTimer);
  }
});

const appTitle = computed(() => activeAppName.value);

function toggleTheme() {
  updatePreferences({
    theme: { mode: isDark.value ? 'light' : 'dark' },
  });
}

function toggleSidebar() {
  updatePreferences({
    sidebar: {
      collapsed: !preferences.sidebar.collapsed,
    },
  });
}

function toggleEditDesktop() {
  if (!isDesktopMode.value) {
    goDesktop();
  }
  desktopEditing.value = !desktopEditing.value;
}

function openAddWidget() {
  if (!isDesktopMode.value) {
    goDesktop();
  }
  desktopEditing.value = true;
  desktopLibraryOpen.value = true;
}

function handleMenuClick(info: { key: number | string }) {
  switch (String(info.key)) {
    case 'desktop': {
      goDesktop();
      break;
    }
    case 'edit-desktop': {
      toggleEditDesktop();
      break;
    }
    case 'launchpad': {
      launchpadOpen.value = true;
      break;
    }
    case 'lock': {
      emit('lockScreen');
      break;
    }
    case 'logout': {
      emit('logout');
      break;
    }
  }
}
</script>

<template>
  <header class="macos-menubar">
    <div class="macos-menubar__backdrop" aria-hidden="true"></div>

    <div class="macos-menubar__content">
      <!-- 左侧：品牌系统菜单 + 当前应用上下文 -->
      <div class="macos-menubar__left">
        <Dropdown :trigger="['click']">
          <button class="macos-menubar__apple" title="系统菜单" type="button">
            <img
              v-if="preferences.logo.source"
              :src="preferences.logo.source"
              alt="Logo"
              class="macos-menubar__logo-img"
            />
            <span v-else class="macos-menubar__logo-dot"></span>
          </button>
          <template #overlay>
            <Menu @click="handleMenuClick">
              <Menu.Item key="desktop">回到工作台桌面</Menu.Item>
              <Menu.Item key="launchpad">打开全部应用 (启动台)</Menu.Item>
              <Menu.Item key="edit-desktop">
                {{ desktopEditing ? '完成整理桌面' : '整理桌面小组件' }}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="lock">锁定屏幕</Menu.Item>
              <Menu.Item key="logout" danger>退出登录</Menu.Item>
            </Menu>
          </template>
        </Dropdown>

        <div class="macos-menubar__app-name">
          <span v-if="!isDesktopMode" class="macos-menubar__app-dot">
            <MacAppIcon
              :fallback-icon="
                typeof activeApp?.icon === 'string' ? activeApp.icon : undefined
              "
              :path="activeApp?.path || DESKTOP_APP_PATH"
              variant="mini"
            />
          </span>
          <span>{{ appTitle }}</span>
        </div>

        <div class="macos-menubar__actions">
          <template v-if="isDesktopMode">
            <button
              class="macos-menubar__pill"
              :class="{ 'is-active': desktopEditing }"
              type="button"
              @click="toggleEditDesktop"
            >
              <span>{{ desktopEditing ? '完成整理' : '整理桌面' }}</span>
            </button>
            <button
              class="macos-menubar__pill"
              type="button"
              @click="openAddWidget"
            >
              <Plus class="size-3.5" />
              <span>小组件</span>
            </button>
            <Popover
              v-model:open="wallpaperPopoverOpen"
              placement="bottomLeft"
              trigger="click"
            >
              <button class="macos-menubar__pill" type="button">
                <Palette class="size-3.5" />
                <span>壁纸</span>
              </button>
              <template #content>
                <div class="wallpaper-picker">
                  <div class="wallpaper-picker__title">桌面壁纸</div>
                  <div class="wallpaper-picker__grid">
                    <button
                      v-for="preset in WALLPAPER_PRESETS"
                      :key="preset.id"
                      class="wallpaper-picker__item"
                      :class="{ 'is-active': wallpaper === preset.id }"
                      type="button"
                      @click="setWallpaper(preset.id)"
                    >
                      <span
                        class="wallpaper-picker__swatch"
                        :style="{ background: preset.swatch }"
                      ></span>
                      <span class="wallpaper-picker__name">
                        {{ preset.name }}
                      </span>
                    </button>
                  </div>
                </div>
              </template>
            </Popover>
          </template>

          <template v-else>
            <button
              class="macos-menubar__pill"
              title="回到工作台桌面"
              type="button"
              @click="goDesktop"
            >
              <ArrowLeft class="size-3.5" />
              <span>桌面</span>
            </button>
            <button
              class="macos-menubar__pill"
              title="折叠/展开左侧菜单"
              type="button"
              @click="toggleSidebar"
            >
              <PanelLeft class="size-3.5" />
              <span>侧栏</span>
            </button>
          </template>

          <button
            class="macos-menubar__pill"
            title="全部应用"
            type="button"
            @click="launchpadOpen = !launchpadOpen"
          >
            <LayoutGrid class="size-3.5" />
            <span class="hidden sm:inline">启动台</span>
          </button>
        </div>
      </div>

      <!-- 右侧：状态栏控件（租户 / 聚光灯搜索 / 通知 / 主题 / 偏好 / 时钟 / 头像） -->
      <div class="macos-menubar__right">
        <slot name="tenant"></slot>

        <div class="macos-menubar__widget macos-menubar__search">
          <GlobalSearch
            :enable-shortcut-key="true"
            :menus="accessStore.accessMenus"
          />
        </div>

        <div class="macos-menubar__widget">
          <slot name="notification"></slot>
        </div>

        <button
          class="macos-menubar__icon-btn"
          :title="isDark ? '切换浅色外观' : '切换深色外观'"
          type="button"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="size-3.5" />
          <MoonStar v-else class="size-3.5" />
        </button>

        <div class="macos-menubar__widget">
          <slot name="preferences"></slot>
        </div>

        <span class="macos-menubar__clock">{{ clockText }}</span>

        <div class="macos-menubar__user">
          <slot name="user-dropdown"></slot>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.macos-menubar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 260;
  height: 34px;
  user-select: none;
  border-bottom: 1px solid rgb(255 255 255 / 24%);
}

.dark .macos-menubar {
  border-bottom-color: rgb(255 255 255 / 10%);
}

.macos-menubar__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: rgb(255 255 255 / 54%);
  backdrop-filter: blur(24px) saturate(185%);
}

.dark .macos-menubar__backdrop {
  background: rgb(17 20 28 / 64%);
}

.macos-menubar__content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 12px;
  font-size: 13px;
  color: rgb(15 23 42 / 90%);
}

.dark .macos-menubar__content {
  color: rgb(248 250 252 / 92%);
}

.macos-menubar__left {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.macos-menubar__apple {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition: background-color 140ms ease;
}

.macos-menubar__apple:hover {
  background: rgb(15 23 42 / 8%);
}

.dark .macos-menubar__apple:hover {
  background: rgb(255 255 255 / 12%);
}

.macos-menubar__logo-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  border-radius: 4px;
}

.macos-menubar__logo-dot {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 4px;
}

.macos-menubar__app-name {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.macos-menubar__app-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 16%);
}

.macos-menubar__actions {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-left: 4px;
}

.macos-menubar__pill {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: inherit;
  white-space: nowrap;
  cursor: pointer;
  background: rgb(15 23 42 / 5%);
  border: 0;
  border-radius: 6px;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.dark .macos-menubar__pill {
  background: rgb(255 255 255 / 9%);
}

.macos-menubar__pill:hover {
  background: rgb(15 23 42 / 11%);
}

.dark .macos-menubar__pill:hover {
  background: rgb(255 255 255 / 16%);
}

.macos-menubar__pill.is-active {
  color: #fff;
  background: hsl(var(--primary));
}

.macos-menubar__right {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}

.macos-menubar__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition: background-color 140ms ease;
}

.macos-menubar__icon-btn:hover {
  background: rgb(15 23 42 / 8%);
}

.dark .macos-menubar__icon-btn:hover {
  background: rgb(255 255 255 / 12%);
}

.macos-menubar__widget {
  display: flex;
  align-items: center;
}

.macos-menubar__widget :deep(button) {
  height: 24px;
  padding-top: 0;
  padding-bottom: 0;
  border-radius: 6px;
}

.macos-menubar__search :deep(div) {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  background: rgb(15 23 42 / 6%) !important;
  border-radius: 6px;
}

.dark .macos-menubar__search :deep(div) {
  background: rgb(255 255 255 / 10%) !important;
}

.macos-menubar__search :deep(span) {
  font-size: 11px;
}

.macos-menubar__clock {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.macos-menubar__user :deep(div[class*='size-8']) {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.macos-menubar__user :deep(span.hidden) {
  font-size: 12px;
}

.wallpaper-picker {
  width: 220px;
}

.wallpaper-picker__title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.wallpaper-picker__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.wallpaper-picker__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
  padding: 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  transition:
    border-color 140ms ease,
    transform 140ms ease;
}

.wallpaper-picker__item:hover {
  transform: translateY(-1px);
}

.wallpaper-picker__item.is-active {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 1px hsl(var(--primary) / 40%);
}

.wallpaper-picker__swatch {
  width: 100%;
  height: 44px;
  border-radius: 7px;
}

.wallpaper-picker__name {
  padding: 0 2px;
  font-size: 11px;
  color: hsl(var(--foreground));
}

@media (max-width: 600px) {
  .macos-menubar__clock,
  .macos-menubar__actions {
    display: none;
  }
}
</style>

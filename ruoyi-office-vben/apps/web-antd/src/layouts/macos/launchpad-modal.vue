<script lang="ts" setup>
import type { MenuRecordRaw } from '@vben/types';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { Pin, PinOff, Search, X } from '@vben/icons';
import { $t } from '@vben/locales';

import { DESKTOP_APP_PATH, getAppMeta } from './config';
import MacAppIcon from './mac-app-icon.vue';
import { useMacOsShell } from './use-macos-shell';

defineOptions({ name: 'MacOsLaunchpad' });

const {
  activeApp,
  goDesktop,
  isAppPinned,
  launchableApps,
  launchpadOpen,
  openApp,
  resetPinnedApps,
  tabsOfApp,
  togglePinApp,
} = useMacOsShell();

const keyword = ref('');
const searchRef = ref<HTMLInputElement>();

const allDisplayApps = computed(() => {
  const desktopItem: MenuRecordRaw = {
    name: '工作台桌面',
    path: DESKTOP_APP_PATH,
  };
  const list = [desktopItem, ...launchableApps.value];
  const q = keyword.value.trim().toLowerCase();
  if (!q) {
    return list;
  }
  return list.filter((app) => {
    const title = $t(String(app.name)).toLowerCase();
    const meta = getAppMeta(app.path || '');
    const desc = (meta.description || '').toLowerCase();
    return (
      title.includes(q) ||
      (app.path || '').toLowerCase().includes(q) ||
      desc.includes(q)
    );
  });
});

watch(launchpadOpen, (open) => {
  if (open) {
    keyword.value = '';
    requestAnimationFrame(() => {
      searchRef.value?.focus();
    });
  }
});

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && launchpadOpen.value) {
    launchpadOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function getVisual(app: MenuRecordRaw) {
  return getAppMeta(
    app.path || '',
    typeof app.icon === 'string' ? app.icon : undefined,
  );
}

function launch(app: MenuRecordRaw) {
  if (app.path === DESKTOP_APP_PATH) {
    goDesktop();
  } else {
    openApp(app);
  }
}
</script>

<template>
  <Transition name="launchpad-fade">
    <div
      v-if="launchpadOpen"
      class="macos-launchpad"
      @click.self="launchpadOpen = false"
    >
      <div class="macos-launchpad__backdrop" aria-hidden="true"></div>

      <div
        class="macos-launchpad__container"
        @click.self="launchpadOpen = false"
      >
        <!-- 顶部搜索栏 -->
        <div class="macos-launchpad__header">
          <div class="macos-launchpad__search">
            <Search class="size-4 text-white/70" />
            <input
              ref="searchRef"
              v-model="keyword"
              placeholder="搜索系统应用（例如：ERP、WMS、CRM、流程）..."
              type="text"
            />
            <button
              v-if="keyword"
              class="macos-launchpad__clear"
              type="button"
              @click="keyword = ''"
            >
              <X class="size-3.5" />
            </button>
          </div>

          <button
            class="macos-launchpad__reset"
            title="恢复默认 Dock 固定应用"
            type="button"
            @click="resetPinnedApps"
          >
            恢复默认 Dock
          </button>

          <button
            class="macos-launchpad__close"
            title="关闭 (Esc)"
            type="button"
            @click="launchpadOpen = false"
          >
            <X class="size-4" />
          </button>
        </div>

        <!-- 应用网格 -->
        <div class="macos-launchpad__grid">
          <div
            v-for="app in allDisplayApps"
            :key="app.path"
            class="launchpad-tile"
            :class="{ 'is-active': activeApp?.path === app.path }"
            @click="launch(app)"
          >
            <button
              v-if="app.path && app.path !== DESKTOP_APP_PATH"
              class="launchpad-tile__pin"
              :class="{ 'is-pinned': isAppPinned(app.path) }"
              :title="isAppPinned(app.path) ? '从 Dock 移除' : '固定到 Dock'"
              type="button"
              @click.stop="togglePinApp(app.path)"
            >
              <PinOff v-if="isAppPinned(app.path)" class="size-3.5" />
              <Pin v-else class="size-3.5" />
            </button>

            <div class="launchpad-tile__icon">
              <MacAppIcon
                :fallback-icon="
                  typeof app.icon === 'string' ? app.icon : undefined
                "
                :path="app.path || DESKTOP_APP_PATH"
                variant="launchpad"
              />
              <span
                v-if="
                  app.path !== DESKTOP_APP_PATH && tabsOfApp(app).length > 0
                "
                class="launchpad-tile__running"
                title="运行中"
              ></span>
            </div>

            <div class="launchpad-tile__name">{{ $t(String(app.name)) }}</div>
            <div class="launchpad-tile__desc">
              {{ getVisual(app).description || app.path }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.macos-launchpad {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 58px 24px 104px;
  overflow-y: auto;
}

.macos-launchpad__backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: rgb(15 23 42 / 56%);
  backdrop-filter: blur(34px) saturate(160%);
}

.macos-launchpad__container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
  max-width: 1020px;
}

.macos-launchpad__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.macos-launchpad__search {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  max-width: 440px;
  height: 40px;
  padding: 0 14px;
  background: rgb(255 255 255 / 14%);
  border: 1px solid rgb(255 255 255 / 26%);
  border-radius: 12px;
  box-shadow: 0 8px 24px -10px rgb(0 0 0 / 35%);
}

.macos-launchpad__search input {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: #fff;
  outline: none;
  background: transparent;
  border: 0;
}

.macos-launchpad__search input::placeholder {
  color: rgb(255 255 255 / 60%);
}

.macos-launchpad__clear,
.macos-launchpad__close,
.macos-launchpad__reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  color: rgb(255 255 255 / 88%);
  cursor: pointer;
  background: rgb(255 255 255 / 14%);
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 10px;
  transition: background-color 140ms ease;
}

.macos-launchpad__clear {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
}

.macos-launchpad__close {
  width: 36px;
}

.macos-launchpad__reset {
  padding: 0 12px;
  font-size: 12px;
  white-space: nowrap;
}

.macos-launchpad__clear:hover,
.macos-launchpad__close:hover,
.macos-launchpad__reset:hover {
  background: rgb(255 255 255 / 24%);
}

.macos-launchpad__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(146px, 1fr));
  gap: 18px;
}

.launchpad-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 18px 12px 14px;
  color: #fff;
  text-align: center;
  cursor: pointer;
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 20px;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}

.launchpad-tile:hover {
  background: rgb(255 255 255 / 16%);
  border-color: rgb(255 255 255 / 32%);
  transform: translateY(-3px);
}

.launchpad-tile.is-active {
  background: rgb(59 130 246 / 26%);
  border-color: rgb(147 197 253 / 65%);
}

.launchpad-tile__pin {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: rgb(255 255 255 / 72%);
  cursor: pointer;
  background: rgb(0 0 0 / 26%);
  border: 0;
  border-radius: 8px;
  opacity: 0;
  transition:
    opacity 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.launchpad-tile:hover .launchpad-tile__pin,
.launchpad-tile__pin.is-pinned {
  opacity: 1;
}

.launchpad-tile__pin.is-pinned {
  color: #fff;
  background: hsl(var(--primary));
}

.launchpad-tile__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
}

.launchpad-tile__running {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: 2px solid rgb(15 23 42 / 90%);
  border-radius: 999px;
}

.launchpad-tile__name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.launchpad-tile__desc {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 11px;
  line-height: 1.4;
  color: rgb(255 255 255 / 68%);
  -webkit-box-orient: vertical;
}

.launchpad-fade-enter-active,
.launchpad-fade-leave-active {
  transition: opacity 180ms ease;
}

.launchpad-fade-enter-from,
.launchpad-fade-leave-to {
  opacity: 0;
}
</style>

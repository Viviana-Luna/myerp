<script lang="ts" setup>
import type { TabDefinition } from '@vben/types';

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useRefresh } from '@vben/hooks';
import { PanelLeft, RotateCw, X } from '@vben/icons';
import { Breadcrumb } from '@vben/layouts';
import { preferences, updatePreferences } from '@vben/preferences';

import { DESKTOP_APP_PATH } from './config';
import MacAppIcon from './mac-app-icon.vue';
import { getTabKey, getTabTitle, useMacOsShell } from './use-macos-shell';

defineOptions({ name: 'MacOsAppWindowBar' });

const route = useRoute();
const router = useRouter();
const { refresh } = useRefresh();

const { activeApp, activeAppName, activeAppTabs, closeTabInApp } =
  useMacOsShell();

const isSidebarCollapsed = computed(() => preferences.sidebar.collapsed);

function toggleSidebar() {
  updatePreferences({
    sidebar: {
      collapsed: !preferences.sidebar.collapsed,
    },
  });
}

function isTabActive(tab: TabDefinition) {
  return tab.path === route.path || tab.fullPath === route.fullPath;
}

function openTab(tab: TabDefinition) {
  router.push(tab.fullPath || tab.path);
}
</script>

<template>
  <div class="macos-window-bar">
    <div class="macos-window-bar__backdrop" aria-hidden="true"></div>

    <div class="macos-window-bar__content">
      <!-- 左侧：侧边栏折叠 + 当前应用标题 -->
      <div class="macos-window-bar__left">
        <button
          class="macos-window-bar__btn"
          :title="isSidebarCollapsed ? '展开左侧菜单' : '折叠左侧菜单'"
          type="button"
          @click="toggleSidebar"
        >
          <PanelLeft class="size-3.5" />
        </button>

        <div class="macos-window-bar__badge">
          <span class="macos-window-bar__badge-icon">
            <MacAppIcon
              :fallback-icon="
                typeof activeApp?.icon === 'string' ? activeApp.icon : undefined
              "
              :path="activeApp?.path || DESKTOP_APP_PATH"
              variant="mini"
            />
          </span>
          <span class="macos-window-bar__badge-title">{{ activeAppName }}</span>
        </div>
      </div>

      <!-- 中间：仅当前应用的打开标签栏（类似 Safari / Finder 标签） -->
      <div class="macos-window-bar__tabs">
        <div
          v-for="tab in activeAppTabs"
          :key="getTabKey(tab)"
          class="macos-window-tab"
          :class="{ 'is-active': isTabActive(tab) }"
          @click="openTab(tab)"
        >
          <span class="macos-window-tab__title">{{ getTabTitle(tab) }}</span>
          <button
            class="macos-window-tab__close"
            title="关闭页面"
            type="button"
            @click.stop="closeTabInApp(tab)"
          >
            <X class="size-3" />
          </button>
        </div>
      </div>

      <!-- 右侧：面包屑 + 刷新 -->
      <div class="macos-window-bar__right">
        <div class="macos-window-bar__breadcrumb hidden xl:flex">
          <Breadcrumb :hide-when-only-one="true" :show-icon="false" />
        </div>

        <button
          class="macos-window-bar__btn"
          title="刷新当前页面"
          type="button"
          @click="refresh"
        >
          <RotateCw class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.macos-window-bar {
  position: relative;
  flex-shrink: 0;
  height: 40px;
  user-select: none;
  border-bottom: 1px solid hsl(var(--border) / 70%);
}

.macos-window-bar__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: rgb(250 251 254 / 86%);
  backdrop-filter: blur(18px) saturate(160%);
}

.dark .macos-window-bar__backdrop {
  background: rgb(28 31 40 / 88%);
}

.macos-window-bar__content {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 10px;
  align-items: center;
  height: 100%;
  padding: 0 12px;
}

.macos-window-bar__left {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.macos-window-bar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.macos-window-bar__btn:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

.macos-window-bar__badge {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-right: 4px;
}

.macos-window-bar__badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 16%);
}

.macos-window-bar__badge-title {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.macos-window-bar__tabs {
  display: flex;
  flex: 1;
  gap: 4px;
  align-items: center;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.macos-window-bar__tabs::-webkit-scrollbar {
  display: none;
}

.macos-window-tab {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 180px;
  height: 28px;
  padding: 0 8px 0 10px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: hsl(var(--muted) / 45%);
  border: 1px solid transparent;
  border-radius: 8px;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    border-color 140ms ease;
}

.macos-window-tab:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 80%);
}

.macos-window-tab.is-active {
  font-weight: 500;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border-color: hsl(var(--border) / 85%);
  box-shadow: 0 1px 3px rgb(15 23 42 / 7%);
}

.macos-window-tab__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.macos-window-tab__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  opacity: 0.65;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    opacity 120ms ease;
}

.macos-window-tab__close:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--border) / 70%);
  opacity: 1;
}

.macos-window-bar__right {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
}

.macos-window-bar__breadcrumb {
  align-items: center;
  max-width: 280px;
  overflow: hidden;
  font-size: 12px;
}
</style>

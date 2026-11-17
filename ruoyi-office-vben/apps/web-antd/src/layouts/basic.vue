<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { SystemTenantApi } from '#/api/system/tenant';

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { AuthenticationLoginExpiredModal, useVbenModal } from '@vben/common-ui';
import { isTenantEnable, useTabs, useWatermark } from '@vben/hooks';
import { AntdProfileOutlined } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  LockScreenModal,
  Notification,
  PreferencesButton,
  TenantDropdown,
  UserDropdown,
} from '@vben/layouts';
import { preferences, updatePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  getUnreadNotifyMessageCount,
  getUnreadNotifyMessageList,
  updateAllNotifyMessageRead,
  updateNotifyMessageRead,
} from '#/api/system/notify/message';
import { getSimpleTenantList } from '#/api/system/tenant';
import { $t } from '#/locales';
import { router } from '#/router';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

import MacOsAppWindowBar from './macos/app-window-bar.vue';
import { DESKTOP_ROUTE_PATH } from './macos/config';
import MacOsDockBar from './macos/dock-bar.vue';
import MacOsLaunchpad from './macos/launchpad-modal.vue';
import MacOsMenuBar from './macos/menu-bar.vue';
import { useMacOsShell } from './macos/use-macos-shell';

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { hasAccessByCodes } = useAccess();
const { destroyWatermark, updateWatermark } = useWatermark();
const { closeOtherTabs, refreshTab } = useTabs();

const { isDesktopMode, isDockVisible, toggleDock, wallpaper } = useMacOsShell();

const windowBodyRef = ref<HTMLElement>();
const sidebarAsideEl = ref<HTMLElement | null>(null);
let sidebarObserver: MutationObserver | undefined;

function syncSidebarAside() {
  const aside = windowBodyRef.value?.querySelector('aside');
  sidebarAsideEl.value = aside instanceof HTMLElement ? aside : null;
}

/**
 * 保证本地缓存过的旧版 Vben 偏好不会破坏 macOS 外壳形态
 */
if (
  preferences.app.layout !== 'mixed-nav' ||
  preferences.app.defaultHomePath !== DESKTOP_ROUTE_PATH ||
  preferences.app.preferencesButtonPosition !== 'header' ||
  preferences.app.contentPadding !== 0 ||
  preferences.header.enable ||
  preferences.header.height !== 0 ||
  !preferences.tabbar.enable ||
  preferences.tabbar.height !== 0 ||
  !preferences.navigation.split
) {
  updatePreferences({
    app: {
      contentPadding: 0,
      contentPaddingBottom: 0,
      contentPaddingLeft: 0,
      contentPaddingRight: 0,
      contentPaddingTop: 0,
      defaultHomePath: DESKTOP_ROUTE_PATH,
      layout: 'mixed-nav',
      preferencesButtonPosition: 'header',
    },
    header: {
      enable: false,
      height: 0,
    },
    navigation: {
      split: true,
    },
    tabbar: {
      enable: true,
      height: 0,
      keepAlive: true,
    },
  });
}

const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);
const showDot = computed(() => unreadCount.value > 0);

const [LockModal, lockModalApi] = useVbenModal({
  connectedComponent: LockScreenModal,
});

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: AntdProfileOutlined,
    text: $t('ui.widgets.profile'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleLockScreen() {
  lockModalApi.open();
}

function handleSubmitLock(lockScreenPassword: string) {
  lockModalApi.close();
  accessStore.lockScreen(lockScreenPassword);
}

/** 获得未读消息数 */
async function handleNotificationGetUnreadCount() {
  unreadCount.value = await getUnreadNotifyMessageCount();
}

/** 获得消息列表 */
async function handleNotificationGetList() {
  const list = await getUnreadNotifyMessageList();
  notifications.value = list.map((item) => ({
    avatar: preferences.app.defaultAvatar,
    date: formatDateTime(item.createTime) as string,
    id: item.id,
    isRead: false,
    message: item.templateContent,
    title: item.templateNickname,
  }));
}

/** 跳转我的站内信 */
function handleNotificationViewAll() {
  router.push({
    name: 'MyNotifyMessage',
  });
}

/** 标记所有已读 */
async function handleNotificationMakeAll() {
  await updateAllNotifyMessageRead();
  unreadCount.value = 0;
  notifications.value = [];
}

/** 清空通知 */
async function handleNotificationClear() {
  await handleNotificationMakeAll();
}

/** 标记单个已读 */
async function handleNotificationRead(item: NotificationItem) {
  if (!item.id) {
    return;
  }
  await updateNotifyMessageRead([item.id]);
  await handleNotificationGetUnreadCount();
  notifications.value = notifications.value.filter((n) => n.id !== item.id);
}

/** 处理通知打开 */
function handleNotificationOpen(open: boolean) {
  if (!open) {
    return;
  }
  handleNotificationGetList();
  handleNotificationGetUnreadCount();
}

// 租户列表
const tenants = ref<SystemTenantApi.Tenant[]>([]);
const tenantEnable = computed(
  () => hasAccessByCodes(['system:tenant:visit']) && isTenantEnable(),
);

/** 获取租户列表 */
async function handleGetTenantList() {
  if (tenantEnable.value) {
    tenants.value = await getSimpleTenantList();
  }
}

/** 处理租户切换 */
async function handleTenantChange(tenant: SystemTenantApi.Tenant) {
  if (!tenant || !tenant.id) {
    message.error('切换租户失败');
    return;
  }
  accessStore.setVisitTenantId(tenant.id as number);
  await closeOtherTabs();
  await refreshTab();
  message.success(`切换当前租户为: ${tenant.name}`);
}

// ========== 初始化 ==========
onMounted(() => {
  nextTick(() => {
    syncSidebarAside();
    if (windowBodyRef.value) {
      sidebarObserver = new MutationObserver(() => {
        syncSidebarAside();
      });
      sidebarObserver.observe(windowBodyRef.value, {
        childList: true,
        subtree: true,
      });
    }
  });
  handleNotificationGetUnreadCount();
  handleGetTenantList();
  setInterval(
    () => {
      if (userStore.userInfo) {
        handleNotificationGetUnreadCount();
      }
    },
    1000 * 60 * 2,
  );
});

onUnmounted(() => {
  sidebarObserver?.disconnect();
});

watch(isDesktopMode, async () => {
  await nextTick();
  syncSidebarAside();
});

watch(
  () => ({
    content: preferences.app.watermarkContent,
    enable: preferences.app.watermark,
  }),
  async ({ content, enable }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.id} - ${userStore.userInfo?.nickname}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div
    class="macos-shell"
    :class="{
      'is-desktop': isDesktopMode,
    }"
    :data-wallpaper="wallpaper"
  >
    <!-- macOS 壁纸层 -->
    <div class="macos-wallpaper" aria-hidden="true"></div>

    <!-- 顶部 macOS 菜单栏 -->
    <MacOsMenuBar @lock-screen="handleLockScreen" @logout="handleLogout">
      <template #tenant>
        <div v-if="tenantEnable && false">
          <TenantDropdown
            class="mr-1"
            :tenant-list="tenants"
            :visit-tenant-id="accessStore.visitTenantId"
            @success="handleTenantChange"
          />
        </div>
      </template>
      <template #notification>
        <Notification
          :dot="showDot"
          :notifications="notifications"
          @clear="handleNotificationClear"
          @make-all="handleNotificationMakeAll"
          @open="handleNotificationOpen"
          @read="handleNotificationRead"
          @view-all="handleNotificationViewAll"
        />
      </template>
      <template #preferences>
        <PreferencesButton @clear-preferences-and-logout="handleLogout" />
      </template>
      <template #user-dropdown>
        <UserDropdown
          :avatar
          :company-name="userStore.userInfo?.companyName"
          :dept-name="userStore.userInfo?.deptName"
          :description="userStore.userInfo?.email"
          :menus
          :tag-text="userStore.userInfo?.username"
          :text="userStore.userInfo?.nickname"
          @logout="handleLogout"
        />
      </template>
    </MacOsMenuBar>

    <!-- 桌面画布 / 应用窗口 -->
    <div class="macos-stage">
      <div class="macos-window">
        <MacOsAppWindowBar v-if="!isDesktopMode" />

        <div ref="windowBodyRef" class="macos-window__body">
          <BasicLayout @clear-preferences-and-logout="handleLogout">
            <template #extra>
              <AuthenticationLoginExpiredModal
                v-model:open="accessStore.loginExpired"
                :avatar
              >
                <LoginForm />
              </AuthenticationLoginExpiredModal>
            </template>
            <template #lock-screen>
              <LockScreen :avatar @to-login="handleLogout" />
            </template>
          </BasicLayout>

          <Teleport
            v-if="sidebarAsideEl && !isDesktopMode"
            :to="sidebarAsideEl"
          >
            <button
              class="macos-sidebar-dock-btn"
              :class="{
                'is-active': isDockVisible,
                'is-collapsed': preferences.sidebar.collapsed,
              }"
              :title="isDockVisible ? '收纳程序坞 (Dock)' : '显示程序坞 (Dock)'"
              type="button"
              @click.stop="toggleDock"
            >
              <svg
                aria-hidden="true"
                class="macos-sidebar-dock-btn__icon"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                viewBox="0 0 18 18"
              >
                <rect height="12.5" rx="3" width="14.5" x="1.75" y="2.75" />
                <path d="M5 12h8" />
                <rect
                  fill="currentColor"
                  height="2.2"
                  rx="0.6"
                  stroke="none"
                  width="2.2"
                  x="4.9"
                  y="6.8"
                />
                <rect
                  fill="currentColor"
                  height="2.2"
                  rx="0.6"
                  stroke="none"
                  width="2.2"
                  x="7.9"
                  y="6.8"
                />
                <rect
                  fill="currentColor"
                  height="2.2"
                  rx="0.6"
                  stroke="none"
                  width="2.2"
                  x="10.9"
                  y="6.8"
                />
              </svg>
              <span
                v-if="!preferences.sidebar.collapsed"
                class="macos-sidebar-dock-btn__label"
              >
                程序坞
              </span>
            </button>
          </Teleport>
        </div>
      </div>
    </div>

    <!-- 底部 macOS Dock 栏 -->
    <MacOsDockBar />

    <!-- 启动台（全部应用） -->
    <MacOsLaunchpad />
  </div>

  <LockModal
    v-if="preferences.widget.lockScreen"
    :avatar="avatar"
    :text="userStore.userInfo?.nickname"
    @submit="handleSubmitLock"
  />
</template>

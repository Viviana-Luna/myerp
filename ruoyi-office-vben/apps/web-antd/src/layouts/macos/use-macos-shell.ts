import type { MenuRecordRaw, TabDefinition } from '@vben/types';

import type { WallpaperId } from './config';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useTabs } from '@vben/hooks';
import { $t } from '@vben/locales';
import { useAccessStore, useTabbarStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import {
  DEFAULT_DOCK_PATHS,
  DESKTOP_APP_PATH,
  DESKTOP_ROUTE_PATH,
  getAppMeta,
  WALLPAPER_PRESETS,
} from './config';

const STORAGE_WALLPAPER = 'macos-shell:wallpaper';
const STORAGE_PINNED_APPS = 'macos-shell:pinned-apps';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 忽略持久化失败
  }
}

const initialWallpaper = readStorage<WallpaperId>(STORAGE_WALLPAPER, 'sequoia');
const wallpaper = ref<WallpaperId>(
  WALLPAPER_PRESETS.some((item) => item.id === initialWallpaper)
    ? initialWallpaper
    : 'sequoia',
);

const pinnedAppPaths = ref<string[]>(
  readStorage<string[]>(STORAGE_PINNED_APPS, DEFAULT_DOCK_PATHS),
);

const launchpadOpen = ref(false);
const dockRevealedInApp = ref(false);
const desktopEditing = ref(false);
const desktopLibraryOpen = ref(false);
const desktopResetNonce = ref(0);

/** 每个一级应用最后访问的路由，从桌面切回应用时恢复现场 */
const lastPathByApp = ref<Record<string, string>>({});

export function isExternalUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

export function getTabKey(tab: TabDefinition) {
  return tab.key ?? tab.fullPath ?? tab.path;
}

export function getTabTitle(tab: TabDefinition) {
  const title = (tab.meta?.title ?? '') as string;
  return title ? $t(title) : tab.path;
}

export function useMacOsShell() {
  const route = useRoute();
  const router = useRouter();
  const accessStore = useAccessStore();
  const tabbarStore = useTabbarStore();
  const { closeTabByKey } = useTabs();

  const isDesktopMode = computed(
    () => route.path === DESKTOP_ROUTE_PATH || route.path === DESKTOP_APP_PATH,
  );

  /** 桌面态常驻显示 Dock；进入应用后自动收纳，需主动点击按钮才弹出 */
  const isDockVisible = computed(
    () => isDesktopMode.value || dockRevealedInApp.value,
  );

  function revealDock() {
    dockRevealedInApp.value = true;
  }

  function hideDock() {
    dockRevealedInApp.value = false;
  }

  function toggleDock() {
    if (!isDesktopMode.value) {
      dockRevealedInApp.value = !dockRevealedInApp.value;
    }
  }

  /** 所有已授权的内部一级应用（工作台不列入普通应用列表，作为固定“桌面”入口） */
  const allMenus = computed<MenuRecordRaw[]>(() => {
    const menus = (accessStore.accessMenus ?? []) as MenuRecordRaw[];
    return menus.filter((menu) => menu.path && !isExternalUrl(menu.path));
  });

  /** 除“工作台”目录外的所有可启动业务/系统应用 */
  const launchableApps = computed<MenuRecordRaw[]>(() =>
    allMenus.value.filter((menu) => menu.path !== DESKTOP_APP_PATH),
  );

  const allTabs = computed<TabDefinition[]>(() =>
    (tabbarStore.getTabs ?? []).filter(
      (tab) => tab.path !== DESKTOP_ROUTE_PATH && tab.path !== DESKTOP_APP_PATH,
    ),
  );

  /** 判断某个路由属于哪个一级应用 */
  function matchAppByPath(path: string): MenuRecordRaw | undefined {
    let matched: MenuRecordRaw | undefined;
    for (const app of allMenus.value) {
      const base = app.path as string;
      const isMatch = path === base || path.startsWith(`${base}/`);
      if (
        isMatch &&
        (!matched || base.length > (matched.path as string).length)
      ) {
        matched = app;
      }
    }
    return matched;
  }

  /** 当前激活的应用（如果在桌面则为工作台；如果在工作台子页面如首页管理/数据分析，也对应其应用） */
  const activeApp = computed<MenuRecordRaw | undefined>(() => {
    return matchAppByPath(route.path);
  });

  const activeAppName = computed(() => {
    if (isDesktopMode.value) {
      return '工作台桌面';
    }
    if (activeApp.value) {
      return $t(String(activeApp.value.name));
    }
    const title = route.meta?.title as string | undefined;
    return title ? $t(title) : '应用窗口';
  });

  const activeAppMeta = computed(() => {
    if (!activeApp.value?.path) {
      return getAppMeta(DESKTOP_APP_PATH);
    }
    return getAppMeta(
      activeApp.value.path,
      typeof activeApp.value.icon === 'string'
        ? activeApp.value.icon
        : undefined,
    );
  });

  function tabsOfApp(app: MenuRecordRaw): TabDefinition[] {
    const base = app.path as string;
    return allTabs.value.filter((tab) => {
      const path = tab.path || tab.fullPath || '';
      return path === base || path.startsWith(`${base}/`);
    });
  }

  /** 当前活跃窗口中仅属于当前应用的标签页 */
  const activeAppTabs = computed<TabDefinition[]>(() => {
    if (!activeApp.value || isDesktopMode.value) {
      return [];
    }
    return tabsOfApp(activeApp.value);
  });

  /** Dock 中展示的固定应用 + 正在运行但未固定的应用 */
  const dockPinnedApps = computed<MenuRecordRaw[]>(() => {
    const appMap = new Map(
      launchableApps.value.map((app) => [app.path as string, app]),
    );
    const result: MenuRecordRaw[] = [];
    for (const path of pinnedAppPaths.value) {
      const app = appMap.get(path);
      if (app) {
        result.push(app);
      }
    }
    return result;
  });

  const dockRunningExtraApps = computed<MenuRecordRaw[]>(() => {
    const pinnedSet = new Set(dockPinnedApps.value.map((app) => app.path));
    return launchableApps.value.filter(
      (app) => !pinnedSet.has(app.path) && tabsOfApp(app).length > 0,
    );
  });

  function routeExists(path: string) {
    const resolved = router.resolve(path);
    return !resolved.matched.some((item) => item.name === 'FallbackNotFound');
  }

  function findFirstLeaf(menu: MenuRecordRaw): MenuRecordRaw | undefined {
    const children = (menu.children ?? []).filter(
      (child) =>
        child.path && !isExternalUrl(child.path) && child.show !== false,
    );
    for (const child of children) {
      const leaf = findFirstLeaf(child);
      if (leaf) {
        return leaf;
      }
    }
    if (children.length === 0 && menu.path && !isExternalUrl(menu.path)) {
      return menu;
    }
    return undefined;
  }

  function resolveAppHomeTarget(app: MenuRecordRaw): string | undefined {
    if (app.path === DESKTOP_APP_PATH && routeExists(DESKTOP_ROUTE_PATH)) {
      return DESKTOP_ROUTE_PATH;
    }
    return findFirstLeaf(app)?.path ?? app.path;
  }

  /** 打开或切回应用：如果有上次停留页面且仍在打开标签中，优先恢复现场 */
  function openApp(app: MenuRecordRaw, forceHome = false) {
    if (!app.path) {
      return;
    }
    if (isExternalUrl(app.path)) {
      openWindow(app.path, { target: '_blank' });
      return;
    }
    launchpadOpen.value = false;
    dockRevealedInApp.value = false;

    if (app.path === DESKTOP_APP_PATH) {
      goDesktop();
      return;
    }

    const openTabs = tabsOfApp(app);
    const lastPath = lastPathByApp.value[app.path];
    if (
      !forceHome &&
      lastPath &&
      openTabs.some((t) => (t.fullPath || t.path) === lastPath)
    ) {
      router.push(lastPath);
      return;
    }
    if (!forceHome && openTabs.length > 0 && openTabs[0]) {
      router.push(openTabs[0].fullPath || openTabs[0].path);
      return;
    }

    const target = resolveAppHomeTarget(app);
    if (target) {
      router.push(target);
    }
  }

  function openAppByPath(path: string) {
    const app = allMenus.value.find((item) => item.path === path);
    if (app) {
      openApp(app);
    } else {
      router.push(path);
    }
  }

  function goDesktop() {
    launchpadOpen.value = false;
    dockRevealedInApp.value = false;
    router.push(DESKTOP_ROUTE_PATH);
  }

  /** 关闭某应用下打开的所有窗口标签 */
  async function closeApp(app: MenuRecordRaw) {
    const appTabs = tabsOfApp(app);
    const keys = appTabs.map((t) => getTabKey(t));
    if (app.path) {
      lastPathByApp.value = Object.fromEntries(
        Object.entries(lastPathByApp.value).filter(([key]) => key !== app.path),
      );
    }
    if (activeApp.value?.path === app.path) {
      await router.push(DESKTOP_ROUTE_PATH);
    }
    if (keys.length > 0) {
      await tabbarStore._bulkCloseByKeys(keys);
    }
  }

  /** 在当前应用窗口关闭单个标签页：如果是该应用最后一个标签，退出应用回桌面 */
  async function closeTabInApp(tab: TabDefinition) {
    const currentApp = matchAppByPath(tab.path);
    const sameAppTabs = currentApp
      ? tabsOfApp(currentApp)
      : activeAppTabs.value;
    const key = getTabKey(tab);
    const isCurrentRoute =
      (tab.fullPath || tab.path) === route.fullPath || tab.path === route.path;

    if (sameAppTabs.length <= 1) {
      if (currentApp) {
        await closeApp(currentApp);
      } else {
        await router.push(DESKTOP_ROUTE_PATH);
        await tabbarStore._bulkCloseByKeys([key]);
      }
      return;
    }

    if (isCurrentRoute) {
      const idx = sameAppTabs.findIndex((item) => getTabKey(item) === key);
      const nextTab = sameAppTabs[idx + 1] ?? sameAppTabs[idx - 1];
      if (nextTab) {
        await router.push(nextTab.fullPath || nextTab.path);
      }
      await tabbarStore._bulkCloseByKeys([key]);
      return;
    }

    await (tabbarStore.getTabs.length > 1
      ? closeTabByKey(key)
      : tabbarStore._bulkCloseByKeys([key]));
  }

  function setWallpaper(id: WallpaperId) {
    wallpaper.value = id;
    writeStorage(STORAGE_WALLPAPER, id);
  }

  function cycleWallpaper() {
    const idx = WALLPAPER_PRESETS.findIndex((w) => w.id === wallpaper.value);
    const next = WALLPAPER_PRESETS[(idx + 1) % WALLPAPER_PRESETS.length];
    if (next) {
      setWallpaper(next.id);
    }
  }

  function isAppPinned(path: string) {
    return pinnedAppPaths.value.includes(path);
  }

  function togglePinApp(path: string) {
    if (path === DESKTOP_APP_PATH) {
      return;
    }
    pinnedAppPaths.value = isAppPinned(path)
      ? pinnedAppPaths.value.filter((p) => p !== path)
      : [...pinnedAppPaths.value, path];
    writeStorage(STORAGE_PINNED_APPS, pinnedAppPaths.value);
  }

  function resetPinnedApps() {
    pinnedAppPaths.value = [...DEFAULT_DOCK_PATHS];
    writeStorage(STORAGE_PINNED_APPS, pinnedAppPaths.value);
  }

  function triggerDesktopReset() {
    desktopResetNonce.value += 1;
  }

  // 记录各应用的最近停留路由，并在切换页面/打开启动台时自动收纳应用内弹出的 Dock
  watch(
    () => route.fullPath,
    (fullPath) => {
      dockRevealedInApp.value = false;
      if (
        route.path === DESKTOP_ROUTE_PATH ||
        route.path === DESKTOP_APP_PATH
      ) {
        return;
      }
      desktopEditing.value = false;
      const app = matchAppByPath(route.path);
      if (app?.path) {
        lastPathByApp.value[app.path] = fullPath;
      }
    },
    { immediate: true },
  );

  watch(launchpadOpen, (open) => {
    if (open) {
      dockRevealedInApp.value = false;
    }
  });

  return {
    activeApp,
    activeAppMeta,
    activeAppName,
    activeAppTabs,
    allMenus,
    allTabs,
    closeApp,
    closeTabInApp,
    cycleWallpaper,
    desktopEditing,
    desktopLibraryOpen,
    desktopResetNonce,
    dockPinnedApps,
    dockRevealedInApp,
    dockRunningExtraApps,
    goDesktop,
    hideDock,
    isAppPinned,
    isDesktopMode,
    isDockVisible,
    launchableApps,
    launchpadOpen,
    openApp,
    openAppByPath,
    resetPinnedApps,
    revealDock,
    setWallpaper,
    tabsOfApp,
    toggleDock,
    togglePinApp,
    triggerDesktopReset,
    wallpaper,
  };
}

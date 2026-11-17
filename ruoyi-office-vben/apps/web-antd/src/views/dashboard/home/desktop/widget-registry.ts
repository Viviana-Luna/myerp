import type { Component } from 'vue';

import type { GridLayoutItem } from '../types/layout';

import MacWidgetCalendarSchedule from './widgets/widget-calendar-schedule.vue';
import MacWidgetClockGreeting from './widgets/widget-clock-greeting.vue';
import MacWidgetErpOverview from './widgets/widget-erp-overview.vue';
import MacWidgetNoticeBoard from './widgets/widget-notice-board.vue';
import MacWidgetQuickShortcuts from './widgets/widget-quick-shortcuts.vue';
import MacWidgetTodoTasks from './widgets/widget-todo-tasks.vue';
import MacWidgetWmsOverview from './widgets/widget-wms-overview.vue';

export interface DesktopWidgetMeta {
  code: string;
  name: string;
  description: string;
  component: Component;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
}

export const MAC_DESKTOP_WIDGETS: DesktopWidgetMeta[] = [
  {
    code: 'mac_clock_greeting',
    component: MacWidgetClockGreeting,
    defaultH: 4,
    defaultW: 8,
    description: '实时时钟、农历日期、个人问候与待办摘要',
    minH: 3,
    minW: 6,
    name: '时钟与今日概览',
  },
  {
    code: 'mac_erp_overview',
    component: MacWidgetErpOverview,
    defaultH: 4,
    defaultW: 8,
    description: 'ERP 销售与采购汇总卡片，支持一键进入 ERP',
    minH: 4,
    minW: 6,
    name: 'ERP 经营速览',
  },
  {
    code: 'mac_wms_overview',
    component: MacWidgetWmsOverview,
    defaultH: 4,
    defaultW: 8,
    description: 'WMS 仓库数量、采购订单与入库动态',
    minH: 4,
    minW: 6,
    name: 'WMS 仓储动态',
  },
  {
    code: 'mac_todo_tasks',
    component: MacWidgetTodoTasks,
    defaultH: 5,
    defaultW: 9,
    description: 'BPM 待办审批任务与我发起的流程单据',
    minH: 4,
    minW: 6,
    name: '流程审批与单据',
  },
  {
    code: 'mac_notice_board',
    component: MacWidgetNoticeBoard,
    defaultH: 5,
    defaultW: 7,
    description: '系统通知公告，支持桌面直接弹窗阅读',
    minH: 4,
    minW: 5,
    name: '通知公告',
  },
  {
    code: 'mac_calendar_schedule',
    component: MacWidgetCalendarSchedule,
    defaultH: 5,
    defaultW: 7,
    description: '月历与每日日程提醒卡片',
    minH: 5,
    minW: 6,
    name: '日历与日程',
  },
  {
    code: 'mac_quick_shortcuts',
    component: MacWidgetQuickShortcuts,
    defaultH: 5,
    defaultW: 8,
    description: '常用业务页面快捷入口矩阵',
    minH: 4,
    minW: 6,
    name: '快捷指令',
  },
];

const MAC_WIDGET_MAP = new Map(
  MAC_DESKTOP_WIDGETS.map((item) => [item.code, item]),
);

export function getMacWidgetMeta(code: string) {
  return MAC_WIDGET_MAP.get(code);
}

/** 24 栅格下默认呈现的高质感 macOS 桌面布局（适配 1280x800 以上屏一屏完整展示） */
export function createDefaultDesktopLayout(): GridLayoutItem[] {
  return [
    {
      componentCode: 'mac_clock_greeting',
      config: {},
      h: 4,
      i: 'mac-default-clock',
      minH: 3,
      minW: 6,
      w: 8,
      x: 0,
      y: 0,
    },
    {
      componentCode: 'mac_erp_overview',
      config: {},
      h: 4,
      i: 'mac-default-erp',
      minH: 4,
      minW: 6,
      w: 8,
      x: 8,
      y: 0,
    },
    {
      componentCode: 'mac_wms_overview',
      config: {},
      h: 4,
      i: 'mac-default-wms',
      minH: 4,
      minW: 6,
      w: 8,
      x: 16,
      y: 0,
    },
    {
      componentCode: 'mac_quick_shortcuts',
      config: {},
      h: 5,
      i: 'mac-default-shortcuts',
      minH: 4,
      minW: 6,
      w: 8,
      x: 0,
      y: 4,
    },
    {
      componentCode: 'mac_todo_tasks',
      config: {},
      h: 5,
      i: 'mac-default-todo',
      minH: 4,
      minW: 6,
      w: 9,
      x: 8,
      y: 4,
    },
    {
      componentCode: 'mac_notice_board',
      config: {},
      h: 5,
      i: 'mac-default-notice',
      minH: 4,
      minW: 5,
      w: 7,
      x: 17,
      y: 4,
    },
  ];
}

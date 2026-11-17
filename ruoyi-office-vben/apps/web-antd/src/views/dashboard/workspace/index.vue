<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();

const projectItems: WorkbenchProjectItem[] = [
  {
    color: '#10b981',
    content: '进销存、采购、销售、库存与财务一体化',
    date: '业务核心',
    group: 'ERP 进销存',
    icon: 'lucide:boxes',
    title: 'ERP 系统',
    url: '/erp/home',
  },
  {
    color: '#f97316',
    content: '仓库管理、采购入库与物资调拨',
    date: '仓储作业',
    group: 'WMS 仓储',
    icon: 'lucide:warehouse',
    title: '仓库管理',
    url: '/wms/warehousing',
  },
  {
    color: '#f43f5e',
    content: '客户关系、商机、合同与回款管理',
    date: '客户经营',
    group: 'CRM 客户',
    icon: 'lucide:handshake',
    title: 'CRM 系统',
    url: '/crm',
  },
  {
    color: '#2563eb',
    content: '协同办公、公文、会议与日常事务处理',
    date: '日常办公',
    group: 'OA 办公',
    icon: 'lucide:briefcase',
    title: 'OA 协同办公',
    url: '/oa',
  },
  {
    color: '#7c3aed',
    content: '审批流程引擎、待办任务与表单设计',
    date: '流程引擎',
    group: 'BPM 流程',
    icon: 'lucide:git-branch',
    title: '流程中心',
    url: '/bpm',
  },
  {
    color: '#db2777',
    content: '组织架构、员工档案与人事考勤管理',
    date: '人事管理',
    group: 'HRM 人力',
    icon: 'lucide:users',
    title: '人力资源管理',
    url: '/hrm',
  },
];

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: '首页',
    url: '/',
  },
  {
    color: '#ff6b6b',
    icon: 'lucide:shopping-bag',
    title: '商城中心',
    url: '/mall',
  },
  {
    color: '#7c3aed',
    icon: 'tabler:ai',
    title: 'AI 大模型',
    url: '/ai',
  },
  {
    color: '#3fb27f',
    icon: 'simple-icons:erpnext',
    title: 'ERP 系统',
    url: '/erp',
  },
  {
    color: '#4daf1bc9',
    icon: 'simple-icons:civicrm',
    title: 'CRM 系统',
    url: '/crm',
  },
  {
    color: '#1a73e8',
    icon: 'fa-solid:hdd',
    title: 'IoT 物联网',
    url: '/iot',
  },
];

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: `完成季度采购预算及供应商结算核对`,
    date: '今日 09:30',
    title: '采购预算核对',
  },
  {
    completed: false,
    content: `确认中转仓库最新一批采购入库单据与库存盘点`,
    date: '今日 14:20',
    title: '仓储入库复核',
  },
  {
    completed: false,
    content: `跟进重点客户季度合同续签与回款计划`,
    date: '明日 10:00',
    title: '客户合同跟进',
  },
  {
    completed: false,
    content: `审核部门周报及待办流程节点`,
    date: '本周五 16:00',
    title: '流程审批处理',
  },
]);
const trendItems: WorkbenchTrendItem[] = [
  {
    avatar: 'svg:avatar-1',
    content: `提交了 <a>采购入库单</a> 待仓储确认`,
    date: '刚刚',
    title: '采购部',
  },
  {
    avatar: 'svg:avatar-2',
    content: `更新了 <a>季度销售台账</a>`,
    date: '1个小时前',
    title: '销售部',
  },
  {
    avatar: 'svg:avatar-3',
    content: `完成了 <a>中转仓库常规盘点</a>`,
    date: '1天前',
    title: '仓储部',
  },
  {
    avatar: 'svg:avatar-4',
    content: `发布了 <a>内部流程审批规范更新</a>`,
    date: '2天前',
    title: '行政办',
  },
];

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        早安, {{ userStore.userInfo?.nickname }}, 开始您一天的工作吧！
      </template>
      <template #description> 今日晴，20℃ - 32℃！ </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject :items="projectItems" title="项目" @click="navTo" />
        <WorkbenchTrends :items="trendItems" class="mt-5" title="最新动态" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷导航"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" title="待办事项" />
        <AnalysisChartCard class="mt-5" title="访问来源">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>

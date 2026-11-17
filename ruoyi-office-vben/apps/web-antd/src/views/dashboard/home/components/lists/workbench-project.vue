<script lang="ts" setup>
import type { WorkbenchProjectItem } from '@vben/common-ui';

import { useRouter } from 'vue-router';

import { WorkbenchProject } from '@vben/common-ui';
import { openWindow } from '@vben/utils';

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: '核心模块',
});

const router = useRouter();

const projectItems: WorkbenchProjectItem[] = [
  {
    color: '#10b981',
    content: '采购、销售、库存与财务一体化管理',
    date: '业务核心',
    group: 'ERP 进销存',
    icon: 'lucide:boxes',
    title: 'ERP 系统',
    url: '/erp/home',
  },
  {
    color: '#f97316',
    content: '仓库档案、采购入库与物资调拨作业',
    date: '仓储管理',
    group: 'WMS 仓储',
    icon: 'lucide:warehouse',
    title: '仓库管理',
    url: '/wms/warehousing',
  },
  {
    color: '#f43f5e',
    content: '线索、客户、商机、合同与回款全周期',
    date: '客户经营',
    group: 'CRM 客户',
    icon: 'lucide:handshake',
    title: 'CRM 系统',
    url: '/crm',
  },
  {
    color: '#7c3aed',
    content: '可视化流程表单与待办审批流转中心',
    date: '审批协作',
    group: 'BPM 流程',
    icon: 'lucide:git-branch',
    title: '流程中心',
    url: '/bpm',
  },
];

function navTo(nav: WorkbenchProjectItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url);
  }
}
</script>

<template>
  <WorkbenchProject :items="projectItems" :title="title" @click="navTo" />
</template>

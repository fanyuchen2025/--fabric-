import React from 'react';
import { OrgRole } from '../types';

interface Props {
  role: OrgRole | string;
  className?: string;
}

const RoleBadge: React.FC<Props> = ({ role, className = '' }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  // 映射表
  const roleNames: Record<string, string> = {
    [OrgRole.SUPPLIER]: '供应商',
    [OrgRole.PROCESSOR]: '加工方',
    [OrgRole.LOGISTICS]: '物流方',
    [OrgRole.RETAILER]: '零售商',
    [OrgRole.CONSUMER]: '消费者',
    'HARVESTED': '已采摘',
    'PROCESSED': '已加工',
    'IN_TRANSIT': '运输中',
    'ON_SHELF': '已上架',
    'SOLD': '已售出'
  };

  switch (role) {
    case OrgRole.SUPPLIER:
    case 'HARVESTED':
      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      break;
    case OrgRole.PROCESSOR:
    case 'PROCESSED':
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case OrgRole.LOGISTICS:
    case 'IN_TRANSIT':
      colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case OrgRole.RETAILER:
    case 'ON_SHELF':
      colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
      break;
    case OrgRole.CONSUMER:
    case 'SOLD':
      colorClass = 'bg-rose-100 text-rose-800 border-rose-200';
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      {roleNames[role] || role}
    </span>
  );
};

export default RoleBadge;
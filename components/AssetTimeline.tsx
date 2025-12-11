import React from 'react';
import { LedgerEntry } from '../types';
import { CheckCircle, Truck, Package, Store, Sprout, Hash, Clock, FileSignature } from 'lucide-react';
import RoleBadge from './RoleBadge';

interface Props {
  data: LedgerEntry;
}

const AssetTimeline: React.FC<Props> = ({ data }) => {
  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN');

  const getIcon = (func: string) => {
    switch (func) {
      case 'createAsset': return <Sprout className="w-5 h-5 text-emerald-600" />;
      case 'processAsset': return <Package className="w-5 h-5 text-blue-600" />;
      case 'transportAsset': return <Truck className="w-5 h-5 text-amber-600" />;
      case 'receiveAsset': return <Store className="w-5 h-5 text-purple-600" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBlockTitle = (func: string) => {
    switch (func) {
        case 'createAsset': return '源头采摘与登记';
        case 'processAsset': return '加工与专业包装';
        case 'transportAsset': return '冷链物流运输';
        case 'receiveAsset': return '零售终端上架';
        default: return '未知操作';
    }
  };

  const translateKey = (key: string) => {
      const map: Record<string, string> = {
          name: '产品名称',
          category: '类别',
          origin: '原产地',
          harvestDate: '采摘日期',
          packageId: '包装编号',
          processTemp: '加工温度',
          logisticsId: '物流运单号',
          transportTemp: '运输温度',
          retailerName: '零售商名称',
          shelfLife: '保质期/最佳食用期'
      };
      return map[key] || key;
  };

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {data.history.map((block, index) => (
        <div key={block.txId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          
          {/* Icon Marker */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {getIcon(block.func)}
          </div>
          
          {/* Card Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between mb-2">
                <RoleBadge role={block.invoker} />
                <time className="text-xs text-slate-400 font-mono mt-1 sm:mt-0">{formatDate(block.timestamp)}</time>
            </div>
            
            <div className="text-sm font-bold text-slate-800 mb-1">
                {getBlockTitle(block.func)}
            </div>

            {/* Block Details */}
            <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2 rounded">
                {Object.entries(block.inputs).map(([key, val]) => (
                    key !== 'id' && (
                        <div key={key} className="flex justify-between border-b border-slate-200 last:border-0 pb-1 last:pb-0">
                            <span className="text-slate-500">{translateKey(key)}:</span>
                            <span className="font-medium text-right ml-2">{String(val)}</span>
                        </div>
                    )
                ))}
            </div>

            {/* Tech Specs */}
            <div className="text-[10px] text-slate-400 font-mono space-y-1 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                    <Hash size={10} />
                    <span className="truncate w-full" title={block.txId}>TxID: {block.txId}</span>
                </div>
                 <div className="flex items-center gap-1">
                    <FileSignature size={10} />
                    <span className="truncate w-full">Sig: {block.signature}</span>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssetTimeline;
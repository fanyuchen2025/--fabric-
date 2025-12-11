import React, { useState, useEffect } from 'react';
import { OrgRole, FoodAsset, LedgerEntry } from './types';
import { fabricService } from './services/fabricService';
import RoleBadge from './components/RoleBadge';
import AssetTimeline from './components/AssetTimeline';
import QrScannerMock from './components/QrScannerMock';
import { 
  Box, Truck, ShoppingBag, ShieldCheck, 
  Search, QrCode, Plus, ArrowRight, UserCircle,
  Database, Activity, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function App() {
  const [currentRole, setCurrentRole] = useState<OrgRole>(OrgRole.CONSUMER);
  const [assets, setAssets] = useState<FoodAsset[]>([]);
  const [scannedData, setScannedData] = useState<LedgerEntry | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Forms State - 使用受控组件
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [searchId, setSearchId] = useState('');

  // Initial Data Load
  useEffect(() => {
    refreshData();
  }, []);

  // 切换角色时清空表单，防止 ID 混淆
  useEffect(() => {
    setFormData({});
    setScannedData(null);
  }, [currentRole]);

  const refreshData = async () => {
    setLoading(true);
    const response = await fabricService.getAllAssets();
    if (response.payload) setAssets(response.payload);
    setLoading(false);
  };

  const handleTransaction = async (func: string, args: any) => {
    setLoading(true);
    const res = await fabricService.invokeChaincode(currentRole, func, args);
    setLoading(false);
    if (res.status === 200) {
      alert(`交易成功！\n交易 ID: ${res.payload?.substring(0, 16)}...`);
      setFormData({});
      refreshData();
    } else {
      alert(`交易失败: ${res.message}`);
    }
  };

  const handleScan = async (id: string) => {
    if (!id) return;
    setIsScanning(false);
    setLoading(true);
    const res = await fabricService.queryAsset(id);
    setLoading(false);
    if (res.status === 200 && res.payload) {
      setScannedData(res.payload);
      setSearchId(id);
    } else {
      alert("区块链账本中未找到该产品。");
    }
  };

  // Helper for controlled inputs
  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- Views ---

  const renderRoleSwitcher = () => (
    <div className="flex flex-wrap justify-center gap-2 p-4 bg-white border-b sticky top-0 z-40 shadow-sm">
        <span className="text-sm font-semibold text-slate-500 flex items-center mr-2">
            <UserCircle size={16} className="mr-1"/> 当前身份:
        </span>
        {Object.values(OrgRole).map(role => (
            <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    currentRole === role 
                    ? 'bg-slate-800 text-white shadow-md transform scale-105' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
                <RoleBadge role={role} />
            </button>
        ))}
    </div>
  );

  const renderConsumerView = () => (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <ShieldCheck size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">验证产品真伪</h1>
        <p className="text-slate-500">
            由 Hyperledger Fabric 区块链技术驱动。<br/>追踪您的高端食材从农场到餐桌的全过程。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-6">
            <input 
                type="text" 
                placeholder="输入资产 ID (例如: ASSET-8821-WAGYU)" 
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
            />
            <button 
                onClick={() => handleScan(searchId)}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-medium transition flex items-center justify-center gap-2"
            >
                <Search size={18} /> 查询
            </button>
        </div>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#f8fafc] text-slate-400">或者使用摄像头扫描</span>
            </div>
        </div>

        <button 
            onClick={() => setIsScanning(true)}
            className="w-full max-w-md px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 mx-auto"
        >
            <QrCode size={24} /> 扫描二维码
        </button>
      </div>

      {scannedData && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-500">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{scannedData.asset.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-slate-500">ID: {scannedData.asset.id}</span>
                        <RoleBadge role={scannedData.asset.status} />
                    </div>
                </div>
                {scannedData.asset.status === 'ON_SHELF' && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <ShieldCheck size={14} /> 验证为正品
                    </span>
                )}
            </div>

            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">原产地</span>
                    <span className="text-sm font-medium text-slate-700">{scannedData.asset.origin || 'N/A'}</span>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">类别</span>
                    <span className="text-sm font-medium text-slate-700">{scannedData.asset.category}</span>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">最近更新</span>
                    <span className="text-sm font-medium text-slate-700">{new Date(scannedData.asset.lastUpdated).toLocaleDateString('zh-CN')}</span>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">当前持有方</span>
                    <RoleBadge role={scannedData.asset.owner} />
                 </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-emerald-500" /> 完整溯源历史
            </h3>
            <AssetTimeline data={scannedData} />
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
      <div className="p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                 <Database className="text-blue-600" /> 联盟链账本状态
             </h2>
             <button onClick={refreshData} className="p-2 bg-white rounded-full shadow hover:bg-slate-50">
                 <RefreshCw size={20} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-sm text-slate-400 font-medium mb-4">资产分布 (按状态)</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { name: '已采摘', count: assets.filter(a => a.status === 'HARVESTED').length },
                            { name: '已加工', count: assets.filter(a => a.status === 'PROCESSED').length },
                            { name: '运输中', count: assets.filter(a => a.status === 'IN_TRANSIT').length },
                            { name: '已上架', count: assets.filter(a => a.status === 'ON_SHELF').length },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
              
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <h3 className="text-sm text-slate-400 font-medium mb-4">区块交易列表 (Ledger)</h3>
                <div className="max-h-64 overflow-y-auto scrollbar-hide">
                    <table className="w-full text-left text-sm relative">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3">资产 ID</th>
                                <th className="p-3">状态</th>
                                <th className="p-3">持有方</th>
                                <th className="p-3">更新时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assets.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-400">账本为空</td></tr>
                            ) : (
                                assets.map(asset => (
                                    <tr key={asset.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => handleScan(asset.id)}>
                                        <td className="p-3 font-mono text-xs font-medium text-slate-700">{asset.id}</td>
                                        <td className="p-3"><RoleBadge role={asset.status} /></td>
                                        <td className="p-3"><RoleBadge role={asset.owner} /></td>
                                        <td className="p-3 text-slate-500">{new Date(asset.lastUpdated).toLocaleDateString('zh-CN')} {new Date(asset.lastUpdated).toLocaleTimeString('zh-CN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">执行操作 (<RoleBadge role={currentRole} />)</h3>
              {renderActionForm()}
          </div>
      </div>
  );

  const renderActionForm = () => {
    const inputClass = "w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition";
    const labelClass = "block text-xs font-medium text-slate-500 mb-1";

    // 确保使用受控组件：value={formData.key || ''}
    
    switch (currentRole) {
        case OrgRole.SUPPLIER:
            return (
                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className={labelClass}>新资产 ID (唯一)</label>
                        <input className={inputClass} placeholder="例如：ASSET-001" 
                            value={formData.id || ''} 
                            onChange={e => handleInputChange('id', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>产品名称</label>
                        <input className={inputClass} placeholder="例如：有机牛油果" 
                            value={formData.name || ''} 
                            onChange={e => handleInputChange('name', e.target.value)} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>类别</label>
                            <input className={inputClass} placeholder="水果" 
                                value={formData.category || ''} 
                                onChange={e => handleInputChange('category', e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>采摘日期</label>
                            <input type="date" className={inputClass} 
                                value={formData.harvestDate || ''} 
                                onChange={e => handleInputChange('harvestDate', e.target.value)} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>原产地</label>
                        <input className={inputClass} placeholder="例如：云南, 中国" 
                            value={formData.origin || ''} 
                            onChange={e => handleInputChange('origin', e.target.value)} 
                        />
                    </div>
                    <button 
                        onClick={() => handleTransaction('createAsset', formData)}
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> 在区块链上创建资产
                    </button>
                </div>
            );
        case OrgRole.PROCESSOR:
            return (
                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className={labelClass}>目标资产 ID</label>
                        <input className={inputClass} placeholder="输入从供应商收到的资产 ID" 
                            value={formData.id || ''} 
                            onChange={e => handleInputChange('id', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>新包装编号 (Package ID)</label>
                        <input className={inputClass} placeholder="PKG-XXX" 
                            value={formData.packageId || ''} 
                            onChange={e => handleInputChange('packageId', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>加工温度</label>
                        <input className={inputClass} placeholder="-2℃" 
                            value={formData.processTemp || ''} 
                            onChange={e => handleInputChange('processTemp', e.target.value)} 
                        />
                    </div>
                    <button 
                        onClick={() => handleTransaction('processAsset', formData)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                    >
                        <Box size={16} /> 加工与包装
                    </button>
                </div>
            );
        case OrgRole.LOGISTICS:
            return (
                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className={labelClass}>目标资产 ID</label>
                        <input className={inputClass} placeholder="输入资产 ID" 
                            value={formData.id || ''} 
                            onChange={e => handleInputChange('id', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>物流追踪单号</label>
                        <input className={inputClass} placeholder="TRK-XXX" 
                            value={formData.logisticsId || ''} 
                            onChange={e => handleInputChange('logisticsId', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>运输温度</label>
                        <input className={inputClass} placeholder="4℃" 
                            value={formData.transportTemp || ''} 
                            onChange={e => handleInputChange('transportTemp', e.target.value)} 
                        />
                    </div>
                    <button 
                        onClick={() => handleTransaction('transportAsset', formData)}
                        className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-medium flex items-center justify-center gap-2"
                    >
                        <Truck size={16} /> 运输配送
                    </button>
                </div>
            );
         case OrgRole.RETAILER:
            return (
                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className={labelClass}>目标资产 ID</label>
                        <input className={inputClass} placeholder="输入资产 ID" 
                            value={formData.id || ''} 
                            onChange={e => handleInputChange('id', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>零售商名称</label>
                        <input className={inputClass} placeholder="例如：盒马鲜生" 
                            value={formData.retailerName || ''} 
                            onChange={e => handleInputChange('retailerName', e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>保质期 / 最佳食用日期</label>
                        <input type="date" className={inputClass} 
                            value={formData.shelfLife || ''} 
                            onChange={e => handleInputChange('shelfLife', e.target.value)} 
                        />
                    </div>
                    <button 
                        onClick={() => handleTransaction('receiveAsset', formData)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={16} /> 接收并上架
                    </button>
                </div>
            );
        default:
            return <div className="text-slate-400">请选择一个业务角色以执行操作。</div>
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {renderRoleSwitcher()}

      {isScanning && <QrScannerMock onScan={handleScan} onClose={() => setIsScanning(false)} />}

      <main>
        {currentRole === OrgRole.CONSUMER ? renderConsumerView() : renderDashboard()}
      </main>

      {/* Helper Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t py-2 px-6 text-xs text-slate-400 flex justify-between items-center z-30">
        <div>Fabric 节点模拟 v1.0.3</div>
        <div className="flex gap-4">
            <span>Peers 节点: 4</span>
            <span>Orderer 排序节点: 1</span>
            <span>网络状态: 正常</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
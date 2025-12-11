import { FoodAsset, OrgRole, BlockTransaction, LedgerEntry, ChaincodeResponse } from '../types';

// Mock "World State" and "Blockchain"
// 更新 Key 以清除旧的缓存数据，确保 seedData 重新执行
const LOCAL_STORAGE_KEY = 'fabric_ledger_v2_cn';

// Initial dummy data
const GENESIS_HASH = '00000000000000000000000000000000';

const generateHash = (data: string): string => {
  let hash = 0, i, chr;
  if (data.length === 0) return hash.toString();
  for (i = 0; i < data.length; i++) {
    chr = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
};

const generateTxId = (): string => {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

class FabricMockService {
  private ledger: Map<string, LedgerEntry>;

  constructor() {
    this.ledger = new Map();
    this.loadLedger();
    
    // Seed data if empty
    if (this.ledger.size === 0) {
        this.seedData();
    }
  }

  private loadLedger() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reconstruct Map from object
      Object.keys(parsed).forEach(key => {
        this.ledger.set(key, parsed[key]);
      });
    }
  }

  private saveLedger() {
    const obj: Record<string, LedgerEntry> = {};
    this.ledger.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
  }
  
  private seedData() {
      // 修复 Bug: 同步构建完整历史记录
      const demoId = "ASSET-8821-WAGYU";
      const baseTime = Date.now() - 10000000; 
      const history: BlockTransaction[] = [];
      
      let prevHash = GENESIS_HASH;

      // 1. Supplier: Create
      const createArgs = {
          id: demoId,
          name: "特级 A5 和牛",
          category: "肉类",
          origin: "日本兵库县神户市",
          harvestDate: "2023-10-25"
      };
      const block1 = this.createBlock(OrgRole.SUPPLIER, 'createAsset', createArgs, prevHash);
      block1.timestamp = baseTime;
      history.push(block1);
      prevHash = block1.currentHash;

      // 2. Processor: Process
      const processArgs = {
          id: demoId,
          packageId: "PKG-JP-992",
          processTemp: "-2°C"
      };
      const block2 = this.createBlock(OrgRole.PROCESSOR, 'processAsset', processArgs, prevHash);
      block2.timestamp = baseTime + 3600000 * 24; 
      history.push(block2);
      prevHash = block2.currentHash;

      // 3. Logistics: Transport
      const transportArgs = {
          id: demoId,
          logisticsId: "LOG-DHL-221",
          transportTemp: "-4°C"
      };
      const block3 = this.createBlock(OrgRole.LOGISTICS, 'transportAsset', transportArgs, prevHash);
      block3.timestamp = baseTime + 3600000 * 48; 
      history.push(block3);
      prevHash = block3.currentHash;

      // 4. Retailer: Receive
      const retailArgs = {
          id: demoId,
          retailerName: "银座美食精品超市",
          shelfLife: "2023-11-15"
      };
      const block4 = this.createBlock(OrgRole.RETAILER, 'receiveAsset', retailArgs, prevHash);
      block4.timestamp = baseTime + 3600000 * 72; 
      history.push(block4);

      // Construct final asset state
      const asset: FoodAsset = {
          id: demoId,
          name: createArgs.name,
          category: createArgs.category,
          createTime: block1.timestamp,
          lastUpdated: block4.timestamp,
          status: 'ON_SHELF',
          owner: OrgRole.RETAILER,
          origin: createArgs.origin,
          harvestDate: createArgs.harvestDate,
          packageId: processArgs.packageId,
          processTemp: processArgs.processTemp,
          logisticsId: transportArgs.logisticsId,
          transportTemp: transportArgs.transportTemp,
          retailerName: retailArgs.retailerName,
          shelfLife: retailArgs.shelfLife
      };

      this.ledger.set(demoId, { asset, history });
      this.saveLedger();
  }

  // --- Chaincode Simulation ---

  public async queryAsset(id: string): Promise<ChaincodeResponse<LedgerEntry>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const entry = this.ledger.get(id?.trim());
    if (!entry) {
      return { status: 404, message: `资产 ${id} 不存在。` };
    }
    return { status: 200, message: '成功', payload: entry };
  }
  
  public async getAllAssets(): Promise<ChaincodeResponse<FoodAsset[]>> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const assets: FoodAsset[] = [];
      // 转换为数组并反转，让最新的显示在前面（可选，但这取决于 App 怎么渲染）
      // 这里保持插入顺序
      this.ledger.forEach(entry => assets.push(entry.asset));
      return { status: 200, message: '成功', payload: assets };
  }

  public async invokeChaincode(
    role: OrgRole,
    functionName: string,
    args: any
  ): Promise<ChaincodeResponse<string>> {
    await new Promise(resolve => setTimeout(resolve, 600)); 

    const assetId = args.id?.trim();
    if (!assetId) return { status: 400, message: '必须提供资产 ID' };

    let entry = this.ledger.get(assetId);
    let asset: FoodAsset;
    let newHistoryItem: BlockTransaction;

    try {
        if (functionName === 'createAsset') {
            if (role !== OrgRole.SUPPLIER) throw new Error("只有供应商可以创建资产。");
            if (entry) throw new Error("资产已存在。");

            asset = {
                id: assetId,
                name: args.name,
                category: args.category,
                createTime: Date.now(),
                lastUpdated: Date.now(),
                status: 'HARVESTED',
                owner: OrgRole.SUPPLIER,
                origin: args.origin,
                harvestDate: args.harvestDate
            };
            
            newHistoryItem = this.createBlock(role, functionName, args, GENESIS_HASH);
            entry = { asset, history: [newHistoryItem] };

        } else {
            // Check if asset exists for update operations
            if (!entry) throw new Error("资产不存在。请检查 ID 是否正确。");
            
            // 重要: 克隆对象，避免直接修改 Map 中的引用，直到最后 set
            asset = { ...entry.asset }; 
            const lastBlock = entry.history[entry.history.length - 1];

            switch (functionName) {
                case 'processAsset':
                    if (role !== OrgRole.PROCESSOR) throw new Error("调用者不是加工商。");
                    if (asset.status !== 'HARVESTED') throw new Error("资产尚未准备好加工(当前状态不是'已采摘')。");
                    
                    asset.status = 'PROCESSED';
                    asset.owner = OrgRole.PROCESSOR;
                    asset.processTemp = args.processTemp;
                    asset.packageId = args.packageId;
                    break;

                case 'transportAsset':
                    if (role !== OrgRole.LOGISTICS) throw new Error("调用者不是物流商。");
                    if (asset.status !== 'PROCESSED') throw new Error("资产尚未打包(当前状态不是'已加工')。");

                    asset.status = 'IN_TRANSIT';
                    asset.owner = OrgRole.LOGISTICS;
                    asset.logisticsId = args.logisticsId;
                    asset.transportTemp = args.transportTemp;
                    break;

                case 'receiveAsset':
                    if (role !== OrgRole.RETAILER) throw new Error("调用者不是零售商。");
                    if (asset.status !== 'IN_TRANSIT') throw new Error("资产不在运输中(当前状态不是'运输中')。");

                    asset.status = 'ON_SHELF';
                    asset.owner = OrgRole.RETAILER;
                    asset.retailerName = args.retailerName;
                    asset.shelfLife = args.shelfLife;
                    break;

                default:
                    throw new Error("未知的链码函数: " + functionName);
            }

            asset.lastUpdated = Date.now();
            newHistoryItem = this.createBlock(role, functionName, args, lastBlock.currentHash);
            entry.history.push(newHistoryItem);
            entry.asset = asset;
        }

        // Commit to Ledger
        this.ledger.set(assetId, entry);
        this.saveLedger();

        return { status: 200, message: '交易已提交并确认', payload: newHistoryItem.txId };

    } catch (e: any) {
        console.error(e);
        return { status: 500, message: e.message || "链码错误" };
    }
  }

  private createBlock(role: OrgRole, func: string, args: any, prevHash: string): BlockTransaction {
    const ts = Date.now();
    const dataString = `${role}:${func}:${JSON.stringify(args)}:${ts}:${prevHash}`;
    const currentHash = generateHash(dataString);
    
    return {
        txId: generateTxId(),
        timestamp: ts,
        func,
        invoker: role,
        inputs: args,
        signature: `SIG_${role}_${generateHash(role).substring(0,8)}`,
        previousHash: prevHash,
        currentHash
    };
  }
}

export const fabricService = new FabricMockService();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Users, 
  Calendar, 
  Send, 
  Mic, 
  Plus, 
  BrainCircuit,
  Dumbbell,
  FileText,
  Search,
  CheckCircle2,
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
  PhoneCall,
  History,
  MessageCircle,
  Keyboard,
  TrendingUp,
  LayoutGrid,
  Menu,
  VolumeX,
  Upload,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  X
} from 'lucide-react';
import { User, Project, Plan, ChatMessage } from './types';
import { processNLU } from './services/nluService';
import { analyzeProject, getDrillFeedback, getChatResponse } from './services/geminiService';

type RecordingScenario = 'all_connected' | 'gtv_only' | 'unbound_gtv';
const heroImage = new URL('../images/IP.png', import.meta.url).href;

const visitPlanMarkdown = `已为您制定好**2026年3月6日（明天）的项目拜访计划**。基于您当前负责的5个项目，结合客户意向强度、区域集中度及跟进紧迫性，采用“高优攻坚 + 区域聚类”策略，确保高效转化：

---

### 📅 明日拜访路线图：2026年3月6日

---

#### 🚀 第一优先级：全力攻坚（高意向/决策窗口期）

##### **1. 生鲜配送 租赁 600平左右 仓储**
- **客户**：钟先生（生鲜配送行业）
- **区域**：上海市闵行区
- **关键风险**：项目已停滞 **233天**，但属高意向（2级），且闵行高标仓资源稀缺。
- **行动建议**：
  - **电话切入**：“钟先生您好！我们系统显示您去年咨询过闵行600平左右的生鲜仓库，最近刚好有两个新放的仓配一体项目，月台和冷库配套比市面上多数房源更成熟，您这边项目还在推进的话，我发您资料先看看？”
  - **钩子话术**：强调“新出高标仓，层高9米、双月台”，激发二次看房意愿。
- **目标**：确认需求有效性，争取预约看房。

##### **2. 机械加工+800+杜海泉**
- **客户**：杜海泉（机械加工）
- **区域**：河北省廊坊市固安县
- **关键机会**：需求周期为“3”（可能3个月内用房），虽停滞219天，但固安厂房资源充足、易匹配。
- **行动建议**：
  - **电话回访**：“杜总好！之前帮您找固安800平左右的机加工厂房，最近这边有两个园区刚有补贴政策落地，适合机加企业入驻，您这周方便去看下吗？我帮您约一下。”
  - **钩子话术**：突出“近期有政策补贴园区，层高和电力都达标”。
- **目标**：判断是否仍需选址，推动二次带看或定房。

---

#### ⚠️ 第二优先级：意向确认与激活（中意向/需首访确认）

##### **3. 安次机加工李总500**
- **客户**：李总（机加工）
- **区域**：河北省廊坊市安次区
- **策略**：轻触达，确认状态。
- **话术建议**：“李总好！我这边更新了一批安次区机加工厂房资源，其中有个600平带5吨行车的房源，特别适合您这行。您项目还在找地方的话，我发您视频先看看？”

##### **4. 装修材料 1000 周女士**
- **客户**：周女士（装修材料）
- **区域**：河北省廊坊市固安县
- **策略**：精准匹配高标厂房（层高8米+承重3吨）。
- **话术建议**：“周女士您好！固安最近出了两处层高8米、承重达标的厂房，特别适合堆放大宗装修材料，您需要的话我发您资料？”

> 💡 **区域协同提示**：杜海泉与周女士均在**固安县**，可安排同一天集中带看，提升效率。

---

#### 🍃 第三优先级：轻量维护（低意向/长线铺垫）

##### **5. 倪总 汽车贴膜求租400广阳市区里**
- **客户**：倪总（汽车贴膜）
- **区域**：河北省廊坊市广阳区
- **策略**：微信留言推荐临街厂房，维持联系。
- **话术建议**：“倪总好！更新了一套广阳市区临街400平厂房，带展示窗和操作间，适合贴膜店，供您参考～”

---

### 📊 任务看板汇总

| 客户 | 优先级 | 关键动作 | 核心价值点 | 预期结果 |
|:---|:---:|:---|:---|:---|
| **钟先生（生鲜配送）** | 高 | 电话+房源推荐 | 新出高标仓/稀缺区位 | 需求确认/约看 |
| **杜海泉（机械加工）** | 高 | 电话回访+政策钩子 | 补贴园区/需求紧迫 | 二次带看/定房 |
| **李总（机加工）** | 中 | 微信/电话轻触达 | 行车厂房/产业聚集 | 状态确认/激活 |
| **周女士（装修材料）** | 中 | 电话回访 | 高层高+高承重 | 需求确认/推荐 |
| **倪总（汽车贴膜）** | 低 | 微信留言 | 临街展示+操作间 | 线索过滤/维护 |

---

### 💡 金牌执行贴士
1. **主攻双高项目**：明日重点突破**钟先生**与**杜海泉**，二者均为高意向且长期未跟进，转化窗口正在打开。
2. **固安聚类拜访**：若杜海泉与周女士均有看房意向，可协调同日下午集中带看，节省时间成本。
3. **闭环习惯**：每次通话后，请立即在GTV系统更新客户状态、顾虑点及下次跟进时间，避免信息断层。

如需针对某一客户的**详细话术拆解**或**房源匹配清单**，随时告诉我，我可为您定制作战包。祝明日旗开得胜！`;

const followUpStrategyMarkdown = `根据倪总项目的详细信息与历史跟进记录，现为其“汽车贴膜求租400㎡广阳市区里”项目制定如下经营策略，采用**问题-洞察-行动**的金字塔结构呈现：

---

### **倪总项目经营策略**

#### **一、项目核心摘要**
- **客户画像**：保定已有成功门店，计划异地扩张至廊坊广阳，属**流量依赖型To C服务**（汽车贴膜）。
- **显性需求**：租赁400㎡“厂房”，但明确要求位于**广阳市中心正核心区域**，拒绝北旺、开发区等偏远地带。
- **当前状态**：C级项目（未推进），因多次带看失败、意向房源房东问题及天气/距离借口，已实质停滞。

#### **二、深层需求洞察**
| 表面诉求 | 实际痛点 | 关键矛盾 |
|--------|--------|--------|
| “租厂房” | 需**临街展示面+自然客流** | 广阳核心区**无合规工业用地**，纯商铺难满足生产备案/环评 |
| “要市中心” | 依赖**路过车主转化** | 客户将“厂房”误作载体类型，实则需**前店后仓式类商铺** |

> 💡 **本质问题**：客户在用“厂房”框架寻找“商铺”，导致供需错配。

#### **三、精准跟进策略**

##### **1. 载体匹配方向**
- **目标物业类型**：广阳老城区（如解放道、银河北路）**临街一层老旧工业/仓储用房**，具备：
  - 可挂门头招牌
  - 门前允许临时停车
  - 水电独立开户
  - 产权性质可注册个体工商户（不强求纯工业）

##### **2. 关键话术与提问**
- **价值传递话术**：  
  > “这套不在园区，在解放道主干道旁，日均车流超2万辆，隔壁就是洗车店，天然导流。门头8米宽，晚上打灯特别醒目。”
  
- **需求澄清三问**：  
  ① “您保定店的日均自然进店客户有多少？是否依赖线上引流？”  
  ② “如果位置绝佳但产权是商服性质，能否接受注册个体户而非公司？”  
  ③ “若面积350㎡但位置在十字路口，是否愿意压缩办公区？”

##### **3. 风险预警与备选方案**
- **预期管理**：明确告知广阳核心区无标准厂房，避免客户幻想“市中心工业园”。
- **竞品防御**：警惕共享工位+展示窗模式分流，可强调“独立门面=品牌信任感”。
- **紧急动作**：立即盘点解放道沿线汽配城、旧仓库改造资源，优先推荐“前店后仓”结构。

---

> ✅ **执行要点**：不再推送标准厂房，转而以**高可见度临街载体**为核心卖点，用“客流转化率”替代“面积/产权”作为决策锚点。`;

const propertyMatchMarkdown = `根据您的需求，为您输出如下方案：

### 选址方案1
![选址方案1-地铁站旁可研发办公](https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80)
**地铁站旁可研发办公**  
多层 · 层高3.5米  
\`花园式\` \`近地铁\` \`可办公\`  
**1.5-1.8 元/㎡/天** · 2000㎡

- **推荐理由**：该载体为丙二类消防，满足生物制剂生产合规门槛。单层2000㎡、层高3.5米，利于生产动线规划；500kg/㎡承重可覆盖常规设备布置。临近地铁且园区食堂、停车配套完善，便于研发与运营协同。

---

### 选址方案2
![选址方案2-地铁口可研发办公](https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80)
**地铁口，可研发办公**  
多层 · 层高3.5米  
\`近地铁\` \`可办公\` \`有产权\`  
**1.5 元/㎡/天** · 2000㎡

- **推荐理由**：该载体具备丙二类消防资质，2000㎡单层空间结合3.5米层高，适合研发及生产分区。租金稳定且园区配套成熟，整体运营成本更可控，适合稳步扩张型团队。

---

### 选址方案3
![选址方案3-亦庄东区精装厂房地铁旁](https://images.unsplash.com/photo-1581092446327-9f89b7fc4f3f?auto=format&fit=crop&w=1200&q=80)
**亦庄东区精装厂房地铁旁**  
多层 · 层高8米  
\`近地铁\` \`单层厂房\` \`可分割\`  
**1.6-2.6 元/㎡/天** · 2000㎡

- **推荐理由**：8米层高与单层2000㎡组合适配大型设备与洁净风管安装需求，改造潜力大。该载体支持分割，利于“生产+仓储+办公”分区管理；如项目后续扩产，空间弹性更好。

---

### 选址方案4（不推荐）
![选址方案4-低价小面积载体](https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&fit=crop&w=1200&q=80)
**测试载体（面积过小）**  
固安县 · 层高1.0米  
\`低价\` \`非生产级\`  
**0.01-0.2 元/㎡/天** · 1㎡

- **推荐理由**：该载体面积与层高远低于生产需求，仅可作为对照样本，不建议进入候选清单。

---

### 综合分析
建议优先安排方案1和方案2现场踏勘（位置与成本平衡最佳），方案3作为扩产备选。若您确认意向区域与面积区间，我可以继续输出带地图与通勤半径的下一版清单。`;

const buildProjectDetailMarkdown = (projectName: string, projectCode: string) => `好的，我已准确理解您要查询项目编号为 ${projectCode} 的${projectName}项目详情。作为您的金牌经纪人，我会立即为您调取该项目的完整信息，包括客户、阶段、面积等关键数据，马上开始执行。  
好的，这是您负责的项目 **${projectCode}** 的完整详情整理：

---

### 📌 项目基本信息

- **项目名称**：${projectName}  
- **项目编号**：${projectCode}  
- **项目阶段**：未推进  
- **项目等级**：B级  
- **创建时间**：2025-06-27 16:49:23  
- **最近跟进时间**：2025-07-16 19:08:00

---

### 👤 客户信息

- **客户姓名**：钟先生  
- **联系电话**：136****7208（已脱敏）  
- **公司名称**：未填写  
- **微信信息**：未提供

> 💡 **客户核心需求备注**：  
> - 当前在马桥，计划搬迁至春申区域；  
> - 目标选址：**莘庄附近约600㎡的一楼仓储**；  
> - **必须能进9.6米大货车**；  
> - 预算较低（曾提出一楼0.7元/㎡/天，带看时报价0.8元）；  
> - 业务类型：做“多多买菜”（也有记录提及“叮咚买菜”，需确认是否为同一主体或切换平台）。

---

### 📝 关键跟进记录（按时间倒序）

| 日期 | 动作 | 内容摘要 |
|------|------|--------|
| **2025-07-16** | 跟进 | 客户电话/微信长期不回复。 |
| **2025-07-16** | 跟进 | 客户此前被中介成交过，但因面积不符退租，中介承诺找到新房后才退佣金。 |
| **2025-06-28** | 带看 | 带看申港路518号房源：<br>• 客户日均10-20辆车进出；<br>• 预算偏低（0.8元/㎡）；<br>• 房东因车辆太多拒绝出租。 |
| **2025-06-27** | 跟进 | 约定次日看房，客户做多多买菜，预算一楼0.7元，经纪人表示可后续谈价。 |

---

### 📍 意向区域与载体要求

- **意向区域**：上海市闵行区（明确聚焦 **莘庄/春申** 片区）  
- **面积需求**：约600㎡（系统记录范围：500~1000㎡）  
- **载体类型**：仓库  
- **特殊要求**：  
  - 必须为**一楼**；  
  - **可通行9.6米货车**；  
  - 对价格敏感，预算偏低。

---

### ⚠️ 风险与机会点

- **风险**：  
  - 客户响应率低，沟通困难；  
  - 曾有被其他中介“截胡”经历，信任度需重建；  
  - 预算与市场行情可能存在较大差距。
  
- **机会**：  
  - 客户确有真实搬迁和扩仓需求；  
  - 若能找到符合动线、承重、货车进出条件且价格适配的房源，仍有成交可能。

---

如需我为您：
- ✅ 制定下一步拜访/沟通策略  
- ✅ 匹配莘庄区域符合条件的仓库载体  
- ✅ 生成客户破冰话术或价格谈判方案

请随时告诉我！`;

// --- Components ---

const ActionCard = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-2 transition-all active:scale-95"
  >
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
      <Icon size={24} />
    </div>
    <span className="text-[14px] font-medium text-slate-600">{label}</span>
  </button>
);

type PropertyMatchOption = {
  id: number;
  title: string;
  image: string;
  subtitle: string;
  tags: string[];
  price: string;
  area: string;
  reason: string;
};

const propertyMatchOptions: PropertyMatchOption[] = [
  {
    id: 1,
    title: '地铁站旁可研发办公',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
    subtitle: '多层·层高3.5米',
    tags: ['花园式', '近地铁', '可办公'],
    price: '1.5-1.8 元/㎡/天',
    area: '2000㎡',
    reason: '该载体为丙二类消防，满足生物制剂生产合规门槛。单层2000㎡、层高3.5米，利于生产动线规划；500kg/㎡承重可覆盖常规设备布置。临近地铁且园区食堂、停车配套完善，便于研发与运营协同。',
  },
  {
    id: 2,
    title: '地铁口，可研发办公',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    subtitle: '多层·层高3.5米',
    tags: ['近地铁', '可办公', '有产权'],
    price: '1.5 元/㎡/天',
    area: '2000㎡',
    reason: '该载体具备丙二类消防资质，2000㎡单层空间结合3.5米层高，适合研发及生产分区。租金稳定且园区配套成熟，整体运营成本更可控，适合稳步扩张型团队。',
  },
  {
    id: 3,
    title: '亦庄东区精装厂房地铁旁',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80',
    subtitle: '多层·层高8米',
    tags: ['近地铁', '单层厂房', '可分割'],
    price: '1.6-2.6 元/㎡/天',
    area: '2000㎡',
    reason: '8米层高与单层2000㎡组合适配大型设备与洁净风管安装需求，改造潜力大。该载体支持分割，利于“生产+仓储+办公”分区管理；如项目后续扩产，空间弹性更好。',
  },
  {
    id: 4,
    title: '测试载体（面积过小）',
    image: 'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&fit=crop&w=1200&q=80',
    subtitle: '固安县·层高1.0米',
    tags: ['低价', '非生产级'],
    price: '0.01-0.2 元/㎡/天',
    area: '1㎡',
    reason: '该载体面积与层高远低于生产需求，仅可作为对照样本，不建议进入候选清单。',
  },
];

const PropertyMatchLayout = () => (
  <div className="space-y-4">
    <p className="font-semibold text-slate-800 text-[17px]">根据您的需求，为您输出如下方案：</p>
    {propertyMatchOptions.map((item) => (
      <div key={item.id} className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-orange-500 px-1 text-[11px] font-bold text-white">
            {item.id}
          </span>
          <h4 className="text-[16px] font-bold text-slate-800">选址方案{item.id}：</h4>
        </div>
        <div className="rounded-2xl bg-white/60 p-2">
          <div className="flex gap-2.5">
            <img
              src={item.image}
              alt={item.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = heroImage;
              }}
              className="h-28 w-28 rounded-xl object-cover shrink-0 border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-slate-800 leading-snug line-clamp-2">{item.title}</p>
              <p className="mt-0.5 text-slate-500 text-[13px]">{item.subtitle}</p>
              <div className="mt-1 flex flex-nowrap gap-1 overflow-hidden whitespace-nowrap">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500 shrink-0">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 leading-none">
                <span className="text-[16px] font-bold text-red-500">{item.price}</span>
                <span className="ml-1.5 text-slate-400 text-[12px]">{item.area}</span>
              </p>
            </div>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed text-[13px]">
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-orange-500 align-middle" />
          <span className="font-bold text-slate-800">推荐理由：</span> {item.reason}
        </p>
      </div>
    ))}
    <div className="pt-1">
      <h4 className="text-[16px] font-bold text-slate-800">综合分析</h4>
      <p className="mt-1.5 text-[13px] text-slate-700 leading-relaxed">
        综合匹配结果建议优先安排方案1和方案2现场踏勘（位置与成本平衡更优），方案3作为扩产备选，方案4不建议进入候选清单。
        如您确认意向区域与面积区间，我可继续输出带通勤半径与载体对比的下一版清单。
      </p>
    </div>
  </div>
);

const GTVBindingCard = ({ onBind, isBound }: { onBind: () => void, isBound?: boolean }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 mt-2">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center bg-white">
        <img src="/liyeyun-logo.png" alt="立业云" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col">
        <h4 className="font-semibold text-slate-900 text-base">立业云 GTV 请求授权</h4>
      </div>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed mb-5">
      使用你的手机号查询、绑定立业云GTV账号，完成后即可为你查询立业云GTV相关数据，并提供对应服务。
    </p>
    <button
      onClick={onBind}
      disabled={isBound}
      className={`w-full py-3 font-semibold text-sm rounded-xl transition-colors ${
        isBound
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-[#2141d6]/10 text-[#2141d6] hover:bg-[#2141d6]/20'
      }`}
    >
      {isBound ? '已授权' : '去授权'}
    </button>
  </div>
);

const TranscriptionCard = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <BrainCircuit size={20} />
      </motion.div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-800">录音中</p>
      <p className="text-[11px] text-slate-400 mt-0.5">正在录音中...</p>
    </div>
  </div>
);

const RecordingAnalysisCard = ({ metadata, onLinkProject }: { metadata: any; onLinkProject: () => void }) => {
  const sourceLabel = metadata?.source === 'upload' ? '本地录音分析' : 'A1录音分析';
  const analysisTime = metadata?.analysisTime || '2025-09-15 14:22:53';
  const projectName = metadata?.projectName || '未关联项目';
  const hasLinkedProject = !!projectName && !projectName.includes('未关联');
  const projectCode = `（${metadata?.projectCode || 'XM2505282241'}）`;
  const context = metadata?.context || '暂无沟通背景';
  const feedback = metadata?.feedback || '暂无客户反馈';
  const decision = metadata?.decision || '待定';
  const nextPlan = metadata?.nextPlan || '暂无下步计划';
  const resultItems = [
    { label: '沟通背景', value: context },
    { label: '客户反馈', value: feedback },
    { label: '结果判定', value: decision },
    { label: '下步计划', value: nextPlan },
  ];

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <BrainCircuit size={18} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-800">AI录音分析结果</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{analysisTime}</p>
          </div>
        </div>
        {hasLinkedProject ? (
          <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            已生成跟进记录
          </span>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl bg-white/85 border border-slate-100 p-3">
        <p className="text-[13px] text-slate-500 mb-1">关联项目</p>
        {hasLinkedProject ? (
          <p className="text-[14px] font-semibold text-slate-800 leading-snug">{projectName}{projectCode}</p>
        ) : null}
        {!hasLinkedProject ? (
          <button
            onClick={onLinkProject}
            className="mt-2 inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-[12px] font-medium text-white shadow-sm active:scale-95 transition-all"
          >
            去关联项目
          </button>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl bg-white/85 border border-slate-100 p-3">
        <p className="text-[13px] text-slate-500 mb-1">分析结果</p>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-slate-700 leading-relaxed">
          {resultItems.map((item) => (
            <li key={item.label}>
              <span className="font-semibold text-slate-900">{item.label}：</span>
              <span>{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const HistorySidebar = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onSelectSession 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  sessions: any[], 
  onSelectSession: (session: any) => void 
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-[280px] bg-[#FAFAFA] z-[70] shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">历史会话</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {sessions.map((s) => (
              <button 
                key={s.id}
                onClick={() => {
                  onSelectSession(s);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-600">{s.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">{s.date}</p>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-50">
            <button 
              onClick={() => {
                onSelectSession({ messages: [] });
                onClose();
              }}
              className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Plus size={18} /> 新建会话
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [isRecordingView, setIsRecordingView] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [isProjectSelectionView, setIsProjectSelectionView] = useState(false);
  const [isBindingProjectMode, setIsBindingProjectMode] = useState(false);
  const [bindingTargetMessageId, setBindingTargetMessageId] = useState<number | null>(null);
  const [pendingBindingProjectId, setPendingBindingProjectId] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [visibleProjectCount, setVisibleProjectCount] = useState(10);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrilling, setIsDrilling] = useState(false);
  const [currentDrillProject, setCurrentDrillProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBindingView, setIsBindingView] = useState(false);
  const [bindingPhone, setBindingPhone] = useState('');
  const [bindingSmsCode, setBindingSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [isBindingLoading, setIsBindingLoading] = useState(false);
  const [isBindingError, setIsBindingError] = useState(false);
  const [isBindingDemo, setIsBindingDemo] = useState(false);
  const [isScenarioPickerOpen, setIsScenarioPickerOpen] = useState(false);
  const [recordingScenario, setRecordingScenario] = useState<RecordingScenario>('all_connected');
  const [isPropertyMatchingScene, setIsPropertyMatchingScene] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<Record<number, 'up' | 'down' | undefined>>({});
  const [sessions, setSessions] = useState<{id: string, title: string, date: string, messages: ChatMessage[]}[]>([
    {
      id: 'visit-plan',
      title: '拜访计划',
      date: '2026-03-06',
      messages: [
        { role: 'user', content: '帮我制定拜访计划' },
        { role: 'assistant', content: visitPlanMarkdown }
      ]
    },
    {
      id: 'follow-up-strategy',
      title: '跟进策略',
      date: '2026-03-06',
      messages: [
        { role: 'user', content: '帮我生成跟进策略' },
        { role: 'assistant', content: followUpStrategyMarkdown }
      ]
    },
    {
      id: 'property-match',
      title: '房源匹配',
      date: '2026-03-06',
      messages: [
        { role: 'user', content: '帮我进行房源匹配' },
        { role: 'assistant', content: propertyMatchMarkdown }
      ]
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mock Login on Mount
  useEffect(() => {
    const login = async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'broker@example.com' })
      });
      const data = await res.json();
      setUser(data.user);
      fetchData(data.user.id);
    };
    login();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecordingActive) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchData = async (userId: number) => {
    const [pRes, plRes] = await Promise.all([
      fetch(`/api/projects?userId=${userId}`),
      fetch(`/api/plans?userId=${userId}`)
    ]);
    setProjects(await pRes.json());
    setPlans(await plRes.json());
  };

  const handleProjectScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !isFetchingMore && projectSearch === '' && visibleProjectCount < projects.length) {
      setIsFetchingMore(true);
      setTimeout(() => {
        setVisibleProjectCount(prev => Math.min(prev + 10, projects.length));
        setIsFetchingMore(false);
      }, 1000);
    }
  };

  const closeProjectSelection = () => {
    setIsProjectSelectionView(false);
    setProjectSearch('');
    setIsBindingProjectMode(false);
    setBindingTargetMessageId(null);
    setPendingBindingProjectId(null);
  };

  const openProjectSelection = (messageId: number) => {
    setRecordingScenario('all_connected');
    setProjectSearch('');
    setVisibleProjectCount(10);
    setIsBindingProjectMode(true);
    setBindingTargetMessageId(messageId);
    setPendingBindingProjectId(null);
    setIsScenarioPickerOpen(true);
  };

  const confirmProjectBinding = () => {
    if (recordingScenario === 'unbound_gtv') {
      setRecordingScenario('unbound_gtv');
      return;
    }
    if (!bindingTargetMessageId || !pendingBindingProjectId) return;
    const project = projects.find((p) => p.id === pendingBindingProjectId);
    if (!project) return;

    const displayProjectName = getDisplayProjectName(project.name);
    const projectCode = `XM211023${project.id.toString().padStart(4, '0')}`;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === bindingTargetMessageId && message.type === 'recording_analysis'
          ? {
              ...message,
              metadata: {
                ...(message.metadata || {}),
                projectName: displayProjectName,
                projectCode,
              },
            }
          : message
      )
    );
    setToast('已关联项目');
    setTimeout(() => setToast(null), 1500);
    closeProjectSelection();
  };

  const openRecordingScenarioPicker = () => {
    if (isRecordingActive && !selectedProjectId) {
      setIsRecordingView(true);
      return;
    }
    setIsScenarioPickerOpen(true);
  };

  const enterProjectSelectionWithScenario = (scenario: RecordingScenario) => {
    setRecordingScenario(scenario);
    setIsScenarioPickerOpen(false);
    setProjectSearch('');
    setVisibleProjectCount(10);
    if (!isBindingProjectMode && scenario === 'unbound_gtv') {
      setSelectedProjectId(null);
      setIsRecordingActive(false);
      setRecordingTime(0);
      setIsProjectSelectionView(false);
      setIsRecordingView(true);
      return;
    }
    setIsProjectSelectionView(true);
  };

  const pendingProjectIds = new Set(
    plans
      .filter((plan) => plan.status === 'pending')
      .map((plan) => plan.project_id)
  );

  const followUpProjects = projects
    .filter((project) => pendingProjectIds.has(project.id))
    .slice(0, 5);

  const homeFollowUpProjects = followUpProjects.length > 0 ? followUpProjects : projects.slice(0, 5);

  const getPendingDays = (projectId: number) => {
    const projectPlans = plans
      .filter((plan) => plan.project_id === projectId && plan.status === 'pending')
      .map((plan) => new Date(plan.time).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => a - b);

    if (projectPlans.length === 0) return 0;
    const now = Date.now();
    const overdueDays = Math.floor((now - projectPlans[0]) / (1000 * 60 * 60 * 24));
    return overdueDays > 0 ? overdueDays : 0;
  };

  const getProjectLevel = (project: Project): 'A级' | 'B级' | 'C级' | 'D级' => {
    const stage = project.stage || '';
    if (stage.includes('签约') || stage.includes('回款完成')) return 'A级';
    if (stage.includes('回款中') || stage.includes('夯实')) return 'B级';
    if (stage.includes('带看') || stage.includes('房源匹配')) return 'C级';
    return 'D级';
  };

  const getDisplayProjectName = (name: string) => name.replace(/^【[^】]+】\s*/, '');

  const handleSend = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || !user) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (text === '开启AI录音') {
        openRecordingScenarioPicker();
        setLoading(false);
        return;
      }

      if (isDrilling) {
        const drillProjectInfo = currentDrillProject ? {
          name: currentDrillProject.name,
          industry: currentDrillProject.industry,
          area: currentDrillProject.area,
          region: currentDrillProject.region,
          type: currentDrillProject.type,
          clientName: currentDrillProject.client_name,
          stage: currentDrillProject.stage,
          remarks: currentDrillProject.remarks
        } : undefined;
        
        const content = await getChatResponse([...messages, userMsg], true, drillProjectInfo);
        setMessages(prev => [...prev, { role: 'assistant', content: content || "抱歉，我暂时无法回应。", type: 'drill' }]);
        setLoading(false);
        return;
      }

      if (text === '帮我制定拜访计划') {
        setIsPropertyMatchingScene(false);
        setMessages(prev => [...prev, { role: 'assistant', content: visitPlanMarkdown }]);
        setLoading(false);
        return;
      }

      if (text === '帮我生成跟进策略') {
        setIsPropertyMatchingScene(false);
        setMessages(prev => [...prev, { role: 'assistant', content: followUpStrategyMarkdown }]);
        setLoading(false);
        return;
      }

      if (text === '帮我进行房源匹配') {
        setIsPropertyMatchingScene(true);
        setMessages(prev => [...prev, { role: 'assistant', content: propertyMatchMarkdown }]);
        setLoading(false);
        return;
      }

      if (isPropertyMatchingScene) {
        setMessages(prev => [...prev, { role: 'assistant', content: propertyMatchMarkdown }]);
        setLoading(false);
        return;
      }

      const projectDetailMatch = text.match(/^帮我查下“(.+?)”[（(](XM\d+)[）)]的项目详情$/);
      if (projectDetailMatch) {
        const [, projectName, projectCode] = projectDetailMatch;
        const assistantContent = buildProjectDetailMarkdown(projectName, projectCode);
        const assistantMsg: ChatMessage = { role: 'assistant', content: assistantContent };
        setMessages(prev => [...prev, assistantMsg]);
        setSessions([
          {
            id: `${Date.now()}`,
            title: `项目详情：${projectName}`,
            date: new Date().toISOString().slice(0, 10),
            messages: [userMsg, assistantMsg],
          }
        ]);
        setLoading(false);
        return;
      }

      const nlu = await processNLU(text, { currentTab: 'chat' });
      
      // Check for GTV binding requirement
      if ((nlu.intent === 'FOLLOW_UP_PLAN' || text.includes('拜访计划') || text.includes('跟进策略')) && !user.crm_bound) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '您目前还未绑定立业云GTV账号，请先完成账号绑定，以便我们为您提供更好的服务。',
          type: 'gtv_binding'
        }]);
        setLoading(false);
        return;
      }
      
      if (nlu.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: nlu.response }]);
      } else if (nlu.intent === 'FOLLOW_UP_PLAN') {
        const projectInfo = nlu.params; 
        if (projectInfo && projectInfo.industry) {
          const analysis = await analyzeProject({
            name: projectInfo.name || "新项目",
            industry: projectInfo.industry,
            area: projectInfo.area || "未知面积",
            region: projectInfo.region || "未知区域",
            type: projectInfo.type || "厂房",
            clientName: projectInfo.clientName || "客户",
            stage: "初接触"
          });
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `已为你生成项目分析报告：\n\n**行业特征**: ${analysis.industryAnalysis}\n\n**建议策略**: ${analysis.strategy}`,
            type: 'analysis',
            metadata: analysis
          }]);

          const pRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              name: projectInfo.name || "新项目",
              industry: projectInfo.industry,
              area: projectInfo.area || "未知面积",
              region: projectInfo.region || "未知区域",
              type: projectInfo.type || "厂房",
              client_name: projectInfo.clientName || "客户",
              stage: "未推进"
            })
          });
          const { id: projectId } = await pRes.json();
          
          for (const plan of analysis.plans) {
            await fetch('/api/plans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projectId,
                user_id: user.id,
                ...plan
              })
            });
          }
          fetchData(user.id);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: '请提供更多项目信息，例如行业、面积和区域，以便我为你制定计划。' }]);
        }
      } else if (nlu.intent === 'INFO_QUERY') {
        const query = nlu.params?.query || nlu.params?.name || text;
        const matchedProjects = projects.filter(p => 
          p.name.includes(query) || 
          p.industry.includes(query) || 
          p.client_name.includes(query)
        );

        if (matchedProjects.length > 0) {
          const projectInfo = matchedProjects.map(p => `
**项目名称**: ${p.name}
**行业领域**: ${p.industry}
**选址需求概要**:
- 意向面积: ${p.area}
- 意向区域: ${p.region}
- 载体类型: ${p.type}
- 当前阶段: ${p.stage}
- 客户姓名: ${p.client_name}
- 备注: ${p.remarks || '无'}
          `).join('\n---\n');
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `找到以下相关项目信息：\n${projectInfo}` 
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: nlu.response || '抱歉，我没有找到相关的项目或信息。' }]);
        }
      } else if (nlu.intent === 'MATCH_PROPERTY') {
        const params = nlu.params || {};
        const hasRequirements = params.region || params.area || params.type;
        
        if (hasRequirements) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `正在为您匹配符合以下需求的房源：\n- 区域：${params.region || '新余'}\n- 面积：${params.area || '不限'}\n- 类型：${params.type || '不限'}\n\n正在为您筛选数据库...` 
          }]);
          // Here you would normally call a property matching service
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `目前我还没有了解到您的选址需求(例如:区域、面积、载体类型等)\n\n为了给您推荐最匹配的载体，请告诉我:\n\n1.您想找哪种类型的空间?\n例如:厂房、仓库、办公)\n\n2.优先考虑哪个区域?\n(初始默认为新余，您可指定其他城市/区县)\n\n3.对面积、层高、预算等是否有初步要求?\n\n我会根据您的需求，从数据库中为您筛选精准方案。期待为您服务!` 
          }]);
        }
      } else if (nlu.intent === 'SIMULATION_DRILL') {
        setIsDrilling(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '好的，演练开始！我是某电子制造企业的采购经理，我们最近在寻找5000平的厂房。请问你们园区的供电和防静电措施怎么样？', type: 'drill' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我还没完全理解你的意思。你可以试着说“分析我的新项目”或者“帮我制定拜访计划”。' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，处理请求时出错了。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setToast(`已选择文件: ${file.name}，正在上传并分析...`);
      setTimeout(() => setToast(null), 1800);
      const transcriptionMsgId = Date.now();
      setMessages(prev => [...prev, {
        id: transcriptionMsgId,
        role: 'assistant',
        content: '',
        type: 'transcription'
      }]);

      setTimeout(() => {
        const metadata = {
          source: 'upload',
          projectName: '未关联项目（建议手动选择）',
          projectCode: '未关联编号',
          context: `已上传本地录音“${file.name}”，系统已完成转写并提取关键信息。`,
          feedback: '客户对载体条件有明确偏好，同时对交付风险与预算边界较敏感。',
          decision: '待定',
          nextPlan: '按优先级筛选2-3个匹配载体，补充关键参数对比后安排回访确认。',
          archiveNote: '✅ 归档成功，该录音分析已写入跟进历史，可继续补充沟通内容。'
        };
        setMessages(prev => prev.map(m =>
          m.id === transcriptionMsgId
            ? {
                ...m,
                type: 'recording_analysis',
                content: `录音分析完成\n\n沟通背景：${metadata.context}\n客户反馈：${metadata.feedback}\n结果判定：${metadata.decision}\n下步计划：${metadata.nextPlan}\n${metadata.archiveNote}`,
                metadata
              }
            : m
        ));
        setToast(null);
      }, 2000);
    }
    event.target.value = '';
  };

  const handleBindGTV = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Mock binding API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updatedUser = { ...user, crm_bound: true };
      setUser(updatedUser);
      setMessages(prev => [...prev, { role: 'assistant', content: '绑定成功！现在您可以查询您的拜访计划和跟进策略了。' }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setInterval(() => setSmsCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [smsCountdown]);

  const handleSendSms = () => {
    if (bindingPhone.length !== 11 || smsCountdown > 0) return;
    setSmsSent(true);
    setSmsCountdown(60);
  };

  const handleConfirmBinding = () => {
    if (!user || bindingSmsCode.length === 0) return;
    setIsBindingDemo(true);
  };

  const handleBindSuccess = async () => {
    if (!user) return;
    setIsBindingDemo(false);
    setIsBindingLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setUser({ ...user, crm_bound: true });
    setRecordingScenario('all_connected');
    setIsBindingView(false);
    setBindingPhone('');
    setBindingSmsCode('');
    setSmsSent(false);
    setSmsCountdown(0);
    setIsBindingLoading(false);
    setToast('授权成功');
    setTimeout(() => setToast(null), 2000);
  };

  const handleBindFail = () => {
    setIsBindingDemo(false);
    setIsBindingError(true);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setToast('已复制');
      setTimeout(() => setToast(null), 1500);
    } catch {
      setToast('复制失败');
      setTimeout(() => setToast(null), 1500);
    }
  };

  const handleShareMessage = async (content: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ text: content });
      } else {
        await navigator.clipboard.writeText(content);
        setToast('已复制内容，可直接分享');
        setTimeout(() => setToast(null), 1500);
      }
    } catch {
      // user cancelled share panel; no toast needed
    }
  };

  const handleFeedback = (index: number, type: 'up' | 'down') => {
    setMessageFeedback(prev => ({
      ...prev,
      [index]: prev[index] === type ? undefined : type,
    }));
  };

  const getSceneGuideButtons = (content: string): { label: string; prompt: string; type?: 'send' | 'upload' }[] => {
    const isProjectListScene = content.includes('找到以下相关项目信息') || content.includes('**项目名称**');
    const isProjectDetailScene = content.includes('### 📌 项目基本信息') || (content.includes('项目编号') && content.includes('客户信息'));
    const isVisitPlanScene = content.includes('明日拜访路线图') || content.includes('项目拜访计划');
    const isFollowUpStrategyScene = content.includes('倪总项目经营策略') || content.includes('精准跟进策略');

    if (isProjectDetailScene) {
      return [
        { label: '跟进策略', prompt: '帮我生成跟进策略' },
        { label: '房源匹配', prompt: '帮我进行房源匹配' },
      ];
    }

    if (isProjectListScene) {
      return [
        { label: '拜访计划', prompt: '帮我制定拜访计划' },
        { label: '跟进策略', prompt: '帮我生成跟进策略' },
        { label: '房源匹配', prompt: '帮我进行房源匹配' },
      ];
    }

    if (isVisitPlanScene) {
      return [
        { label: '跟进策略', prompt: '帮我生成跟进策略' },
        { label: '房源匹配', prompt: '帮我进行房源匹配' },
      ];
    }

    if (isFollowUpStrategyScene) {
      return [
        { label: '房源匹配', prompt: '帮我进行房源匹配' },
        { label: '开启AI录音', prompt: '开启AI录音' },
        { label: '上传跟进录音', prompt: '上传录音', type: 'upload' },
      ];
    }

    return [];
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden font-sans">
      <AnimatePresence>
        {isProjectSelectionView && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-50 bg-[#FAFAFA] flex flex-col"
          >
            <header className="flex items-center justify-between px-4 py-4 border-b border-slate-50">
              <button onClick={closeProjectSelection} className="p-2 text-slate-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="font-bold text-slate-800">{isBindingProjectMode ? '关联项目' : '选择项目'}</h2>
              <div className="w-10" />
            </header>
            
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="搜索项目名称、编号或客户姓名"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm transition-all"
                />
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 pt-0 space-y-1.5 custom-scrollbar"
              onScroll={handleProjectScroll}
            >
              <p className="text-[11px] text-slate-400 mb-1 px-1">请选择本次录音关联的项目，以便后续自动归档分析</p>
              {(projectSearch === '' 
                ? projects.slice(0, visibleProjectCount) 
                : projects.filter(p => 
                    p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                    p.client_name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                    `XM211023${p.id.toString().padStart(4, '0')}`.includes(projectSearch)
                  )
              ).map((p) => {
                const isCurrentRecording = isRecordingActive && selectedProjectId === p.id;
                const isBindingSelected = isBindingProjectMode && pendingBindingProjectId === p.id;
                const isRowSelected = isBindingProjectMode ? isBindingSelected : isCurrentRecording;
                return (
                  <button 
                    key={p.id}
                    onClick={() => {
                      if (isBindingProjectMode) {
                        setPendingBindingProjectId((prev) => (prev === p.id ? null : p.id));
                        return;
                      }
                      if (isRecordingActive) {
                        if (selectedProjectId === p.id) {
                          setIsProjectSelectionView(false);
                          setIsRecordingView(true);
                        } else {
                          setToast('已有进行中的录音，请结束后再开启新录音');
                          setTimeout(() => setToast(null), 2000);
                        }
                      } else {
                        setSelectedProjectId(p.id);
                        setIsProjectSelectionView(false);
                        setProjectSearch('');
                        setVisibleProjectCount(10);
                        setIsRecordingActive(false);
                        setRecordingTime(0);
                        setIsRecordingView(true);
                      }
                    }}
                    className={`group w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isRowSelected
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'bg-white border-slate-200 shadow-sm active:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-3 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm truncate">{getDisplayProjectName(p.name)}</p>
                        {isCurrentRecording && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-600 text-[9px] text-white rounded-md animate-pulse">
                            <div className="w-1 h-1 bg-white rounded-full" />
                            录音中
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        XM211023{p.id.toString().padStart(4, '0')} · {p.stage} · {p.client_name}
                      </p>
                    </div>
                    <div className="min-w-[64px] flex items-center justify-end">
                      {isBindingProjectMode ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isBindingSelected
                                ? 'bg-indigo-600 border-2 border-indigo-600 shadow-sm shadow-indigo-200'
                                : 'bg-white border-2 border-slate-300'
                            }`}
                          >
                            {isBindingSelected ? (
                              <span className="text-white text-[11px] leading-none font-bold">✓</span>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isCurrentRecording
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-400 group-active:bg-indigo-100'
                        }`}>
                          <Mic size={16} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {isFetchingMore && (
                <div className="py-6 flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-400">正在加载更多项目...</p>
                </div>
              )}
              {(projectSearch !== '' && projects.filter(p => 
                p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                p.client_name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                `XM211023${p.id.toString().padStart(4, '0')}`.includes(projectSearch)
              ).length === 0) && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">未找到相关项目</p>
                </div>
              )}
            </div>

            {isBindingProjectMode && (
              <div className="p-4 border-t border-slate-100 bg-[#FAFAFA]">
                <button
                  onClick={confirmProjectBinding}
                  disabled={!pendingBindingProjectId}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    pendingBindingProjectId
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80 pointer-events-none'
                  }`}
                >
                  确认关联
                </button>
              </div>
            )}

            <AnimatePresence>
              {recordingScenario === 'unbound_gtv' && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/35 backdrop-blur-sm z-20"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-30 shadow-2xl"
                  >
                    <div className="relative mb-3 min-h-10 flex items-center justify-center">
                      <button
                        onClick={closeProjectSelection}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                      <p className="text-base text-slate-500 text-center">
                        {isBindingProjectMode ? '未绑定GTV，请先授权后关联项目' : '未绑定GTV，无法开启A1录音'}
                      </p>
                    </div>
                    <GTVBindingCard onBind={() => setIsBindingView(true)} isBound={false} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {recordingScenario === 'gtv_only' && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/35 backdrop-blur-sm z-20"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-30 shadow-2xl"
                  >
                    <div className="relative mb-3 min-h-10 flex items-center justify-center">
                      <button
                        onClick={closeProjectSelection}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                      <h3 className="text-[22px] leading-snug font-semibold text-slate-900 text-center px-10">
                        设备未连接，无法开启录音
                      </h3>
                    </div>
                    <p className="text-[14px] leading-7 text-slate-500 text-center mb-4">
                      设备未连接，无法在线开启录音。请先连接设备或长按设备录音键2秒抬手开始录音。
                    </p>
                    <div className="bg-slate-50 rounded-3xl p-4 mb-4 border border-slate-100">
                      <div className="h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <div className="w-12 h-12 rounded-full border-[3px] border-blue-400 bg-white flex items-center justify-center text-blue-500">
                          <Mic size={20} />
                        </div>
                      </div>
                      <p className="text-center text-slate-500 text-[14px] leading-6">长按录音键2秒后抬手开始录音</p>
                    </div>
                    <button
                      onClick={closeProjectSelection}
                      className="w-full py-3 rounded-full bg-blue-50 text-blue-600 text-lg font-semibold"
                    >
                      确定
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isRecordingView && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <header className="flex items-center justify-between px-4 py-4 border-b border-slate-50">
              <button onClick={() => setIsRecordingView(false)} className="p-2 text-slate-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="font-bold text-slate-800">
                {!isRecordingActive ? 'AI 录音准备' : 'AI 录音中'}
              </h2>
              <div className="w-10" />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="relative mb-12">
                {/* Animated Waves */}
                {isRecordingActive && [1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                    className="absolute inset-0 bg-indigo-100 rounded-full"
                  />
                ))}
                <div className={`relative w-32 h-32 ${!isRecordingActive ? 'bg-slate-300' : 'bg-indigo-600'} rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 transition-colors`}>
                  <Mic size={48} className="text-white" />
                </div>
              </div>

              <div className="text-4xl font-mono font-bold text-slate-800 mb-4">
                {formatTime(recordingTime)}
              </div>
              <p className="text-slate-400 text-sm">
                {!isRecordingActive
                  ? '点击下方按钮，手动开始录音'
                  : '正在为您实时记录对话内容...'}
              </p>
            </div>

            <footer className="p-8 pb-12">
              {!isRecordingActive ? (
                <button
                  onClick={() => {
                    setIsRecordingActive(true);
                  }}
                  className="w-full h-12 rounded-xl bg-indigo-600 text-white font-semibold text-base shadow-lg shadow-indigo-200 active:scale-[0.99] transition-all"
                >
                  开始录音
                </button>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => {
                        const projectId = selectedProjectId;
                        setIsRecordingActive(false);
                        setIsRecordingView(false);
                        setRecordingTime(0);
                        
                        const transcriptionMsgId = Date.now();
                        setMessages(prev => [...prev, { 
                          id: transcriptionMsgId,
                          role: 'assistant', 
                          content: '', 
                          type: 'transcription' 
                        }]);

                        setTimeout(() => {
                          const currentProject = projects.find(p => p.id === projectId);
                          const displayProjectName = getDisplayProjectName(currentProject?.name || '未关联项目');
                          const projectCode = currentProject ? `XM211023${currentProject.id.toString().padStart(4, '0')}` : '未关联编号';
                          const metadata = {
                            source: 'a1',
                            projectName: displayProjectName,
                            projectCode,
                            context: '经纪人推荐马桥500平大单层厂房，客户关注层高与面积。',
                            feedback: '对6米层高感兴趣，但担忧加盖违建风险，明确要求5公里内找两个同类型房源。',
                            decision: '待定',
                            nextPlan: '筛选周边符合条件的厂房资源并跟进推荐。',
                            archiveNote: '✅ 归档成功，该记录已归档至项目 5035050349859180880 的跟进历史中，后续如需补充其他沟通内容或绑定新录音，随时告知！'
                          };
                          setMessages(prev => prev.map(m => 
                            m.id === transcriptionMsgId 
                              ? { 
                                  ...m, 
                                  type: 'recording_analysis',
                                  content: `录音分析完成\nA1分析结果\n\n沟通背景：${metadata.context}\n客户反馈：${metadata.feedback}\n结果判定：${metadata.decision}\n下步计划：${metadata.nextPlan}\n${metadata.archiveNote}`,
                                  metadata
                                } 
                              : m
                          ));
                        }, 3000);
                      }}
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform bg-red-500 shadow-red-100"
                    >
                      <div className="w-6 h-6 bg-white rounded-sm" />
                    </button>
                    <span className="text-xs text-slate-400 font-medium">结束</span>
                  </div>
                </div>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GTV Binding View */}
      <AnimatePresence>
        {isBindingView && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
          >
            <header className="flex items-center px-2 py-4">
              <button onClick={() => setIsBindingView(false)} className="p-2 text-slate-700">
                <ChevronLeft size={24} />
              </button>
            </header>

            <div className="flex-1 flex flex-col px-6 pt-4 pb-10">
              {/* Logo + 标题 */}
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img src="/liyeyun-logo.png" alt="立业云" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center mb-1">绑定立业云 GTV</h2>
              <p className="text-sm text-slate-400 text-center mb-10">绑定后即可查询 GTV 相关数据并获得对应服务</p>

              {/* 输入区 */}
              <div className="space-y-4 mb-8">
                {/* 手机号 */}
                <input
                  type="tel"
                  maxLength={11}
                  value={bindingPhone}
                  onChange={(e) => setBindingPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入手机号"
                  className="w-full bg-[#F5F5F5] rounded-full px-6 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {/* 验证码（内联获取按钮） */}
                <div className="flex items-center bg-[#F5F5F5] rounded-full px-6 py-4">
                  <input
                    type="text"
                    value={bindingSmsCode}
                    onChange={(e) => setBindingSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入验证码"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none tracking-widest"
                  />
                  <button
                    onClick={handleSendSms}
                    disabled={bindingPhone.length !== 11 || smsCountdown > 0}
                    className={`font-semibold text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed ${bindingPhone.length === 11 && smsCountdown === 0 ? 'text-[#165DFF]' : 'text-slate-400'}`}
                  >
                    {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* 确认按钮 */}
              <button
                onClick={handleConfirmBinding}
                disabled={bindingPhone.length !== 11 || bindingSmsCode.length === 0 || isBindingLoading}
                className="w-full py-4 bg-[#2141d6] text-white font-bold text-base rounded-full disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-[#1935b8] active:scale-[0.98] transition-all"
              >
                {isBindingLoading ? '绑定中...' : '确认绑定'}
              </button>
            </div>

            {/* 演示选择弹窗 */}
            <AnimatePresence>
              {isBindingDemo && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"
                    onClick={() => setIsBindingDemo(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-6 right-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-20 shadow-xl"
                  >
                    <p className="text-xs text-slate-400 text-center mb-1">演示模式</p>
                    <p className="text-sm font-semibold text-slate-700 text-center mb-5">选择绑定结果</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleBindFail}
                        className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        绑定失败
                      </button>
                      <button
                        onClick={handleBindSuccess}
                        className="flex-1 py-3 bg-[#2141d6] text-white font-semibold text-sm rounded-xl hover:bg-[#1935b8] transition-colors"
                      >
                        绑定成功
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* 绑定失败弹窗 */}
            <AnimatePresence>
              {isBindingError && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-6 right-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-20 shadow-xl"
                  >
                    <p className="text-sm font-semibold text-slate-800 text-center mb-3">未找到账号</p>
                    <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                      立业云GTV中未找到相关账号，无法完成关联，请联系人工客服。
                    </p>
                    <button
                      onClick={() => setIsBindingError(false)}
                      className="w-full py-3 bg-[#2141d6] text-white font-semibold text-sm rounded-xl hover:bg-[#1935b8] transition-colors"
                    >
                      知道了
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#FAFAFA] sticky top-0 z-30 border-b border-slate-200/70">
          <button 
            onClick={() => {
              setMessages([]);
              setIsDrilling(false);
              setCurrentDrillProject(null);
              setIsPropertyMatchingScene(false);
            }} 
            className={`p-2 -ml-2 text-slate-600 transition-opacity ${messages.length <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
              <img src={heroImage} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
              AI金牌经纪人
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-600"><VolumeX size={20} /></button>
            {user?.crm_bound && (
              <button
                onClick={() => setUser(u => u ? { ...u, crm_bound: false } : u)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <img src="/liyeyun-logo.png" className="w-3.5 h-3.5 object-contain" />
                已授权
              </button>
            )}
            <button className="p-2 text-slate-600" onClick={() => setIsHistoryOpen(true)}><Menu size={20} /></button>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden relative bg-[#FAFAFA]">
          {messages.length <= 0 ? (
            <div className="flex-1 overflow-y-auto px-4 pt-1 pb-4 custom-scrollbar">
              {/* Hero Section */}
              <div className="relative rounded-[30px] overflow-visible mb-5">
                <div className="w-[56%] min-h-[155px] flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-slate-900 leading-[1.3] mb-4">
                    AI金牌经纪人，<br />您的随身军师！
                  </h2>
                  <div className="flex flex-wrap gap-4 text-[14px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      产业选址行业垂直大模型
                    </span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-[40%] h-[220px] pointer-events-none z-10">
                  <img
                    src={heroImage}
                    alt="AI Broker"
                    className="w-full h-full object-contain object-top translate-y-2 drop-shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative bg-white/96 backdrop-blur rounded-[28px] px-4 py-2 shadow-sm border border-slate-100 z-30">
                  <div className="grid grid-cols-4 gap-1">
                    <ActionCard icon={FileText} label="拜访计划" onClick={() => handleSend('帮我制定拜访计划')} />
                    <ActionCard icon={TrendingUp} label="跟进策略" onClick={() => handleSend('帮我生成跟进策略')} />
                    <ActionCard icon={LayoutGrid} label="房源匹配" onClick={() => handleSend('帮我进行房源匹配')} />
                    <ActionCard icon={History} label="今日复盘" onClick={() => handleSend('今日跟进复盘')} />
                  </div>
                </div>
              </div>

              {/* Follow-up Projects */}
              <div className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-white">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[16px] font-[400] text-black">待跟进项目</p>
                </div>

                <div className="space-y-4">
                  {homeFollowUpProjects.length > 0 ? (
                    homeFollowUpProjects.map((project) => {
                      const pendingDays = getPendingDays(project.id);
                      const projectLevel = getProjectLevel(project);
                      const displayProjectName = getDisplayProjectName(project.name);
                      return (
                        <button
                          key={project.id}
                          onClick={() =>
                            handleSend(
                              `帮我查下“${displayProjectName}”（XM211023${project.id.toString().padStart(4, '0')}）的项目详情`
                            )
                          }
                          className="w-full text-left pb-3 border-b border-slate-200 last:border-b-0 last:pb-0 hover:bg-slate-50/40 rounded-md transition-colors"
                        >
                          <p className="text-slate-800 text-[14px] font-medium overflow-hidden whitespace-nowrap text-ellipsis">{displayProjectName}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-slate-400 text-[12px]">
                            <span className="truncate">{projectLevel}</span>
                            <span className="truncate">{project.stage || '待跟进'}</span>
                            <span className="truncate">{project.client_name || '未命名'}</span>
                            <span className="truncate">{pendingDays > 0 ? `${pendingDays}天未跟进` : '10天未跟进'}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 text-sm py-2">暂无待跟进项目</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col px-4 pt-4 pb-1 lg:px-6 lg:pt-6 lg:pb-2 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-6 pr-1 lg:pr-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`${msg.role === 'user' ? 'max-w-[85%] lg:max-w-[75%]' : 'max-w-full'} rounded-2xl ${
                        msg.type === 'transcription' ? '' : 'p-3 lg:p-4'
                      } ${
                        msg.role === 'user' 
                          ? 'bg-[#EEEFF1] text-slate-800 shadow-sm rounded-tr-none' 
                          : msg.type === 'drill'
                            ? 'bg-amber-50 border border-amber-100 text-amber-900 rounded-tl-none'
                            : msg.type === 'transcription'
                              ? ''
                              : 'bg-transparent text-slate-800'
                      }`}>
                        {msg.type === 'transcription' ? (
                          <TranscriptionCard />
                        ) : msg.type === 'recording_analysis' ? (
                          <RecordingAnalysisCard
                            metadata={msg.metadata}
                            onLinkProject={() => openProjectSelection(msg.id || Date.now())}
                          />
                        ) : msg.role === 'assistant' && msg.content === propertyMatchMarkdown ? (
                          <PropertyMatchLayout />
                        ) : (
                          <div className="markdown-body prose prose-sm max-w-none leading-relaxed">
                            <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                          </div>
                        )}
                        {msg.type === 'gtv_binding' && (
                          <GTVBindingCard onBind={() => setIsBindingView(true)} isBound={user?.crm_bound} />
                        )}
                        {msg.type === 'drill' && i === messages.length - 1 && (
                          <div className="mt-3 flex justify-end">
                            <button 
                              onClick={() => {
                                setIsDrilling(false);
                                setMessages(prev => [...prev, { role: 'assistant', content: '演练已结束。需要我为你刚才的表现提供反馈吗？' }]);
                              }}
                              className="text-[10px] bg-amber-200 text-amber-800 px-2 py-1 rounded-lg font-bold hover:bg-amber-300 transition-colors"
                            >
                              结束演练
                            </button>
                          </div>
                        )}
                        {msg.type === 'analysis' && msg.metadata && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                              <Calendar size={14} /> 推荐跟进计划
                            </h4>
                            <div className="space-y-3">
                              {msg.metadata.plans.map((p: any, pi: number) => (
                                <div key={pi} className="bg-slate-50 p-3 rounded-xl text-xs">
                                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                                    <span>{p.time}</span>
                                    <span className="text-indigo-600">{p.action}</span>
                                  </div>
                                  <p className="text-slate-500">话题: {p.topic}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.type !== 'transcription' && (() => {
                          const guideButtons = getSceneGuideButtons(msg.content);
                          if (guideButtons.length === 0) return null;
                          return (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {guideButtons.map((btn) => (
                                <button
                                  key={btn.label}
                                  onClick={() => {
                                    if (btn.type === 'upload') {
                                      fileInputRef.current?.click();
                                      return;
                                    }
                                    handleSend(btn.prompt);
                                  }}
                                  className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 active:scale-95 transition-all"
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                        {msg.role === 'assistant' && msg.type !== 'transcription' && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => handleCopyMessage(msg.content)}
                              className="h-8 w-8 text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center justify-center"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleFeedback(i, 'up')}
                              className={`h-8 w-8 transition-colors inline-flex items-center justify-center ${
                                messageFeedback[i] === 'up'
                                  ? 'text-emerald-600'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              onClick={() => handleFeedback(i, 'down')}
                              className={`h-8 w-8 transition-colors inline-flex items-center justify-center ${
                                messageFeedback[i] === 'down'
                                  ? 'text-rose-600'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <ThumbsDown size={14} />
                            </button>
                            <button
                              onClick={() => handleShareMessage(msg.content)}
                              className="h-8 w-8 text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center justify-center"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 p-3 lg:p-4 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 pt-1 pb-4">
            {/* Bottom Quick Actions */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={openRecordingScenarioPicker}
                className="bg-white px-4 py-2 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-100 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Mic size={14} className="text-slate-400" /> 开启AI录音
              </button>
              <button
                onClick={() => handleSend('联系我们')}
                className="bg-white px-4 py-2 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-100 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <PhoneCall size={14} className="text-slate-400" /> 联系我们
              </button>
            </div>

            {/* Main Input Button/Field */}
            <div className="bg-white border border-slate-100 rounded-full shadow-lg p-1 flex items-center gap-2 transition-all duration-300">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept="audio/*,video/*,.pdf,.doc,.docx,.txt"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={24} className="border border-slate-300 rounded-full p-0.5" />
              </button>
              
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="发消息或按住说话..."
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-800 py-2 text-sm selection:bg-indigo-100"
              />

              <button 
                onClick={() => handleSend()}
                className="p-2 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Mic size={24} />
              </button>
            </div>
          </div>
        </div>
      </main>
      <AnimatePresence>
        {isScenarioPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScenarioPickerOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-[90] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {isBindingProjectMode ? '选择关联场景' : '选择录音场景'}
                </h3>
                <button
                  onClick={() => setIsScenarioPickerOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {isBindingProjectMode ? (
                  <>
                    <button
                      onClick={() => enterProjectSelectionWithScenario('all_connected')}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900">1. 已授权GTV账号</p>
                      <p className="text-xs text-slate-500 mt-1">可直接进入项目列表并确认关联</p>
                    </button>
                    <button
                      onClick={() => enterProjectSelectionWithScenario('unbound_gtv')}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900">2. 未授权GTV账号</p>
                      <p className="text-xs text-slate-500 mt-1">在项目列表展示GTV授权提示</p>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => enterProjectSelectionWithScenario('all_connected')}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900">1. 有项目</p>
                      <p className="text-xs text-slate-500 mt-1">进入项目列表，选择后开启A1录音</p>
                    </button>
                    <button
                      onClick={() => enterProjectSelectionWithScenario('unbound_gtv')}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900">2. 无项目/未判定GTV账号</p>
                      <p className="text-xs text-slate-500 mt-1">直接进入录音页面，支持后关联项目</p>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-slate-800/90 text-white text-xs rounded-full shadow-xl backdrop-blur-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        sessions={sessions} 
        onSelectSession={(s) => setMessages(s.messages)} 
      />
    </div>
  );
}

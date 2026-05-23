import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================
// Helper types
// ============================================================
interface OptionValueDef {
  label: string;
  priceDelta: number;
  sort: number;
  isDefault?: boolean;
}

interface OptionGroupDef {
  name: string;
  desc: string;
  required: boolean;
  multi: boolean;
  sort: number;
  values: OptionValueDef[];
}

interface ProductDef {
  sku: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  categorySlug: string;
  specs: string[];
  optionGroups: OptionGroupDef[];
}

// ============================================================
// Category definitions
// ============================================================
const CATEGORIES = [
  { name: '电动叉车', slug: 'electric-forklift', sortOrder: 1 },
  { name: '内燃叉车', slug: 'diesel-forklift', sortOrder: 2 },
];

const SUBCATEGORIES = [
  { name: 'EFS 系列', slug: 'efs-series', parent: 'electric-forklift', sortOrder: 1 },
  { name: 'EFL 系列', slug: 'efl-series', parent: 'electric-forklift', sortOrder: 2 },
  { name: 'CPCD 系列', slug: 'cpcd-series', parent: 'diesel-forklift', sortOrder: 1 },
  { name: 'CPD 系列', slug: 'cpd-series', parent: 'diesel-forklift', sortOrder: 2 },
];

// ============================================================
// Common option groups (shared across models)
// ============================================================

// --- Lights & accessories (shared by all models) ---
const FOG_LIGHT_GROUP: OptionGroupDef = {
  name: 'Fog Light', desc: '雾灯位置', required: false, multi: true, sort: 8,
  values: [
    { label: '前雾灯', priceDelta: 50, sort: 1 },
    { label: '左雾灯', priceDelta: 23, sort: 2 },
    { label: '右雾灯', priceDelta: 23, sort: 3 },
  ],
};

const ROTATE_WARNING_GROUP: OptionGroupDef = {
  name: 'Rotate Warning', desc: '旋转警示灯', required: false, multi: true, sort: 9,
  values: [
    { label: '后旋转警示灯', priceDelta: 35, sort: 1 },
    { label: '前旋转警示灯', priceDelta: 35, sort: 2 },
  ],
};

const BLUESPOT_GROUP: OptionGroupDef = {
  name: 'Extra Bluespot', desc: '额外蓝光灯', required: false, multi: true, sort: 10,
  values: [
    { label: '前蓝光灯', priceDelta: 50, sort: 1 },
    { label: '左蓝光灯', priceDelta: 50, sort: 2 },
    { label: '右蓝光灯', priceDelta: 50, sort: 3 },
  ],
};

const SIDE_LINE_LIGHT_GROUP: OptionGroupDef = {
  name: 'Side Line Light', desc: '侧边线灯', required: false, multi: true, sort: 11,
  values: [
    { label: '左侧边线灯', priceDelta: 50, sort: 1 },
    { label: '后侧边线灯', priceDelta: 50, sort: 2 },
    { label: '右侧边线灯', priceDelta: 50, sort: 3 },
  ],
};

const WARNING_LIGHT_GROUP: OptionGroupDef = {
  name: 'Warning Light', desc: '警示灯', required: false, multi: true, sort: 12,
  values: [
    { label: '后警示灯', priceDelta: 50, sort: 1 },
    { label: '前警示灯', priceDelta: 50, sort: 2 },
  ],
};

const WORKING_LIGHT_GROUP: OptionGroupDef = {
  name: 'Working Light', desc: '工作灯', required: false, multi: true, sort: 13,
  values: [
    { label: '后工作灯', priceDelta: 50, sort: 1 },
  ],
};

const TRUCK_COLOR_GROUP: OptionGroupDef = {
  name: 'Truck Color', desc: '车身颜色 (RAL色卡)', required: false, multi: false, sort: 14,
  values: [
    { label: 'PT2422C - EP Green', priceDelta: 500, sort: 1, isDefault: true },
    { label: 'RAL 1000 - Green beige', priceDelta: 500, sort: 2 },
    { label: 'RAL 1001 - Beige', priceDelta: 500, sort: 3 },
    { label: 'RAL 1002 - Sand yellow', priceDelta: 500, sort: 4 },
    { label: 'RAL 1003 - Signal yellow', priceDelta: 500, sort: 5 },
    { label: 'RAL 1004 - Golden yellow', priceDelta: 500, sort: 6 },
    { label: 'RAL 1005 - Honey yellow', priceDelta: 500, sort: 7 },
    { label: 'RAL 1006 - Maize yellow', priceDelta: 500, sort: 8 },
    { label: 'RAL 1011 - Brown beige', priceDelta: 500, sort: 9 },
    { label: 'RAL 1013 - Oyster white', priceDelta: 500, sort: 10 },
    { label: 'RAL 1014 - Ivory', priceDelta: 500, sort: 11 },
    { label: 'RAL 1015 - Light ivory', priceDelta: 500, sort: 12 },
    { label: 'RAL 1016 - Sulfur yellow', priceDelta: 500, sort: 13 },
    { label: 'RAL 1018 - Zinc yellow', priceDelta: 500, sort: 14 },
    { label: 'BT2422C - BP Green', priceDelta: 500, sort: 15 },
    { label: 'RAL 1034 - Opticorte 500', priceDelta: 500, sort: 16 },
  ],
};

const GPS_GROUP: OptionGroupDef = {
  name: 'GPS', desc: 'GPS 定位系统', required: false, multi: false, sort: 7,
  values: [
    { label: '标准 GPS', priceDelta: 0, sort: 1, isDefault: true },
    { label: '额外 GPS 5年服务', priceDelta: 339, sort: 2 },
  ],
};

// ============================================================
// Product definitions (from screenshots)
// ============================================================

// --- EFS151: 1.5-ton electric forklift ---
const EFS151: ProductDef = {
  sku: 'EFS151', name: 'EFS151 电动叉车',
  description: '1.5吨电动平衡重叉车',
  basePrice: 13720, currency: 'EUR', categorySlug: 'efs-series',
  specs: [
    'OPS + 悬浮座椅 + 倒车扶手带喇叭按钮 + 倒车蓝灯 + 第四阀 + 管路 + GPS',
    '150ah 48V 铅酸电池',
    '外置 304/48V 164A 单相充电器',
  ],
  optionGroups: [
    {
      name: 'Battery', desc: '电池选项', required: true, multi: false, sort: 1,
      values: [
        { label: 'Lead Acid 150AH/48V', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'Lead Acid 180AH/48V', priceDelta: 171, sort: 2 },
      ],
    },
    {
      name: 'Charger', desc: '充电器选项', required: true, multi: false, sort: 2,
      values: [
        { label: '内置 60A/48V 16Anp 单相', priceDelta: 0, sort: 1, isDefault: true },
        { label: '外置 30A/48V 16Anp 单相', priceDelta: 0, sort: 2 },
        { label: '外置 50A/48V 16Anp 单相', priceDelta: 400, sort: 3 },
      ],
    },
    {
      name: 'Fork length', desc: '货叉长度', required: true, multi: false, sort: 3,
      values: [
        { label: '1070mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: '1150mm', priceDelta: 10, sort: 2 },
        { label: '1220mm', priceDelta: 20, sort: 3 },
        { label: '1370mm', priceDelta: 24, sort: 4 },
        { label: '1520mm', priceDelta: 40, sort: 5 },
      ],
    },
    {
      name: 'Mast Height', desc: '门架高度 (必选)', required: true, multi: false, sort: 4,
      values: [
        { label: '3000mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'D3500', priceDelta: 173, sort: 2 },
        { label: 'D4000', priceDelta: 525, sort: 3 },
        { label: 'D4350', priceDelta: 703, sort: 4 },
        { label: 'D4500', priceDelta: 703, sort: 5 },
      ],
    },
    {
      name: 'Shifter', desc: '侧移器', required: false, multi: false, sort: 5,
      values: [
        { label: 'Cascade 外置侧移器', priceDelta: 0, sort: 1, isDefault: true },
        { label: '内置侧移器', priceDelta: 0, sort: 2 },
        { label: '无侧移器', priceDelta: 0, sort: 3 },
        { label: '国产定位器', priceDelta: 200, sort: 4 },
      ],
    },
    {
      name: 'Tyres / Wheels', desc: '轮胎选项', required: true, multi: false, sort: 6,
      values: [
        { label: '无痕轮胎', priceDelta: 169, sort: 1, isDefault: true },
        { label: '实心轮胎', priceDelta: 0, sort: 2 },
      ],
    },
    GPS_GROUP,
    FOG_LIGHT_GROUP,
    ROTATE_WARNING_GROUP,
    BLUESPOT_GROUP,
    SIDE_LINE_LIGHT_GROUP,
    WARNING_LIGHT_GROUP,
    WORKING_LIGHT_GROUP,
    TRUCK_COLOR_GROUP,
  ],
};

// --- EFL203P: 2.0-ton electric forklift ---
const EFL203P: ProductDef = {
  sku: 'EFL203P', name: 'EFL203P 电动叉车',
  description: '2.0吨电动平衡重叉车',
  basePrice: 15135, currency: 'EUR', categorySlug: 'efl-series',
  specs: [
    'OPS + 悬浮座椅 + 倒车扶手带喇叭按钮 + 倒车蓝灯',
    '80V 高电压平台',
    'AC 驱动电机 + 液压电机',
  ],
  optionGroups: [
    {
      name: 'Battery', desc: '电池选项', required: true, multi: false, sort: 1,
      values: [
        { label: '30Ah/80V 铅酸电池', priceDelta: 0, sort: 1, isDefault: true },
        { label: '40Ah/80V 铅酸电池', priceDelta: 400, sort: 2 },
        { label: '460Ah/80V 铅酸电池', priceDelta: 2688, sort: 3 },
      ],
    },
    {
      name: 'Charger', desc: '充电器选项', required: true, multi: false, sort: 2,
      values: [
        { label: '内置 35A/80V 16Anp 单相', priceDelta: 0, sort: 1, isDefault: true },
        { label: '外置 60A/80V 32Anp 三相', priceDelta: 349, sort: 2 },
        { label: '外置 80V/100A 32Anp 三相', priceDelta: 846, sort: 3 },
        { label: '外置 160A/80V 32Anp 三相', priceDelta: 1031, sort: 4 },
        { label: '外置 200A/80V 32Anp 三相', priceDelta: 1379, sort: 5 },
      ],
    },
    {
      name: 'Fork length', desc: '货叉长度', required: true, multi: false, sort: 3,
      values: [
        { label: '1000mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: '1070mm', priceDelta: 10, sort: 2 },
        { label: '1200mm', priceDelta: 20, sort: 3 },
        { label: '1220mm', priceDelta: 24, sort: 4 },
        { label: '1370mm', priceDelta: 67, sort: 5 },
        { label: '1500mm', priceDelta: 185, sort: 6 },
        { label: '1520mm', priceDelta: 224, sort: 7 },
        { label: '1600mm', priceDelta: 280, sort: 8 },
        { label: '1670mm', priceDelta: 300, sort: 9 },
        { label: '1700mm', priceDelta: 315, sort: 10 },
        { label: '1800mm', priceDelta: 370, sort: 11 },
        { label: '2000mm', priceDelta: 490, sort: 12 },
        { label: '2200mm', priceDelta: 590, sort: 13 },
        { label: '2400mm', priceDelta: 690, sort: 14 },
        { label: 'No forks (无货叉)', priceDelta: 0, sort: 15 },
      ],
    },
    {
      name: 'Mast Height', desc: '门架高度', required: true, multi: false, sort: 4,
      values: [
        { label: '2500mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: '2700mm', priceDelta: 0, sort: 2 },
        { label: '3000mm', priceDelta: 0, sort: 3 },
        { label: '3300mm', priceDelta: 156, sort: 4 },
        { label: 'D3500', priceDelta: 227, sort: 5 },
        { label: 'D3600', priceDelta: 227, sort: 6 },
        { label: 'D4000', priceDelta: 525, sort: 7 },
        { label: 'D4300', priceDelta: 703, sort: 8 },
        { label: 'D4500', priceDelta: 703, sort: 9 },
        { label: 'T4300', priceDelta: 1218, sort: 10 },
        { label: 'T4500', priceDelta: 1487, sort: 11 },
        { label: 'T4800', priceDelta: 1233, sort: 12 },
        { label: 'T5000', priceDelta: 1850, sort: 13 },
        { label: 'T5500', priceDelta: 2250, sort: 14 },
        { label: 'T6000', priceDelta: 2898, sort: 15 },
      ],
    },
    {
      name: 'Shifter', desc: '侧移器', required: false, multi: false, sort: 5,
      values: [
        { label: 'Cascade 外置侧移器', priceDelta: 0, sort: 1, isDefault: true },
        { label: '内置侧移器', priceDelta: 0, sort: 2 },
        { label: 'Cascade 定位器', priceDelta: 562, sort: 3 },
        { label: '10吨侧移器', priceDelta: 0, sort: 4 },
        { label: '国产定位器', priceDelta: 402, sort: 5 },
      ],
    },
    {
      name: 'Tyres / Wheels', desc: '轮胎选项', required: true, multi: false, sort: 6,
      values: [
        { label: '无痕轮胎', priceDelta: 183, sort: 1, isDefault: true },
        { label: '实心轮胎', priceDelta: 0, sort: 2 },
      ],
    },
    {
      name: 'Cabin', desc: '驾驶室选项', required: false, multi: false, sort: 7,
      values: [
        { label: '无驾驶室', priceDelta: 0, sort: 1, isDefault: true },
        { label: '开放式驾驶室', priceDelta: 300, sort: 2 },
        { label: '全封闭驾驶室带暖风', priceDelta: 2628, sort: 3 },
      ],
    },
    {
      name: 'Fingertips', desc: '指尖操控', required: false, multi: false, sort: 8,
      values: [
        { label: '标准操控', priceDelta: 0, sort: 1, isDefault: true },
        { label: '指尖操控 (Fingertips)', priceDelta: 1629, sort: 2 },
      ],
    },
    GPS_GROUP,
    {
      name: 'Joystick', desc: '摇杆操控', required: false, multi: false, sort: 9,
      values: [
        { label: '标准操控', priceDelta: 0, sort: 1, isDefault: true },
        { label: '摇杆操控 (Joystick)', priceDelta: 1629, sort: 2 },
      ],
    },
    FOG_LIGHT_GROUP,
    ROTATE_WARNING_GROUP,
    BLUESPOT_GROUP,
    SIDE_LINE_LIGHT_GROUP,
    WARNING_LIGHT_GROUP,
    WORKING_LIGHT_GROUP,
    TRUCK_COLOR_GROUP,
  ],
};

// --- CPCD25T8: 2.5-ton diesel forklift ---
const CPCD25T8: ProductDef = {
  sku: 'CPCD25T8', name: 'CPCD25T8 内燃叉车',
  description: '2.5吨柴油平衡重叉车',
  basePrice: 22069, currency: 'EUR', categorySlug: 'cpcd-series',
  specs: [
    'H4/27 标准门架 2500mm',
    '双前轮气轮胎',
    '国产发动机 + 液压变速箱',
  ],
  optionGroups: [
    {
      name: 'Mast Height', desc: '门架高度 (必选)', required: true, multi: false, sort: 1,
      values: [
        { label: '2F3000', priceDelta: 573, sort: 1, isDefault: true },
        { label: 'D2500', priceDelta: 191, sort: 2 },
        { label: 'D3000', priceDelta: 156, sort: 3 },
        { label: 'D4000', priceDelta: 525, sort: 4 },
      ],
    },
    {
      name: 'Tyres / Wheels', desc: '轮胎选项', required: true, multi: false, sort: 2,
      values: [
        { label: '双前轮气轮胎 (Dual front Pneumatic)', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'Castor Wheels (转向轮)', priceDelta: 0, sort: 2 },
        { label: '无痕轮胎 (Non marking tyres)', priceDelta: 320, sort: 3 },
        { label: '实心轮胎 (Solid Tyres)', priceDelta: 0, sort: 4 },
        { label: '双前轮无痕轮胎 (Dual front No Marking)', priceDelta: 1064, sort: 5 },
        { label: '双前轮实心轮胎 (Dual front solid tyre)', priceDelta: 863, sort: 6 },
        { label: '双负重轮 (Dual load wheel)', priceDelta: 0, sort: 7 },
        { label: '单负重轮 (Single load wheel)', priceDelta: 0, sort: 8 },
      ],
    },
    {
      name: 'Cabin', desc: '驾驶室选项', required: false, multi: false, sort: 3,
      values: [
        { label: '无驾驶室', priceDelta: 0, sort: 1, isDefault: true },
        { label: '开放式驾驶室', priceDelta: 461, sort: 2 },
        { label: '全封闭驾驶室带暖风', priceDelta: 1436, sort: 3 },
      ],
    },
    GPS_GROUP,
    {
      name: 'Motor', desc: '发动机选项', required: false, multi: false, sort: 4,
      values: [
        { label: '国产标准发动机', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'KUBOTA 发动机', priceDelta: 2253, sort: 2 },
      ],
    },
    FOG_LIGHT_GROUP,
    ROTATE_WARNING_GROUP,
    BLUESPOT_GROUP,
    SIDE_LINE_LIGHT_GROUP,
    WARNING_LIGHT_GROUP,
    WORKING_LIGHT_GROUP,
    TRUCK_COLOR_GROUP,
  ],
};

// --- CPCD30T8: 3.0-ton diesel forklift ---
const CPCD30T8: ProductDef = {
  sku: 'CPCD30T8', name: 'CPCD30T8 内燃叉车',
  description: '3.0吨柴油平衡重叉车',
  basePrice: 19718, currency: 'EUR', categorySlug: 'cpcd-series',
  specs: [
    'H4/27 标准门架 2700mm',
    '双前轮气轮胎',
    '国产发动机 + 液压变速箱',
  ],
  optionGroups: [
    {
      name: 'Fork length', desc: '货叉长度', required: true, multi: false, sort: 1,
      values: [
        { label: '1500mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: '1600mm', priceDelta: 45, sort: 2 },
        { label: '1800mm', priceDelta: 90, sort: 3 },
        { label: '2000mm', priceDelta: 135, sort: 4 },
      ],
    },
    {
      name: 'Mast Height', desc: '门架高度 (必选)', required: true, multi: false, sort: 2,
      values: [
        { label: '2F2500', priceDelta: 573, sort: 1 },
        { label: '2F2700', priceDelta: 573, sort: 2 },
        { label: '2F3000', priceDelta: 673, sort: 3 },
        { label: '2F3300', priceDelta: 692, sort: 4 },
        { label: 'D2500', priceDelta: 227, sort: 5 },
        { label: 'D2700', priceDelta: 227, sort: 6, isDefault: true },
        { label: 'D3000', priceDelta: 0, sort: 7 },
        { label: 'D3300', priceDelta: 156, sort: 8 },
        { label: 'D3500', priceDelta: 227, sort: 9 },
        { label: 'D3600', priceDelta: 227, sort: 10 },
        { label: 'D4000', priceDelta: 525, sort: 11 },
        { label: 'D4300', priceDelta: 703, sort: 12 },
        { label: 'D4500', priceDelta: 703, sort: 13 },
        { label: 'T4300', priceDelta: 1218, sort: 14 },
        { label: 'T4500', priceDelta: 1487, sort: 15 },
        { label: 'T4800', priceDelta: 1365, sort: 16 },
        { label: 'T5000', priceDelta: 1850, sort: 17 },
        { label: 'T5500', priceDelta: 2250, sort: 18 },
        { label: 'T6000', priceDelta: 2116, sort: 19 },
      ],
    },
    {
      name: 'Shifter', desc: '侧移器 (必选)', required: true, multi: false, sort: 3,
      values: [
        { label: 'Cascade 定位器', priceDelta: 562, sort: 1 },
        { label: 'Cascade 外置侧移器', priceDelta: 0, sort: 2, isDefault: true },
        { label: '国产外置侧移器', priceDelta: 0, sort: 3 },
        { label: '内置侧移器', priceDelta: 0, sort: 4 },
        { label: '10吨侧移器', priceDelta: 0, sort: 5 },
      ],
    },
    {
      name: 'Tyres / Wheels', desc: '轮胎选项', required: true, multi: false, sort: 4,
      values: [
        { label: '双前轮气轮胎', priceDelta: 0, sort: 1, isDefault: true },
        { label: '双前轮无痕轮胎', priceDelta: 1323, sort: 2 },
        { label: '双前轮实心轮胎', priceDelta: 962, sort: 3 },
        { label: '无痕轮胎', priceDelta: 320, sort: 4 },
        { label: '实心轮胎', priceDelta: 0, sort: 5 },
      ],
    },
    {
      name: 'Cabin', desc: '驾驶室选项', required: false, multi: false, sort: 5,
      values: [
        { label: '无驾驶室', priceDelta: 0, sort: 1, isDefault: true },
        { label: '开放式驾驶室', priceDelta: 461, sort: 2 },
        { label: '全封闭驾驶室带暖风', priceDelta: 1436, sort: 3 },
      ],
    },
    GPS_GROUP,
    {
      name: 'Motor', desc: '发动机选项', required: false, multi: false, sort: 6,
      values: [
        { label: '国产标准发动机', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'KUBOTA 发动机', priceDelta: 2253, sort: 2 },
      ],
    },
    FOG_LIGHT_GROUP,
    ROTATE_WARNING_GROUP,
    BLUESPOT_GROUP,
    SIDE_LINE_LIGHT_GROUP,
    WARNING_LIGHT_GROUP,
    WORKING_LIGHT_GROUP,
    TRUCK_COLOR_GROUP,
  ],
};

// --- CPCD35T8: 3.5-ton diesel forklift ---
const CPCD35T8: ProductDef = {
  sku: 'CPCD35T8', name: 'CPCD35T8 内燃叉车',
  description: '3.5吨柴油平衡重叉车',
  basePrice: 20728, currency: 'EUR', categorySlug: 'cpcd-series',
  specs: [
    'H4/27 标准门架 2700mm',
    '双前轮气轮胎',
    '国产发动机 + 液压变速箱',
  ],
  optionGroups: [
    {
      name: 'Fork length', desc: '货叉长度', required: true, multi: false, sort: 1,
      values: [
        { label: '1500mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: '1600mm', priceDelta: 45, sort: 2 },
        { label: '1800mm', priceDelta: 90, sort: 3 },
        { label: '2000mm', priceDelta: 135, sort: 4 },
      ],
    },
    {
      name: 'Mast Height', desc: '门架高度 (必选)', required: true, multi: false, sort: 2,
      values: [
        { label: '2F2500', priceDelta: 573, sort: 1 },
        { label: '2F2700', priceDelta: 573, sort: 2 },
        { label: '2F3000', priceDelta: 673, sort: 3 },
        { label: '2F3300', priceDelta: 692, sort: 4 },
        { label: 'D2500', priceDelta: 227, sort: 5 },
        { label: 'D2700', priceDelta: 227, sort: 6, isDefault: true },
        { label: 'D3000', priceDelta: 0, sort: 7 },
        { label: 'D3300', priceDelta: 156, sort: 8 },
        { label: 'D3500', priceDelta: 227, sort: 9 },
        { label: 'D3600', priceDelta: 227, sort: 10 },
        { label: 'D4000', priceDelta: 525, sort: 11 },
        { label: 'D4300', priceDelta: 703, sort: 12 },
        { label: 'D4500', priceDelta: 703, sort: 13 },
        { label: 'T4300', priceDelta: 1218, sort: 14 },
        { label: 'T4500', priceDelta: 1487, sort: 15 },
        { label: 'T4800', priceDelta: 1365, sort: 16 },
        { label: 'T5000', priceDelta: 1850, sort: 17 },
        { label: 'T5500', priceDelta: 2250, sort: 18 },
        { label: 'T6000', priceDelta: 2116, sort: 19 },
      ],
    },
    {
      name: 'Shifter', desc: '侧移器', required: true, multi: false, sort: 3,
      values: [
        { label: 'Cascade 定位器', priceDelta: 562, sort: 1 },
        { label: 'Cascade 外置侧移器', priceDelta: 0, sort: 2, isDefault: true },
        { label: '国产外置侧移器', priceDelta: 0, sort: 3 },
        { label: '10吨侧移器', priceDelta: 0, sort: 4 },
      ],
    },
    {
      name: 'Tyres / Wheels', desc: '轮胎选项', required: true, multi: false, sort: 4,
      values: [
        { label: '双前轮气轮胎', priceDelta: 0, sort: 1, isDefault: true },
        { label: '双前轮无痕轮胎', priceDelta: 1323, sort: 2 },
        { label: '双前轮实心轮胎', priceDelta: 962, sort: 3 },
        { label: '无痕轮胎', priceDelta: 320, sort: 4 },
        { label: '实心轮胎', priceDelta: 0, sort: 5 },
        { label: 'Castor Wheels', priceDelta: 0, sort: 6 },
        { label: 'Dual load wheel', priceDelta: 0, sort: 7 },
        { label: 'Single Load wheel', priceDelta: 0, sort: 8 },
      ],
    },
    {
      name: 'Cabin', desc: '驾驶室选项', required: false, multi: false, sort: 5,
      values: [
        { label: '无驾驶室', priceDelta: 0, sort: 1, isDefault: true },
        { label: '开放式驾驶室', priceDelta: 461, sort: 2 },
        { label: '全封闭驾驶室带暖风', priceDelta: 1436, sort: 3 },
      ],
    },
    GPS_GROUP,
    {
      name: 'Motor', desc: '发动机选项', required: false, multi: false, sort: 6,
      values: [
        { label: '国产标准发动机', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'KUBOTA 发动机', priceDelta: 2253, sort: 2 },
      ],
    },
    FOG_LIGHT_GROUP,
    ROTATE_WARNING_GROUP,
    BLUESPOT_GROUP,
    SIDE_LINE_LIGHT_GROUP,
    WARNING_LIGHT_GROUP,
    WORKING_LIGHT_GROUP,
    TRUCK_COLOR_GROUP,
  ],
};

// --- CPD45F8: 4.5-ton diesel forklift ---
const CPD45F8: ProductDef = {
  sku: 'CPD45F8', name: 'CPD45F8 内燃叉车',
  description: '4.5吨柴油平衡重叉车',
  basePrice: 30161, currency: 'EUR', categorySlug: 'cpd-series',
  specs: [
    'OPS + 悬浮座椅 + 倒车扶手带喇叭按钮 + 倒车蓝灯 + 第四阀 + 管路',
    '大功率柴油发动机',
    '双前轮气轮胎 8.25-15',
  ],
  optionGroups: [
    {
      name: 'Battery', desc: '电池选项', required: false, multi: false, sort: 1,
      values: [
        { label: '标准铅酸电池 80V', priceDelta: 0, sort: 1, isDefault: true },
        { label: '免维护电池 80V', priceDelta: 500, sort: 2 },
      ],
    },
    {
      name: 'Charger', desc: '充电器选项 (必选)', required: true, multi: false, sort: 2,
      values: [
        { label: '外置 200A/80V 32Anp 三相', priceDelta: 0, sort: 1, isDefault: true },
        { label: '外置 160A/80V 32Anp 三相', priceDelta: 0, sort: 2 },
        { label: '外置 100A/80V 32Anp 三相', priceDelta: 0, sort: 3 },
      ],
    },
    {
      name: 'Fork length', desc: '货叉长度', required: true, multi: false, sort: 3,
      values: [
        { label: '1200mm', priceDelta: 0, sort: 1, isDefault: true },
        { label: '1220mm', priceDelta: 44, sort: 2 },
        { label: '1370mm', priceDelta: 67, sort: 3 },
        { label: '1500mm', priceDelta: 185, sort: 4 },
        { label: '1520mm', priceDelta: 232, sort: 5 },
        { label: '1600mm', priceDelta: 280, sort: 6 },
        { label: '1670mm', priceDelta: 300, sort: 7 },
        { label: '1700mm', priceDelta: 315, sort: 8 },
        { label: '1800mm', priceDelta: 370, sort: 9 },
        { label: '2000mm', priceDelta: 490, sort: 10 },
        { label: '2200mm', priceDelta: 590, sort: 11 },
        { label: '2400mm', priceDelta: 690, sort: 12 },
        { label: 'No forks (无货叉)', priceDelta: 0, sort: 13 },
      ],
    },
    {
      name: 'Mast Height', desc: '门架高度', required: true, multi: false, sort: 4,
      values: [
        { label: '2F3000', priceDelta: 0, sort: 1, isDefault: true },
        { label: '2F3600', priceDelta: 1550, sort: 2 },
        { label: 'D2500', priceDelta: 227, sort: 3 },
        { label: 'D3000', priceDelta: 227, sort: 4 },
        { label: 'D3300', priceDelta: 156, sort: 5 },
        { label: 'D3500', priceDelta: 368, sort: 6 },
        { label: 'D4000', priceDelta: 525, sort: 7 },
        { label: 'D4300', priceDelta: 703, sort: 8 },
        { label: 'D4500', priceDelta: 703, sort: 9 },
        { label: 'T4800', priceDelta: 2979, sort: 10 },
        { label: 'T5000', priceDelta: 3336, sort: 11 },
        { label: 'T5500', priceDelta: 5239, sort: 12 },
        { label: 'T6000', priceDelta: 5918, sort: 13 },
      ],
    },
    {
      name: 'Shifter', desc: '侧移器', required: false, multi: false, sort: 5,
      values: [
        { label: '10吨侧移器', priceDelta: 0, sort: 1, isDefault: true },
        { label: 'Cascade 外置侧移器', priceDelta: 0, sort: 2 },
        { label: '国产外置侧移器', priceDelta: 0, sort: 3 },
        { label: '国产定位器', priceDelta: 1518, sort: 4 },
      ],
    },
    {
      name: 'Tyres / Wheels', desc: '轮胎选项', required: true, multi: false, sort: 6,
      values: [
        { label: '实心轮胎', priceDelta: 0, sort: 1, isDefault: true },
        { label: '无痕轮胎', priceDelta: 414, sort: 2 },
        { label: '双前轮无痕轮胎', priceDelta: 2018, sort: 3 },
        { label: '双前轮实心轮胎', priceDelta: 2263, sort: 4 },
      ],
    },
    {
      name: 'Cabin', desc: '驾驶室选项', required: false, multi: false, sort: 7,
      values: [
        { label: '无驾驶室', priceDelta: 0, sort: 1, isDefault: true },
        { label: '开放式驾驶室', priceDelta: 300, sort: 2 },
        { label: '全封闭驾驶室带暖风', priceDelta: 2628, sort: 3 },
      ],
    },
    GPS_GROUP,
    FOG_LIGHT_GROUP,
    ROTATE_WARNING_GROUP,
    BLUESPOT_GROUP,
    SIDE_LINE_LIGHT_GROUP,
    WARNING_LIGHT_GROUP,
    WORKING_LIGHT_GROUP,
    TRUCK_COLOR_GROUP,
  ],
};

// ============================================================
// All products to seed
// ============================================================
const ALL_PRODUCTS: ProductDef[] = [
  EFS151,
  EFL203P,
  CPCD25T8,
  CPCD30T8,
  CPCD35T8,
  CPD45F8,
];

// ============================================================
// Seed execution
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  诺力CPQ选配器 — 数据初始化                       ║');
  console.log('║  Noblelift CPQ Data Initialization                ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1. Clean existing data (in reverse FK order)
  console.log('[1/5] 清理已有数据...');
  await prisma.quoteHistory.deleteMany();
  await prisma.quoteDiscount.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.dependencyRule.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.standardSpec.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.user.deleteMany();
  console.log('  已清理所有数据\n');

  // 2. Create users
  console.log('[2/5] 创建用户...');
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: { email: 'admin@noblelift.com', passwordHash: adminHash, name: '系统管理员', role: 'ADMIN' },
  });

  const salesHash = await bcrypt.hash('sales123', 10);
  const sales = await prisma.user.create({
    data: { email: 'sales@noblelift.com', passwordHash: salesHash, name: '销售员小王', role: 'SALES' },
  });
  console.log(`  Admin : ${admin.email} / admin123`);
  console.log(`  Sales : ${sales.email} / sales123\n`);

  // 3. Create categories
  console.log('[3/5] 创建产品分类...');
  const categoryMap: Record<string, number> = {};

  for (const cat of CATEGORIES) {
    const created = await prisma.productCategory.create({ data: cat });
    categoryMap[cat.slug] = created.id;
    console.log(`  [分类] ${cat.name} (${cat.slug})`);
  }

  for (const sub of SUBCATEGORIES) {
    const created = await prisma.productCategory.create({
      data: { name: sub.name, slug: sub.slug, parentId: categoryMap[sub.parent], sortOrder: sub.sortOrder },
    });
    categoryMap[sub.slug] = created.id;
    console.log(`  [子分类]   ${sub.name} (${sub.slug}) ← ${sub.parent}`);
  }
  console.log('');

  // 4. Create products with option groups
  console.log('[4/5] 创建产品与配置项...');
  let totalOptionGroups = 0;
  let totalOptionValues = 0;

  for (const productDef of ALL_PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        sku: productDef.sku,
        name: productDef.name,
        description: productDef.description,
        basePrice: productDef.basePrice,
        currency: productDef.currency,
        categoryId: categoryMap[productDef.categorySlug],
        standardSpecs: {
          create: productDef.specs.map((desc, i) => ({ description: desc, sortOrder: i + 1 })),
        },
      },
    });

    let ogCount = 0;
    let ovCount = 0;

    for (const ogDef of productDef.optionGroups) {
      await prisma.optionGroup.create({
        data: {
          productId: product.id,
          name: ogDef.name,
          description: ogDef.desc,
          isRequired: ogDef.required,
          isMultiSelect: ogDef.multi,
          sortOrder: ogDef.sort,
          optionValues: {
            create: ogDef.values.map(v => ({
              label: v.label,
              priceDelta: v.priceDelta,
              sortOrder: v.sort,
              isDefault: v.isDefault ?? (v.sort === 1),
            })),
          },
        },
      });
      ogCount++;
      ovCount += ogDef.values.length;
    }

    console.log(`  [${productDef.sku}] ${productDef.name} — ${ogCount} 配置组, ${ovCount} 配置值 (基础价: €${productDef.basePrice.toLocaleString()})`);
    totalOptionGroups += ogCount;
    totalOptionValues += ovCount;
  }

  console.log(`\n  合计: ${ALL_PRODUCTS.length} 款车型, ${totalOptionGroups} 配置组, ${totalOptionValues} 配置值\n`);

  // 5. Summary
  console.log('[5/5] 初始化完成!\n');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  登录信息                                         ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  管理员 : admin@noblelift.com / admin123          ║');
  console.log('║  销售员 : sales@noblelift.com / sales123          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  车型列表                                         ║');
  for (const p of ALL_PRODUCTS) {
    const cat = SUBCATEGORIES.find(s => s.slug === p.categorySlug)!;
    const parentCat = CATEGORIES.find(c => c.slug === cat.parent)!;
    console.log(`║  ${p.sku.padEnd(12)} ${parentCat.name} → ${cat.name.padEnd(12)} €${p.basePrice.toLocaleString().padEnd(12)} ║`);
  }
  console.log('╚══════════════════════════════════════════════════╝');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

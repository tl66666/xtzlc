const { getHubImage, getEcologyImage } = require('./assets');

const DIMENSIONS = [
  {
    id: 'sport',
    name: '运动',
    shortName: '动',
    color: '#E8653A',
    darkColor: '#B8492A',
    lightColor: '#FF8A65',
    glow: 'rgba(232,101,58,0.3)',
    icon: '/assets/icons/sport.svg',
    sceneName: '运动绿洲',
    sceneSubtitle: '跑道、球场和围栏花园',
    sceneImage: getEcologyImage('sport'),
    hubImage: getHubImage('sport'),
    summaryField: 'duration'
  },
  {
    id: 'diet',
    name: '饮食',
    shortName: '食',
    color: '#5CB85C',
    darkColor: '#3D8B3D',
    lightColor: '#8FD68F',
    glow: 'rgba(92,184,92,0.3)',
    icon: '/assets/icons/diet.svg',
    sceneName: '饮食花园',
    sceneSubtitle: '果园小屋和露台餐桌',
    sceneImage: getEcologyImage('diet'),
    hubImage: getHubImage('diet'),
    summaryField: 'rating'
  },
  {
    id: 'study',
    name: '学习',
    shortName: '学',
    color: '#4A9BD9',
    darkColor: '#2E7AB8',
    lightColor: '#7EC4F0',
    glow: 'rgba(74,155,217,0.3)',
    icon: '/assets/icons/study.svg',
    sceneName: '学习天文台',
    sceneSubtitle: '图书馆灯光和观测穹顶',
    sceneImage: getEcologyImage('study'),
    hubImage: getHubImage('study'),
    summaryField: 'duration'
  },
  {
    id: 'work',
    name: '工作',
    shortName: '工',
    color: '#9B6DC6',
    darkColor: '#7B4FA6',
    lightColor: '#C49DE0',
    glow: 'rgba(155,109,198,0.3)',
    icon: '/assets/icons/work.svg',
    sceneName: '工作基地',
    sceneSubtitle: '办公楼、实验室和信号塔',
    sceneImage: getEcologyImage('work'),
    hubImage: getHubImage('work'),
    summaryField: 'duration'
  },
  {
    id: 'plan',
    name: '计划',
    shortName: '计',
    color: '#E8B83A',
    darkColor: '#C49A2E',
    lightColor: '#FFD466',
    glow: 'rgba(232,184,58,0.3)',
    icon: '/assets/icons/plan.svg',
    sceneName: '计划灯塔',
    sceneSubtitle: '灯塔、航线牌和任务广场',
    sceneImage: getEcologyImage('plan'),
    hubImage: getHubImage('plan'),
    summaryField: 'completedItems'
  },
  {
    id: 'sleep',
    name: '睡眠',
    shortName: '眠',
    color: '#5B7FCC',
    darkColor: '#3D5FA8',
    lightColor: '#8BA8E0',
    glow: 'rgba(91,127,204,0.3)',
    icon: '/assets/icons/sleep.svg',
    sceneName: '月光观测站',
    sceneSubtitle: '望远镜、月光花园和静眠舱',
    sceneImage: getEcologyImage('sleep'),
    hubImage: getHubImage('sleep'),
    summaryField: 'quality'
  }
];

const DIMENSION_MAP = DIMENSIONS.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});

const LEVELS = [
  { level: 1, name: '荒芜星', threshold: 0 },
  { level: 2, name: '萌芽星', threshold: 50 },
  { level: 3, name: '绿洲星', threshold: 200 },
  { level: 4, name: '山河星', threshold: 500 },
  { level: 5, name: '文明星', threshold: 1000 },
  { level: 6, name: '星辉星', threshold: 2500 },
  { level: 7, name: '卫星星', threshold: 5000 },
  { level: 8, name: '光环星', threshold: 10000 }
];

const ACHIEVEMENTS = [
  {
    id: 'first_light',
    name: '初次点亮',
    description: '完成第一次打卡',
    tone: '#F5C842'
  },
  {
    id: 'perfect_day',
    name: '完美一天',
    description: '一天内完成六个维度',
    tone: '#FFE066'
  },
  {
    id: 'seven_day_route',
    name: '七日航线',
    description: '连续打卡 7 天',
    tone: '#60A5FA'
  },
  {
    id: 'study_star',
    name: '学习恒星',
    description: '累计学习打卡 10 次',
    tone: '#4A9BD9'
  },
  {
    id: 'sport_orbit',
    name: '运动轨道',
    description: '累计运动打卡 10 次',
    tone: '#E8653A'
  },
  {
    id: 'regular_sleep',
    name: '规律作息',
    description: '累计睡眠打卡 10 次',
    tone: '#5B7FCC'
  },
  {
    id: 'starlight_collector',
    name: '星光收藏家',
    description: '累计星光值达到 500',
    tone: '#4ADE80'
  }
];

const GOAL_PRESETS = [
  {
    id: 'balanced_life',
    name: '均衡自律',
    description: '每天尽量点亮六个维度，保持稳定节奏。',
    focusDimensions: ['sport', 'diet', 'study', 'work', 'plan', 'sleep'],
    weeklyTarget: '每周完成 24 次打卡'
  },
  {
    id: 'exam_boost',
    name: '学习提升',
    description: '以学习、计划和睡眠为核心，适合备考和技能提升。',
    focusDimensions: ['study', 'plan', 'sleep'],
    weeklyTarget: '每天学习 60 分钟'
  },
  {
    id: 'fitness_shape',
    name: '健身塑形',
    description: '优先点亮运动和饮食，让星球长出活力生态。',
    focusDimensions: ['sport', 'diet', 'sleep'],
    weeklyTarget: '每周运动 4 次'
  },
  {
    id: 'project_sprint',
    name: '项目冲刺',
    description: '围绕工作、学习和计划推进一个具体项目。',
    focusDimensions: ['work', 'study', 'plan'],
    weeklyTarget: '每天推进一个关键任务'
  },
  {
    id: 'early_sleep',
    name: '早睡早起',
    description: '先稳住作息，再带动学习、运动和计划。',
    focusDimensions: ['sleep', 'plan', 'sport'],
    weeklyTarget: '每晚 23:30 前睡觉'
  }
];

const CHECKIN_TEMPLATES = [
  { id: 'sport_stretch', dimension: 'sport', title: '快速拉伸', subtitle: '15 分钟唤醒身体', payload: { primary: '健身', metric: '15 分钟', mood: '轻松', note: '完成快速拉伸' } },
  { id: 'sport_run', dimension: 'sport', title: '轻松跑步', subtitle: '30 分钟有氧', payload: { primary: '跑步', metric: '30 分钟', mood: '适中', note: '完成轻松跑步' } },
  { id: 'diet_water', dimension: 'diet', title: '饮水 8 杯', subtitle: '让饮食区长出果园', payload: { primary: '加餐', metric: '5 星', mood: '很健康', note: '今天饮水达标' } },
  { id: 'diet_regular', dimension: 'diet', title: '三餐规律', subtitle: '早餐午餐晚餐都有记录', payload: { primary: '早餐', metric: '4 星', mood: '很健康', note: '三餐规律' } },
  { id: 'study_code', dimension: 'study', title: '编程 60 分钟', subtitle: '点亮图书馆灯光', payload: { primary: '编程', metric: '60 分钟', mood: '非常专注', note: '完成编程学习' } },
  { id: 'study_read', dimension: 'study', title: '阅读 30 页', subtitle: '给学习区增加书页粒子', payload: { primary: '阅读', metric: '45 分钟', mood: '一般专注', note: '阅读 30 页' } },
  { id: 'work_pomodoro', dimension: 'work', title: '番茄钟 1 轮', subtitle: '推进一个任务', payload: { primary: '番茄钟', metric: '25 分钟', mood: '已完成', note: '完成一轮番茄钟' } },
  { id: 'work_project', dimension: 'work', title: '项目推进', subtitle: '完成一个小模块', payload: { primary: '开发', metric: '1 小时', mood: '进行中', note: '推进项目任务' } },
  { id: 'plan_three', dimension: 'plan', title: '今日三件事', subtitle: '明确今天最重要的 3 件事', payload: { primary: '日计划', metric: '3/3 项', mood: '按计划完成', note: '完成今日三件事' } },
  { id: 'plan_review', dimension: 'plan', title: '晚间复盘', subtitle: '整理今天和明天', payload: { primary: '复盘', metric: '2/3 项', mood: '部分完成', note: '完成晚间复盘' } },
  { id: 'sleep_early', dimension: 'sleep', title: '早睡目标', subtitle: '23:30 前准备休息', payload: { primary: '早睡早起', metric: '8 小时', mood: '不错', note: '早睡目标达成' } },
  { id: 'sleep_phone', dimension: 'sleep', title: '睡前远离手机', subtitle: '让梦境花园亮起来', payload: { primary: '正常作息', metric: '7 小时', mood: '很好', note: '睡前减少刷手机' } }
];

const CHECKIN_ACTIONS = {
  sport: [
    { id: 'sport_seed', title: '微汗启动', desc: '10-15 分钟，让运动绿洲出现第一圈跑道灯。', payload: { primary: '拉伸', metric: '15 分钟', mood: '轻松', effort: '轻量' } },
    { id: 'sport_build', title: '绿洲建设', desc: '30 分钟有氧或力量，解锁更多运动设施。', payload: { primary: '跑步', metric: '30 分钟', mood: '适中', effort: '标准' } },
    { id: 'sport_boost', title: '突破训练', desc: '45 分钟以上，把运动区推进到高亮状态。', payload: { primary: '健身', metric: '45 分钟', mood: '突破极限', effort: '深度' } }
  ],
  diet: [
    { id: 'diet_seed', title: '补水果园', desc: '喝水或准备一份清爽加餐，给果树补充能量。', payload: { primary: '饮水', metric: '4 杯', mood: '正常', effort: '轻量' } },
    { id: 'diet_build', title: '三餐巡检', desc: '记录一餐并给出健康评分，稳定饮食花园。', payload: { primary: '午餐', metric: '4 星', mood: '很健康', effort: '标准' } },
    { id: 'diet_boost', title: '健康餐盘', desc: '完成一整天规律饮食，扩建露台餐桌。', payload: { primary: '三餐', metric: '5 星', mood: '很健康', effort: '深度' } }
  ],
  study: [
    { id: 'study_seed', title: '专注 25 分钟', desc: '完成一个小节，让学习天文台亮起一盏灯。', payload: { primary: '阅读', metric: '25 分钟', mood: '一般专注', effort: '轻量' } },
    { id: 'study_build', title: '知识推进', desc: '学习 60 分钟，给图书馆增加一排书架。', payload: { primary: '编程', metric: '60 分钟', mood: '非常专注', effort: '标准' } },
    { id: 'study_boost', title: '深度沉浸', desc: '90 分钟以上专注，启动观测穹顶。', payload: { primary: '刷题', metric: '90 分钟', mood: '非常专注', effort: '深度' } }
  ],
  work: [
    { id: 'work_seed', title: '清掉一个小任务', desc: '完成一个 25 分钟番茄钟，基地开始运转。', payload: { primary: '番茄钟', metric: '25 分钟', mood: '已完成', effort: '轻量' } },
    { id: 'work_build', title: '项目推进', desc: '推进一个模块，点亮办公楼灯光。', payload: { primary: '开发', metric: '1 小时', mood: '进行中', effort: '标准' } },
    { id: 'work_boost', title: '深度工作舱', desc: '连续推进 2 小时，信号塔进入高效模式。', payload: { primary: '开发', metric: '2 小时', mood: '已完成', effort: '深度' } }
  ],
  plan: [
    { id: 'plan_seed', title: '写下三件事', desc: '明确今天最重要的三件事，灯塔开始校准方向。', payload: { primary: '日计划', metric: '3/3 项', mood: '按计划完成', effort: '轻量' } },
    { id: 'plan_build', title: '任务复盘', desc: '复盘今天并整理明天，任务广场扩建。', payload: { primary: '复盘', metric: '2/3 项', mood: '部分完成', effort: '标准' } },
    { id: 'plan_boost', title: '航线规划', desc: '完成周计划或项目路线图，点亮航线牌。', payload: { primary: '项目计划', metric: '5/5 项', mood: '超额完成', effort: '深度' } }
  ],
  sleep: [
    { id: 'sleep_seed', title: '睡前降噪', desc: '睡前少刷手机，月光花园开始发亮。', payload: { primary: '睡前远离手机', metric: '20 分钟', mood: '不错', effort: '轻量' } },
    { id: 'sleep_build', title: '规律作息', desc: '记录睡眠时长，稳定观测站灯光。', payload: { primary: '正常作息', metric: '7 小时', mood: '很好', effort: '标准' } },
    { id: 'sleep_boost', title: '早睡航线', desc: '按目标时间入睡，让夜间生态进入满电状态。', payload: { primary: '早睡早起', metric: '8 小时', mood: '很好', effort: '深度' } }
  ]
};

const ECOSYSTEM_UNLOCKS = {
  sport: [
    { threshold: 1, name: '起点跑道', type: '建筑', desc: '运动绿洲出现第一圈跑道。' },
    { threshold: 3, name: '晨跑花径', type: '装饰', desc: '跑道旁长出一圈花径。' },
    { threshold: 7, name: '能量看台', type: '建筑', desc: '绿洲拥有自己的加油看台。' },
    { threshold: 14, name: '训练营地', type: '建筑群', desc: '形成完整训练区域。' }
  ],
  diet: [
    { threshold: 1, name: '补水井', type: '设施', desc: '饮食花园获得第一处水源。' },
    { threshold: 3, name: '果树篱笆', type: '装饰', desc: '果树和篱笆开始围出生活气。' },
    { threshold: 7, name: '露台餐桌', type: '建筑', desc: '花园出现可以聚餐的露台。' },
    { threshold: 14, name: '丰收小屋', type: '建筑群', desc: '饮食生态进入稳定丰收状态。' }
  ],
  study: [
    { threshold: 1, name: '阅读灯', type: '设施', desc: '学习区亮起第一盏灯。' },
    { threshold: 3, name: '书页花园', type: '装饰', desc: '书页像花瓣一样铺开。' },
    { threshold: 7, name: '图书馆侧楼', type: '建筑', desc: '学习天文台开始扩建。' },
    { threshold: 14, name: '观测穹顶', type: '建筑群', desc: '知识观测系统启动。' }
  ],
  work: [
    { threshold: 1, name: '启动工位', type: '设施', desc: '工作基地出现第一处工位灯。' },
    { threshold: 3, name: '任务路径', type: '装饰', desc: '基地道路被整理清楚。' },
    { threshold: 7, name: '实验室', type: '建筑', desc: '项目推进能力提升。' },
    { threshold: 14, name: '信号塔', type: '建筑群', desc: '工作基地进入高效协作状态。' }
  ],
  plan: [
    { threshold: 1, name: '方向牌', type: '设施', desc: '计划灯塔出现第一块方向牌。' },
    { threshold: 3, name: '任务广场', type: '建筑', desc: '任务被集中到清晰广场上。' },
    { threshold: 7, name: '灯塔光束', type: '光效', desc: '目标方向变得更稳定。' },
    { threshold: 14, name: '航线中心', type: '建筑群', desc: '长期计划开始形成航线系统。' }
  ],
  sleep: [
    { threshold: 1, name: '月光长椅', type: '装饰', desc: '睡眠区出现一处安静角落。' },
    { threshold: 3, name: '静眠花圃', type: '装饰', desc: '夜间花园开始发光。' },
    { threshold: 7, name: '观测台', type: '建筑', desc: '月光观测站进入规律记录。' },
    { threshold: 14, name: '梦境圆顶', type: '建筑群', desc: '睡眠生态形成完整夜间循环。' }
  ]
};

module.exports = {
  DIMENSIONS,
  DIMENSION_MAP,
  LEVELS,
  ACHIEVEMENTS,
  GOAL_PRESETS,
  CHECKIN_TEMPLATES,
  CHECKIN_ACTIONS,
  ECOSYSTEM_UNLOCKS
};

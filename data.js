// 示例数据：活动、组队、攻略（真实产品中由后端 / 活动方入驻 / 爬虫聚合提供）
window.CITIES = {
  上海: { lat: 31.23, lon: 121.47 },
  杭州: { lat: 30.27, lon: 120.15 },
  北京: { lat: 39.9, lon: 116.4 },
};

window.INTERESTS = [
  { key: '展览', emoji: '🖼️' },
  { key: '市集', emoji: '🛍️' },
  { key: '演出', emoji: '🎸' },
  { key: '徒步', emoji: '🥾' },
  { key: 'CityWalk', emoji: '🚶' },
  { key: '美食', emoji: '🍜' },
  { key: '运动', emoji: '🏸' },
  { key: '手作', emoji: '🎨' },
];

// indoor: 是否室内；price: 人均元；dur: 时长(小时)；group: 适合人数 [min,max]；days: 开放日
window.ACTIVITIES = [
  // ---------- 上海 ----------
  { id: 'sh1', city: '上海', title: '西岸美术馆 · 蓬皮杜典藏展', type: '展览', indoor: true, price: 60, student: 30, dur: 3, group: [1, 4], days: ['六', '日'], area: '徐汇滨江', emoji: '🖼️', color: '#6C5CE7', desc: '法国蓬皮杜中心五年合作展，现代艺术入门友好。看完可沿滨江骑行。', tips: ['学生证半价，官方小程序预约', '周日下午人少，建议 14:00 后入场', '出馆右转就是滨江步道'], tags: ['学生优惠', '拍照出片', '雨天友好'] },
  { id: 'sh2', city: '上海', title: '安福路周末创意市集', type: '市集', indoor: false, price: 50, student: 50, dur: 2, group: [1, 6], days: ['六', '日'], area: '徐汇', emoji: '🛍️', color: '#E17055', desc: '40+ 原创摊主，手作饰品、中古、咖啡，门票免费，逛吃预算自控。', tips: ['免费入场，预算主要在咖啡和小物', '11:00 开市，15:00 光线最好', '附近武康路可顺路 CityWalk'], tags: ['免费入场', '拍照出片'] },
  { id: 'sh3', city: '上海', title: 'MAO Livehouse 独立乐队专场', type: '演出', indoor: true, price: 120, student: 100, dur: 2.5, group: [1, 4], days: ['六'], area: '黄浦', emoji: '🎸', color: '#D63031', desc: '三支新晋独立乐队拼盘，现场氛围热烈，适合和朋友一起嗨。', tips: ['提前购票有学生价', '19:30 开场，建议 19:00 到', '寄存 10 元/件'], tags: ['夜间活动', '雨天友好'] },
  { id: 'sh4', city: '上海', title: '佘山国家森林公园轻徒步', type: '徒步', indoor: false, price: 40, student: 40, dur: 5, group: [2, 8], days: ['六', '日'], area: '松江', emoji: '🥾', color: '#00B894', desc: '地铁 9 号线直达，东西佘山环线约 8km，难度低，登顶看天文台。', tips: ['地铁佘山站出发，交通 ¥8', '带 1L 水和简单补给', '下雨后石阶湿滑慎行'], tags: ['地铁直达', '适合组队'] },
  { id: 'sh5', city: '上海', title: '武康路—衡复历史风貌 CityWalk', type: 'CityWalk', indoor: false, price: 30, student: 30, dur: 3, group: [1, 6], days: ['六', '日'], area: '徐汇', emoji: '🚶', color: '#FDCB6E', desc: '梧桐树下看老洋房，武康大楼 → 巴金故居 → 安福路，经典路线。', tips: ['巴金故居免费需预约', '上午 9-10 点人少', '可衔接安福路市集'], tags: ['免费入场', '拍照出片'] },
  { id: 'sh6', city: '上海', title: '定西路美食扫街', type: '美食', indoor: false, price: 80, student: 80, dur: 2, group: [2, 6], days: ['六', '日'], area: '长宁', emoji: '🍜', color: '#FF7675', desc: '本地人私藏美食街，葱油饼、小笼、烧烤一路吃，人多点得多更划算。', tips: ['人越多越能多点几样', '晚上 17:00 后更热闹', '支持 AA 记账'], tags: ['适合组队', '夜间活动'] },
  { id: 'sh7', city: '上海', title: '陶艺手作体验课', type: '手作', indoor: true, price: 128, student: 98, dur: 2, group: [1, 4], days: ['六', '日'], area: '静安', emoji: '🏺', color: '#A29BFE', desc: '拉坯 + 上釉，作品烧制后可寄回学校，适合约会或闺蜜局。', tips: ['需提前 2 天预约', '穿深色衣服', '成品约 3 周寄出'], tags: ['雨天友好', '学生优惠'] },
  { id: 'sh8', city: '上海', title: '世纪公园飞盘局', type: '运动', indoor: false, price: 20, student: 20, dur: 2, group: [6, 14], days: ['日'], area: '浦东', emoji: '🥏', color: '#0984E3', desc: '新手友好的躲避飞盘/极限飞盘局，现场分队，结交新朋友。', tips: ['公园门票 ¥10', '穿运动鞋', '人数凑齐 6 人才开局'], tags: ['适合组队', '社交'] },
  { id: 'sh9', city: '上海', title: '上海天文馆', type: '展览', indoor: true, price: 30, student: 15, dur: 4, group: [1, 6], days: ['六', '日'], area: '浦东临港', emoji: '🔭', color: '#2D3436', desc: '全球最大天文馆之一，球幕影院强烈推荐，雨天首选。', tips: ['学生票 ¥15', '球幕影院需另购票', '地铁 16 号线滴水湖站'], tags: ['学生优惠', '雨天友好'] },
  { id: 'sh10', city: '上海', title: '剧本杀 · 沉浸式本格推理', type: '演出', indoor: true, price: 158, student: 138, dur: 5, group: [5, 7], days: ['六', '日'], area: '杨浦', emoji: '🕵️', color: '#636E72', desc: '6 人本，新手友好，DM 专业，下午场刚好一个半天。', tips: ['需凑满 6 人，可在组队页找人', '下午场 13:00 开', '五角场地铁站 5 分钟'], tags: ['适合组队', '雨天友好', '社交'] },
  // ---------- 杭州 ----------
  { id: 'hz1', city: '杭州', title: '九溪十八涧徒步', type: '徒步', indoor: false, price: 20, student: 20, dur: 4, group: [2, 8], days: ['六', '日'], area: '西湖区', emoji: '🥾', color: '#00B894', desc: '溪水、茶园、竹林，约 6km 平缓路线，终点可喝龙井。', tips: ['公交 4 路直达', '穿防滑鞋，要过溪', '雨后更有意境但注意安全'], tags: ['免费入场', '适合组队'] },
  { id: 'hz2', city: '杭州', title: '中国美院毕业展', type: '展览', indoor: true, price: 0, student: 0, dur: 3, group: [1, 6], days: ['六', '日'], area: '转塘象山', emoji: '🎓', color: '#6C5CE7', desc: '王澍设计的象山校区本身就是展品，毕业展免费开放。', tips: ['免费需预约', '校园很大建议穿舒适鞋', '食堂可以体验'], tags: ['免费入场', '雨天友好', '拍照出片'] },
  { id: 'hz3', city: '杭州', title: '小河直街夜市', type: '市集', indoor: false, price: 60, student: 60, dur: 2, group: [1, 6], days: ['六', '日'], area: '拱墅', emoji: '🏮', color: '#E17055', desc: '运河边的老街夜市，灯笼+小吃+文创。', tips: ['18:00 后亮灯', '可坐水上巴士过来', '人均 60 吃饱'], tags: ['夜间活动'] },
  { id: 'hz4', city: '杭州', title: '西湖环湖骑行', type: '运动', indoor: false, price: 30, student: 30, dur: 3, group: [1, 6], days: ['六', '日'], area: '西湖', emoji: '🚲', color: '#0984E3', desc: '共享单车环湖约 15km，苏堤白堤一次打卡。', tips: ['苏堤周末禁止骑行需推行', '清晨人最少', '雨天建议改坐游船'], tags: ['拍照出片'] },
  { id: 'hz5', city: '杭州', title: '木版画手作工坊', type: '手作', indoor: true, price: 99, student: 79, dur: 2, group: [1, 4], days: ['六'], area: '上城', emoji: '🎨', color: '#A29BFE', desc: '自己刻版、印制一张西湖明信片，带回作品。', tips: ['提前预约', '适合 2-4 人'], tags: ['雨天友好', '学生优惠'] },
  { id: 'hz6', city: '杭州', title: '大运河 Livehouse 民谣夜', type: '演出', indoor: true, price: 88, student: 68, dur: 2, group: [1, 4], days: ['六', '日'], area: '拱墅', emoji: '🎤', color: '#D63031', desc: '小众民谣歌手专场，安静温柔的夜晚。', tips: ['学生价需验证学生证'], tags: ['夜间活动', '雨天友好', '学生优惠'] },
  // ---------- 北京 ----------
  { id: 'bj1', city: '北京', title: '798 艺术区看展', type: '展览', indoor: true, price: 80, student: 40, dur: 4, group: [1, 6], days: ['六', '日'], area: '朝阳', emoji: '🖼️', color: '#6C5CE7', desc: 'UCCA + 多个免费画廊，逛一天也不腻。', tips: ['UCCA 学生半价', '很多小画廊免费', '周一闭馆'], tags: ['学生优惠', '雨天友好', '拍照出片'] },
  { id: 'bj2', city: '北京', title: '香山—植物园轻徒步', type: '徒步', indoor: false, price: 30, student: 15, dur: 5, group: [2, 8], days: ['六', '日'], area: '海淀', emoji: '🍁', color: '#00B894', desc: '秋天红叶季必去，香山登顶后下到植物园。', tips: ['香山需预约', '西郊线直达', '红叶季人非常多'], tags: ['适合组队', '学生优惠'] },
  { id: 'bj3', city: '北京', title: '胡同 CityWalk：南锣到什刹海', type: 'CityWalk', indoor: false, price: 40, student: 40, dur: 3, group: [1, 6], days: ['六', '日'], area: '东城', emoji: '🚶', color: '#FDCB6E', desc: '钻胡同、看鼓楼、什刹海边吃冰。', tips: ['避开南锣主街，钻小胡同', '傍晚什刹海最美'], tags: ['免费入场', '拍照出片'] },
  { id: 'bj4', city: '北京', title: '五道营周末市集', type: '市集', indoor: false, price: 60, student: 60, dur: 2, group: [1, 6], days: ['六', '日'], area: '东城', emoji: '🛍️', color: '#E17055', desc: '雍和宫旁的文艺市集，咖啡和古着多。', tips: ['免费入场', '可衔接雍和宫'], tags: ['免费入场'] },
  { id: 'bj5', city: '北京', title: '国家话剧院青年剧场', type: '演出', indoor: true, price: 180, student: 90, dur: 2.5, group: [1, 4], days: ['六', '日'], area: '西城', emoji: '🎭', color: '#D63031', desc: '学生票半价，小剧场话剧体验。', tips: ['学生票需现场验证', '提前一周开票'], tags: ['学生优惠', '雨天友好', '夜间活动'] },
  { id: 'bj6', city: '北京', title: '奥森公园夜跑团', type: '运动', indoor: false, price: 0, student: 0, dur: 2, group: [4, 20], days: ['六'], area: '朝阳', emoji: '🏃', color: '#0984E3', desc: '5km / 10km 两个配速组，跑完一起吃宵夜。', tips: ['南门集合 19:00', '存包可放志愿者处'], tags: ['免费入场', '适合组队', '社交', '夜间活动'] },
];

window.SEED_TEAMS = [
  { id: 't1', actId: 'sh4', title: '周六佘山轻徒步，i 人友好', host: '阿蓝', school: '复旦', day: '六', time: '08:30 佘山站', need: 6, members: ['阿蓝', '小周', 'Momo'], note: '慢速，边走边拍，AA 午饭', gender: '不限' },
  { id: 't2', actId: 'sh10', title: '剧本杀差 2 人！新手也来', host: '橙子', school: '同济', day: '日', time: '13:00 五角场', need: 6, members: ['橙子', '大猫', 'Kiki', '阿杰'], note: '推理本，不恐怖', gender: '不限' },
  { id: 't3', actId: 'sh8', title: '世纪公园飞盘，凑够就开', host: 'Leo', school: '上财', day: '日', time: '15:00 3 号门', need: 10, members: ['Leo', '阿飞', '一一', '小林', '豆豆'], note: '自带水，结束去吃烧烤', gender: '不限' },
  { id: 't4', actId: 'sh6', title: '定西路扫街，人多点得多', host: '胖虎', school: '华师大', day: '六', time: '17:30 定西路口', need: 4, members: ['胖虎', '糖糖'], note: '预算 80 以内', gender: '不限' },
  { id: 't5', actId: 'hz1', title: '九溪徒步+喝茶', host: '青青', school: '浙大', day: '日', time: '09:00 九溪公交站', need: 5, members: ['青青', '阿木'], note: '不赶路，慢慢走', gender: '不限' },
  { id: 't6', actId: 'bj2', title: '香山红叶团', host: '北北', school: '北师大', day: '六', time: '07:30 香山站', need: 6, members: ['北北', '小马', '七七'], note: '早出发避开人潮', gender: '不限' },
];

window.SEED_GUIDES = [
  { id: 'g1', actIds: ['sh5', 'sh2'], city: '上海', title: '¥80 搞定一整天：武康路 + 安福路市集', author: '阿蓝', cover: '🍂', budget: 80, likes: 342, content: '09:30 武康大楼拍照（人少）\n10:30 巴金故居（免费预约）\n12:00 安福路市集逛吃\n14:00 找家咖啡店歇脚\n\n💡省钱：全程步行，午饭在市集解决，人均不到 80。', tags: ['省钱', 'CityWalk', '一人也行'] },
  { id: 'g2', actIds: ['sh9'], city: '上海', title: '下雨天去哪？天文馆 4 小时通关攻略', author: '星星', cover: '🔭', budget: 60, likes: 518, content: '学生票只要 15！\n1. 地铁 16 号线到滴水湖站，转接驳车\n2. 先看球幕影院（热门场次提前买）\n3. 主展馆按「家园-宇宙-征程」顺序\n4. 出来去滴水湖边走走（雨停的话）', tags: ['雨天', '学生优惠'] },
  { id: 'g3', actIds: ['sh4'], city: '上海', title: '佘山徒步避坑指南（新手向）', author: '小周', cover: '⛰️', budget: 50, likes: 206, content: '路线：东佘山 → 西佘山 → 天文台 → 圣母大殿\n全程约 8km，3-4 小时\n\n避坑：\n- 别在景区买水，贵\n- 西佘山台阶多，量力而行\n- 下山可以去欢乐谷门口吃饭', tags: ['徒步', '组队'] },
  { id: 'g4', actIds: ['hz1'], city: '杭州', title: '九溪十八涧：一条被低估的秋日路线', author: '青青', cover: '🍃', budget: 40, likes: 189, content: '推荐从九溪公交站进，一路向上走到龙井村。\n溪水要踩石头过，建议防滑鞋。\n终点龙井村喝杯茶，人均 30。', tags: ['徒步', '省钱'] },
  { id: 'g5', actIds: ['bj1'], city: '北京', title: '798 免费画廊清单（持续更新）', author: '北北', cover: '🎨', budget: 50, likes: 276, content: '免费：佩斯、常青画廊、林冠...\n付费但值得：UCCA（学生半价）\n吃饭：园区内贵，出门对面商场更划算。', tags: ['看展', '省钱'] },
];

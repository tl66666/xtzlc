# 星途自律舱

星途自律舱是一款星球养成式自律打卡微信小程序。用户围绕运动、饮食、学习、工作、计划、睡眠六类行动完成打卡，获得星光值，并逐步点亮个人星球生态。

## 当前能力

- 原生微信小程序页面与组件
- 首次启动、星球命名、目标选择的新手流程
- 六类生态区与打卡任务
- 自定义计划保存与今日行动生成
- 打卡奖励弹窗、星光结算、宝箱与成就墙
- 星光值、等级、连续天数、热力图统计
- 本地优先数据流，支持微信云开发同步
- 云函数：登录、打卡提交、统计读取、资料更新、数据导出
- Node.js 单元测试覆盖核心计算逻辑

## 目录结构

```text
星途自律舱/
├── app.js
├── app.json
├── app.wxss
├── pages/
│   ├── planet/
│   ├── checkin/
│   ├── stats/
│   ├── profile/
│   ├── achievements/
│   └── ecologyHub/
├── components/
├── utils/
├── cloudfunctions/
├── tests/
└── docs/
```

## 本地运行

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择 `C:\Users\唐乐\Desktop\项目1\星途自律舱`。
4. AppID 使用当前小程序 AppID：`wx96fd1ee9889d6641`。
5. 选择云开发环境 `cloud1-d8gpkxcft4c41ea12`。
6. 编译后即可在模拟器中体验。

## 云开发

项目已包含以下云函数目录：

- `login`
- `submitCheckin`
- `getDashboard`
- `exportData`
- `updateProfile`
- `getAssetUrl`

首次配置请参考 [docs/cloud-setup.md](docs/cloud-setup.md)。

云存储素材说明请参考 [docs/cloud-assets.md](docs/cloud-assets.md)。

## 测试

在本目录运行：

```powershell
npm.cmd test
```

当前测试重点：

- 日期工具
- 奖励计算
- 等级计算
- 成就解锁
- 数据统计聚合

## 素材规范

小程序包内只保留压缩后的轻量素材。视频、高清原图、生成源素材和序列帧应放入微信云存储，避免包体超限。


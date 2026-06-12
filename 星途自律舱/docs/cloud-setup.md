# 微信云开发配置

当前小程序 AppID：

```text
wx96fd1ee9889d6641
```

当前云环境：

```text
cloud1-d8gpkxcft4c41ea12
```

## 导入项目

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择 `星途自律舱`。
4. AppID 填入当前小程序 AppID。
5. 导入后点击顶部“云开发”。
6. 确认当前环境为 `cloud1-d8gpkxcft4c41ea12`。

## 上传云函数

在左侧资源管理器中展开 `cloudfunctions`，对每个云函数目录执行：

1. 右键云函数目录。
2. 选择“上传并部署：云端安装依赖”。
3. 等待上传成功。

需要上传的云函数：

- `login`
- `submitCheckin`
- `getDashboard`
- `exportData`
- `updateProfile`
- `getAssetUrl`

## 创建数据库集合

在云开发控制台的“数据库”中创建以下集合：

```text
users
checkins
plans
goals
achievements
```

初期调试阶段可以把集合权限设置为“仅创建者可读写”。正式发布前建议结合云函数权限控制，避免用户直接改写他人数据。

## 上传视频和大图

在“存储”中新建目录：

```text
star-cabin/assets/video
star-cabin/assets/images
star-cabin/assets/fx
```

把开场视频上传到：

```text
star-cabin/assets/video/onboarding-ignite.mp4
```

如果视频需要在小程序中播放，请确保云存储权限允许读取，或通过 `getAssetUrl` 云函数转换为临时可播放链接。

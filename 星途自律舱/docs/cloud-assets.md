# 云存储资源规范

项目采用“本地保留轻量兜底图，高清大图和视频统一走微信云存储”的方式。这样可以避免小程序包体过大，也能减少开发者工具上传和编译超时。

## 本地保留

- 六个 SVG 功能图标
- 压缩后的 JPG 兜底图
- 首屏必要素材，单张建议控制在 100KB 以内

## 云存储放置

- 开场视频
- 高清生态区图
- 星光序列帧或奖励动效
- 后续新增的星球皮肤、建筑、徽章素材

建议云存储目录：

```text
star-cabin/assets/images
star-cabin/assets/video
star-cabin/assets/fx
star-cabin/assets/icons
```

## 当前预留资源

```text
star-cabin/assets/images/app-bg.jpg
star-cabin/assets/images/planet-overview.jpg
star-cabin/assets/images/planet-empty.png
star-cabin/assets/images/ecology-empty.png
star-cabin/assets/images/reward-chest.png
star-cabin/assets/images/unlock-badge.png
star-cabin/assets/video/onboarding-ignite.mp4
star-cabin/assets/fx/starlight-01.png
star-cabin/assets/fx/starlight-02.png
star-cabin/assets/fx/starlight-03.png
star-cabin/assets/fx/starlight-04.png
star-cabin/assets/fx/starlight-05.png
star-cabin/assets/fx/starlight-06.png
```

## 接入位置

上传后把微信云存储的 `fileID` 填入：

```text
utils/assets.js
```

如果字段为空，页面会自动使用本地压缩图或 CSS 兜底，不会影响基础运行。

## 性能建议

- 首页背景 JPG 建议小于 100KB。
- 首页星球图建议小于 300KB。
- 生态区详情图建议小于 500KB。
- 开场视频建议小于 2MB，优先 720p、6-8 秒、低码率。
- 不要把视频和 AI 原图放入小程序本地包。

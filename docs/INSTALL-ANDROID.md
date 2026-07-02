# Android 手机安装指南

桌面 Edge 有「加载解压缩的扩展」，**手机版没有这个功能**。这是 Microsoft 的设计，不是项目问题。

## 为什么「管理扩展」里找不到开发人员模式？

| 位置 | 桌面 Edge | 手机 Edge（稳定版） |
|------|-----------|---------------------|
| 管理扩展页面 | 有「开发人员模式」+ 加载文件夹 | **只有商店里有限的扩展列表** |
| 自定义/本地扩展 | 可直接加载文件夹 | 需走 **开发者选项 → 安装 CRX** |
| 解锁入口 | 扩展管理页开关 | **设置 → 关于 → 连点版本号**（不在扩展页） |

---

## 方案 A：Edge Canary + 安装 CRX（推荐，装自己的扩展）

### 1. 安装 Edge Canary

从 Google Play 安装 **Microsoft Edge Canary**（比稳定版更早支持 sideload）。

### 2. 开启实验开关（部分版本需要）

地址栏输入 `edge://flags`，搜索 **Android Extension**（或 Android extensions v3），设为 **Enabled**，重启 Edge。

### 3. 解锁「开发者选项」（关键：不在扩展页）

1. 右下角 **菜单 ≡** → **设置**
2. 滑到最底 → **关于 Microsoft Edge**
3. **连续点击**「Edge Canary x.x.x.x」版本号 **5～7 次**
4. 出现提示后返回 **设置**，底部会多出 **开发者选项 / Developer options**

> 若连点无反应：确认用的是 **Canary**；或更新到最新 Canary 再试。

### 4. 安装 CRX 文件

1. 把 PC 打包好的 **`dist/swipe-seek.crx`** 传到手机（微信/QQ/网盘/USB 均可）
2. **设置 → 开发者选项 → Extension install by crx**（通过 CRX 安装扩展）
3. 在文件管理器里选中 `swipe-seek.crx`
4. 菜单 → **扩展**，确认「进度条直接划」已启用

### 5. 重新打包 CRX（代码有更新时）

在项目根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pack-extension.ps1
```

输出：`dist/进度条直接划.crx`

---

## 方案 B：Edge 稳定版（仅商店扩展）

稳定版 **扩展** 菜单通常只能从 **Microsoft 扩展商店** 安装官方白名单扩展（Dark Reader、uBlock 等），**不能**直接装本项目的 CRX。

若你只有稳定版且找不到开发者选项：

1. 改用 **Edge Canary**（方案 A），或  
2. 等扩展上架商店（需开发者账号与审核），或  
3. 临时用 **Tampermonkey + 用户脚本** 实现类似功能（见下方备选）

---

## 方案 C：稳定版也能出现「开发者选项」的情况

部分新稳定版在开启 `edge://flags` 的 Android Extension 后，**关于页连点版本号** 也会出现开发者选项；但 CRX 安装仍可能只在 **Canary** 上稳定可用。  
**连点位置始终是：设置 → 关于 Microsoft Edge → 版本号**，不是「管理扩展」页面。

---

## 安装后如何验证

1. 打开任意带 HTML5 `<video>` 的网页  
2. 在**视频画面中间**（避开底部控件条）**左右滑动**  
3. 应出现 `+0:xx` 时间提示并跳转进度  

本地测试页（需能访问外网 sample 视频）：`test/test-video.html`

---

## 常见问题

**Q：扩展列表里有，但滑动没反应？**  
- 页面可能是 YouTube/B 站等自定义播放器（非原生 `<video>` 手势层），第一版暂不支持  
- 确认扩展已启用；刷新页面后再试  

**Q：能否像桌面一样选文件夹安装？**  
- 不能。手机只能 **CRX** 或（Canary）**扩展 ID** 安装。  

**Q：popup / 设置页打不开？**  
- 部分 Android 版本对 popup 支持不完整；核心滑动功能在 content script，不依赖 popup。  

---

## 备选：Tampermonkey（稳定版 Edge 不想装 Canary 时）

1. 在 Edge 手机 **扩展商店** 安装 **Tampermonkey**（若在白名单内）  
2. 新建用户脚本，把 `src/content/` 逻辑合并注入（需自行维护）  

体验与独立扩展相近，但分发与更新不如 CRX 正规。

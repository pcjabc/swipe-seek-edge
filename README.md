# 进度条直接划

Android Edge 扩展：在视频**画面中间**横向滑动即可拖动进度，边拖边预览，不用点细小进度条。

## 安装（Android）

需要 **Microsoft Edge Canary**（Google Play 安装）。

1. **开启扩展实验功能**（部分版本需要）  
   地址栏输入 `edge://flags` → 搜索 `Android Extension` → **Enabled** → 重启 Edge

2. **打开开发者选项**  
   **设置 → 关于 Microsoft Edge → 连续点击版本号 5～7 次** → 返回设置，底部出现 **开发者选项**

3. **安装扩展**  
   - 下载 **`release/swipe-seek.crx`**（仓库根目录下，或 GitHub 页面 **Code → Download** 后解压找到该文件）  
   - **设置 → 开发者选项 → Extension install by crx** → 选择该文件  
   - **扩展** 菜单中确认「进度条直接划」已启用

> 稳定版 Edge 一般不能装本地扩展，请用 Canary。  
> 自己打包 CRX：在项目目录运行 `powershell -File scripts/pack-extension.ps1`（需 Windows + 桌面 Edge）。

## 使用

| 操作 | 效果 |
|------|------|
| 视频中间 **右滑** | 快进 |
| 视频中间 **左滑** | 快退 |
| 底部约 15% 区域 | 留给原生播放/全屏按钮 |

拖动时屏幕中央会显示 `+0:32` 等时间提示。

点击扩展图标可开关；**设置**里可调灵敏度、触发距离等。

## 适用与限制

- ✅ 使用标准 HTML5 `<video>` 的网页  
- ❌ YouTube / B 站等自定义播放器（后续版本适配）  
- ❌ 直播、DRM 视频可能无法拖动  

## 桌面调试

1. `edge://extensions` → 开发人员模式 → **加载解压缩的扩展** → 选本项目文件夹  
2. 打开 `test/test-video.html` 测试  

## 许可

MIT

# 云朵猫猫 Cloud Cat

粉彩风 3D 弹跳收集小游戏。控制圆滚滚的云朵猫，在空中云朵间弹跳收集星星。

## 本地运行

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:5188

## 操作

| 按键 | 作用 |
| --- | --- |
| WASD / 方向键 | 移动（跟随镜头方向） |
| 空格 | 空中冲刺 |
| 右键拖动 | 旋转视角 |
| 滚轮 | 缩放 |
| 触屏摇杆 + 跳 | 移动 / 冲刺 |

## 发布到 GitHub Pages

1. 在 GitHub 新建仓库（建议名 `cloud-cat`，Public）
2. 把本项目全部文件推到仓库 `main` 分支（仓库根目录需能看到 `package.json`）
3. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
4. 推送后等待 Actions 完成，访问：
   `https://<你的用户名>.github.io/<仓库名>/`

推送后把链接发给朋友即可，各自单机游玩，无需服务器。

## 生产构建

```bash
npm run build
```

产物在 `dist/`，任意静态空间都能托管。

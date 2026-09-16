# 云朵猫猫联机服务器

## 本地运行

```bash
cd server
npm install
npm start
```

默认监听 `ws://127.0.0.1:8787`。客户端在本地开发时会自动连这个地址。

## 部署到 Render（推荐）

1. 把整个 `cloud-cat` 项目推到 GitHub（或只推 `server/` 子目录）
2. 打开 [render.com](https://render.com) → New → Web Service
3. 选中仓库，**Root Directory** 填 `server`
4. Build Command：`npm install`
5. Start Command：`npm start`
6. 创建后记下公网地址，例如：  
   `https://cloud-cat-ws.onrender.com`
7. WebSocket 地址是：  
   `wss://cloud-cat-ws.onrender.com`

## 客户端如何连上服务器

任选其一：

- 页面 URL 加参数：  
  `https://nn462.github.io/Small-game/?server=wss://cloud-cat-ws.onrender.com`
- 或在部署前端时设置环境变量 `VITE_WS_URL=wss://...` 后重新 `npm run build` 上传 `dist`

本地联机测试：先 `npm start` 开服务器，再开两个浏览器窗口进同一房间码。

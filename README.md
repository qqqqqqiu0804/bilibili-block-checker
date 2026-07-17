# B站双向拉黑检测工具

一个用于查询两个B站用户之间拉黑状态的浏览器油猴脚本。

## 功能

- 查询用户A是否拉黑用户B
- 查询用户B是否拉黑用户A
- 显示双向拉黑状态结果
- 自动获取用户昵称

## 效果截图

```
Check block: 49922172(正直少年李发卡) <-> 404523870(南柯十一梦)
49922172(正直少年李发卡) --blocks--> 404523870(南柯十一梦): is_black = 1
404523870(南柯十一梦) --blocks--> 49922172(正直少年李发卡): is_black = 0
========================================
Result: 正直少年李发卡 blocked 南柯十一梦.
```

## 使用方法

### 1. 安装Tampermonkey插件

- Chrome/Edge: [Tampermonkey](https://www.tampermonkey.net/)
- Firefox: [Tampermonkey](https://www.tampermonkey.net/)

### 2. 安装脚本

1. 点击Tampermonkey图标 → "添加新脚本"
2. 删除默认内容
3. 复制 `bilibili_block_checker.user.js` 的内容粘贴
4. 按 `Ctrl+S` 保存

### 3. 使用

1. 打开B站任意页面
2. 点击页面右侧的粉色🔍按钮
3. 输入两个用户的UID
4. 点击"开始检测"

## 如何获取UID

打开用户主页，URL中的数字就是UID：
- 例如: `https://space.bilibili.com/49922172`
- UID就是 `49922172`

## 技术实现

- 使用B站用户信息API获取用户昵称
- 使用B站直播API查询用户关系状态
- 纯前端实现，无需后端服务器

## 免责声明

- 本工具仅供学习研究使用
- 不得用于非法用途或侵犯他人隐私
- 使用本工具造成的一切后果由使用者自行承担
- 如有侵权，请联系删除

## License

MIT License
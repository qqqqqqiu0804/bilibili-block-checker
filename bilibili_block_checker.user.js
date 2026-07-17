// ==UserScript==
// @name         B站双向拉黑检测
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  查询两个B站用户之间的互相拉黑状态
// @author       You
// @match        https://www.bilibili.com/*
// @match        https://space.bilibili.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.bilibili.com
// ==/UserScript==

(function() {
    'use strict';

    // 创建悬浮按钮
    function createFloatButton() {
        const btn = document.createElement('div');
        btn.id = 'block-checker-btn';
        btn.innerHTML = '🔍';
        btn.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #fb7299, #fc9dbd);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 99999;
            box-shadow: 0 4px 15px rgba(251, 114, 153, 0.4);
            font-size: 24px;
            transition: all 0.3s ease;
        `;
        btn.onmouseover = () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 6px 20px rgba(251, 114, 153, 0.6)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 15px rgba(251, 114, 153, 0.4)';
        };
        btn.onclick = showDialog;
        document.body.appendChild(btn);
    }

    // 创建对话框
    function showDialog() {
        if (document.getElementById('block-checker-dialog')) return;

        const dialog = document.createElement('div');
        dialog.id = 'block-checker-dialog';
        dialog.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 100000;
                min-width: 400px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <h3 style="margin: 0 0 20px 0; color: #333; text-align: center;">B站双向拉黑检测</h3>

                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 14px;">用户A的UID：</label>
                        <input type="text" id="uid-a-input" placeholder="如：49922172" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 14px;">用户B的UID：</label>
                        <input type="text" id="uid-b-input" placeholder="如：1727095428" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                </div>

                <div id="result-area" style="
                    background: #1e1e1e;
                    color: #00ff00;
                    padding: 15px;
                    border-radius: 8px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 13px;
                    min-height: 100px;
                    margin-bottom: 15px;
                    white-space: pre-wrap;
                    display: none;
                "></div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="close-dialog" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        background: #f5f5f5;
                        color: #666;
                    ">关闭</button>
                    <button id="check-btn" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        background: linear-gradient(135deg, #fb7299, #fc9dbd);
                        color: white;
                    ">开始检测</button>
                </div>

                <p style="margin: 15px 0 0 0; color: #999; font-size: 12px; text-align: center;">
                    提示：输入两个用户的UID即可查询，无需登录
                </p>
            </div>
            <div id="dialog-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 99999;
            "></div>
        `;
        document.body.appendChild(dialog);

        // 绑定事件
        document.getElementById('close-dialog').onclick = closeDialog;
        document.getElementById('dialog-overlay').onclick = closeDialog;
        document.getElementById('check-btn').onclick = startCheck;
    }

    // 关闭对话框
    function closeDialog() {
        const dialog = document.getElementById('block-checker-dialog');
        if (dialog) dialog.remove();
    }

    // 显示结果
    function showResult(text, isError = false) {
        const resultArea = document.getElementById('result-area');
        resultArea.style.display = 'block';
        resultArea.innerHTML = text;
        resultArea.style.color = isError ? '#ff6b6b' : '#00ff00';
        // 同时输出到控制台方便调试
        console.log('[拉黑检测]', text);
    }

    // 获取用户信息
    function getUserInfo(uid) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://api.bilibili.com/x/web-interface/card?mid=${uid}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.bilibili.com'
                },
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.code === 0 && data.data && data.data.card) {
                            resolve(data.data.card.name);
                        } else {
                            resolve(`UID:${uid}`);
                        }
                    } catch (e) {
                        resolve(`UID:${uid}`);
                    }
                },
                onerror: function() {
                    resolve(`UID:${uid}`);
                }
            });
        });
    }

    // 查询拉黑状态（使用直播API，无需SESSDATA）
    function checkBlockStatus(ruid, uid) {
        return new Promise((resolve) => {
            const url = `https://api.live.bilibili.com/xlive/app-ucenter/v2/card/user?ruid=${ruid}&uid=${uid}`;
            console.log('[拉黑检测] 请求URL:', url);

            // 方式1：使用页面内的fetch
            fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Referer': 'https://www.bilibili.com/'
                }
            })
            .then(response => {
                console.log('[拉黑检测] 响应状态:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('[拉黑检测] 返回数据:', data);
                if (data.code === 0 && data.data) {
                    resolve(data.data.is_black || 0);
                } else {
                    resolve(-1);
                }
            })
            .catch(error => {
                console.error('[拉黑检测] fetch错误:', error);
                // 方式2：回退到GM_xmlhttpRequest
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: function(response) {
                        console.log('[拉黑检测] GM响应:', response.responseText);
                        try {
                            const data = JSON.parse(response.responseText);
                            if (data.code === 0 && data.data) {
                                resolve(data.data.is_black || 0);
                            } else {
                                resolve(-1);
                            }
                        } catch (e) {
                            resolve(-1);
                        }
                    },
                    onerror: function() {
                        resolve(-1);
                    }
                });
            });
        });
    }

    // 主检查函数
    async function startCheck() {
        const uidA = document.getElementById('uid-a-input').value.trim();
        const uidB = document.getElementById('uid-b-input').value.trim();

        if (!uidA || !uidB) {
            showResult('错误：请输入两个用户的UID', true);
            return;
        }

        showResult('Fetching user info...');

        // 获取用户名
        const [nameA, nameB] = await Promise.all([
            getUserInfo(uidA),
            getUserInfo(uidB)
        ]);

        let result = `Check block: ${uidA}(${nameA}) <-> ${uidB}(${nameB})\n\n`;

        showResult(result + '正在查询A是否拉黑B...');

        // 查询A是否拉黑B（ruid=A, uid=B）
        const aBlockB = await checkBlockStatus(uidA, uidB);

        result += `${uidA}(${nameA}) --blocks--> ${uidB}(${nameB}): is_black = ${aBlockB}\n`;
        showResult(result + '正在查询B是否拉黑A...');

        // 查询B是否拉黑A（ruid=B, uid=A）
        const bBlockA = await checkBlockStatus(uidB, uidA);

        result += `${uidB}(${nameB}) --blocks--> ${uidA}(${nameA}): is_black = ${bBlockA}\n\n`;

        // 汇总结果
        result += '='.repeat(40) + '\n';
        if (aBlockB === 0 && bBlockA === 0) {
            result += `Result: No block between ${nameA} and ${nameB}.`;
        } else if (aBlockB === 1 && bBlockA === 0) {
            result += `Result: ${nameA} blocked ${nameB}.`;
        } else if (aBlockB === 0 && bBlockA === 1) {
            result += `Result: ${nameB} blocked ${nameA}.`;
        } else if (aBlockB === 1 && bBlockA === 1) {
            result += `Result: ${nameA} and ${nameB} blocked each other.`;
        } else {
            result += `Result: 查询失败，请稍后重试`;
        }

        showResult(result);
    }

    // 初始化
    createFloatButton();
})();
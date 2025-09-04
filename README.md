# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# 🤖 GitHub Copilot Chat 模型備忘卡

快速對照表，方便在 VS Code 切換 Copilot Chat 模型時參考。

| 模型名稱                  | 計費倍率 | 是否吃到飽 | 適用情境                                                         |
| ------------------------- | -------- | ---------- | ---------------------------------------------------------------- |
| **GPT-4o**                | 吃到飽   | ✅ 是      | **最推薦**：綜合表現佳，低延遲，穩定可靠，適合日常開發與小修改。 |
| **GPT-4.1**               | 吃到飽   | ✅ 是      | 同樣吃到飽，適合需要完整推理、語言理解的情境。                   |
| **Gemini 2.0 Flash**      | 0.25x    | ❌ 否      | **最快**：適合快速補全、命名建議，但推理較弱。                   |
| **o3 / o4-mini**          | 0.33x    | ❌ 否      | 輕量模型，速度快、省額度，適合小段程式碼建議。                   |
| **Claude Sonnet 3.7 / 4** | 1x       | ❌ 否      | 程式重構、長程式分析，推理力強。                                 |
| **GPT-5 Preview**         | 1x       | ❌ 否      | 最新 Preview，強邏輯推理與跨檔案理解。                           |
| **Claude Opus**           | 10x      | ❌ 否      | 成本極高，不建議日常使用。                                       |

---

## 🚀 建議使用策略

1. **日常開發 → GPT-4o (吃到飽)**
2. **需要快 → Gemini 2.0 Flash / o4-mini**
3. **需要深推理 → GPT-5 Preview / Claude Sonnet 4**
4. **避免使用 Claude Opus（10x 配額，成本太高）**

---

## 🔧 如何切換模型？

1. 打開 **Copilot Chat 面板**
2. 點右上角 **模型選單**
3. 選擇需要的模型即可，VS Code 會記住你的選擇。

---

[隱私權政策](public/privacy.html)

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const appOutput = join(root, ".next", "server", "app");

function readRoute(pathname) {
  const path = join(appOutput, `${pathname}.html`);
  if (!existsSync(path)) throw new Error(`Missing production artifact: ${path}`);
  return readFileSync(path, "utf8");
}

function expectContains(content, sentinel, label) {
  if (!content.includes(sentinel)) throw new Error(`${label} is missing its current-page sentinel`);
}

function expectExcludes(content, sentinel, label) {
  if (content.includes(sentinel)) throw new Error(`${label} contains a cross-locale or cross-page sentinel: ${sentinel}`);
}

const englishButton = readRoute("docs/button");
const chineseButton = readRoute("zh-CN/docs/button");
const englishSentinel = "Buttons trigger actions and move people through a task.";
const chineseSentinel = "按钮用于触发操作并推动用户完成任务。";
const otherPageSentinel = "可折叠的内容区块，支持展开与收起动画";

expectContains(englishButton, englishSentinel, "English Button");
expectExcludes(englishButton, chineseSentinel, "English Button");
expectContains(chineseButton, chineseSentinel, "Chinese Button");
expectExcludes(chineseButton, englishSentinel, "Chinese Button");
expectExcludes(chineseButton, otherPageSentinel, "Chinese Button");

console.log("i18n client payload check passed");

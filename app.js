"use strict";
const content = window.PORTFOLIO_DATA;
const storageKey = "int6140-eportfolio-v1";
const gibbs = [
  ["description", "描述", "发生了什么，具体情境是什么"], ["feelings", "感受", "当时有哪些想法或感受"],
  ["evaluation", "评价", "哪些方面有效，哪些需要改善"], ["analysis", "分析", "结合理论和证据解释原因"],
  ["conclusion", "结论", "本次经历改变了什么判断"], ["action", "行动", "下一步做什么，怎样检验"]
];
let state = { entries: [], completed: [] };
let storageAvailable = true;
try {
  const saved = localStorage.getItem(storageKey);
  if (saved) state = validateBackup(JSON.parse(saved));
} catch { storageAvailable = false; }
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; }
  catch { storageAvailable = false; return false; }
}
function validateBackup(value) {
  if (!value || !Array.isArray(value.entries) || !Array.isArray(value.completed) || value.entries.length > 200) throw new Error("备份格式不正确");
  const entries = value.entries.map(entry => {
    if (!entry || typeof entry.title !== "string" || !entry.title.trim() || entry.title.length > 80 || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) throw new Error("记录格式不正确");
    const result = { id: String(entry.id || crypto.randomUUID()), title: entry.title, date: entry.date };
    gibbs.forEach(([key]) => { if (typeof entry[key] !== "string" || entry[key].length > 3000) throw new Error("反思字段不正确"); result[key] = entry[key]; });
    return result;
  });
  return { entries, completed: [...new Set(value.completed.filter(v => Number.isInteger(v) && v >= 0 && v < 4))] };
}
document.getElementById("core-count").textContent = content.core_chinese_characters.toLocaleString();
content.modules.forEach(module => {
  const target = document.querySelector(`[data-core="${module.id}"]`);
  module.paragraphs.forEach(text => target.append(node("p", text)));
});
content.skills.forEach(row => {
  const tr = node("tr"); row.forEach(text => tr.append(node("td", text)));
  document.getElementById("skills-table").append(tr);
});
content.cognitive_nodes.forEach(item => {
  const block = node("div", undefined, "cognitive-node");
  block.append(node("h4", item.title));
  [["初次关注", item.initial], ["证据与条件", item.evidence], ["修订后的判断", item.revised]].forEach(([label, text]) => {
    const p = node("p"); p.append(node("small", label), document.createTextNode(text)); block.append(p);
  });
  document.getElementById("cognitive-nodes").append(block);
});
const flows = {
  assisted: [
    ["接收与分类", "最少必要信息", "确认客户的问题、已有订单资料和授权范围，识别仍需核实的信息。"],
    ["AI检索草拟", "显示依据来源", "从企业现行知识库检索规则并形成回复草稿，保留来源与版本信息。"],
    ["员工核查", "业务与文化判断", "核对商品、物流和退款条件，并检查语气、语言及文化语境。"],
    ["解决或升级", "明确转交责任", "在权限范围内回应。涉及例外承诺时转交负责人，并说明接收与跟进安排。"],
    ["复盘与维护", "沉淀修订证据", "记录草稿错误、修改依据与反馈，将共性问题用于知识库和培训更新。"]
  ],
  manual: [
    ["接收咨询", "确认问题", "人工阅读咨询并确认需要解决的问题。"], ["人工查找", "检索业务规则", "在规则、订单及历史记录中查找依据。"],
    ["草拟回复", "组织语言", "结合业务条件组织回复，必要时请同事协助翻译或理解语境。"], ["判断与处理", "处理例外", "核查回复，并依照权限解决或转交复杂问题。"], ["记录交接", "更新工单", "保存处理依据和未决问题，供后续跟进。"]
  ]
};
let flowMode = "assisted";
let flowStep = 0;
function renderFlow() {
  const parent = document.getElementById("workflow"); parent.replaceChildren();
  flows[flowMode].forEach(([title, subtitle], index) => {
    const button = node("button", undefined, "flow-step" + (flowStep === index ? " selected" : ""));
    button.type = "button"; button.setAttribute("aria-pressed", String(flowStep === index));
    button.append(node("strong", title), node("small", subtitle));
    button.addEventListener("click", () => { flowStep = index; renderFlow(); }); parent.append(button);
  });
  document.getElementById("flow-detail").textContent = flows[flowMode][flowStep][2];
}
document.querySelectorAll("[data-flow]").forEach(button => button.addEventListener("click", () => {
  flowMode = button.dataset.flow; flowStep = 0;
  document.querySelectorAll("[data-flow]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
  renderFlow();
}));
renderFlow();
const sourceButton = document.querySelector(".source-toggle");
sourceButton.addEventListener("click", () => {
  const open = sourceButton.getAttribute("aria-expanded") !== "true";
  sourceButton.setAttribute("aria-expanded", String(open)); document.getElementById("rule-source").hidden = !open;
});
document.getElementById("verify-check").addEventListener("change", event => { document.getElementById("approve-demo").disabled = !event.target.checked; });
document.getElementById("approve-demo").addEventListener("click", () => { document.getElementById("prototype-status").textContent = "已完成示例回复核对。此操作为原型演示，实际回复需在企业系统中完成。"; });
document.getElementById("escalate-demo").addEventListener("click", () => { document.getElementById("prototype-status").textContent = "已模拟转交主管，待核实事项与沟通记录一并交接。该演示不会发送真实工单。"; });
function renderRoadmap() {
  const target = document.getElementById("roadmap"); target.replaceChildren();
  content.roadmap.forEach(([phase, action, evidence], index) => {
    const block = node("div", undefined, "milestone"); const label = node("label");
    const input = node("input"); input.type = "checkbox"; input.checked = state.completed.includes(index);
    input.addEventListener("change", () => {
      state.completed = input.checked ? [...new Set([...state.completed, index])] : state.completed.filter(n => n !== index);
      saveState(); renderRoadmap();
    });
    label.append(input, document.createTextNode(phase)); block.append(label, node("p", action), node("small", evidence)); target.append(block);
  });
  document.getElementById("roadmap-progress").textContent = `${state.completed.length}/4 阶段完成 · 本机记录`;
}
renderRoadmap();
const journalDialog = document.getElementById("journal-dialog");
const form = document.getElementById("journal-form");
gibbs.forEach(([key, label, help]) => {
  const field = node("label", label); field.append(node("small", help));
  const textarea = node("textarea"); textarea.name = key; textarea.maxLength = 3000; field.append(textarea);
  document.getElementById("gibbs-fields").append(field);
});
document.querySelectorAll(".journal-open").forEach(button => button.addEventListener("click", () => {
  form.reset();
  const today = new Date();
  form.elements.date.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  document.getElementById("form-status").textContent = ""; journalDialog.showModal();
}));
["close-dialog", "cancel-dialog"].forEach(id => document.getElementById(id).addEventListener("click", () => journalDialog.close()));
form.addEventListener("submit", event => {
  event.preventDefault(); if (!form.reportValidity()) return;
  if (!form.elements.title.value.trim()) { document.getElementById("form-status").textContent = "请填写记录标题。"; form.elements.title.focus(); return; }
  if (state.entries.length >= 200) { document.getElementById("form-status").textContent = "当前记录已达200条，请先导出备份并整理记录。"; return; }
  const entry = { id: crypto.randomUUID(), date: form.elements.date.value, title: form.elements.title.value.trim() };
  gibbs.forEach(([key]) => { entry[key] = form.elements[key].value.trim(); });
  state.entries.unshift(entry); const saved = saveState(); renderEntries(); journalDialog.close();
  document.getElementById("record-status").textContent = saved ? "学习记录已保存到当前浏览器。" : "浏览器存储不可用，请立即导出备份。";
});
function renderEntries() {
  const target = document.getElementById("journal-list"); target.replaceChildren();
  if (!state.entries.length) { target.append(node("p", "当前尚无个人学习记录。可添加真实经历，逐步补充本学期的认知变化。", "empty")); return; }
  state.entries.forEach(entry => {
    const details = node("details", undefined, "journal-entry"); const summary = node("summary");
    const time = node("time", entry.date); time.dateTime = entry.date;
    summary.append(time, document.createTextNode(entry.title)); details.append(summary);
    const dl = node("dl"); gibbs.forEach(([key, label]) => { dl.append(node("dt", label), node("dd", entry[key] || "尚未填写")); }); details.append(dl);
    const remove = node("button", "删除这条本机记录", "delete-entry"); remove.type = "button";
    remove.addEventListener("click", () => { state.entries = state.entries.filter(e => e.id !== entry.id); saveState(); renderEntries(); document.getElementById("record-status").textContent = "该条本机记录已删除。"; }); details.append(remove); target.append(details);
  });
}
renderEntries();
function downloadJSON(value) {
  const file = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(file); const link = node("a"); link.href = url; link.download = "INT6140学习记录备份.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.getElementById("export-records").addEventListener("click", () => downloadJSON({ ...state, exportedAt: new Date().toISOString(), format: "int6140-eportfolio-v1" }));
document.getElementById("import-records").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error("文件过大");
    const backup = validateBackup(JSON.parse(await file.text()));
    const merged = new Map(state.entries.map(entry => [entry.id, entry]));
    backup.entries.forEach(entry => merged.set(entry.id, entry));
    if (merged.size > 200) throw new Error("合并后超过200条记录");
    state = { entries: [...merged.values()].sort((a,b) => b.date.localeCompare(a.date)), completed: [...new Set([...state.completed, ...backup.completed])] };
    const saved = saveState(); renderEntries(); renderRoadmap();
    document.getElementById("record-status").textContent = saved ? "备份已导入并与本机记录合并。" : "已读取备份，浏览器存储不可用，请导出当前记录。";
  } catch (error) { document.getElementById("record-status").textContent = `导入失败，${error.message}。`; }
  event.target.value = "";
});
content.references.forEach(([text, url]) => {
  const li = node("li"); const a = node("a", "查看来源 ↗"); a.href = url; a.target = "_blank"; a.rel = "noreferrer";
  li.append(document.createTextNode(text + " "), a); document.getElementById("reference-list").append(li);
});
content.ai_statement.paragraphs.forEach(text => document.getElementById("ai-text").append(node("p", text)));
document.getElementById("authenticity-note").textContent = content.authenticity_note;
content.rubric.forEach(row => {
  const tr = node("tr"); tr.append(node("td", row.criterion), node("td", row.weight + "%"), node("td", row.modules.map(id => content.modules.find(m => m.id === id)?.title || "文献与AI使用声明").join("、")));
  document.getElementById("rubric-table").append(tr);
});
const navigation = [...document.querySelectorAll(".sidebar nav a")];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) navigation.forEach(link => link.classList.toggle("active", link.hash === "#" + entry.target.id)); });
}, { rootMargin: "-15% 0px -65% 0px" });
document.querySelectorAll("main>.module").forEach(section => observer.observe(section));
if (!storageAvailable) document.getElementById("record-status").textContent = "浏览器存储暂不可用，请使用导出备份保存新增记录。";

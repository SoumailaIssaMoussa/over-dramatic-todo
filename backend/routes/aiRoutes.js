const express = require("express");
const router = express.Router();
const axios = require("axios");
const protect = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const rateLimit = require("express-rate-limit");

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { message: "Too many AI requests — the oracle needs rest." } });

// POST /api/ai/story — generate dramatic summary of user's tasks
router.post("/story", protect, aiLimiter, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).limit(20).sort({ dramaLevel: -1 });

    if (tasks.length === 0) {
      return res.json({ story: "The chronicles are empty. You have declared no crises yet. Either you are supremely organized, or supremely in denial." });
    }

    const taskList = tasks.map(t =>
      `- "${t.title}" (Drama Level: ${t.dramaLevel}/10, Status: ${t.completed ? "SURVIVED" : "ONGOING"}, Due: ${t.dueDate ? new Date(t.dueDate).toDateString() : "No deadline — living dangerously"})`
    ).join("\n");

    const avgDrama = (tasks.reduce((s, t) => s + t.dramaLevel, 0) / tasks.length).toFixed(1);

    const prompt = `You are the world's most theatrical narrator. You speak in overwrought, melodramatic prose, treating everyday tasks as epic tragedies or heroic triumphs. Generate a dramatic, funny, story-like summary of the following person's task list. Name them "our protagonist." Reference specific tasks. Use literary devices — metaphors, dramatic pauses (em dashes), rhetorical questions. Max 200 words.

User's tasks:
${taskList}

Average drama level: ${avgDrama}/10

Write the dramatic chronicle now:`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback mock story if no API key
      const mock = generateMockStory(tasks, avgDrama);
      return res.json({ story: mock });
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const story = response.data.content[0]?.text || "The oracle has gone silent.";
    res.json({ story });
  } catch (err) {
    console.error("AI story error:", err.message);
    // Fallback if Anthropic API fails
    const tasks = await Task.find({ user: req.user._id }).limit(10);
    const avgDrama = tasks.length ? (tasks.reduce((s, t) => s + t.dramaLevel, 0) / tasks.length).toFixed(1) : 5;
    res.json({ story: generateMockStory(tasks, avgDrama) });
  }
});

function generateMockStory(tasks, avgDrama) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const worst = tasks.sort((a, b) => b.dramaLevel - a.dramaLevel)[0];
  return `Gather round, mortals, for I shall recount the EPIC SAGA of our protagonist — a soul burdened with ${total} crises, each more harrowing than the last. Their average drama level stands at a staggering ${avgDrama}/10 — a number that would make philosophers weep. ${worst ? `Most catastrophic of all looms "${worst.title}" — a Level ${worst.dramaLevel} ordeal that threatens the very fabric of their schedule. ` : ""}Of the ${total} declared catastrophes, only ${completed} have been vanquished. ${completed === total ? "By some miracle, ALL have been survived! The heavens themselves applaud." : `The remaining ${total - completed} still rage — unfinished, unresolved, and undeniably dramatic.`} Will our hero prevail? Will the tasks be completed? Only fate — and perhaps a strong coffee — shall decide.`;
}

// POST /api/ai/chaos-report — weekly dramatic summary based on real task data
router.post("/chaos-report", protect, aiLimiter, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const allTasks = await Task.find({ user: req.user._id });
    const weekTasks = allTasks.filter(t => t.createdAt >= since);
    const completed = allTasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= since);
    const overdue = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
    const escalated = allTasks.filter(t =>
      (t.dramaHistory || []).some(h => h.event === "escalated" && new Date(h.date) >= since)
    );

    const avgDrama = allTasks.length
      ? (allTasks.reduce((s, t) => s + t.dramaLevel, 0) / allTasks.length).toFixed(1)
      : "0";

    const summary = {
      created: weekTasks.length,
      completed: completed.length,
      overdue: overdue.length,
      escalations: escalated.length,
      avgDrama,
      worstTask: overdue.sort((a, b) => b.dramaLevel - a.dramaLevel)[0]?.title || null,
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.json({ report: generateMockChaosReport(summary) });
    }

    const prompt = `You are a melodramatic journalist writing "The Weekly Chaos Report" for a productivity app. 
Write a dramatic, funny, weekly summary based on these stats. Use theatrical newspaper-style language. Max 150 words.

Stats for this week:
- New tasks created: ${summary.created}
- Tasks completed (survived): ${summary.completed}
- Tasks overdue (disasters unfolding): ${summary.overdue}
- Tasks that escalated in drama: ${summary.escalations}
- Current average drama level: ${summary.avgDrama}/10
${summary.worstTask ? `- Most catastrophic ongoing crisis: "${summary.worstTask}"` : ""}

Write "THE WEEKLY CHAOS REPORT" as a dramatic headline, then the body:`;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      { model: "claude-sonnet-4-20250514", max_tokens: 300, messages: [{ role: "user", content: prompt }] },
      { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, timeout: 20000 }
    );

    res.json({ report: response.data.content[0]?.text || generateMockChaosReport(summary), summary });
  } catch (err) {
    console.error("Chaos report error:", err.message);
    res.json({ report: "The chaos report could not be compiled — the data was too dramatic to process." });
  }
});

function generateMockChaosReport(s) {
  return `📰 THE WEEKLY CHAOS REPORT\n\nThis week, our beleaguered protagonist launched ${s.created} new crises into the universe — ${s.completed} of which were somehow, miraculously, SURVIVED. Yet ${s.overdue} disasters remain unresolved, festering like an unread email. Drama escalated on ${s.escalations} task(s), a frankly alarming statistic. ${s.worstTask ? `The most catastrophic ongoing saga, "${s.worstTask}", continues to haunt us.` : ""} With an average drama level of ${s.avgDrama}/10, the outlook for next week is: theatrical.`;
}

// POST /api/ai/reaction — generate a one-liner dramatic reaction for completing a task
router.post("/reaction", protect, async (req, res) => {
  try {
    const { taskTitle, dramaLevel } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const reactions = [
        `UNPRECEDENTED! "${taskTitle}" has been conquered! History books tremble.`,
        `Against ALL cosmic odds, you completed "${taskTitle}". The universe bows.`,
        `"${taskTitle}" — done. Shakespeare is composing a sonnet in your honor.`,
      ];
      return res.json({ reaction: reactions[Math.floor(Math.random() * reactions.length)] });
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 80,
        messages: [{
          role: "user",
          content: `Write ONE ultra-dramatic, funny celebration line for completing the task "${taskTitle}" (drama level ${dramaLevel}/10). Max 25 words. Be theatrical and funny.`
        }],
      },
      {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    res.json({ reaction: response.data.content[0]?.text || "INCREDIBLE! History has been made!" });
  } catch (err) {
    res.json({ reaction: "A MIRACLE HAS OCCURRED! The chronicles will remember this day." });
  }
});

module.exports = router;

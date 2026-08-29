const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Ajuste aqui se precisar (fuso fixo do Brasil, sem horário de verão desde 2019).
const UTC_OFFSET = "-03:00";
// Quantos minutos antes do horário do compromisso o aviso deve chegar.
const APPOINTMENT_LEAD_MINUTES = 30;
// Horário (fuso acima) em que tarefas com vencimento hoje avisam.
const TASK_REMINDER_HOUR = "08:00";
// Janela de tolerância: evita perder um lembrete se a função atrasar um pouco,
// mas também evita reenviar avisos muito antigos.
const GRACE_WINDOW_MS = 15 * 60 * 1000;

function toMillis(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr && timeStr.length === 5 ? timeStr : TASK_REMINDER_HOUR;
  const iso = `${dateStr}T${time}:00${UTC_OFFSET}`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

function dueNow(targetMs, nowMs) {
  return targetMs !== null && targetMs <= nowMs && targetMs > nowMs - GRACE_WINDOW_MS;
}

exports.checkReminders = onSchedule(
  { schedule: "every 5 minutes", timeZone: "America/Sao_Paulo" },
  async () => {
    const nowMs = Date.now();
    const snapshot = await db.collection("agendas").get();

    const writes = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() || {};
      const tokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
      if (tokens.length === 0) continue;

      const messagesToSend = [];
      let changed = false;

      const appointments = Array.isArray(data.appointments) ? data.appointments : [];
      appointments.forEach((a) => {
        if (a.notified) return;
        const targetMs = toMillis(a.date, a.time) !== null
          ? toMillis(a.date, a.time) - APPOINTMENT_LEAD_MINUTES * 60 * 1000
          : null;
        if (dueNow(targetMs, nowMs)) {
          const when = a.time ? `hoje às ${a.time}` : "hoje";
          messagesToSend.push({
            title: "Compromisso em breve",
            body: `${a.title} — ${when}`,
          });
          a.notified = true;
          changed = true;
        }
      });

      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      tasks.forEach((t) => {
        if (t.notified || t.done || !t.dueDate) return;
        const targetMs = toMillis(t.dueDate, null);
        if (dueNow(targetMs, nowMs)) {
          messagesToSend.push({
            title: "Tarefa vence hoje",
            body: t.title,
          });
          t.notified = true;
          changed = true;
        }
      });

      if (messagesToSend.length === 0) continue;

      const invalidTokens = new Set();
      for (const msg of messagesToSend) {
        const response = await messaging.sendEachForMulticast({
          tokens,
          notification: { title: msg.title, body: msg.body },
          webpush: {
            notification: { icon: "icons/icon-192.png" },
            fcmOptions: { link: "./" },
          },
        });
        response.responses.forEach((r, idx) => {
          if (!r.success) {
            const code = r.error && r.error.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              invalidTokens.add(tokens[idx]);
            }
          }
        });
      }

      if (changed || invalidTokens.size > 0) {
        const cleanedTokens = tokens.filter((tk) => !invalidTokens.has(tk));
        writes.push(
          docSnap.ref.set(
            { appointments, tasks, fcmTokens: cleanedTokens },
            { merge: true }
          )
        );
      }
    }

    await Promise.all(writes);
  }
);

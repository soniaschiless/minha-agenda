const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Ajuste aqui se precisar (fuso fixo do Brasil, sem horário de verão desde 2019).
const UTC_OFFSET = "-03:00";
// Horário padrão usado quando o item não tem horário definido (meia-noite do dia marcado),
// igual ao comportamento do popup "Lembrete" dentro do app (dueDateTimeMs em index.html).
const DEFAULT_TIME = "00:00";

function toMillis(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr && timeStr.length === 5 ? timeStr : DEFAULT_TIME;
  const iso = `${dateStr}T${time}:00${UTC_OFFSET}`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

// Sem gente/janela de tolerância: um item vencido continua "devido" até ser concluído
// ou reagendado, então a notificação repete a cada execução (a cada 5 min) enquanto isso
// não acontecer — a melhor aproximação do popup bloqueante quando o app está fechado.
function isDue(targetMs, nowMs) {
  return targetMs !== null && targetMs <= nowMs;
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

      const appointments = Array.isArray(data.appointments) ? data.appointments : [];
      appointments.forEach((a) => {
        if (a.done) return;
        const targetMs = toMillis(a.date, a.time);
        if (isDue(targetMs, nowMs)) {
          const when = a.time ? `hoje às ${a.time}` : "hoje";
          messagesToSend.push({
            title: "Compromisso",
            body: `${a.title} — ${when}. Toque para confirmar ou remarcar.`,
          });
        }
      });

      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      tasks.forEach((t) => {
        if (t.done || !t.lembreteAtivo || !t.dueDate) return;
        const targetMs = toMillis(t.dueDate, t.lembreteTime);
        if (isDue(targetMs, nowMs)) {
          messagesToSend.push({
            title: "Tarefa: lembrete",
            body: `${t.title}. Toque para confirmar ou remarcar.`,
          });
        }
      });

      if (messagesToSend.length === 0) continue;

      const invalidTokens = new Set();
      for (const msg of messagesToSend) {
        const response = await messaging.sendEachForMulticast({
          tokens,
          notification: { title: msg.title, body: msg.body },
          webpush: {
            notification: { icon: "icons/icon-192.png", requireInteraction: true },
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

      if (invalidTokens.size > 0) {
        const cleanedTokens = tokens.filter((tk) => !invalidTokens.has(tk));
        writes.push(docSnap.ref.set({ fcmTokens: cleanedTokens }, { merge: true }));
      }
    }

    await Promise.all(writes);
  }
);

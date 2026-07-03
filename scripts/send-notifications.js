import admin from "firebase-admin";
import Papa from "papaparse";
import { DateTime } from "luxon";

/**
 * Notificaciones automáticas Knockout - v4.3.2
 *
 * Mejora clave:
 * - La ventana real ahora es de 20 a 0 minutos antes del inicio,
 *   para cubrir retrasos normales de GitHub Actions.
 * - Se soporta FechaHora o Fecha + Hora, incluyendo horas tipo "1:00 p.m.".
 */
const KNOCKOUT_CSV_URL = process.env.KNOCKOUT_CSV_URL;
const APP_URL = process.env.APP_URL || "https://moylevi.github.io/quiniela-mundial-2026/";
const TIME_ZONE = process.env.TIME_ZONE || "America/Mexico_City";

const MINUTOS_ANTES = Number(process.env.NOTIFICATION_MINUTES_BEFORE || 15);
const VENTANA_TOLERANCIA_MINUTOS = Number(process.env.NOTIFICATION_WINDOW_MINUTES || 20);
const ENVIAR_HASTA_MINUTOS_ANTES_DEL_INICIO = Number(process.env.NOTIFICATION_SEND_UNTIL_MINUTES_BEFORE_START || 0);

const TOKEN_COLLECTION = process.env.FCM_TOKEN_COLLECTION || "fcmTokens";
const SENT_COLLECTION = process.env.SENT_NOTIFICATION_COLLECTION || "sentNotifications";
const NOTIFICATION_TYPE = "match-reminder";

const MESSAGE_TEMPLATE = {
  title: "🏆 Mundial FIFA 2026",
  body: "⚽ {LOCAL} vs {VISITANTE}\n⏰ Comienza en {MINUTOS} minutos.\n📍 {LUGAR}\n🎯 ¡Aún estás a tiempo de registrar tus pronósticos!"
};

const CHUNK_SIZE = 500;
const MESES_ES = {
  enero: 1, ene: 1,
  febrero: 2, feb: 2,
  marzo: 3, mar: 3,
  abril: 4, abr: 4,
  mayo: 5, may: 5,
  junio: 6, jun: 6,
  julio: 7, jul: 7,
  agosto: 8, ago: 8,
  septiembre: 9, sept: 9, sep: 9,
  octubre: 10, oct: 10,
  noviembre: 11, nov: 11,
  diciembre: 12, dic: 12
};

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan secretos de Firebase. Usa FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.");
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey
  };
}

function normalize(value) {
  return String(value || "").trim();
}

function firstValue(row, names) {
  for (const name of names) {
    const value = normalize(row[name]);
    if (value) return value;
  }
  return "";
}

function isActiveMatch(row) {
  const activo = normalize(row.Activo).toUpperCase();
  const status = normalize(row.Status).toLowerCase();
  return activo === "SI" && !status.includes("finalizado");
}

function getMatchId(row) {
  return firstValue(row, ["IDPartido", "IdPartido", "ID Partido", "PartidoID", "ID", "Num"]);
}

function normalizeMeridian(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/a\.?\s*m\.?/g, "AM")
    .replace(/p\.?\s*m\.?/g, "PM")
    .replace(/a\.m\./g, "AM")
    .replace(/p\.m\./g, "PM")
    .replace(/a\.m/g, "AM")
    .replace(/p\.m/g, "PM");
}

function parseTimeText(value) {
  const raw = normalizeMeridian(value);
  const match12 = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = Number(match12[2] || 0);
    const meridian = match12[3].toUpperCase();
    if (meridian === "PM" && hour < 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    return { hour, minute };
  }

  const match24 = raw.match(/(\d{1,2}):(\d{2})/);
  if (match24) return { hour: Number(match24[1]), minute: Number(match24[2]) };

  const matchHour = raw.match(/^\d{1,2}$/);
  if (matchHour) return { hour: Number(raw), minute: 0 };

  return null;
}

function parseSpanishDateText(value) {
  const raw = normalize(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let match = raw.match(/(\d{1,2})[.\-/\s]+([a-z]+)(?:[.\-/\s]+(\d{4}))?/i);
  if (!match) match = raw.match(/(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(\d{1,2})[.\-/\s]+([a-z]+)(?:[.\-/\s]+(\d{4}))?/i);
  if (!match) return null;

  const day = Number(match[1]);
  const month = MESES_ES[match[2]];
  const year = Number(match[3] || process.env.NOTIFICATION_YEAR || 2026);

  if (!day || !month || !year) return null;
  return { year, month, day };
}

function parseDateTimeCandidates(value) {
  const raw = normalize(value);
  if (!raw) return [];

  return [
    DateTime.fromISO(raw, { zone: TIME_ZONE }),
    DateTime.fromFormat(raw, "yyyy-MM-dd HH:mm", { zone: TIME_ZONE }),
    DateTime.fromFormat(raw, "yyyy/MM/dd HH:mm", { zone: TIME_ZONE }),
    DateTime.fromFormat(normalizeMeridian(raw), "yyyy-MM-dd h:mm a", { zone: TIME_ZONE }),
    DateTime.fromFormat(normalizeMeridian(raw), "yyyy/MM/dd h:mm a", { zone: TIME_ZONE })
  ].filter(date => date.isValid);
}

function parseCdmxDate(row) {
  const fechaHora = firstValue(row, ["FechaHora", "Fecha Hora", "DateTime", "Fecha_Hora"]);
  const candidates = parseDateTimeCandidates(fechaHora);
  if (candidates.length) return candidates[0];

  const fecha = firstValue(row, ["Fecha", "Date", "Dia", "Día"]);
  const hora = firstValue(row, ["Hora", "Time", "Horario"]);

  const dateParts = parseSpanishDateText(fecha);
  const timeParts = parseTimeText(hora);

  if (!dateParts || !timeParts) return null;

  const parsed = DateTime.fromObject({
    ...dateParts,
    hour: timeParts.hour,
    minute: timeParts.minute
  }, { zone: TIME_ZONE });

  return parsed.isValid ? parsed : null;
}

function replaceTemplate(template, values) {
  return template.replace(/\{([A-Z_]+)\}/g, (_, key) => values[key] ?? "");
}

function getTeamNames(row) {
  const local = firstValue(row, ["Local", "Loc", "Equipo Local", "EquipoLocal"]) || "Equipo local";
  const visitante = firstValue(row, ["Visitante", "Visita", "Vis", "Equipo Visitante", "EquipoVisitante"]) || "Equipo visitante";
  return { local, visitante };
}

function buildMessage(row, matchId, matchTime, now) {
  const { local, visitante } = getTeamNames(row);
  const lugar = firstValue(row, ["Lugar", "Sede", "Estadio"]) || "Sede por confirmar";
  const stage = firstValue(row, ["Stage", "Fase", "Ronda"]);
  const hora = matchTime.setZone(TIME_ZONE).toFormat("HH:mm");
  const minutosRestantes = Math.max(0, Math.round(getMinutesUntil(matchTime, now)));

  const values = {
    LOCAL: local,
    VISITANTE: visitante,
    LUGAR: lugar,
    STAGE: stage,
    HORA: hora,
    MINUTOS: String(minutosRestantes)
  };

  const title = replaceTemplate(MESSAGE_TEMPLATE.title, values);
  const body = replaceTemplate(MESSAGE_TEMPLATE.body, values);

  return {
    title,
    body,
    data: {
      type: NOTIFICATION_TYPE,
      matchId,
      local,
      visitante,
      lugar,
      stage,
      hora,
      minutosAntes: String(MINUTOS_ANTES),
      minutosRestantes: String(minutosRestantes),
      url: APP_URL,
      title,
      body
    }
  };
}

async function fetchKnockoutRows() {
  if (!KNOCKOUT_CSV_URL) throw new Error("Falta KNOCKOUT_CSV_URL.");

  const separator = KNOCKOUT_CSV_URL.includes("?") ? "&" : "?";
  const response = await fetch(`${KNOCKOUT_CSV_URL}${separator}_ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo leer Knockout CSV: HTTP ${response.status}`);

  const csv = await response.text();
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => String(h || "").trim()
  });

  if (parsed.errors?.length) {
    console.warn("Advertencias al parsear CSV:", parsed.errors.slice(0, 3));
  }

  return parsed.data || [];
}

function isTokenInvalidError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token" ||
    code.includes("registration-token-not-registered") ||
    code.includes("invalid-registration-token") ||
    message.includes("registration-token-not-registered") ||
    message.includes("Requested entity was not found")
  );
}

function chunk(array, size) {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
}

async function getActiveTokenDocs(db) {
  const snapshot = await db.collection(TOKEN_COLLECTION).get();
  const docs = snapshot.docs
    .map(doc => {
      const data = doc.data() || {};
      const token = String(data.token || doc.id || "").trim();
      const enabled = data.enabled !== false;
      return { id: doc.id, ref: doc.ref, token, enabled, data };
    })
    .filter(item => item.token && item.enabled);

  console.log(`[INFO] Documentos en ${TOKEN_COLLECTION}: ${snapshot.size}`);
  console.log(`[INFO] Tokens activos utilizables: ${docs.length}`);
  return docs;
}

function getSentId(matchId) {
  return `${NOTIFICATION_TYPE}-${matchId}-${MINUTOS_ANTES}min`;
}

function getMinutesUntil(matchTime, now) {
  return matchTime.diff(now, "minutes").minutes;
}

function getNotificationWindowLimits() {
  // NOTIFICATION_WINDOW_MINUTES representa la ventana real antes del inicio.
  // Ejemplo: 20 => notificar desde 20 hasta 0 minutos antes del partido.
  const upperLimit = Math.max(MINUTOS_ANTES, VENTANA_TOLERANCIA_MINUTOS);
  const lowerLimit = Math.max(0, ENVIAR_HASTA_MINUTOS_ANTES_DEL_INICIO);
  return { upperLimit, lowerLimit };
}

function isInsideNotificationWindow(matchTime, now) {
  const minutesUntil = getMinutesUntil(matchTime, now);
  const { upperLimit, lowerLimit } = getNotificationWindowLimits();

  return minutesUntil <= upperLimit && minutesUntil >= lowerLimit;
}

async function disableInvalidTokens(invalidTokenDocs) {
  if (!invalidTokenDocs.length) return;

  await Promise.all(invalidTokenDocs.map(item =>
    item.ref.set({
      enabled: false,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      disabledReason: "invalid-token-match-reminder-v4.3.2"
    }, { merge: true })
  ));

  console.log(`[WARN] Tokens inválidos desactivados: ${invalidTokenDocs.length}`);
}

async function sendReminder(db, messaging, row, matchTime, now) {
  const matchId = getMatchId(row);
  if (!matchId) return { skipped: true, reason: "sin IDPartido" };

  const sentId = getSentId(matchId);
  const sentRef = db.collection(SENT_COLLECTION).doc(sentId);
  const sent = await sentRef.get();

  if (sent.exists) {
    return { skipped: true, reason: "ya enviado", matchId, sentId };
  }

  const tokenDocs = await getActiveTokenDocs(db);
  if (!tokenDocs.length) return { skipped: true, reason: "sin tokens", matchId, sentId };

  const message = buildMessage(row, matchId, matchTime, now);
  const cleanAppUrl = APP_URL.replace(/\/$/, "");
  const invalidTokenDocs = [];

  let successCount = 0;
  let failureCount = 0;

  console.log(`[INFO] Enviando: ${message.data.local} vs ${message.data.visitante}`);
  console.log(`[INFO] Partido ${TIME_ZONE}: ${matchTime.toFormat("yyyy-MM-dd HH:mm")}`);
  console.log(`[INFO] Faltan aprox: ${Math.round(getMinutesUntil(matchTime, now))} minutos`);
  console.log(`[INFO] sentId: ${sentId}`);

  for (const group of chunk(tokenDocs, CHUNK_SIZE)) {
    const tokens = group.map(item => item.token);

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: message.title,
        body: message.body
      },
      data: {
        ...message.data,
        sentId
      },
      webpush: {
        fcmOptions: {
          link: APP_URL
        },
        notification: {
          icon: `${cleanAppUrl}/icons/icon-192.png`,
          badge: `${cleanAppUrl}/icons/icon-192.png`,
          tag: `quiniela-${sentId}`,
          renotify: true
        }
      }
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((item, index) => {
      const tokenDoc = group[index];
      const shortToken = `${tokenDoc.token.slice(0, 12)}...${tokenDoc.token.slice(-8)}`;

      if (!item.error) {
        console.log(`[OK] Token ${shortToken}: enviado correctamente.`);
        return;
      }

      const code = item.error.code || "sin-codigo";
      const errorMessage = item.error.message || "";
      console.warn(`[ERROR] Token ${shortToken}: ${code} ${errorMessage}`);

      if (isTokenInvalidError(item.error)) {
        invalidTokenDocs.push(tokenDoc);
      }
    });
  }

  await disableInvalidTokens(invalidTokenDocs);

  await sentRef.set({
    type: NOTIFICATION_TYPE,
    matchId,
    sentId,
    minutesBefore: MINUTOS_ANTES,
    windowMinutes: VENTANA_TOLERANCIA_MINUTOS,
    timeZone: TIME_ZONE,
    local: message.data.local,
    visitante: message.data.visitante,
    lugar: message.data.lugar,
    stage: message.data.stage,
    matchTime: matchTime.toISO(),
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    successCount,
    failureCount,
    totalTokens: tokenDocs.length,
    invalidTokens: invalidTokenDocs.length
  });

  console.log(`[OK] Resumen ${matchId}: ${successCount} enviados, ${failureCount} fallidos, ${invalidTokenDocs.length} inválidos.`);
  return { skipped: false, matchId, sentId, successCount, failureCount, invalidTokens: invalidTokenDocs.length };
}

async function main() {
  const serviceAccount = getServiceAccount();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const messaging = admin.messaging();
  const rows = await fetchKnockoutRows();
  const now = DateTime.now().setZone(TIME_ZONE);

  console.log(`[INFO] Hora actual ${TIME_ZONE}: ${now.toFormat("yyyy-MM-dd HH:mm:ss")}`);
  console.log(`[INFO] Minutos antes configurados: ${MINUTOS_ANTES}`);
  const { upperLimit, lowerLimit } = getNotificationWindowLimits();
  console.log(`[INFO] Ventana real de notificación: ${upperLimit} a ${lowerLimit} minutos antes del inicio`);
  console.log(`[INFO] Revisando ${rows.length} partidos Knockout...`);

  const activeRows = rows
    .filter(isActiveMatch)
    .map(row => ({ row, matchTime: parseCdmxDate(row) }))
    .filter(item => item.matchTime);

  console.log(`[INFO] Partidos activos con fecha/hora válida: ${activeRows.length}`);

  const candidates = activeRows.filter(({ matchTime }) => isInsideNotificationWindow(matchTime, now));

  if (!candidates.length) {
    console.log(`[INFO] No hay partidos dentro de la ventana de notificación (${upperLimit} a ${lowerLimit} minutos antes).`);

    const nextMatch = activeRows
      .filter(({ matchTime }) => matchTime > now)
      .sort((a, b) => a.matchTime.toMillis() - b.matchTime.toMillis())[0];

    if (nextMatch) {
      const { local, visitante } = getTeamNames(nextMatch.row);
      console.log(`[INFO] Próximo partido activo: ${local} vs ${visitante} | ${nextMatch.matchTime.toFormat("yyyy-MM-dd HH:mm")} ${TIME_ZONE} | faltan ${Math.round(getMinutesUntil(nextMatch.matchTime, now))} minutos.`);
    }

    return;
  }

  console.log(`[INFO] Candidatos para notificar: ${candidates.length}`);

  for (const { row, matchTime } of candidates) {
    const result = await sendReminder(db, messaging, row, matchTime, now);
    console.log("[INFO] Resultado:", result);
  }
}

main().catch(error => {
  console.error("[FATAL]", error);
  process.exit(1);
});

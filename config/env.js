
// Fonction utilitaire pour gérer les variables d'environnement
export function requiredEnv(name) {
  const v = process.env[name];
  if (!v || v === "undefined" || v === "null") {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

// Retourne la valeur de la variable d'environnement ou une valeur de repli si elle n'est pas définie
export function optionalEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (!v || v === "undefined" || v === "null") return fallback;
  return v;
}

// Retourne la valeur booléenne de la variable d'environnement
export function envBool(name, fallback = false) {
  const v = optionalEnv(name);
  if (v == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

// Retourne la valeur entière de la variable d'environnement
export function envInt(name, fallback) {
  const v = optionalEnv(name);
  if (v == null) {
    if (fallback === undefined) throw new Error(`Missing env var: ${name}`);
    return fallback;
  }
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`Env var ${name} must be an integer`);
  return n;
}

// Retourne la valeur JSON de la variable d'environnement -- Pour les secret files
export function envJson(name) {
  const raw = requiredEnv(name);
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Env var ${name} must be valid JSON`);
  }
}

// Journalise la présence et la longueur des variables d'environnement spécifiées
export function logEnv(...names) {
  for (const name of names) {
    const v = process.env[name];
    const present = !!(v && v !== "undefined" && v !== "null");
    const len = present ? String(v).length : 0;
    console.log(`[env] ${name}: present=${present} length=${len}`);
  }
}

// Every UI string lives here, in English and French.
import { AWARD_MAX, REASON_MAX } from "./shared";

export type Lang = "en" | "fr";
export const LANG_COOKIE = "rv_lang";
export const DEFAULT_LANG: Lang = "en";

/** Nomination deadline shown in the header (YYYY-MM-DD). Change it here. */
export const DEADLINE = "2026-12-04";

export function formatDeadline(lang: Lang) {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${DEADLINE}T12:00:00Z`));
}

const firstName = (name: string) => name.split(" ")[0];

const en = {
  // Header
  edition: "4th Edition",
  deadline: (date: string) => `Nominations close ${date}`,
  switchLang: "Passer en français",

  // Landing: explanations + "Who are you?" + 4-digit code
  how: [
    "Recommend colleagues for award categories: invent the category (say, “The Inbox Zero Award”) and tell us why.",
    "Your recommendations influence who wins what at the Raimondis awards.",
    "Vote for as many colleagues as possible. You can vote for the same person more than once.",
  ],
  tagline: ["Your colleagues.", "Your categories.", "One big night."],
  marquee: ["Nominations are open", "Les Raimondis", "4th Edition", "Vote for everyone", "No spoilers"],
  deadlineLabel: "Deadline",
  privacy: "Only the organizer sees what you submit.",
  whoTitle: "Who are you?",
  whoHint: "Pick your name. Your own card will be hidden, so no self-nominations.",
  searchNames: "Search your name",
  noMatch: (q: string) => `No one matches “${q}”.`,
  change: "Change",
  codeTitle: (name: string) => `Hi ${firstName(name)}! Your 4-digit code`,
  codeLabel: "4-digit code",
  codeHint: "First visit? Choose any 4 digits (not your bank PIN) and remember them. Coming back? Enter the same code to find your nominations.",
  start: "Start nominating",

  // Board
  hello: (name: string) => `Hi ${firstName(name)}!`,
  notYou: "Not you?",
  intro: "Pick a colleague, invent an award category, say why. You can vote for the same person more than once.",
  progress: (n: number, total: number) => `You've nominated ${n} of ${total} colleagues`,
  searchColleagues: "Search colleagues…",
  clearSearch: "Clear search",
  nominate: (name: string) => `Nominate ${name}`,
  awardsGiven: (n: number) => (n === 1 ? "1 award" : `${n} awards`),
  nominateShort: "Nominate",

  // Nomination dialog
  dialogEyebrow: "An award for",
  awardName: "Award name",
  awardExamples: [
    "The Inbox Zero Award",
    "The Last-Minute Deck Hero Award",
    "The Excel Whisperer Award",
    "The Coffee Machine Diplomat Award",
  ],
  reason: "Why they deserve it",
  reasonPlaceholder: "Because…",
  enterHint: "Enter to submit · Shift+Enter for a new line",
  submit: "Give the award",
  submitting: "Saving…",
  cancel: "Cancel",
  close: "Close",
  alreadyGiven: "Already given",
  charsLeft: (n: number) => `${n} left`,

  // Feedback
  saved: (name: string) => `Nomination saved for ${firstName(name)}!`,
  milestone25: "A quarter of the team covered. Keep going!",
  milestone50: "Halfway there! The red carpet is rolling out.",
  milestone100: "Everyone's nominated. You're a Raimondis legend!",

  // Your nominations
  mineTitle: (n: number) => `Your nominations (${n})`,
  mineHint: "Only you and the organizer can see these.",
  mineEmpty: "Nothing yet. Pick a colleague above to get started.",
  forName: (name: string) => `for ${name}`,
  delete: "Delete",
  confirmDelete: "Confirm?",

  // Errors (keys match the codes returned by server actions)
  errors: {
    noSession: "Your session expired. Reload the page and sign in again.",
    pickName: "Pick your name first.",
    codeFormat: "Your code must be exactly 4 digits.",
    wrongCode: "That's not the code saved for this name. Forgot it? Ask the organizer to reset it.",
    tooManyAttempts: "Too many attempts for this name. Try again in an hour, or ask the organizer.",
    badNominee: "That colleague isn't on the list.",
    selfNomination: "Nice try, but you can't nominate yourself.",
    awardRequired: "Give the award a name.",
    awardTooLong: `The award name must be ${AWARD_MAX} characters or less.`,
    reasonRequired: "Tell us why they deserve it.",
    reasonTooLong: `The reason must be ${REASON_MAX} characters or less.`,
    rateLimited: "Whoa, that's a lot of awards! Take a breather and try again in a bit.",
    deleteFailed: "Couldn't delete this one. Please try again.",
    generic: "Something went wrong. Please try again.",
  },

  // Admin
  admin: "Admin",
  adminPassword: "Admin password",
  badAdminPassword: "Wrong password.",
  signIn: "Sign in",
  signOut: "Sign out",
  results: "Results",
  stats: (n: number, nominees: number, voters: number) =>
    `${n} nominations · ${nominees} nominees · ${voters} voters`,
  nominee: "Nominee",
  voter: "Voter",
  all: "All",
  searchText: "Search awards and reasons",
  exportCsv: "Export CSV",
  refresh: "Refresh",
  colAward: "Award",
  colReason: "Reason",
  colVoter: "Voter",
  colTime: "Submitted",
  noResults: "No nominations match these filters.",
  noNominations: "No nominations yet.",
  notNominated: (n: number) => `Not nominated yet (${n})`,
  clearFilters: "Clear filters",
  codes: (n: number, total: number) => `${n} of ${total} people have created their code`,
  resetCodeHint: "Someone forgot their code? Reset it and they can choose a new one. Their nominations are kept.",
  resetCode: "Reset code",
  resetDone: (name: string) => `Code reset for ${name}.`,
  csvHeaders: ["Nominee", "Award name", "Reason", "Voter", "Timestamp"],
};

// (\u00a0 is a non-breaking space, so French punctuation never wraps onto its own line.)
const fr: typeof en = {
  edition: "4e édition",
  deadline: (date) => `Mises en nomination jusqu'au ${date}`,
  switchLang: "Switch to English",

  how: [
    "Recommande tes collègues pour des catégories de prix\u00a0: invente la catégorie (par exemple «\u00a0Le prix Boîte de réception zéro\u00a0») et dis-nous pourquoi.",
    "Tes recommandations influenceront qui gagne quoi aux prix Raimondis.",
    "Vote pour le plus de collègues possible. Tu peux voter plus d'une fois pour la même personne.",
  ],
  tagline: ["Tes collègues.", "Tes catégories.", "Une grande soirée."],
  marquee: ["Les nominations sont ouvertes", "Les Raimondis", "4e édition", "Vote pour tout le monde", "Aucun divulgâcheur"],
  deadlineLabel: "Date limite",
  privacy: "Seul l'organisateur voit ce que tu soumets.",
  whoTitle: "Qui es-tu?",
  whoHint: "Choisis ton nom. Ta propre carte sera masquée\u00a0: pas d'autonomination.",
  searchNames: "Recherche ton nom",
  noMatch: (q) => `Personne ne correspond à «\u00a0${q}\u00a0».`,
  change: "Changer",
  codeTitle: (name) => `Salut ${firstName(name)}! Ton code à 4 chiffres`,
  codeLabel: "Code à 4 chiffres",
  codeHint: "Première visite? Choisis 4 chiffres (pas ton NIP bancaire) et retiens-les. De retour? Entre le même code pour retrouver tes nominations.",
  start: "Commencer à voter",

  hello: (name) => `Salut ${firstName(name)}!`,
  notYou: "Ce n'est pas toi?",
  intro: "Choisis un collègue, invente une catégorie de prix, explique pourquoi. Tu peux voter plus d'une fois pour la même personne.",
  progress: (n, total) => `Tu as mis en nomination ${n} collègue${n > 1 ? "s" : ""} sur ${total}`,
  searchColleagues: "Rechercher des collègues…",
  clearSearch: "Effacer la recherche",
  nominate: (name) => `Mettre ${name} en nomination`,
  awardsGiven: (n) => `${n} prix`,
  nominateShort: "Voter",

  dialogEyebrow: "Un prix pour",
  awardName: "Nom du prix",
  awardExamples: [
    "Le prix Boîte de réception zéro",
    "Le prix Sauveur de présentation de dernière minute",
    "Le prix Chuchoteur d'Excel",
    "Le prix Diplomate de la machine à café",
  ],
  reason: "Pourquoi cette personne le mérite",
  reasonPlaceholder: "Parce que…",
  enterHint: "Entrée pour envoyer · Maj+Entrée pour changer de ligne",
  submit: "Décerner le prix",
  submitting: "Enregistrement…",
  cancel: "Annuler",
  close: "Fermer",
  alreadyGiven: "Déjà décernés",
  charsLeft: (n) => `${n} restants`,

  saved: (name) => `Nomination enregistrée pour ${firstName(name)}!`,
  milestone25: "Le quart de l'équipe, c'est fait. Continue!",
  milestone50: "À mi-chemin! Le tapis rouge se déroule.",
  milestone100: "Tout le monde est en nomination. Tu es une légende des Raimondis!",

  mineTitle: (n) => `Tes nominations (${n})`,
  mineHint: "Visibles seulement par toi et par l'organisateur.",
  mineEmpty: "Rien pour l'instant. Choisis un collègue ci-dessus pour commencer.",
  forName: (name) => `pour ${name}`,
  delete: "Supprimer",
  confirmDelete: "Confirmer?",

  errors: {
    noSession: "Ta session a expiré. Recharge la page et reconnecte-toi.",
    pickName: "Choisis d'abord ton nom.",
    codeFormat: "Ton code doit contenir exactement 4 chiffres.",
    wrongCode: "Ce n'est pas le code enregistré pour ce nom. Oublié? Demande à l'organisateur de le réinitialiser.",
    tooManyAttempts: "Trop de tentatives pour ce nom. Réessaie dans une heure ou contacte l'organisateur.",
    badNominee: "Cette personne n'est pas dans la liste.",
    selfNomination: "Bien essayé, mais tu ne peux pas te mettre toi-même en nomination.",
    awardRequired: "Donne un nom au prix.",
    awardTooLong: `Le nom du prix doit faire ${AWARD_MAX} caractères ou moins.`,
    reasonRequired: "Dis-nous pourquoi cette personne le mérite.",
    reasonTooLong: `La raison doit faire ${REASON_MAX} caractères ou moins.`,
    rateLimited: "Wow, ça fait beaucoup de prix! Prends une pause et réessaie dans un moment.",
    deleteFailed: "Impossible de supprimer celle-ci. Réessaie.",
    generic: "Une erreur est survenue. Réessaie.",
  },

  admin: "Administration",
  adminPassword: "Mot de passe administrateur",
  badAdminPassword: "Mot de passe incorrect.",
  signIn: "Se connecter",
  signOut: "Se déconnecter",
  results: "Résultats",
  stats: (n, nominees, voters) =>
    `${n} nominations · ${nominees} personnes en nomination · ${voters} votants`,
  nominee: "Personne en nomination",
  voter: "Votant",
  all: "Tous",
  searchText: "Rechercher dans les prix et les raisons",
  exportCsv: "Exporter en CSV",
  refresh: "Actualiser",
  colAward: "Prix",
  colReason: "Raison",
  colVoter: "Votant",
  colTime: "Soumis le",
  noResults: "Aucune nomination ne correspond à ces filtres.",
  noNominations: "Aucune nomination pour l'instant.",
  notNominated: (n) => `Pas encore en nomination (${n})`,
  clearFilters: "Effacer les filtres",
  codes: (n, total) => `${n} personnes sur ${total} ont créé leur code`,
  resetCodeHint: "Quelqu'un a oublié son code? Réinitialise-le et la personne pourra en choisir un nouveau. Ses nominations sont conservées.",
  resetCode: "Réinitialiser le code",
  resetDone: (name) => `Code réinitialisé pour ${name}.`,
  csvHeaders: ["Personne en nomination", "Nom du prix", "Raison", "Votant", "Horodatage"],
};

export const dict = { en, fr };
export type Dict = typeof en;
export type ErrorCode = keyof Dict["errors"];

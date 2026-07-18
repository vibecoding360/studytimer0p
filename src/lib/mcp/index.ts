import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCourses from "./tools/list-courses";
import listSyllabusEvents from "./tools/list-syllabus-events";
import createSyllabusEvent from "./tools/create-syllabus-event";
import listStudySessions from "./tools/list-study-sessions";
import logStudySession from "./tools/log-study-session";
import get365Stats from "./tools/get-365-stats";
import completeToday from "./tools/complete-today";
import getDailyNote from "./tools/get-daily-note";
import setDailyNote from "./tools/set-daily-note";
import listPublishedCourses from "./tools/list-published-courses";

// Kept import-safe: no throwing / env reads at module top-level.
// The issuer MUST be the direct supabase.co host derived from the project ref.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "matrixmindset-mcp",
  title: "MatrixMindset",
  version: "0.1.0",
  instructions:
    "Tools for the MatrixMindset study platform. Read and update the signed-in user's mastery tracks (courses), syllabus/calendar events, focus sessions, daily notes, and the 365-day consistency challenge. Also browse the public course catalog.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCourses,
    listSyllabusEvents,
    createSyllabusEvent,
    listStudySessions,
    logStudySession,
    get365Stats,
    completeToday,
    getDailyNote,
    setDailyNote,
    listPublishedCourses,
  ],
});

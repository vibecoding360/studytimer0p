export interface UpcomingEvent {
  id: string;
  title: string;
  date: string | null;
  is_high_stakes: boolean | null;
  course_id: string;
}

export interface GradeCategory {
  id: string;
  category: string;
  current_score: number | null;
  weight: number;
  course_id: string;
}

export interface RoadmapEntry {
  id: string;
  course_id: string;
  week_number: number;
  tasks: unknown;
  focus_area: string;
}

export interface StudySessionLite {
  id: string;
  completed_at: string;
  duration_minutes: number;
  mode: string;
  commit_message: string | null;
  syllabus_item_id: string | null;
}

export interface CourseLite {
  id: string;
  name: string;
}

export interface PlanItem {
  id: string;
  title: string;
  detail: string;
  priority: number;
  type: "event" | "grade" | "roadmap";
}

export interface ReviewItem {
  id: string;
  title: string;
  source: "session" | "syllabus";
  dueAt: string;
  stageLabel: string;
  isDueNow: boolean;
}

const DAY_MS = 1000 * 60 * 60 * 24;
const reviewIntervals = [1, 3, 7, 14] as const;

const toDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysUntil = (value?: string | null) => {
  const d = toDate(value);
  if (!d) return Number.POSITIVE_INFINITY;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / DAY_MS);
};

const extractTasks = (tasks: unknown): string[] => {
  if (Array.isArray(tasks)) {
    return tasks
      .map((task) => {
        if (typeof task === "string") return task;
        if (typeof task === "object" && task && "task" in task) return String((task as { task: unknown }).task);
        if (typeof task === "object" && task && "title" in task) return String((task as { title: unknown }).title);
        return "";
      })
      .filter(Boolean);
  }
  return [];
};

export function generateTodayPlan(params: {
  events: UpcomingEvent[];
  categories: GradeCategory[];
  roadmap: RoadmapEntry[];
  courses: CourseLite[];
}): PlanItem[] {
  const { events, categories, roadmap, courses } = params;
  const courseName = new Map(courses.map((c) => [c.id, c.name]));

  const eventItems = events
    .filter((event) => Boolean(event.is_high_stakes) && daysUntil(event.date) >= 0 && daysUntil(event.date) <= 14)
    .map((event) => {
      const d = daysUntil(event.date);
      return {
        id: `event-${event.id}`,
        title: `Prep: ${event.title}`,
        detail: `${courseName.get(event.course_id) ?? "Course"} • due in ${d} day${d === 1 ? "" : "s"}`,
        priority: 100 - d,
        type: "event" as const,
      };
    });

  const weakCategoryItems = categories
    .filter((c) => c.current_score !== null && c.current_score < 78)
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 4)
    .map((category) => ({
      id: `grade-${category.id}`,
      title: `Recover ${category.category}`,
      detail: `${courseName.get(category.course_id) ?? "Course"} • ${category.current_score}% (${category.weight}% of grade)`,
      priority: (category.weight || 0) * 2,
      type: "grade" as const,
    }));

  const roadmapItems = roadmap
    .sort((a, b) => a.week_number - b.week_number)
    .flatMap((entry) => {
      const tasks = extractTasks(entry.tasks).slice(0, 2);
      return tasks.map((task, idx) => ({
        id: `roadmap-${entry.id}-${idx}`,
        title: task,
        detail: `${courseName.get(entry.course_id) ?? "Course"} • Week ${entry.week_number}: ${entry.focus_area}`,
        priority: 25,
        type: "roadmap" as const,
      }));
    })
    .slice(0, 6);

  return [...eventItems, ...weakCategoryItems, ...roadmapItems]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);
}

export function generateReviewQueue(params: {
  sessions: StudySessionLite[];
  pastSyllabusEvents: UpcomingEvent[];
  courses: CourseLite[];
}): ReviewItem[] {
  const { sessions, pastSyllabusEvents, courses } = params;
  const courseName = new Map(courses.map((c) => [c.id, c.name]));
  const now = Date.now();

  const fromTimestamp = (id: string, title: string, source: "session" | "syllabus", completedAt: string) => {
    const completedTs = new Date(completedAt).getTime();
    if (Number.isNaN(completedTs)) return null;
    const elapsedDays = (now - completedTs) / DAY_MS;
    const dueInterval = reviewIntervals.find((interval) => elapsedDays < interval + 1);
    if (!dueInterval) return null;
    const dueAt = new Date(completedTs + dueInterval * DAY_MS);
    return {
      id,
      title,
      source,
      dueAt: dueAt.toISOString(),
      stageLabel: `${dueInterval}d review`,
      isDueNow: elapsedDays >= dueInterval && elapsedDays <= dueInterval + 1,
    } satisfies ReviewItem;
  };

  const sessionReviews = sessions
    .slice(0, 20)
    .map((s) =>
      fromTimestamp(
        `session-${s.id}`,
        s.commit_message?.trim() || `${s.mode} focus block (${s.duration_minutes}m)`,
        "session",
        s.completed_at,
      ),
    )
    .filter((item): item is ReviewItem => Boolean(item));

  const syllabusReviews = pastSyllabusEvents
    .filter((event) => event.date && daysUntil(event.date) < 0)
    .slice(0, 20)
    .map((event) =>
      fromTimestamp(
        `syllabus-${event.id}`,
        `${event.title} (${courseName.get(event.course_id) ?? "Course"})`,
        "syllabus",
        event.date!,
      ),
    )
    .filter((item): item is ReviewItem => Boolean(item));

  return [...sessionReviews, ...syllabusReviews]
    .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
    .slice(0, 10);
}

export function buildGoalEngine(sessions: StudySessionLite[]) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() + mondayOffset);

  const weekSessions = sessions.filter((s) => new Date(s.completed_at) >= startOfWeek);
  const focusCount = weekSessions.length;
  const deepWorkHours = weekSessions
    .filter((s) => s.mode === "deep-work")
    .reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
  const roadmapProofs = weekSessions.filter((s) => (s.commit_message || "").trim().length > 12).length;

  const sessionsByDay = new Set(sessions.map((s) => new Date(s.completed_at).toDateString()));
  let streakDays = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (sessionsByDay.has(cursor.toDateString())) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const hadYesterday = sessionsByDay.has(yesterday.toDateString());
  const recentActiveDays = new Set(
    sessions
      .filter((s) => now.getTime() - new Date(s.completed_at).getTime() <= 5 * DAY_MS)
      .map((s) => new Date(s.completed_at).toDateString()),
  ).size;

  return {
    goals: [
      { label: "Focus sessions", current: focusCount, target: 8 },
      { label: "Deep work hours", current: Number(deepWorkHours.toFixed(1)), target: 6 },
      { label: "Roadmap tasks (commit evidence)", current: roadmapProofs, target: 3 },
    ],
    streakDays,
    recoveryAvailable: !hadYesterday && recentActiveDays >= 3,
  };
}

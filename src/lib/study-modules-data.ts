// ─── Shared Study Module Data ────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  subtitle: string;
}

export interface StudyModule {
  id: string;
  topicName: string;
  tasks: Task[];
  isLocked: boolean;
}

export const studyModulesData: StudyModule[] = [
  {
    id: "mod-1",
    topicName: "Relations & Functions",
    isLocked: false,
    tasks: [
      { id: "rf-1", title: "Types of Relations", subtitle: "Reflexive, Symmetric, Transitive" },
      { id: "rf-2", title: "One-One and Onto Functions", subtitle: "Injective, Surjective, Bijective" },
      { id: "rf-3", title: "Composition of Functions", subtitle: "fog, gof and Inverse functions" },
    ],
  },
  {
    id: "mod-2",
    topicName: "Matrices & Determinants",
    isLocked: false,
    tasks: [
      { id: "md-1", title: "Matrix Operations", subtitle: "Addition, Scalar Multiplication, Transpose" },
      { id: "md-2", title: "Determinant Properties", subtitle: "Expansion, Minors, Cofactors" },
      { id: "md-3", title: "Inverse of a Matrix", subtitle: "Adjoint method and Row reduction" },
      { id: "md-4", title: "System of Linear Equations", subtitle: "Cramer's Rule and Matrix method" },
    ],
  },
  {
    id: "mod-3",
    topicName: "Differentiation",
    isLocked: false,
    tasks: [
      { id: "df-1", title: "Limits & Continuity", subtitle: "L'Hôpital's rule and standard limits" },
      { id: "df-2", title: "First Principles", subtitle: "Definition and basic derivatives" },
      { id: "df-3", title: "Chain Rule & Product Rule", subtitle: "Composite and product functions" },
      { id: "df-4", title: "Implicit Differentiation", subtitle: "Implicit relations and parametric forms" },
      { id: "df-5", title: "Applications of Derivatives", subtitle: "Maxima, Minima, Rate of change" },
    ],
  },
  {
    id: "mod-4",
    topicName: "Integration",
    isLocked: true,
    tasks: [
      { id: "ig-1", title: "Indefinite Integrals", subtitle: "Basic formulas and substitution" },
      { id: "ig-2", title: "Integration by Parts", subtitle: "LIATE rule and applications" },
      { id: "ig-3", title: "Definite Integrals", subtitle: "Properties and evaluation" },
    ],
  },
];

// Map task IDs to their module for quick lookup
export const taskToModuleMap = new Map<string, StudyModule>();
studyModulesData.forEach((mod) => {
  mod.tasks.forEach((task) => {
    taskToModuleMap.set(task.id, mod);
  });
});

// Get all unlocked task IDs
export const allUnlockedTaskIds = studyModulesData
  .filter((m) => !m.isLocked)
  .flatMap((m) => m.tasks.map((t) => t.id));

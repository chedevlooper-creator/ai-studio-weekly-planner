/**
 * @process perf-ux-techdebt-overhaul
 * @description Performance optimization (code splitting, lazy loading, bundle opt),
 *              UI/UX improvements (dark/light theme, micro-interactions),
 *              and technical debt cleanup (TypeScript strict, error boundaries, memoization)
 * @inputs { projectRoot: string, targetScore: number, maxFixLoops: number }
 * @outputs { success: boolean, phases: object[], buildOk: boolean, finalScore: number }
 * @skill worker
 * @agent general-purpose
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectRoot = 'C:/Users/isaha/Downloads/zip',
    targetScore = 85,
    maxFixLoops = 2,
  } = inputs;

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 1: Audit & Plan
  // ══════════════════════════════════════════════════════════════════════
  const audit = await ctx.task(auditTask, { projectRoot });

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 2: Performance — Code Splitting & Lazy Loading
  // ══════════════════════════════════════════════════════════════════════
  const perf = await ctx.task(performanceTask, { projectRoot, audit });

  // Build check after performance work
  const buildCheck1 = await ctx.task(buildVerifyTask, { projectRoot, phase: 'post-performance' });

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 3: Technical Debt — TS strict, Error Boundaries, Memoization
  // ══════════════════════════════════════════════════════════════════════
  const techdebt = await ctx.task(techDebtTask, { projectRoot, audit });

  // Build check after tech debt
  const buildCheck2 = await ctx.task(buildVerifyTask, { projectRoot, phase: 'post-techdebt' });

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 4: UI/UX — Theme System & Polish
  // ══════════════════════════════════════════════════════════════════════
  const ux = await ctx.task(uxImprovementsTask, { projectRoot, audit });

  // Build check after UX
  const buildCheck3 = await ctx.task(buildVerifyTask, { projectRoot, phase: 'post-ux' });

  // ══════════════════════════════════════════════════════════════════════
  // PHASE 5: Integration & Quality Review
  // ══════════════════════════════════════════════════════════════════════
  const review = await ctx.task(qualityReviewTask, {
    projectRoot,
    targetScore,
    perf,
    techdebt,
    ux,
  });

  // Fix loop if score below target
  let finalReview = review;
  for (let i = 0; i < maxFixLoops && finalReview.score < targetScore; i++) {
    const fixes = await ctx.task(fixIssuesTask, {
      projectRoot,
      issues: finalReview.fixPlan,
      iteration: i + 1,
    });

    await ctx.task(buildVerifyTask, { projectRoot, phase: `fix-loop-${i + 1}` });

    finalReview = await ctx.task(qualityReviewTask, {
      projectRoot,
      targetScore,
      perf,
      techdebt,
      ux,
      previousReview: finalReview,
    });
  }

  // Final build
  const finalBuild = await ctx.task(buildVerifyTask, { projectRoot, phase: 'final' });

  return {
    success: finalReview.score >= targetScore && finalBuild.success,
    phases: {
      audit: audit.summary,
      performance: perf.summary,
      techDebt: techdebt.summary,
      ux: ux.summary,
    },
    buildOk: finalBuild.success,
    finalScore: finalReview.score,
    review: {
      score: finalReview.score,
      strengths: finalReview.strengths,
      issues: finalReview.issues,
    },
  };
}

// ════════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ════════════════════════════════════════════════════════════════════════

export const auditTask = defineTask('audit-codebase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit codebase for performance, tech debt, and UX gaps',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior full-stack engineer and code auditor',
      task: `Audit the React+Vite project at ${args.projectRoot} across three dimensions: performance, technical debt, and UI/UX.`,
      context: { projectRoot: args.projectRoot },
      instructions: [
        'Read vite.config.ts, tsconfig.json, package.json, src/App.tsx, src/main.tsx',
        'Scan src/components/ and src/hooks/ for patterns',
        'PERFORMANCE: Check bundle size (npm run build), identify code-splitting opportunities, lazy loading candidates, heavy dependencies (lucide-react is 40MB in node_modules), missing React.memo/useMemo/useCallback',
        'TECH DEBT: Check TypeScript strictness (no strict:true, no noUncheckedIndexedAccess, no strictNullChecks), missing error boundaries, any type usage, missing return types',
        'UI/UX: Check if there is a theme system (dark/light), check animation consistency, check for missing loading states, skeleton screens usage',
        'Produce a prioritized action plan for each dimension',
        'Return JSON with: { summary: string, performance: { bundleSize: string, issues: string[], plan: string[] }, techDebt: { issues: string[], plan: string[] }, ux: { issues: string[], plan: string[] } }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'performance', 'techDebt', 'ux'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const performanceTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement performance optimizations: code splitting, lazy loading, bundle optimization',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'React performance engineer',
      task: `Implement performance optimizations for the project at ${args.projectRoot}. Current bundle is 513KB JS (gzip 150KB) in a single chunk.`,
      context: { projectRoot: args.projectRoot, audit: args.audit },
      instructions: [
        '1. CODE SPLITTING with React.lazy + Suspense:',
        '   - Lazy load AIAssistant (heavy, not always visible)',
        '   - Lazy load TeamPanel and RemindersPanel (sidebar panels)',
        '   - Lazy load TaskEditModal (only shown on interaction)',
        '   - Lazy load FilePreviewModal',
        '   - Lazy load AuthGate login/signup forms',
        '   - Add Suspense boundaries with Skeleton fallbacks from ui/Skeleton',
        '2. VITE CONFIG - Add manual chunks in vite.config.ts:',
        '   - Separate vendor chunk for react/react-dom',
        '   - Separate chunk for @dnd-kit',
        '   - Separate chunk for lucide-react icons',
        '   - Separate chunk for @insforge/sdk',
        '3. OPTIMIZE IMPORTS:',
        '   - Check if lucide-react icons are tree-shakeable (they should be with named imports)',
        '   - Ensure no barrel file re-exports pulling in unused code',
        '4. REACT MEMOIZATION:',
        '   - Add React.memo to TaskRow (rendered many times in lists)',
        '   - Add React.memo to DaySection',
        '   - Add React.memo to StatsCards, StatsPills',
        '   - Add useMemo for filtered/sorted data in App.tsx',
        '   - Add useCallback for event handlers passed as props',
        '5. Make sure all imports are correct and build passes',
        'Return JSON: { summary: string, changes: string[], bundleBefore: string, bundleAfter: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'changes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const techDebtTask = defineTask('tech-debt-cleanup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix technical debt: TypeScript strict mode, error boundaries, code quality',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TypeScript engineer focused on code quality',
      task: `Fix technical debt in the project at ${args.projectRoot}`,
      context: { projectRoot: args.projectRoot, audit: args.audit },
      instructions: [
        '1. TYPESCRIPT STRICT MODE:',
        '   - Add "strict": true to tsconfig.json compilerOptions',
        '   - Add "noUncheckedIndexedAccess": true',
        '   - Fix all resulting TypeScript errors across the codebase',
        '   - Add proper return types to exported functions',
        '   - Replace any `any` types with proper types where feasible',
        '2. ERROR BOUNDARIES:',
        '   - Create src/components/ui/ErrorBoundary.tsx - a reusable error boundary component',
        '   - It should show a friendly error UI with a "Try Again" button',
        '   - Style it consistently with the existing design system (dark theme, rounded-xl, etc.)',
        '   - Wrap main App content sections with ErrorBoundary',
        '   - Wrap each lazy-loaded component Suspense with ErrorBoundary',
        '3. CODE QUALITY:',
        '   - Add explicit return types to hook functions',
        '   - Ensure useCallback/useMemo dependencies are correct',
        '   - Fix any eslint-detectable issues',
        '4. Make sure the build passes after all changes',
        'Return JSON: { summary: string, changes: string[], strictErrors: number, errorsFixed: number }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'changes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const uxImprovementsTask = defineTask('ux-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'UI/UX improvements: theme system, micro-interactions, loading states',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI/UX engineer and designer',
      task: `Implement UI/UX improvements for the project at ${args.projectRoot}`,
      context: { projectRoot: args.projectRoot, audit: args.audit },
      instructions: [
        '1. DARK/LIGHT THEME SYSTEM:',
        '   - Create src/hooks/useTheme.ts with a ThemeProvider context',
        '   - Support "dark", "light", and "system" modes',
        '   - Persist preference in localStorage',
        '   - Use Tailwind dark: variant - add "darkMode: class" to tailwind config if needed',
        '   - Add CSS variables for theme colors in index.css for both :root and .dark',
        '   - Update key components to use dark: variants where needed',
        '   - Add a theme toggle button in the header (sun/moon icon from lucide-react)',
        '   - IMPORTANT: The app currently is dark-themed. Make dark the default. Light theme should have proper light colors.',
        '2. MICRO-INTERACTIONS:',
        '   - Add subtle hover scale on task cards (scale-[1.01])',
        '   - Add press/active state feedback on buttons (scale-[0.98])',
        '   - Add smooth expand/collapse animation for day sections',
        '   - Add count badge animation when task count changes',
        '3. LOADING & EMPTY STATES:',
        '   - Ensure Skeleton components are used as Suspense fallbacks',
        '   - Add empty state illustrations for no-tasks, no-search-results',
        '   - Add loading spinner for async operations (file upload, AI chat)',
        '4. Keep the build passing after all changes',
        'Return JSON: { summary: string, changes: string[], themeModes: string[] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'changes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const buildVerifyTask = defineTask('build-verify', (args, taskCtx) => ({
  kind: 'shell',
  title: `Build verification: ${args.phase}`,
  command: `cd "${args.projectRoot}" && npm run build 2>&1; echo "BUILD_EXIT:$?"`,
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const qualityReviewTask = defineTask('quality-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality review and scoring',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior code reviewer and quality assessor',
      task: `Review the current state of the project at ${args.projectRoot} and score it out of 100.`,
      context: {
        projectRoot: args.projectRoot,
        targetScore: args.targetScore,
        previousReview: args.previousReview || null,
      },
      instructions: [
        'Read the key files to assess the current state:',
        '- vite.config.ts (manual chunks, build config)',
        '- tsconfig.json (strict mode settings)',
        '- src/App.tsx (lazy loading, error boundaries, Suspense)',
        '- src/components/ui/ (ErrorBoundary, theme support)',
        '- src/hooks/ (useTheme, memoization patterns)',
        '- src/components/planner/TaskRow.tsx (React.memo)',
        '- src/components/header/ (theme toggle)',
        '- Run "npm run build" and check output for chunk sizes',
        'SCORING CRITERIA (100 points total):',
        '- Performance (30pts): Code splitting implemented, lazy loading, manual chunks, React.memo on list items, bundle under 500KB per chunk',
        '- Technical Debt (35pts): TypeScript strict:true enabled and compiling, error boundaries present, proper types, no any types',
        '- UI/UX (25pts): Theme system with dark/light toggle, micro-interactions, loading states, Suspense fallbacks',
        '- Build Health (10pts): Clean build with no errors, no warnings except chunk size',
        'If score < target, provide a fixPlan array of specific issues to address',
        'Return JSON: { score: number, strengths: string[], issues: string[], fixPlan: string[], ok: boolean }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'strengths', 'issues', 'fixPlan', 'ok'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const fixIssuesTask = defineTask('fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix issues from quality review (iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Full-stack developer fixing quality issues',
      task: `Fix the following issues in the project at ${args.projectRoot}`,
      context: {
        projectRoot: args.projectRoot,
        issues: args.issues,
        iteration: args.iteration,
      },
      instructions: [
        'Fix each issue in the fixPlan:',
        ...args.issues.map((issue, i) => `${i + 1}. ${issue}`),
        'Make sure the build passes after fixes',
        'Return JSON: { fixed: string[], remaining: string[] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

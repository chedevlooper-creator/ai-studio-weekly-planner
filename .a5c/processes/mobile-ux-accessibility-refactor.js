/**
 * @process mobile-ux-accessibility-refactor
 * @description Refactor the existing React planner app for stronger mobile UX and accessibility without changing core product behavior.
 * @skill css-precision-editor specializations/ux-ui-design/skills/css-precision-editor/SKILL.md
 * @skill axe-accessibility specializations/ux-ui-design/skills/axe-accessibility/SKILL.md
 * @skill keyboard-navigation specializations/web-development/skills/keyboard-navigation/SKILL.md
 * @skill aria specializations/web-development/skills/aria/SKILL.md
 * @agent responsive-verifier specializations/ux-ui-design/agents/responsive-verifier/AGENT.md
 * @agent wcag-accessibility-auditor specializations/ux-ui-design/agents/wcag-accessibility-auditor/AGENT.md
 * @agent touch-target-optimizer specializations/ux-ui-design/agents/touch-target-optimizer/AGENT.md
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @inputs { projectRoot?: string, targetScore?: number, maxFixLoops?: number }
 * @outputs { success: boolean, targetScore: number, finalScore: number, buildOk: boolean, loops: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs = {}, ctx) {
  const {
    projectRoot = '.',
    targetScore = 88,
    maxFixLoops = 2,
  } = inputs ?? {};

  const audit = await ctx.task(auditAndPlanTask, {
    projectRoot,
    focus: [
      'small-screen layout robustness',
      'touch target sizing and spacing',
      'safe-area and sticky mobile actions',
      'form usability on mobile',
      'keyboard navigation and focus visibility',
      'dialog semantics and focus management',
      'landmarks, labels, and aria usage',
      'reduced motion and readable interaction feedback',
    ],
  });

  const mobileRefactor = await ctx.task(implementMobileUxTask, {
    projectRoot,
    audit,
  });

  const accessibilityRefactor = await ctx.task(implementAccessibilityTask, {
    projectRoot,
    audit,
    mobileRefactor,
  });

  let build = await ctx.task(verifyBuildTask, {
    projectRoot,
    phase: 'post-refactor',
  });

  let review = await ctx.task(reviewQualityTask, {
    projectRoot,
    audit,
    mobileRefactor,
    accessibilityRefactor,
    build,
    targetScore,
    iteration: 0,
  });

  let loops = 0;
  while (loops < maxFixLoops && (!build.success || !review.ok || review.score < targetScore)) {
    loops += 1;

    await ctx.task(remediateIssuesTask, {
      projectRoot,
      audit,
      build,
      review,
      iteration: loops,
      targetScore,
    });

    build = await ctx.task(verifyBuildTask, {
      projectRoot,
      phase: `remediation-${loops}`,
    });

    review = await ctx.task(reviewQualityTask, {
      projectRoot,
      audit,
      build,
      targetScore,
      iteration: loops,
    });
  }

  return {
    success: Boolean(build.success) && Boolean(review.ok) && Number(review.score ?? 0) >= targetScore,
    targetScore,
    finalScore: Number(review.score ?? 0),
    buildOk: Boolean(build.success),
    loops,
    auditSummary: audit.summary,
    build,
    review,
    metadata: {
      processId: 'mobile-ux-accessibility-refactor',
      timestamp: ctx.now(),
    },
  };
}

export const auditAndPlanTask = defineTask('audit-and-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit the app and create a prioritized mobile UX + accessibility refactor plan',
  agent: {
    name: 'planner',
    prompt: {
      role: 'Senior frontend architect focused on mobile UX and accessibility',
      task: 'Audit the existing React planner app and produce a concrete implementation plan for mobile UX and accessibility refactoring',
      context: {
        projectRoot: args.projectRoot,
        focus: args.focus,
        mustReview: [
          'package.json',
          'src/App.tsx',
          'src/index.css',
          'src/components/header/AppHeader.tsx',
          'src/components/header/MobileHeader.tsx',
          'src/components/header/DesktopHeader.tsx',
          'src/components/planner/FilterBar.tsx',
          'src/components/planner/TaskRow.tsx',
          'src/components/planner/TaskEditModal.tsx',
          'src/components/planner/MobileBottomNav.tsx',
          'src/components/planner/FloatingActionButton.tsx',
          'src/components/planner/DaySection.tsx',
          'src/components/planner/AIAssistant.tsx',
          'src/components/ui/Modal.tsx',
          'src/components/ui/Button.tsx',
          'src/components/ui/Input.tsx',
          'src/components/ui/Toast.tsx',
        ],
      },
      instructions: [
        'Read the listed files thoroughly before making recommendations.',
        'Identify the highest-impact mobile UX issues in the current app.',
        'Identify accessibility gaps affecting keyboard users, screen reader users, low-vision users, and reduced-motion users.',
        'Stay within the existing app architecture and preserve current features.',
        'Prefer targeted refactors over broad rewrites.',
        'Produce a prioritized plan with concrete files to modify and expected outcomes.',
        'Include a short acceptance checklist for the implementation and final review.',
      ],
      outputFormat: 'JSON with summary, priorities, filesToChange, acceptanceChecklist',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'priorities', 'filesToChange', 'acceptanceChecklist'],
      properties: {
        summary: { type: 'string' },
        priorities: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'reason', 'files'],
            properties: {
              title: { type: 'string' },
              reason: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        filesToChange: { type: 'array', items: { type: 'string' } },
        acceptanceChecklist: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementMobileUxTask = defineTask('implement-mobile-ux', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement mobile UX improvements across the app',
  agent: {
    name: 'worker',
    prompt: {
      role: 'Senior React engineer specializing in polished mobile web UX',
      task: 'Implement the prioritized mobile UX refactor in the existing planner app',
      context: {
        projectRoot: args.projectRoot,
        audit: args.audit,
      },
      instructions: [
        'Read the audit output and the relevant source files completely before editing.',
        'Improve the small-screen experience of the existing app without removing features.',
        'Focus on layout compression, safe-area handling, touch target sizing, clearer action affordances, and reducing cramped interactions.',
        'Keep the visual style consistent with the current dark glassmorphism theme.',
        'Prefer improving existing components such as header, filter bar, task rows, bottom navigation, FAB, and modal presentation instead of inventing new complex systems.',
        'Make sure mobile-specific changes still work well on tablet and desktop.',
        'Run the project verification commands yourself before returning if feasible.',
        'Return only what was actually changed.',
      ],
      outputFormat: 'JSON with filesModified, notableChanges, mobileOutcomes',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'notableChanges', 'mobileOutcomes'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        notableChanges: { type: 'array', items: { type: 'string' } },
        mobileOutcomes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementAccessibilityTask = defineTask('implement-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement accessibility improvements across the app',
  agent: {
    name: 'worker',
    prompt: {
      role: 'Accessibility-focused React engineer',
      task: 'Implement accessibility improvements for the existing planner app after the mobile UX refactor',
      context: {
        projectRoot: args.projectRoot,
        audit: args.audit,
        mobileRefactor: args.mobileRefactor,
      },
      instructions: [
        'Read the audit output and inspect the currently modified files before editing further.',
        'Improve semantics, focus behavior, keyboard navigation, form labeling, aria usage, dialog behavior, and reduced-motion handling where needed.',
        'Pay special attention to App.tsx landmarks, modal/dialog behavior, task actions, file inputs, nav controls, and status/action buttons.',
        'Preserve the existing Turkish UI copy unless a label needs to be clarified for accessibility.',
        'Prefer native semantics first, then ARIA only where necessary.',
        'Ensure focus-visible styles remain obvious on dark surfaces.',
        'Run verification commands yourself before returning if feasible.',
        'Return only completed changes that actually exist in the codebase.',
      ],
      outputFormat: 'JSON with filesModified, accessibilityFixes, remainingRisks',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'accessibilityFixes', 'remainingRisks'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        accessibilityFixes: { type: 'array', items: { type: 'string' } },
        remainingRisks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyBuildTask = defineTask('verify-build', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify build and type safety (${args.phase})`,
  command: `cd \"${args.projectRoot}\" && npm run lint && npm run build`,
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewQualityTask = defineTask('review-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review mobile UX and accessibility quality',
  agent: {
    name: 'reviewer',
    prompt: {
      role: 'Code reviewer focused on mobile UX and accessibility quality',
      task: 'Review the current state of the refactor and determine whether it meets the target quality threshold',
      context: {
        projectRoot: args.projectRoot,
        audit: args.audit,
        build: args.build,
        targetScore: args.targetScore,
        iteration: args.iteration,
      },
      instructions: [
        'Inspect the codebase as it exists now, not just the prior summaries.',
        'Check whether the audit priorities were addressed in a focused and non-breaking way.',
        'Review mobile ergonomics, touch target sizing, responsive layout behavior, form usability, focus visibility, landmark structure, control labeling, dialog accessibility, and reduced-motion support.',
        'Use the latest build result in your assessment.',
        'Return ok=false if build failed or if there are meaningful remaining issues.',
        'List the smallest concrete fixes needed for the next remediation pass.',
      ],
      outputFormat: 'JSON with ok, score, strengths, issues, fixPlan',
    },
    outputSchema: {
      type: 'object',
      required: ['ok', 'score', 'strengths', 'issues', 'fixPlan'],
      properties: {
        ok: { type: 'boolean' },
        score: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        fixPlan: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const remediateIssuesTask = defineTask('remediate-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediate remaining issues (pass ${args.iteration})`,
  agent: {
    name: 'worker',
    prompt: {
      role: 'Senior React engineer fixing targeted review findings',
      task: 'Apply a focused remediation pass for remaining mobile UX and accessibility issues',
      context: {
        projectRoot: args.projectRoot,
        audit: args.audit,
        build: args.build,
        review: args.review,
        targetScore: args.targetScore,
        iteration: args.iteration,
      },
      instructions: [
        'Read the current reviewer findings carefully and fix only the concrete remaining issues.',
        'Preserve prior improvements and avoid broad rewrites.',
        'If build failed, fix the build first, then address reviewer issues.',
        'Run verification commands yourself before returning if feasible.',
        'Return a concise list of actual edits applied.',
      ],
      outputFormat: 'JSON with filesModified, fixesApplied, unresolved',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'fixesApplied', 'unresolved'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesApplied: { type: 'array', items: { type: 'string' } },
        unresolved: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

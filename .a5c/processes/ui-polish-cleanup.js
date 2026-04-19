/**
 * @process ui-polish-cleanup
 * @description Clean up dead code, integrate UI primitives into remaining components,
 *              fix last window.alert, and final polish pass
 * @inputs { targetQuality: number }
 * @outputs { success: boolean, cleaned: string[], integrated: string[] }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const targetQuality = inputs?.targetQuality ?? 90;

  // Phase 1: Dead code cleanup
  const cleanup = await ctx.task(cleanupDeadCodeTask, {});

  // Phase 2: Fix remaining window.alert
  const alertFix = await ctx.task(fixRemainingAlertsTask, {});

  // Phase 3: Integrate Modal primitive into TaskEditModal
  const modalIntegration = await ctx.task(integrateModalTask, {});

  // Phase 4: Verify build
  const verify1 = await ctx.task(verifyBuildTask, { phase: 'integration' });

  // Phase 5: Visual polish pass
  const polish = await ctx.task(visualPolishTask, {});

  // Phase 6: Final build verify
  const finalVerify = await ctx.task(verifyBuildTask, { phase: 'final' });

  return {
    success: finalVerify.success,
    cleaned: cleanup.removed,
    integrated: modalIntegration.changes,
  };
}

export const cleanupDeadCodeTask = defineTask('cleanup-dead-code', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remove dead/unused files and imports',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code cleanup engineer',
      task: 'Remove unused files and dead imports from the Kafkasder project',
      instructions: [
        'Delete: src/components/header/PerformanceSection.tsx (not imported anywhere)',
        'Delete: src/components/planner/BottomPanels.tsx (not imported anywhere)',
        'Delete: src/components/planner/KeyboardShortcutsOverlay.tsx (not imported anywhere)',
        'Delete: src/hooks/useFocusTrap.ts (not imported anywhere)',
        'Delete: src/hooks/useSwipe.ts (not imported anywhere)',
        'Remove StatsCards PlanStats type from DesktopHeader/MobileHeader if not used',
        'Clean up any unused imports in all modified files',
        'Verify build passes after cleanup',
      ],
      outputFormat: 'JSON { removed: string[], cleaned: string[] }',
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const fixRemainingAlertsTask = defineTask('fix-remaining-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Replace last window.alert with toast',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Developer',
      task: 'Fix the last window.alert in useWeeklyPlan.ts',
      instructions: ['Replace window.alert(r.error) in importFromFile with a toast notification'],
      outputFormat: 'JSON { fixed: string[] }',
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const integrateModalTask = defineTask('integrate-modal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Modal primitive into TaskEditModal',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'React developer',
      task: 'Refactor TaskEditModal to use the Modal UI primitive',
      instructions: ['Use Modal component from ui/Modal with focus trap and proper animations'],
      outputFormat: 'JSON { changes: string[] }',
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const visualPolishTask = defineTask('visual-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final visual polish pass',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI designer',
      task: 'Final polish pass on all components',
      instructions: ['Check spacing, consistency, transitions across all components'],
      outputFormat: 'JSON { improvements: string[] }',
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const verifyBuildTask = defineTask('verify-build', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify build: ${args.phase}`,
  command: 'cd "C:/Users/isaha/Downloads/zip" && npx tsc --noEmit 2>&1; echo "EXIT:$?"',
  io: { outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

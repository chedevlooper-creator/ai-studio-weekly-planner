/**
 * @process ui-ux-pro-max
 * @description Comprehensive UI/UX overhaul for Kafkasder Weekly Planner — premium visual polish,
 *              component refactoring, mobile UX, animations, accessibility, and design system
 * @skill ui-implementer specializations/ux-ui-design/skills/css-precision-editor/SKILL.md
 * @skill visual-diff-scorer specializations/ux-ui-design/skills/visual-diff-scorer/SKILL.md
 * @agent ui-implementer specializations/ux-ui-design/agents/ui-implementer/AGENT.md
 * @agent visual-qa-scorer specializations/ux-ui-design/agents/visual-qa-scorer/AGENT.md
 * @agent refinement-planner specializations/ux-ui-design/agents/refinement-planner/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @agent component-developer specializations/web-development/agents/component-developer/AGENT.md
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @inputs { targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, phases: object[], finalQuality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ═══════════════════════════════════════════════════════════════════════════════
// UI/UX PRO MAX PROCESS
// ═══════════════════════════════════════════════════════════════════════════════
//
// 6-Phase process:
//   Phase 1: Audit & Design System Planning
//   Phase 2: Component Architecture Refactor (App.tsx monolith breakup)
//   Phase 3: Design System & Reusable Primitives
//   Phase 4: Visual Polish & Animations
//   Phase 5: Mobile UX & Responsiveness
//   Phase 6: Accessibility & Final Quality Gate
//
// Each phase has an implementation + verification + refinement convergence loop.
// ═══════════════════════════════════════════════════════════════════════════════

export async function process(inputs, ctx) {
  const { targetQuality = 90, maxIterations = 3 } = inputs;
  const phases = [];

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1: AUDIT & DESIGN SYSTEM PLANNING
  // ══════════════════════════════════════════════════════════════════════════

  const auditResult = await ctx.task(auditCurrentUITask, {
    projectRoot: '.',
    description: 'Kafkasder Weekly Planner - React+Vite+Tailwind v4 dark glassmorphism theme',
  });

  const designPlan = await ctx.task(createDesignPlanTask, {
    audit: auditResult,
    inspirations: ['Linear', 'Notion', 'Things 3', 'Todoist', 'Arc Browser'],
    scope: [
      'Design tokens & color system refinement',
      'Typography scale & hierarchy',
      'Spacing system standardization',
      'Component library (Button, Card, Input, Modal, Badge, Toast)',
      'Animation & transition system',
      'Mobile-first responsive patterns',
      'Accessibility (WCAG 2.1 AA)',
      'Dark theme polish with premium feel',
    ],
  });

  await ctx.breakpoint({
    question: 'Design plan ready. Review the audit findings and proposed design system. Approve to proceed?',
    title: 'Phase 1: Design System Plan Review',
    context: { runId: ctx.runId, designPlan },
  });

  phases.push({ phase: 1, name: 'Audit & Design Plan', result: designPlan });

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2: COMPONENT ARCHITECTURE REFACTOR
  // ══════════════════════════════════════════════════════════════════════════
  // Break the 30KB App.tsx monolith into clean, focused components

  const archPlan = await ctx.task(planArchRefactorTask, {
    designPlan,
    currentStructure: {
      monolith: 'src/App.tsx (30KB, 780+ lines)',
      components: [
        'DaySection.tsx', 'TaskRow.tsx', 'TaskEditModal.tsx',
        'AIAssistant.tsx', 'TeamPanel.tsx', 'RemindersPanel.tsx',
        'ProgressRing.tsx', 'Badge.tsx', 'LuxuryCard.tsx', 'FilePreviewModal.tsx',
      ],
      hooks: ['useInsforgeAuth.ts', 'useOpenClaw.ts', 'useWeeklyPlan.ts'],
    },
  });

  const archImpl = await ctx.task(implementArchRefactorTask, {
    plan: archPlan,
    designPlan,
  });

  const archVerify = await ctx.task(verifyBuildTask, { phase: 'architecture-refactor' });

  // Refinement loop if build fails
  let archIterations = 0;
  let archOk = archVerify.success;
  while (!archOk && archIterations < maxIterations) {
    archIterations++;
    const archFix = await ctx.task(fixBuildIssuesTask, {
      phase: 'architecture-refactor',
      errors: archVerify.errors,
      iteration: archIterations,
    });
    const reVerify = await ctx.task(verifyBuildTask, { phase: 'architecture-refactor' });
    archOk = reVerify.success;
  }

  phases.push({ phase: 2, name: 'Component Architecture', result: archImpl, verified: archOk });

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3: DESIGN SYSTEM & REUSABLE PRIMITIVES
  // ══════════════════════════════════════════════════════════════════════════
  // Create a proper design system with reusable UI primitives

  const dsImpl = await ctx.task(implementDesignSystemTask, {
    designPlan,
    components: [
      'Button (primary, ghost, danger, icon variants)',
      'Card (glass, solid, interactive)',
      'Input (text, select, textarea, search)',
      'Modal (dialog, bottom-sheet on mobile, drawer)',
      'Badge (status, priority, count)',
      'Toast/notification system with undo',
      'Tooltip',
      'Avatar (single, group/stack)',
      'ProgressBar (linear, ring)',
      'EmptyState (with illustrations)',
      'Skeleton loading states',
      'Dropdown menu',
      'Tabs',
      'Toggle/Switch',
    ],
    designTokens: [
      'Refined color palette (surface, accent, semantic colors)',
      'Typography scale (display, heading, body, caption, code)',
      'Spacing scale (4px base, consistent gaps)',
      'Border radius tokens',
      'Shadow elevation system',
      'Animation/transition tokens (duration, easing)',
      'Z-index scale',
    ],
  });

  const dsVerify = await ctx.task(verifyBuildTask, { phase: 'design-system' });
  let dsOk = dsVerify.success;
  let dsIter = 0;
  while (!dsOk && dsIter < maxIterations) {
    dsIter++;
    await ctx.task(fixBuildIssuesTask, { phase: 'design-system', errors: dsVerify.errors, iteration: dsIter });
    const rv = await ctx.task(verifyBuildTask, { phase: 'design-system' });
    dsOk = rv.success;
  }

  phases.push({ phase: 3, name: 'Design System & Primitives', result: dsImpl, verified: dsOk });

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 4: VISUAL POLISH & ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const visualImpl = await ctx.task(implementVisualPolishTask, {
    designPlan,
    areas: [
      'Micro-interactions (button clicks, hover states, focus rings)',
      'Page/view transitions (smooth fade, slide)',
      'Task completion celebration (confetti/checkmark animation)',
      'Skeleton loading screens for all async states',
      'Empty state illustrations and copy',
      'Drag-and-drop visual feedback improvements',
      'Header gradient animation refinement',
      'Card hover/active states with depth',
      'Input focus animations',
      'Modal enter/exit transitions (scale+fade)',
      'AI Assistant panel smooth slide-up',
      'Toast notification slide-in with progress bar',
      'Progress ring smooth animation',
      'Staggered list enter animations',
      'Keyboard shortcut hints overlay',
    ],
  });

  const visualVerify = await ctx.task(verifyBuildTask, { phase: 'visual-polish' });
  let visualOk = visualVerify.success;
  let visualIter = 0;
  while (!visualOk && visualIter < maxIterations) {
    visualIter++;
    await ctx.task(fixBuildIssuesTask, { phase: 'visual-polish', errors: visualVerify.errors, iteration: visualIter });
    const rv = await ctx.task(verifyBuildTask, { phase: 'visual-polish' });
    visualOk = rv.success;
  }

  phases.push({ phase: 4, name: 'Visual Polish & Animations', result: visualImpl, verified: visualOk });

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 5: MOBILE UX & RESPONSIVENESS
  // ══════════════════════════════════════════════════════════════════════════

  const mobileImpl = await ctx.task(implementMobileUXTask, {
    designPlan,
    improvements: [
      'Bottom sheet pattern for task modal on mobile',
      'Swipe-to-complete and swipe-to-delete gestures',
      'Improved touch targets (min 44px)',
      'Pull-to-refresh pattern',
      'Mobile-optimized navigation',
      'Sticky header with compact mode on scroll',
      'Bottom navigation bar for mobile',
      'Floating action button (FAB) for quick add',
      'Responsive grid improvements (1-col mobile, 2-col tablet, 3-col desktop)',
      'Mobile-friendly filter/search bar',
      'Gesture hints on first use',
    ],
  });

  const mobileVerify = await ctx.task(verifyBuildTask, { phase: 'mobile-ux' });
  let mobileOk = mobileVerify.success;
  let mobileIter = 0;
  while (!mobileOk && mobileIter < maxIterations) {
    mobileIter++;
    await ctx.task(fixBuildIssuesTask, { phase: 'mobile-ux', errors: mobileVerify.errors, iteration: mobileIter });
    const rv = await ctx.task(verifyBuildTask, { phase: 'mobile-ux' });
    mobileOk = rv.success;
  }

  phases.push({ phase: 5, name: 'Mobile UX', result: mobileImpl, verified: mobileOk });

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 6: ACCESSIBILITY & FINAL QUALITY GATE
  // ══════════════════════════════════════════════════════════════════════════

  const a11yImpl = await ctx.task(implementAccessibilityTask, {
    designPlan,
    requirements: [
      'WCAG 2.1 AA color contrast ratios',
      'Focus management (visible focus rings, focus trapping in modals)',
      'Screen reader ARIA labels and live regions',
      'Keyboard navigation (Tab, Enter, Escape, Arrow keys)',
      'Keyboard shortcuts with discoverable overlay (? key)',
      'Reduced motion support (@media prefers-reduced-motion)',
      'Proper heading hierarchy (h1-h6)',
      'Form labels and error messages',
      'Skip to content link',
      'Role and landmark regions',
    ],
  });

  const a11yVerify = await ctx.task(verifyBuildTask, { phase: 'accessibility' });
  let a11yOk = a11yVerify.success;
  let a11yIter = 0;
  while (!a11yOk && a11yIter < maxIterations) {
    a11yIter++;
    await ctx.task(fixBuildIssuesTask, { phase: 'accessibility', errors: a11yVerify.errors, iteration: a11yIter });
    const rv = await ctx.task(verifyBuildTask, { phase: 'accessibility' });
    a11yOk = rv.success;
  }

  phases.push({ phase: 6, name: 'Accessibility', result: a11yImpl, verified: a11yOk });

  // ══════════════════════════════════════════════════════════════════════════
  // FINAL QUALITY SCORING & INTEGRATION VERIFICATION
  // ══════════════════════════════════════════════════════════════════════════

  const finalQuality = await ctx.task(finalQualityScoringTask, {
    phases,
    criteria: [
      'Visual consistency & premium feel',
      'Component architecture cleanliness',
      'Design system completeness',
      'Animation smoothness & taste',
      'Mobile responsiveness',
      'Accessibility compliance',
      'TypeScript type safety',
      'Build success (no errors)',
      'Code organization',
      'Performance (no jank, smooth 60fps)',
    ],
    targetQuality,
  });

  // Final build check
  const finalBuild = await ctx.task(verifyBuildTask, { phase: 'final-integration' });

  return {
    success: finalBuild.success && finalQuality.score >= targetQuality,
    phases,
    finalQuality: finalQuality.score,
    qualityDetails: finalQuality,
    buildSuccess: finalBuild.success,
    metadata: {
      processId: 'ui-ux-pro-max',
      timestamp: ctx.now(),
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Phase 1: Audit ──────────────────────────────────────────────────────────

export const auditCurrentUITask = defineTask('audit-current-ui', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit current UI/UX state',
  agent: {
    name: 'frontend-architect',
    prompt: {
      role: 'Senior UX/UI Auditor and Frontend Architect',
      task: 'Perform a comprehensive audit of the current Kafkasder Weekly Planner UI/UX',
      context: {
        projectRoot: args.projectRoot,
        description: args.description,
        filesToReview: [
          'src/App.tsx', 'src/index.css',
          'src/components/planner/TaskRow.tsx', 'src/components/planner/DaySection.tsx',
          'src/components/planner/TaskEditModal.tsx', 'src/components/planner/AIAssistant.tsx',
          'src/components/planner/TeamPanel.tsx', 'src/components/planner/RemindersPanel.tsx',
          'src/components/planner/ProgressRing.tsx', 'src/components/planner/Badge.tsx',
          'src/components/planner/LuxuryCard.tsx', 'src/components/planner/FilePreviewModal.tsx',
        ],
      },
      instructions: [
        'Read and analyze ALL listed files thoroughly',
        'Evaluate: visual hierarchy, spacing consistency, color usage, typography',
        'Evaluate: component architecture (App.tsx is 30KB monolith)',
        'Evaluate: mobile responsiveness, touch targets, gesture support',
        'Evaluate: accessibility (ARIA, focus management, keyboard nav, contrast)',
        'Evaluate: animation/transition quality, loading states, error states',
        'Evaluate: design system consistency (are tokens used consistently?)',
        'Score each area 0-100 and provide specific improvement recommendations',
        'Identify the TOP 10 highest-impact improvements',
        'Note: Turkish language UI (Kafkasder = organization name)',
      ],
      outputFormat: 'JSON with scores object, recommendations array, and topImprovements array',
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'recommendations', 'topImprovements'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const createDesignPlanTask = defineTask('create-design-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive design system plan',
  agent: {
    name: 'frontend-architect',
    prompt: {
      role: 'Design System Architect and UX Lead',
      task: 'Create a comprehensive design plan for the UI/UX Pro Max overhaul based on audit findings',
      context: {
        audit: args.audit,
        inspirations: args.inspirations,
        scope: args.scope,
        currentTech: 'React 19 + Vite + Tailwind CSS v4 (with @theme) + Lucide icons + dnd-kit',
        currentTheme: 'Dark glassmorphism with indigo/violet accent, Space Grotesk + Inter fonts',
      },
      instructions: [
        'Review the audit scores and recommendations',
        'Design a comprehensive token system (colors, typography, spacing, shadows, animations)',
        'Plan the component library with variants and states',
        'Define the animation philosophy (subtle, purposeful, 60fps)',
        'Plan the mobile UX patterns (bottom sheets, gestures, FAB)',
        'Define accessibility standards and testing approach',
        'Create a phased implementation plan with dependencies',
        'Inspirations: Linear (clean, fast), Notion (flexible), Things 3 (delightful interactions)',
        'Keep the dark glassmorphism aesthetic but elevate it to premium quality',
        'Write the full plan as a detailed markdown document to artifacts/design-plan.md',
      ],
      outputFormat: 'JSON with plan summary and path to detailed plan file',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'phases', 'tokens', 'components'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Phase 2: Architecture Refactor ──────────────────────────────────────────

export const planArchRefactorTask = defineTask('plan-arch-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan App.tsx monolith refactoring',
  agent: {
    name: 'frontend-architect',
    prompt: {
      role: 'Senior React Architect',
      task: 'Plan the refactoring of the 30KB App.tsx monolith into clean, focused components',
      context: {
        designPlan: args.designPlan,
        currentStructure: args.currentStructure,
      },
      instructions: [
        'Read src/App.tsx thoroughly to understand the current structure',
        'Identify logical sections: AuthGate, AppHeader, FilterBar, DayGrid, BottomPanels',
        'Plan extraction into separate components with clear props interfaces',
        'Plan a layout component (AppLayout) with proper slot composition',
        'Ensure no functionality is lost during refactor',
        'Plan the file structure: src/components/layout/, src/components/auth/, etc.',
        'TypeScript interfaces for all component props',
        'Output a step-by-step refactoring plan',
      ],
      outputFormat: 'JSON with components array (name, file, props, responsibilities) and extractionOrder',
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'extractionOrder'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementArchRefactorTask = defineTask('implement-arch-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement App.tsx component architecture refactor',
  agent: {
    name: 'react-developer',
    prompt: {
      role: 'Senior React Developer',
      task: 'Refactor the App.tsx monolith into clean, well-typed components following the architecture plan',
      context: {
        plan: args.plan,
        designPlan: args.designPlan,
      },
      instructions: [
        'Read src/App.tsx fully before making any changes',
        'Extract components in the order specified by the plan',
        'Create proper TypeScript interfaces for all props',
        'Extract: AuthGate, AppHeader (mobile+desktop), FilterBar, DayGrid wrapper, BottomPanels',
        'Create src/components/layout/AppLayout.tsx as the main layout shell',
        'Create src/components/auth/AuthGate.tsx for login/signup screen',
        'Create src/components/header/AppHeader.tsx with MobileHeader and DesktopHeader',
        'Create src/components/header/SyncStatus.tsx, StatsCards.tsx, SessionCard.tsx',
        'Create src/components/planner/FilterBar.tsx',
        'Create src/components/planner/DayGrid.tsx (DnD wrapper)',
        'Slim App.tsx to <100 lines — just composition of extracted components',
        'Preserve ALL existing functionality — this is a refactor, not a rewrite',
        'Run the TypeScript compiler to verify no type errors',
        'Make sure all imports are correct and no circular dependencies exist',
      ],
      outputFormat: 'JSON with filesCreated, filesModified arrays and summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Phase 3: Design System ─────────────────────────────────────────────────

export const implementDesignSystemTask = defineTask('implement-design-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement design system & reusable UI primitives',
  agent: {
    name: 'component-developer',
    prompt: {
      role: 'Design System Engineer and Component Developer',
      task: 'Build a complete design system with reusable UI primitives for the Kafkasder planner',
      context: {
        designPlan: args.designPlan,
        components: args.components,
        designTokens: args.designTokens,
        tech: 'React 19 + Tailwind CSS v4 (@theme tokens) + TypeScript',
      },
      instructions: [
        'First read the existing src/index.css to understand current token system',
        'Refine and expand the @theme tokens in src/index.css',
        'Add proper spacing scale, typography scale, shadow elevation, animation tokens',
        'Create src/components/ui/ directory for all primitives',
        'Build each component with proper TypeScript types, variants via props',
        'Use Tailwind classes and CSS custom properties for theming',
        'Components to create:',
        '  - Button.tsx (variants: primary, ghost, danger, icon-only; sizes: sm, md, lg)',
        '  - Card.tsx (variants: glass, solid, interactive; with proper hover states)',
        '  - Input.tsx (text, password, search with icon; with label, error, hint)',
        '  - Select.tsx (styled native select with custom arrow)',
        '  - Textarea.tsx (auto-resize, character count)',
        '  - Modal.tsx (dialog with backdrop, focus trap, Escape to close, animations)',
        '  - Badge.tsx (variants: status, priority, count; sizes: sm, md)',
        '  - Toast.tsx (success, error, warning, info; with dismiss and undo; portal-based)',
        '  - Tooltip.tsx (positioning, delay, arrow)',
        '  - Avatar.tsx (single with initials/image, AvatarGroup for stacking)',
        '  - Progress.tsx (linear bar and ring variants)',
        '  - EmptyState.tsx (icon, title, description, action button)',
        '  - Skeleton.tsx (text, circle, card shapes for loading)',
        '  - Dropdown.tsx (trigger + portal menu with items)',
        '  - Tabs.tsx (horizontal tabs with active indicator animation)',
        '  - Toggle.tsx (switch component with animation)',
        '  - IconButton.tsx (ghost button optimized for icon actions)',
        'Create src/components/ui/index.ts barrel export',
        'Replace existing inline styling in components with these primitives where possible',
        'Ensure all components have proper aria attributes',
        'Verify TypeScript types compile cleanly',
      ],
      outputFormat: 'JSON with filesCreated, tokensAdded, and componentList arrays',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'tokensAdded', 'componentList'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Phase 4: Visual Polish ─────────────────────────────────────────────────

export const implementVisualPolishTask = defineTask('implement-visual-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement visual polish & animations',
  agent: {
    name: 'ui-implementer',
    prompt: {
      role: 'Motion Designer and CSS Animation Expert',
      task: 'Add premium visual polish, micro-interactions, and animations to the Kafkasder planner',
      context: {
        designPlan: args.designPlan,
        areas: args.areas,
        tech: 'React 19 + Tailwind CSS v4 + CSS animations/transitions',
      },
      instructions: [
        'Read the existing components and index.css to understand current animation state',
        'Philosophy: animations should be subtle, purposeful, and delightful — never distracting',
        'Target 60fps — use transform and opacity only, avoid layout-triggering properties',
        'Implement each area listed in the context:',
        '  1. Refine button micro-interactions (scale on press, glow on hover)',
        '  2. Add smooth page transitions using CSS transitions',
        '  3. Task completion: green checkmark animation with subtle confetti burst',
        '  4. Skeleton loading screens for async states (plan loading, auth checking)',
        '  5. Empty state components with tasteful illustrations (CSS/SVG)',
        '  6. Enhanced drag-and-drop visual feedback (shadow, scale, placeholder)',
        '  7. Refined header gradient with subtle parallax on scroll',
        '  8. Card hover states with smooth depth change',
        '  9. Input focus: expanding border glow animation',
        '  10. Modal: backdrop blur + scale entrance, smooth exit',
        '  11. AI chat panel: smooth slide-up with spring easing',
        '  12. Toast: slide from right, progress timer bar, exit slide',
        '  13. Progress ring: smooth value transition with glow',
        '  14. Staggered list animations for task rows on expand',
        '  15. Keyboard shortcut overlay: ? key shows command palette style',
        'Add @keyframes to src/index.css for reusable animations',
        'Respect prefers-reduced-motion (already has base in CSS)',
        'Verify no TypeScript errors after changes',
      ],
      outputFormat: 'JSON with animationsAdded array, filesModified array, and summary',
    },
    outputSchema: {
      type: 'object',
      required: ['animationsAdded', 'filesModified', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Phase 5: Mobile UX ─────────────────────────────────────────────────────

export const implementMobileUXTask = defineTask('implement-mobile-ux', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement mobile UX improvements',
  agent: {
    name: 'react-developer',
    prompt: {
      role: 'Mobile-First UX Engineer',
      task: 'Implement comprehensive mobile UX improvements for the Kafkasder planner',
      context: {
        designPlan: args.designPlan,
        improvements: args.improvements,
        tech: 'React 19 + Tailwind CSS v4 (responsive) + touch events',
      },
      instructions: [
        'Read existing mobile styles and responsive breakpoints',
        'Implement each improvement listed:',
        '  1. Bottom sheet Modal on mobile: slide-up with drag-to-dismiss handle',
        '  2. Swipe gestures on TaskRow: swipe-right=complete, swipe-left=delete with confirm',
        '  3. Ensure all touch targets >= 44px (audit and fix small buttons)',
        '  4. Pull-to-refresh with custom animation (if applicable for sync)',
        '  5. Compact header that shrinks on scroll (sticky with blur backdrop)',
        '  6. Bottom tab navigation for mobile (Hafta, Takım, AI, Ayarlar)',
        '  7. Floating Action Button: bottom-right, expandable radial menu (add task, AI, search)',
        '  8. Responsive grid: sm:1-col, md:2-col, lg:2-col, 2xl:3-col',
        '  9. Mobile search: expandable from icon to full-width input',
        '  10. Use CSS env(safe-area-inset-*) for notch/island devices',
        '  11. First-use gesture hints (subtle pulsing indicators)',
        'Use React hooks for touch/gesture handling (useSwipe, usePullToRefresh)',
        'Create gesture hooks in src/hooks/ directory',
        'Test responsive behavior at 375px (mobile), 768px (tablet), 1024px+ (desktop)',
        'Verify no TypeScript errors',
      ],
      outputFormat: 'JSON with filesCreated, filesModified, hooksCreated arrays and summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Phase 6: Accessibility ─────────────────────────────────────────────────

export const implementAccessibilityTask = defineTask('implement-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement accessibility improvements (WCAG 2.1 AA)',
  agent: {
    name: 'react-developer',
    prompt: {
      role: 'Accessibility Engineer (WCAG 2.1 AA Specialist)',
      task: 'Implement comprehensive accessibility improvements across the entire Kafkasder planner',
      context: {
        designPlan: args.designPlan,
        requirements: args.requirements,
      },
      instructions: [
        'Audit all components for accessibility issues',
        'Implement each requirement:',
        '  1. Check and fix all color contrast ratios (4.5:1 for text, 3:1 for large text)',
        '  2. Add visible focus rings (2px solid accent with offset) to all interactive elements',
        '  3. Add focus trapping in Modal and AI Assistant panel',
        '  4. Add proper ARIA labels to all buttons, inputs, and interactive elements',
        '  5. Add aria-live regions for dynamic content (sync status, toast notifications)',
        '  6. Implement full keyboard navigation:',
        '     - Tab/Shift+Tab between elements',
        '     - Enter/Space to activate buttons',
        '     - Escape to close modals/panels',
        '     - Arrow keys within lists',
        '     - / to focus search (already exists)',
        '  7. Keyboard shortcuts: ? opens shortcut overlay, Ctrl+N new task, etc.',
        '  8. Check and fix heading hierarchy (only one h1, proper h2-h6 nesting)',
        '  9. Add proper form labels (using <label> or aria-label/aria-labelledby)',
        '  10. Add "Skip to main content" link as first focusable element',
        '  11. Add proper landmark roles (main, nav, complementary, banner)',
        '  12. Ensure prefers-reduced-motion disables all non-essential animations',
        'Create src/hooks/useFocusTrap.ts and src/hooks/useKeyboardShortcuts.ts',
        'Verify no TypeScript errors and all ARIA attributes are valid',
      ],
      outputFormat: 'JSON with fixes array, hooksCreated array, and a11yScore number',
    },
    outputSchema: {
      type: 'object',
      required: ['fixes', 'a11yScore', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Shared: Build Verification ─────────────────────────────────────────────

export const verifyBuildTask = defineTask('verify-build', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify build: ${args.phase}`,
  command: 'cd "C:/Users/isaha/Downloads/zip" && npx tsc --noEmit 2>&1; echo "EXIT:$?"',
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const fixBuildIssuesTask = defineTask('fix-build-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix build issues: ${args.phase} (iter ${args.iteration})`,
  agent: {
    name: 'react-developer',
    prompt: {
      role: 'Senior TypeScript Developer and Debugger',
      task: `Fix TypeScript/build errors in phase: ${args.phase}`,
      context: {
        phase: args.phase,
        errors: args.errors,
        iteration: args.iteration,
      },
      instructions: [
        'Read the build error output carefully',
        'Fix each TypeScript error in the affected files',
        'Ensure no new errors are introduced',
        'Run TypeScript compiler to verify: npx tsc --noEmit',
        'If import paths are wrong, fix them',
        'If types are missing, add proper interfaces',
        'Return list of files fixed and remaining issues if any',
      ],
      outputFormat: 'JSON with filesFixed array, errorsResolved number, and remainingIssues array',
    },
    outputSchema: {
      type: 'object',
      required: ['filesFixed', 'errorsResolved'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ─── Final Quality Scoring ──────────────────────────────────────────────────

export const finalQualityScoringTask = defineTask('final-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final UI/UX quality scoring',
  agent: {
    name: 'visual-qa-scorer',
    prompt: {
      role: 'Senior UX Quality Analyst',
      task: 'Score the final UI/UX quality of the Kafkasder planner after the Pro Max overhaul',
      context: {
        phases: args.phases,
        criteria: args.criteria,
        targetQuality: args.targetQuality,
      },
      instructions: [
        'Review all source files to evaluate the final state',
        'Score each criterion from 0-100',
        'Check: src/index.css for design tokens',
        'Check: src/components/ui/ for component library completeness',
        'Check: src/App.tsx for clean architecture',
        'Check: All component files for consistency and quality',
        'Check: Mobile responsiveness patterns',
        'Check: Accessibility attributes and hooks',
        'Check: Animation quality and performance',
        'Calculate weighted average as final score',
        'Provide specific praise and remaining improvement suggestions',
        'Run: npx tsc --noEmit to verify build still passes',
      ],
      outputFormat: 'JSON with score, criteriaScores object, praise array, suggestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'criteriaScores'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

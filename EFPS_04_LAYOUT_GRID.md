# EFPS #4: LAYOUT & GRID SYSTEM VALIDATION
**Date:** 2026-05-17 | **Grade: D+ (67/100)**

## EXECUTIVE SUMMARY

TWO COMPLETELY DIFFERENT layout systems exist. Modern system uses systematic CSS Grid with proper responsive breakpoints. Old system uses mixed Grid/Flexbox with inconsistent container widths and no systematic approach.

**CRITICAL: 2 | MAJOR: 3 | MINOR: 2**

---

## CRITICAL FINDINGS

### #1: Container Width Mismatch
**Modern:** `--container-2xl: 1536px`
**Old:** `max-width: 1300px`
**Difference:** 236px narrower on old pages!

On wide screens, homepage content extends 236px wider than other pages. Jarring visual jump.

### #2: No Responsive Grid on Old Pages
**Modern:** Systematic 3-column grid with auto-fit
```css
.cards-grid-3 {
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
}

@media (max-width: 1024px) {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

**Old:** Ad-hoc responsive
```css
.modes-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));  /* No explicit breakpoints */
  gap: 32px;
}
```

`auto-fit` with `minmax()` is unpredictable. On 1200px screen, might show 3 columns or 2 depending on content. Inconsistent layout across pages.

---

## MAJOR FINDINGS

### #1: Parsha.html Layout Broken (User Complaint)
User reported: "can't see the whole thing the hebrew is big, but the english i can only see halfway because its at its edge"

**Root cause:**
```css
.parallel-text-container {
  display: flex;  /* Side-by-side */
}

.hebrew-column, .english-column {
  flex: 1;  /* Equal width */
}

.text-content {
  max-height: 70vh;  /* Vertical scroll */
  overflow-y: auto;
  /* MISSING: overflow-x, word-wrap */
}
```

English text with long words overflows horizontally because no `overflow-x: hidden` or `word-wrap: break-word`. **Already fixed in parsha.css** but needs testing.

### #2: No Layout Grid System
Modern has systematic grid:
- 1fr, 2-column, 3-column, 4-column variants
- Consistent gap spacing
- Responsive

Old has:
- Mixed approaches per page
- Inconsistent gaps (2rem, 32px, 1.5rem)
- No system

### #3: Z-Index Chaos
Multiple elements use arbitrary z-index values:

| Element | Z-Index | Conflicts? |
|---------|---------|------------|
| nav-modern | 1000 | |
| main-nav | 1000 | ✅ Same |
| ambient-overlay | 1 | |
| parchment-texture | 1 | ⚠️ Overlap |
| scroll-progress | 10000 | |
| page-transition | 9999 | |
| mobile-menu | 999 (implied) | ⚠️ Below nav |

No systematic z-index scale. Elements may overlap incorrectly.

---

## MINOR FINDINGS

### #1: Mixed Flex/Grid Usage
Some pages use Grid, others Flexbox for same purpose. No consistency.

### #2: No Layout Documentation
Developers must reverse-engineer which layout pattern to use.

---

## RECOMMENDATIONS

1. **Unify container widths** - Use 1536px everywhere
2. **Standardize grid system** - Use modern explicit breakpoints
3. **Create z-index scale** - Base 0, nav 1000, modal 2000, toast 3000
4. **Document layouts** - When to use Grid vs Flex, grid patterns
5. **Test parsha layout fix** - Verify English text no longer cuts off

---

**EFPS #4 Complete | Next: EFPS #5-10 Batch Analysis**

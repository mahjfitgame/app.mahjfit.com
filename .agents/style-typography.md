Mahjfit — Mandatory Design System & AI Coding Rules
CRITICAL INSTRUCTION
These design rules are mandatory and persistent.
You MUST follow them every time you create, modify, refactor, or extend code in this project.

These rules apply to:
New screens
Existing screens
Components
Forms
Buttons
Navigation
Cards
Modals
Dialogs
Tables
Labels
Inputs
Errors
Validation
Empty states
Loading states
Responsive layouts
Icons
Typography
Colors
Spacing
Visual styling
DO NOT override these rules based on personal design preference.
If the user's request does not specify a visual treatment, use the existing Mahjfit design system defined below.
If an existing component already follows the design system, reuse it instead of creating a visually different version.

1. Design-System Priority
When making changes, follow this priority:
Explicit user requirements
This mandatory Mahjfit design system
Existing project components and design patterns
Existing project architecture
Accessibility and responsive requirements
Minimal implementation necessary to complete the task

Do not introduce visual changes that were not requested.
2. Color System
Solid Colors
Name	Hex	Usage
Fuchsia	#B92A90	Buttons, links
Blue	#264089	Headings, text
Lavender	#DAB6D6	Backgrounds
Avocado	#C7C22E	Labels, feedback
Red	#F04846	Errors
Green	#11B364	Validation, success
Gray	#9EB5C1	Disabled — 60%
Pink	#EFACBF	Decorative

Mandatory Color Rules
Use Fuchsia #B92A90 for primary buttons and links.
Use Blue #264089 for headings and primary text.
Use Lavender #DAB6D6 for applicable backgrounds.
Use Avocado #C7C22E for labels and feedback.
Use Red #F04846 for errors.
Use Green #11B364 for validation and success.
Use Gray #9EB5C1 at 60% for disabled states.
Use Pink #EFACBF for decorative elements.

Do NOT
Invent new brand colors.
Substitute arbitrary Tailwind colors.
Use browser-default colors for designed UI.
Introduce another shade of blue, pink, purple, etc. when an approved design-system color exists.
Change an approved color because another color "looks better."

If a color is not defined here, inspect the existing project implementation/design tokens first.

3. Gradients
Gradient — Elements
Direction:
left → right

Colors:
#B92A90 → #264089

Usage:
Progress bars
Taglines
Attention-grabbing non-clickable visual elements

Important
This gradient is intended to stand out and draw attention, but it must NOT be used to make an element appear clickable.
Do not use this gradient indiscriminately on buttons or interactive controls.

Gradient — Backgrounds
Colors:
#C9CEDF → #EDD0E2

Angle:
32deg

Usage:
Backgrounds
Use this gradient only where appropriate to the background design.

4. Typography System
Primary Application Font
Outfit

Use Outfit for the application interface.
Outfit is mandatory for:
Headings
Body copy
Buttons
Labels
Navigation
Forms
Inputs
Interface elements
Error messages
Helper text
Gameplay Tile Font
Poppins

Poppins is reserved for Mahjong gameplay tile artwork.

Use Poppins only for:
Mahjong tile numbers
Mahjong tile lettering

Tile-specific typography where applicable

Important
Do NOT use Poppins for general application UI.
Do NOT use Outfit for gameplay tile lettering when Poppins is required by the tile artwork.

5. Typography Scale
Use the following base design-system values.

Style	Font	Weight	Size
H1	Outfit	700 Bold	36px
H2	Outfit	600 SemiBold	22px
H3	Outfit	600 SemiBold	28px
Body	Outfit	400 Regular	16px
Button	Outfit	600 SemiBold	20px
Navigation	Outfit	600 SemiBold	16px
Input	Outfit	400 Regular	16px
Caption	Outfit	500 Medium	12px
Error	Outfit	500 Medium	14px
Tile Text	Poppins	500 Medium	Varies
Typography Rules

Maintain the defined typographic hierarchy.
Do not randomly change font sizes.
Do not use arbitrary font weights when an existing design-system weight applies.
Use sentence case for headings and body copy.
Use ALL CAPS only for buttons and small UI labels.
Links must be underlined.
Body copy should be left-aligned.
Hero messaging may be center-aligned when appropriate.
Maintain consistent spacing between typographic elements.

6. Responsive Typography
The sizes above represent the base design system.

For smaller breakpoints:
Typography may scale proportionally.

Maintain the same hierarchy.
Do not arbitrarily shrink typography until it becomes difficult to read.
Do not change the relative importance of H1/H2/H3/body/etc.
Responsive adjustments must preserve the Mahjfit visual hierarchy.

7. Buttons
Primary Button Colors
State	Color
Default	#B92A90
Hover	#C453A3
Pressed	#921D70
Disabled	#9EB5C1 at 60%

Button Typography
Font: Outfit
Weight: 600 SemiBold
Size: 20px

Text treatment: ALL CAPS where appropriate

Button Shape
Border radius:
8px

Button Rules
Every button implementation must account for the relevant states:

Default
Hover
Pressed
Disabled

Do not create a button with a random radius or arbitrary color.
Do not replace the Mahjfit button colors with generic framework colors.

8. Iconography
Default icon color:
#B92A90

States:
State	Color
Default	#B92A90
Hover	#C453A3
Pressed	#921D70
Disabled	#9EB5C1 at 60%
Icon Rules

Maintain consistent icon sizing within the same component category.
Use the existing icon library/components when one already exists in the project.
Do not introduce a new icon library unnecessarily.
Do not replace existing icons without a requirement.

Icons must visually match the surrounding UI.

9. Shape System
Buttons
Border radius:
8px

Mahjong Tiles
Border radius:
10px
Shape Rules
Do not arbitrarily change corner radii.

If an existing component has a defined radius, preserve it unless the design system or user request requires a change.

10. Layout & Spacing
When modifying an existing screen:
Preserve the existing layout unless the requested change requires modification.

Maintain consistent spacing and alignment.
Reuse existing spacing tokens/utilities if they exist.
Do not introduce arbitrary spacing values unnecessarily.
Align related elements consistently.
Maintain visual hierarchy.
If the project already has spacing/design tokens, use them instead of creating new values.

11. Component Reuse
Before creating a new UI component:
Search the project for an existing equivalent.
Determine whether it can be reused.
Determine whether it can be extended.
Only create a new component if reuse or extension is inappropriate.

Prefer:
Reuse existing component

over:
Create duplicate component
Do not create multiple visually different versions of the same UI pattern without a genuine requirement.

12. Existing UI Must Be Preserved
When implementing a requested change:
Change only what is necessary.

Do NOT:
Redesign unrelated components.
Change unrelated colors.
Change typography on unrelated screens.
Change spacing throughout the application.
Replace existing components unnecessarily.
Rename unrelated components.
Refactor unrelated code.
Remove existing functionality.
Introduce a new visual style.

A feature request is NOT permission to redesign the application.

13. Responsive Design

Every UI change must work across:

Mobile
Tablet
Desktop
Large desktop

Do not optimize for only one viewport.
Do not solve a mobile problem by breaking desktop.
Do not solve a desktop problem by breaking mobile.
Preserve the existing responsive architecture whenever possible.

14. Accessibility
All UI changes must preserve or improve accessibility.

Pay attention to:
Semantic HTML
Keyboard navigation
Focus states
Accessible labels
Form labels
Button semantics
Color contrast
Screen-reader support
Appropriate ARIA attributes

Never remove an existing accessibility feature simply to achieve a visual result.

15. Interactive States

When implementing interactive UI, consider all applicable states:
Default
Hover
Focus
Pressed
Disabled
Loading
Empty
Error
Success

Do not implement only the default state when the component requires additional states.
Use the approved Mahjfit color system for these states.

16. Styling Architecture
Use the styling approach already established by the project.

For example:
If the project uses CSS modules → continue using CSS modules.
If the project uses Tailwind → follow the existing Tailwind conventions.
If the project uses styled-components → follow the existing styled-component patterns.
If the project uses CSS variables/design tokens → use the existing tokens.

Do NOT introduce a new styling system simply because you prefer it.

17. Dependencies
Do not add a new dependency unless it is genuinely required.
Before adding a dependency:
Check whether the project already provides the required functionality.
Check whether an existing library can solve the problem.
Prefer existing project dependencies.
Add a new dependency only when justified.

18. Code Changes Must Be Minimal
Follow the principle:
Smallest correct change.

Avoid:
Unnecessary refactoring
Unrelated cleanup
Large rewrites
Changing working code unnecessarily
Introducing unnecessary abstractions
Modifying unrelated files
Keep the change focused on the requested task.

19. Before Writing Code
For every coding task, follow this sequence:
Step 1 — Inspect
Inspect the relevant:
Components
Pages
Styles
Design tokens
Theme configuration
Existing UI patterns
Responsive rules
Related tests
Step 2 — Understand
Understand how the existing implementation works before changing it.
Step 3 — Reuse
Identify reusable components, utilities, styles, and tokens.
Step 4 — Modify
Make the smallest change that satisfies the requirement.
Step 5 — Verify

Check the implementation against this design system.

20. Final Design Verification
Before considering any UI task complete, verify:
Colors
Are approved Mahjfit colors being used?
Did I accidentally introduce arbitrary colors?
Are button states correct?
Are disabled states correct?

Typography
Is Outfit used for application UI?
Is Poppins restricted to Mahjong tile text?
Are font sizes and weights consistent?
Is the hierarchy preserved?

Components
Did I reuse existing components
Did I accidentally create a duplicate component?
Does the new component match existing UI?

Shapes
Are buttons using 8px radius?
Are Mahjong tiles using 10px radius?

Responsive
Does the change work on mobile?
Does it work on tablet?
Does it work on desktop?
Does it preserve existing responsive behavior?

Accessibility
Are focus states preserved?
Are controls keyboard accessible?
Are labels and semantics correct?

Scope
Did I modify only what was necessary?
Did I accidentally redesign unrelated UI?
Did I introduce unnecessary dependencies?
Did I refactor unrelated code?

If any answer is "No", fix the implementation before completing the task.

21. Mandatory Decision Rule
When uncertain about how a new UI element should look:
Do not invent a design.

Instead:
Find the closest existing Mahjfit component.
Follow its visual pattern.
Apply the appropriate colors and typography from this design system.
Preserve existing spacing and responsive behavior.
Existing project patterns take precedence over personal design preference.

22. Non-Negotiable Summary
For every code change:
Inspect → Understand → Reuse → Implement minimally → Verify
The AI agent must always preserve the Mahjfit visual language.
The AI agent must never introduce arbitrary:
Colors
Fonts
Font weights
Font sizes
Border radii
Button styles
Icon styles
Gradients
UI patterns

unless explicitly requested by the user.

These rules apply to every future code change in this project.






For cleanup reference, here is the same details of typography, shapes and colors:
Color System:
SOLIDS
Name: Fuchsia
Hex: #B92A90 
Usage: Buttons, Links

Name: Blue 
Hex: #264089 
Usage: Headings, T ext

Name: Lavender 
Hex: #DAB6D6 
Usage: Backgrounds

Name: Avocado 
Hex: #C7C22E 
Usage: Labels, Feedback

Name: Red 
Hex: #F04846 
Usage: Errors

Name: Green 
Hex: #11B364 
Usage: Validation, Success

Name: Gray 
Hex: #9EB5C1 
Usage: Disabled - 60%

Name: Pink 
Hex: #EFACBF 
Usage: Decorative

GRADIENTS
Name: Gradient - elements 
Hex: Linear, left to right
B92A90 >> 264089
Usage: Progress bar, tagline
- to stand out and
draw attention to, but
not clickable

Name: Gradient - backgrounds
Hex: Linear
C9CEDF >> EDD0E2
32°
Usage: background




Typography System
Mahjong tile typography is part of the game artwork and intentionally uses Poppins to maintain
consistency across all tile assets, while the application interface uses Outfit.
Outfit:
- Primary UI font
- Used for headings, body copy, buttons, labels, navigation, forms, interface elements.

Poppins:
- Gameplay tile font only.
- Used on tile numbers/lettering where applicable.



Responsive Note: Font sizes shown represent the base design system. Sizes may be scaled
proportionally for smaller breakpoints while maintaining the same typographic hierarchy.


Style: H1 
Font: Outfit
Weight: Bold (700) 
Size: 36 px 
Typical Usage: Hero headlines, titles

Style: H2
Font: Outfit
Weight: SemiBold (600)
Size: 22 px 
Typical Usage: Section headers

Style: H3 
Font: Outfit
Weight: SemiBold (600)
Size: 28 px 
Typical Usage: 

Style: Body 
Font: Outfit
Weight: Regular (400) 16 px 
Typical Usage: Main copy

Style: Button 
Font: Outfit
Weight: SemiBold (600)
Size: 20 px 
Typical Usage: Button CTAs

Style: Navigation 
Font: Outfit
Weight: SemiBold (600)
Size: 16 px 
Typical Usage: Main navigation

Style: Input
Font: Outfit
Weight: Regular (400)
Size: 16 px
Typical Usage: Form fields

Style: Caption
Font: Outfit
Weight: Medium (500)
Size: 12 px
Typical Usage: Labels, helper text

Style: Error
Font: Outfit
Weight: Medium (500)
Size: 14 px
Typical Usage: Validation/errors

Style: Labels > Tile Text 
Font: Poppins 
Weight: Medium (500)
Size: Varies 
Typical Usage: Mahjong tiles


Typography Principles
- Sentence case for headings and body copy.
- ALL CAPS for buttons and small UI labels only.
- Links are underlined.
- Left align body copy.
- Center align hero messaging when appropriate.
- Maintain consistent spacing and hierarchy across all screens.


Buttons
Default: #B92A90
Hover: #C453A3
Pressed: #921D70
Disabled: #9EB5C1

Corner Radius 8px
Button States
- Default #B92A90
- Hover #C453A3
- Pressed #921D70
- Disabled #9EB5C1 60%


Iconography
- Default color is Mahjfit Fuchsia
- Hover #C453A3
- Pressed #921D70
- Disabled #9EB5C1 60%


Shape System
Component: Buttons
Radius: 8 px
Buttons 
Tiles 10 px





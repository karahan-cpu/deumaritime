# Maritime Emissions Calculator - Design Guidelines

## Design Approach

**Framework:** Material Design System adapted for enterprise data applications
**Reference Inspiration:** Professional maritime software (ClassNK ZETA, DNV platforms) combined with modern dashboard patterns (Linear's data clarity, Notion's form organization)
**Core Principle:** Precision-first design that prioritizes data accuracy, calculation transparency, and professional credibility over visual flourish.

## Layout System

**Spacing Primitives:** Use Tailwind units of 3, 4, 6, 8, and 12 for consistent rhythm
- Form spacing: space-y-6 for form sections, space-y-3 for field groups
- Container padding: p-6 for cards, p-8 for main containers, p-12 for page wrapper
- Component margins: mb-8 between major sections, mb-4 between related elements

**Grid Structure:**
- Two-column layout: 60/40 split (inputs left, preview/summary right) on desktop
- Three-column layout for comparison tables and multi-scenario analysis
- Single column stack on mobile with collapsible sections

## Typography

**Font Selection:** Inter (primary) + JetBrains Mono (numerical data/results)
- Headings: text-2xl font-semibold for page titles, text-lg font-medium for section headers
- Form labels: text-sm font-medium, uppercase tracking-wide for category labels
- Body text: text-base for descriptions, text-sm for helper text
- Numerical displays: text-3xl font-bold JetBrains Mono for primary results, text-lg for secondary metrics
- Technical terms: text-xs uppercase tracking-wider for regulation badges (EEDI, EEXI, CII)

## Component Library

### Navigation & Structure
- **Primary Navigation:** Horizontal tab bar with regulation names (EEDI | EEXI | CII | FuelEU | EU ETS | GFI | Summary)
- **Secondary Navigation:** Vertical sidebar for ship selection and saved calculations
- **Breadcrumb:** Show calculation flow (Ship Type > Input Data > Results)

### Input Components
- **Form Cards:** Elevated cards (shadow-md) with rounded-lg borders grouping related inputs
- **Input Fields:** Full-width text inputs with clear labels above, helper text below, unit indicators (e.g., "tonnes", "kW") inside input on right
- **Dropdowns:** Custom select menus for ship types, fuel types, regulation phases
- **Number Inputs:** Stepper controls for precision values, slider + input combination for ranges
- **Radio Groups:** Horizontal layout for binary choices (Yes/No, New Build/Existing Ship)
- **Calculation Triggers:** Prominent "Calculate" buttons at section completion, disabled until required fields complete

### Output Components
- **Results Dashboard:** Card-based grid layout (2-3 columns on desktop)
  - Primary metric cards: Large numerical value, label, compliance status indicator
  - Breakdown tables: Detailed calculation steps with expand/collapse for formula transparency
  - Cost summary: Itemized breakdown with subtotals and grand total
- **Rating Display:** Large letter grade (A-E for CII) with visual scale indicator
- **Compliance Status:** Badge system (Compliant/Non-Compliant/Warning) with explanatory text
- **Charts:** Bar charts for year-over-year projections, line graphs for reduction trajectories
- **Comparison Tables:** Side-by-side scenario analysis with highlighting for differences

### Data Visualization
- **Formula Breakdown:** Collapsible accordion showing calculation steps with actual values substituted
- **Progress Indicators:** Show completion % for multi-step calculators
- **Regulatory Timeline:** Visual timeline showing phase-in dates and reduction targets
- **Cost Breakdown:** Stacked bar chart showing component costs (fuel, penalties, allowances)

### Interactive Elements
- **Tooltips:** Hover explanations for technical terms (EEDI, MCR, SFC, etc.)
- **Info Panels:** Expandable sidebars with regulation context and compliance requirements
- **Validation Feedback:** Inline error messages, success states with checkmarks
- **Auto-save Indicators:** Subtle save status for draft calculations

## Page Structure

**Landing View:** Ship selector with recent calculations list
**Calculator View (per regulation):**
- Header: Regulation name, brief description, applicable ship types
- Input Section: Grouped form fields with clear progression
- Results Panel: Sticky sidebar or collapsible right panel showing live calculations
- Action Bar: Calculate, Save, Export, Compare buttons

**Summary Dashboard:**
- Overview cards for all regulations
- Total compliance cost prominently displayed
- Overall compliance status matrix
- Multi-year projection table
- Export report functionality

## Professional Enhancements

- **Calculation History:** Sidebar list of saved calculations with timestamps and ship identifiers
- **Template System:** Pre-filled forms for common ship types with industry-standard values
- **Regulatory Updates Banner:** Dismissible alerts for new regulation changes
- **Comparison Mode:** Toggle to compare 2-4 scenarios side-by-side
- **PDF Export Preview:** Generated report preview before download
- **Formula Reference:** Modal overlays showing IMO/EU regulation formulas with citations

## Layout Patterns

- Use max-w-7xl for main content container
- Input forms: max-w-2xl for optimal readability
- Results tables: Full-width with horizontal scroll on mobile
- Sticky positioning for calculator action buttons when scrolling long forms
- Fixed header with regulation navigation for easy switching
# Requirements Document

## Introduction

DocketDive is a production-ready RAG chatbot specializing in South African law. Before launch, the application requires UI/UX polish to ensure professional appearance, optimal readability, and visual appeal across both light and dark themes. This specification addresses critical visual issues including theme transitions, text readability, component visibility, and icon professionalism.

## Glossary

- **DocketDive**: The South African legal AI assistant application
- **Theme System**: The light/dark mode toggle functionality using next-themes
- **Student Mode**: A feature that simplifies legal explanations for different education levels (ELI5, ELI15, ELI25)
- **Active State**: Visual indication that a UI component is currently selected or enabled
- **Glow Effect**: A visual effect using box-shadow or similar CSS to create luminous highlighting
- **Icon Asset**: A graphical symbol used in the UI, sourced from Flaticon or similar professional icon libraries
- **Text Contrast**: The visual difference between text and its background, measured by WCAG standards
- **Gradient Background**: The animated background component that transitions between color schemes
- **Message Bubble**: The container component displaying user and AI messages in the chat interface
- **Readability**: The ease with which text can be read and understood, affected by contrast, font size, and color

## Requirements

### Requirement 1

**User Story:** As a user, I want text to be clearly readable in both light and dark modes, so that I can comfortably use the application regardless of my theme preference.

#### Acceptance Criteria

1. WHEN the application is in light mode THEN the system SHALL ensure all text elements have a minimum contrast ratio of 4.5:1 against their backgrounds
2. WHEN the application is in dark mode THEN the system SHALL ensure all text elements have a minimum contrast ratio of 4.5:1 against their backgrounds
3. WHEN switching between light and dark modes THEN the system SHALL smoothly transition text colors without jarring visual changes
4. WHEN displaying message content THEN the system SHALL use appropriate text colors that maintain readability against the gradient background
5. WHEN rendering markdown content in messages THEN the system SHALL apply theme-appropriate colors to headings, paragraphs, lists, and code blocks

### Requirement 2

**User Story:** As a user, I want the Student Mode button to be clearly distinguishable and visually prominent when active, so that I can easily see which mode I'm currently using.

#### Acceptance Criteria

1. WHEN Student Mode is inactive THEN the system SHALL display the button with a subtle outline style that blends with the interface
2. WHEN Student Mode is active THEN the system SHALL apply a distinctive background color to the button
3. WHEN Student Mode is active THEN the system SHALL add a glowing effect around the button using box-shadow
4. WHEN hovering over the Student Mode button THEN the system SHALL provide visual feedback through color or shadow transitions
5. WHEN the button displays the current ELI level THEN the system SHALL show the level text clearly within the button

### Requirement 3

**User Story:** As a user, I want professional icons instead of emoji characters throughout the interface, so that the application appears polished and suitable for legal professionals.

#### Acceptance Criteria

1. WHEN displaying category icons in the welcome screen prompts THEN the system SHALL use professional SVG icons from Flaticon or similar sources
2. WHEN showing feature pills on the welcome screen THEN the system SHALL replace emoji with appropriate professional icons
3. WHEN rendering the info card on the welcome screen THEN the system SHALL use a professional icon instead of emoji
4. WHEN displaying icons in the Student Mode dropdown menu THEN the system SHALL use consistent professional icon styling
5. WHEN icons are displayed THEN the system SHALL ensure they scale properly and maintain visual quality at all sizes

### Requirement 4

**User Story:** As a user, I want smooth and visually appealing transitions between light and dark modes, so that theme changes feel polished and professional.

#### Acceptance Criteria

1. WHEN switching from light to dark mode THEN the system SHALL transition the gradient background colors smoothly over 300-500ms
2. WHEN switching themes THEN the system SHALL transition all UI component backgrounds and borders smoothly
3. WHEN the gradient background animates THEN the system SHALL use theme-appropriate color palettes that are visually comfortable
4. WHEN in light mode THEN the system SHALL use soft, airy colors that reduce eye strain
5. WHEN in dark mode THEN the system SHALL use rich, deep colors that maintain the professional aesthetic

### Requirement 5

**User Story:** As a user, I want message bubbles and content areas to have proper contrast and readability, so that I can easily read long legal responses without eye strain.

#### Acceptance Criteria

1. WHEN displaying user messages THEN the system SHALL use a solid background color with sufficient contrast for white text
2. WHEN displaying AI messages THEN the system SHALL ensure the background allows for clear text visibility
3. WHEN rendering source citations THEN the system SHALL use card backgrounds that distinguish them from message content
4. WHEN displaying the collapsible sources section THEN the system SHALL use hover states that are visible in both themes
5. WHEN showing code blocks or inline code THEN the system SHALL apply theme-appropriate syntax highlighting

### Requirement 6

**User Story:** As a user, I want the input area to be clearly visible and accessible in both themes, so that I can easily compose my legal queries.

#### Acceptance Criteria

1. WHEN the input area is displayed THEN the system SHALL provide a clear visual boundary or background
2. WHEN typing in the input field THEN the system SHALL ensure text is clearly visible against the background
3. WHEN the input field is focused THEN the system SHALL provide visual feedback through border or shadow changes
4. WHEN the send button is enabled THEN the system SHALL use a prominent color that stands out
5. WHEN the send button is disabled THEN the system SHALL use muted colors that indicate unavailability

### Requirement 7

**User Story:** As a user, I want the header and navigation elements to be clearly visible and professional in both themes, so that I can easily access application features.

#### Acceptance Criteria

1. WHEN the header is displayed THEN the system SHALL ensure the logo is visible in both light and dark modes
2. WHEN displaying the floating dock navigation THEN the system SHALL use backgrounds that provide sufficient contrast for icons
3. WHEN hovering over navigation items THEN the system SHALL provide clear visual feedback
4. WHEN the theme toggle icon is displayed THEN the system SHALL show the appropriate icon for the current theme
5. WHEN displaying the application title and subtitle THEN the system SHALL use colors that maintain brand identity while ensuring readability

### Requirement 8

**User Story:** As a developer, I want to replace all emoji characters with professional icon components, so that the codebase is maintainable and icons are consistent.

#### Acceptance Criteria

1. WHEN implementing icon replacements THEN the system SHALL create reusable icon components or import from icon libraries
2. WHEN sourcing icons from Flaticon THEN the system SHALL ensure proper licensing and attribution
3. WHEN adding new icons THEN the system SHALL maintain consistent sizing and styling across the application
4. WHEN icons are used in different contexts THEN the system SHALL support theme-aware coloring
5. WHEN icons are rendered THEN the system SHALL optimize SVG files for performance

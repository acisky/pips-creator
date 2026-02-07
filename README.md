# Pips Puzzle Creator

## What is Pips Creator?

Pips Creator is an innovative puzzle game creation tool that allows you to design unique domino-based puzzles with flexible grid design, smart domino placement, and region rule definition. The game features user authentication, puzzle showcase, and the ability to save and manage puzzles.

## Features

- **Custom Grid Design** - Create puzzle areas by clicking and dragging on the grid
- **Domino Placement** - Generate random dominoes, drag them onto the grid, and rotate them as needed
- **Region Rules** - Define regions with computed values (sum, equality, inequality, greater/less than) to create puzzle constraints
- **User Authentication** - Google OAuth integration for secure login
- **Puzzle Showcase** - Browse puzzles created by the community
- **Account Management** - Save, edit, and delete your own puzzles
- **Like System** - Interact with puzzles by liking them

## How to Run?

### Prerequisites
- Node.js 18+ installed on your machine
- npm or yarn package manager
- Google Cloud Project with OAuth consent screen configured (for authentication)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pips-creator.git
   cd pips-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   NUXT_GOOGLE_OAUTH_CLIENT_ID=your_client_id
   NUXT_GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## How to Use?

### Creating a Puzzle

#### Step 1: Define Background Area
- Click and drag on the grid to activate/deactivate cells for the puzzle area
- Use the `+` and `-` buttons to resize the grid (4-8 rows)
- The grid must form a valid closed region with no gaps

#### Step 2: Create and Place Dominoes
- Specify the number of dominoes to generate (1-28)
- Click "Generate Dominoes" to create random dominoes
- Drag dominoes from the palette onto the grid
- Click dominoes in the palette to rotate them
- Click placed dominoes to return them to the palette
- All dominoes must be placed before proceeding

#### Step 3: Define Regions
- Click on cells to select them for a new region
- Selected cells must be connected (not disjoint)
- Assign a computed value to the region:
  - Number (e.g., `5`) - Sum of all pips equals this value
  - `=` - All pips in the region must be equal
  - `!=` - All pips must be different from each other
  - `>N` - Sum must be greater than N
  - `<N` - Sum must be less than N

#### Step 4: Save
- Click "Submit" to save your puzzle to the database
- Your puzzle will appear in your account page

### Browsing Puzzles
- Visit the Showcase page to view community puzzles
- Like puzzles to show appreciation
- View puzzle details including the grid, dominoes, and region rules

## Project Structure

```
pips-creator/
├── app/
│   ├── components/       # Vue components
│   │   ├── GridCell.vue
│   │   ├── DominoDisplay.vue
│   │   ├── DominoPalette.vue
│   │   ├── RegionForm.vue
│   │   ├── PuzzleCanvas.vue
│   │   ├── Toast.vue
│   │   └── ConfirmationToast.vue
│   ├── composables/      # Vue composables
│   │   └── useToast.js
│   ├── layouts/          # Layout components
│   │   └── default.vue
│   ├── pages/            # Page components
│   │   ├── index.vue     # Home page
│   │   ├── maker.vue     # Puzzle creator
│   │   ├── showcase.vue  # Puzzle gallery
│   │   └── account.vue   # User account
│   ├── types/            # TypeScript types
│   │   ├── database.ts
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── db.ts
│   │   └── logger.ts
│   └── app.vue           # Root component
├── server/
│   └── api/              # API routes
│       ├── puzzles.post.ts
│       ├── get_puzzles.get.ts
│       ├── get_puzzle_id.get.ts
│       ├── update_like.post.ts
│       ├── delete_puzzle.post.ts
│       ├── user_puzzles.get.ts
│       └── auth/
│           └── google.get.ts
├── public/               # Static assets
├── nuxt.config.ts        # Nuxt configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Built With

### Frontend
- [Nuxt.js](https://nuxt.com/) - Vue.js framework
- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

### Backend
- [Nuxt Server](https://nuxt.com/docs/guide/directory-structure/server) - Server-side components
- [Google OAuth](https://developers.google.com/identity) - Authentication

## Future Plans

### Phase 1: Feature Enhancements
- [ ] Implement Player mode (Solve the puzzles)
- [ ] Add puzzle difficulty levels
- [ ] Puzzle templates and presets

### Phase 2: Social Features
- [ ] User profiles and leaderboards
- [ ] Comment system for puzzles
- [ ] Follow and favorite creators

### Phase 3: Advanced Features
- [ ] Puzzle export/share functionality
- [ ] Multiplayer puzzle creation
- [ ] AI-powered puzzle generation

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Pips Creator - Create the puzzle, challenge your mind!

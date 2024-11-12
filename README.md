# Digital Library

A modern, responsive digital library application built with Next.js, React, and Tailwind CSS, featuring a dark mode toggle, grid/list views, and a clean user interface.

## Features

- 🌓 Dark/Light mode toggle
- 📱 Responsive design
- 📚 Grid and List view options
- 🔍 Book details modal
- 🔐 Login/Register functionality
- 📊 Sorting and pagination
- 🎨 Clean, modern UI using shadcn/ui components

## Prerequisites

- Node.js 16.x or later
- npm or yarn package manager
- Git (optional)

## Installation Guide

### 1. Project Structure

First, review the project structure that we'll be creating:

```
digital-library/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   └── switch.tsx
│   │   ├── digital-library.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── index.d.ts
├── public/
│   └── api/
│       └── placeholder/
├── dist/           # Production build output
├── .eslintrc.json
├── .gitignore
├── components.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Key Files and Directories Explained

- `src/`: Source code directory

  - `app/`: Next.js 13+ app directory
  - `components/`: React components
  - `lib/`: Utility functions
  - `types/`: TypeScript type definitions

- `public/`: Static assets
- `dist/`: Production build output
- Configuration files in root directory

You can use one of our automated scripts to create this structure:
[Previous scripts section remains here...]

### Automatic Project Structure Creation Scripts

#### Bash Script (create-structure.sh)

```bash
#!/bin/bash

# Create main project directory
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo "Created directory: $1"
    else
        echo "Directory already exists: $1"
    fi
}

create_file() {
    if [ ! -f "$1" ]; then
        touch "$1"
        echo "Created file: $1"
    else
        echo "File already exists: $1"
    fi
}

# Create project directories
dirs=(
    "digital-library/src/app"
    "digital-library/src/components/ui"
    "digital-library/src/lib"
    "digital-library/src/types"
    "digital-library/public/api/placeholder"
    "digital-library/dist"
)

files=(
    "src/app/layout.tsx"
    "src/app/page.tsx"
    "src/app/globals.css"
    "src/components/ui/button.tsx"
    "src/components/ui/card.tsx"
    "src/components/ui/dialog.tsx"
    "src/components/ui/input.tsx"
    "src/components/ui/navigation-menu.tsx"
    "src/components/ui/select.tsx"
    "src/components/ui/separator.tsx"
    "src/components/ui/switch.tsx"
    "src/components/digital-library.tsx"
    "src/components/theme-provider.tsx"
    "src/lib/utils.ts"
    "src/types/index.d.ts"
    ".eslintrc.json"
    ".gitignore"
    "components.json"
    "next.config.js"
    "package.json"
    "postcss.config.js"
    "tailwind.config.ts"
    "tsconfig.json"
)

# Create directories
for dir in "${dirs[@]}"; do
    create_dir "$dir"
done

# Change to project directory
cd digital-library

# Create files
for file in "${files[@]}"; do
    create_file "$file"
done

echo "Project structure created successfully!"
```

#### Windows Command Prompt Script (create-structure.bat)

```batch
@echo off
setlocal enabledelayedexpansion

REM Create main project directory and subdirectories

call :create_dir src\app
call :create_dir src\components\ui
call :create_dir src\lib
call :create_dir src\types
call :create_dir public\api\placeholder

REM Create empty files
call :create_file src\app\layout.tsx
call :create_file src\app\page.tsx
call :create_file src\app\globals.css

call :create_file src\components\ui\button.tsx
call :create_file src\components\ui\card.tsx
call :create_file src\components\ui\dialog.tsx
call :create_file src\components\ui\input.tsx
call :create_file src\components\ui\navigation-menu.tsx
call :create_file src\components\ui\select.tsx
call :create_file src\components\ui\separator.tsx
call :create_file src\components\ui\switch.tsx

call :create_file src\components\digital-library.tsx
call :create_file src\components\theme-provider.tsx
call :create_file src\lib\utils.ts
call :create_file src\types\index.d.ts

call :create_file .eslintrc.json
call :create_file .gitignore
call :create_file components.json
call :create_file next.config.js
call :create_file package.json
call :create_file postcss.config.js
call :create_file tailwind.config.ts
call :create_file tsconfig.json

echo Project structure created successfully!

endlocal
exit /b

REM Create directory function
:create_dir
if not exist "%~1" (
    mkdir "%~1"
    echo Created directory: %~1
) else (
    echo Directory already exists: %~1
)
goto :eof

REM Create file function
:create_file
if not exist "%~1" (
    type nul > "%~1"
    echo Created file: %~1
) else (
    echo File already exists: %~1
)
goto :eof
```

#### PowerShell Script (Create-Structure.ps1)

```powershell
function Create-DirectoryIfNotExists {
    param([string]$path)
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "Created directory: $path" -ForegroundColor Green
    } else {
        Write-Host "Directory already exists: $path" -ForegroundColor Yellow
    }
}

function Create-FileIfNotExists {
    param([string]$path)
    if (-not (Test-Path $path)) {
        New-Item -ItemType File -Path $path -Force | Out-Null
        Write-Host "Created file: $path" -ForegroundColor Green
    } else {
        Write-Host "File already exists: $path" -ForegroundColor Yellow
    }
}

# Create main project directory
Create-DirectoryIfNotExists "digital-library"
Set-Location digital-library

# Create directories
$directories = @(
    "src\app",
    "src\components\ui",
    "src\lib",
    "src\types",
    "public\api\placeholder",
    "dist"
)

foreach ($dir in $directories) {
    Create-DirectoryIfNotExists $dir
}

# Create files
$files = @(
    "src\app\layout.tsx",
    "src\app\page.tsx",
    "src\app\globals.css",
    "src\components\ui\button.tsx",
    "src\components\ui\card.tsx",
    "src\components\ui\dialog.tsx",
    "src\components\ui\input.tsx",
    "src\components\ui\navigation-menu.tsx",
    "src\components\ui\select.tsx",
    "src\components\ui\separator.tsx",
    "src\components\ui\switch.tsx",
    "src\components\digital-library.tsx",
    "src\components\theme-provider.tsx",
    "src\lib\utils.ts",
    "src\types\index.d.ts",
    ".eslintrc.json",
    ".gitignore",
    "components.json",
    "next.config.js",
    "package.json",
    "postcss.config.js",
    "tailwind.config.ts",
    "tsconfig.json"
)

foreach ($file in $files) {
    Create-FileIfNotExists $file
}

Write-Host "`nProject structure created successfully!" -ForegroundColor Green
Set-Location ..
```

To use these scripts:

1. For Bash (Linux/macOS):

   ```bash
   chmod +x create-structure.sh
   ./create-structure.sh
   ```

2. For Windows Command Prompt:

   ```batch
   create-structure.bat
   ```

3. For PowerShell:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   .\Create-Structure.ps1
   ```

### 2. Set Up a New Next.js Project

```bash
# Create a new Next.js project with TypeScript and Tailwind CSS
npx create-next-app@latest digital-library --typescript --tailwind --eslint
cd digital-library
```

### 3. Install Required Dependencies

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Install required dependencies
npm install next-themes lucide-react
```

### 4. Install Required shadcn/ui Components

```bash
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add navigation-menu
npx shadcn@latest add separator
```

### 5. Final Steps

After completing the above steps:

1. Ensure all dependencies are correctly installed:

   ```bash
   npm install
   ```

2. Copy the provided component code into their respective files

3. Start the development server:
   ```bash
   npm run dev
   ```

Your Digital Library application should now be running at `http://localhost:3000`

### Notes

- Make sure all files have the correct content and proper imports
- Check that the theme provider is properly configured
- Verify that all shadcn/ui components are correctly installed
- Test the dark/light mode functionality
- Ensure all TypeScript types are properly set up

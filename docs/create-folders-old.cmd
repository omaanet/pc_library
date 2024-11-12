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

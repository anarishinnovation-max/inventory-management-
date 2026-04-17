@echo off
REM Seed Data Setup for Windows

echo.
echo ========================================
echo IMS Database Seed Setup
echo ========================================
echo.

REM Step 1: Generate Prisma Client
echo [1/3] Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma Client
    exit /b 1
)

REM Step 2: Run migrations
echo.
echo [2/3] Running database migrations...
call npx prisma migrate dev --skip-generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to run migrations
    exit /b 1
)

REM Step 3: Seed the database
echo.
echo [3/3] Seeding database with inventory data...
call npx prisma db seed
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to seed database
    exit /b 1
)

echo.
echo ========================================
echo ^+===================== SUCCESS! =====================+
echo ========================================
echo.
echo Seed Data Summary:
echo   * Vendors: 6 (SOHAM ENTERPRISES, K K TOOLS, etc.)
echo   * Items: 17 (Clamps, boring bars, tools, spares)
echo   * Customers: 3 (CNC TOOLS, A K MAHCINE, YASH ENTERPRISES)
echo   * Purchase Orders: 3 (1,300 qty, Rs 645,000)
echo   * Dispatch Orders: 3 (1,000 qty, Rs 285,000)
echo.
echo Transaction Summary:
echo   * Purchase Bills: 24 records (3,050 qty, Rs 756,000)
echo   * Sale Bills: 17 records (1,339 qty, Rs 453,700)
echo   * Purchase Orders: 9 records (1,300 qty, Rs 645,000)
echo   * Sale Orders: 8 records (1,000 qty, Rs 285,000)
echo.
echo Login Credentials:
echo   * Username: admin
echo   * Password: admin123
echo.
echo Next: Run "npm run dev" to start the development server
echo ========================================
echo.

pause

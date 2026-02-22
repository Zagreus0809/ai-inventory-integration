@echo off
echo ========================================
echo ERPNext Connection Test
echo ========================================
echo.
echo Testing connection to ERPNext Cloud...
echo URL: https://ai-inventory-erp.s.frappe.cloud
echo.

node test-erpnext-connection.js

echo.
echo ========================================
echo Test Complete
echo ========================================
echo.
echo If successful, you can now run:
echo   START_SERVER.bat
echo.
pause

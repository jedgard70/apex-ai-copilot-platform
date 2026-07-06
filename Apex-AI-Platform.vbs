Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\AI-constr\apex-ai-copilot-platform"
WshShell.Run "cmd.exe /c npx electron .", 0, False

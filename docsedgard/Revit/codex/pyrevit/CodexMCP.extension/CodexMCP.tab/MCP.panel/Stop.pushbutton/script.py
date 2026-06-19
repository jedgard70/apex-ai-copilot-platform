# -*- coding: utf-8 -*-

import clr
clr.AddReference("System")

from System.IO import StreamWriter
from System.Net import WebRequest
from System.Text import Encoding
from Autodesk.Revit.UI import TaskDialog


def stop_server():
    request = WebRequest.Create("http://127.0.0.1:8765/rpc")
    request.Method = "POST"
    request.ContentType = "application/json"

    body = '{"command":"shutdown","payload":{}}'
    data = Encoding.UTF8.GetBytes(body)
    request.ContentLength = data.Length

    stream = request.GetRequestStream()
    stream.Write(data, 0, data.Length)
    stream.Close()

    response = request.GetResponse()
    response.Close()


try:
    stop_server()
    TaskDialog.Show("Codex MCP", "Listener parado.")
except Exception as exc:
    TaskDialog.Show("Codex MCP", "Nao consegui parar o listener: {}".format(exc))
